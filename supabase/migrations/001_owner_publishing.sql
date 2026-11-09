-- Run once in the Supabase SQL Editor. This creates only Aster-prefixed objects.
begin;

create table if not exists public.aster_admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.aster_case_drafts (
  case_key text primary key,
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  snapshot jsonb check (snapshot is null or jsonb_typeof(snapshot) = 'object'),
  revision integer not null check (revision > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users(id)
);

-- Only public-safe snapshots and non-sensitive publication metadata belong here.
create table if not exists public.aster_publications (
  case_key text primary key references public.aster_case_drafts(case_key),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and snapshot->>'slug' = slug),
  revision integer not null check (revision > 0),
  published_at timestamptz not null default now()
);

create table if not exists public.aster_publication_history (
  id uuid primary key default gen_random_uuid(),
  case_key text not null,
  action text not null check (action in ('publish', 'unpublish')),
  revision integer not null,
  snapshot jsonb not null,
  actor uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.aster_admin_members enable row level security;
alter table public.aster_case_drafts enable row level security;
alter table public.aster_publications enable row level security;
alter table public.aster_publication_history enable row level security;

create or replace function public.aster_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.aster_admin_members where user_id = (select auth.uid()));
$$;
revoke all on function public.aster_is_admin() from public, anon;
grant execute on function public.aster_is_admin() to authenticated;

revoke all on public.aster_admin_members, public.aster_case_drafts,
  public.aster_publications, public.aster_publication_history from anon, authenticated;
grant select on public.aster_admin_members, public.aster_case_drafts, public.aster_publication_history to authenticated;
grant select on public.aster_publications to anon, authenticated;

drop policy if exists aster_read_own_membership on public.aster_admin_members;
create policy aster_read_own_membership on public.aster_admin_members for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists aster_admin_read_drafts on public.aster_case_drafts;
create policy aster_admin_read_drafts on public.aster_case_drafts for select to authenticated
using ((select public.aster_is_admin()));
drop policy if exists aster_admin_read_history on public.aster_publication_history;
create policy aster_admin_read_history on public.aster_publication_history for select to authenticated
using ((select public.aster_is_admin()));
drop policy if exists aster_public_read_snapshots on public.aster_publications;
create policy aster_public_read_snapshots on public.aster_publications for select to anon, authenticated
using (true);

create or replace function public.aster_save_draft(
  p_case_key text, p_settings jsonb, p_snapshot jsonb, p_expected_revision integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved public.aster_case_drafts;
begin
  if not public.aster_is_admin() then raise exception 'Owner access required' using errcode = '42501'; end if;
  if p_case_key is null or length(p_case_key) > 160 or jsonb_typeof(p_settings) is distinct from 'object'
    or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Invalid draft' using errcode = '23514';
  end if;
  if p_snapshot is not null and (jsonb_typeof(p_snapshot) is distinct from 'object'
    or p_snapshot->>'id' is distinct from p_case_key
    or nullif(btrim(p_snapshot->>'name'), '') is null
    or nullif(btrim(p_snapshot->>'summary'), '') is null) then
    raise exception 'Invalid public snapshot' using errcode = '23514';
  end if;
  if p_expected_revision = 0 then
    insert into public.aster_case_drafts(case_key, settings, snapshot, revision, updated_by)
      values (p_case_key, p_settings, p_snapshot, 1, auth.uid())
      on conflict (case_key) do nothing returning * into saved;
  else
    update public.aster_case_drafts set settings = p_settings, snapshot = p_snapshot,
      revision = revision + 1, updated_at = now(), updated_by = auth.uid()
      where case_key = p_case_key and revision = p_expected_revision returning * into saved;
  end if;
  if saved.case_key is null then raise exception 'Draft changed; reload before saving' using errcode = '40001'; end if;
  return to_jsonb(saved);
end;
$$;

create or replace function public.aster_publish_case(p_case_key text, p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare draft public.aster_case_drafts; published public.aster_publications;
begin
  if not public.aster_is_admin() then raise exception 'Owner access required' using errcode = '42501'; end if;
  select * into draft from public.aster_case_drafts where case_key = p_case_key for update;
  if draft.case_key is null or draft.revision is distinct from p_expected_revision then
    raise exception 'Draft changed; reload before publishing' using errcode = '40001';
  end if;
  if draft.snapshot is null then raise exception 'Add a public introduction before publishing' using errcode = '23514'; end if;
  select * into published from public.aster_publications where case_key = p_case_key;
  if published.revision = draft.revision and published.snapshot = draft.snapshot then return to_jsonb(published); end if;
  insert into public.aster_publications(case_key, slug, snapshot, revision)
    values (p_case_key, draft.snapshot->>'slug', draft.snapshot, draft.revision)
    on conflict (case_key) do update set slug = excluded.slug, snapshot = excluded.snapshot,
      revision = excluded.revision, published_at = now() returning * into published;
  insert into public.aster_publication_history(case_key, action, revision, snapshot, actor)
    values (p_case_key, 'publish', published.revision, published.snapshot, auth.uid());
  return to_jsonb(published);
end;
$$;

create or replace function public.aster_unpublish_case(p_case_key text, p_expected_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
declare published public.aster_publications;
begin
  if not public.aster_is_admin() then raise exception 'Owner access required' using errcode = '42501'; end if;
  select * into published from public.aster_publications where case_key = p_case_key for update;
  if published.case_key is null then return; end if;
  if published.revision is distinct from p_expected_revision then
    raise exception 'Publication changed; reload before unpublishing' using errcode = '40001';
  end if;
  delete from public.aster_publications where case_key = p_case_key;
  insert into public.aster_publication_history(case_key, action, revision, snapshot, actor)
    values (p_case_key, 'unpublish', published.revision, published.snapshot, auth.uid());
end;
$$;

revoke all on function public.aster_save_draft(text,jsonb,jsonb,integer) from public, anon;
revoke all on function public.aster_publish_case(text,integer) from public, anon;
revoke all on function public.aster_unpublish_case(text,integer) from public, anon;
grant execute on function public.aster_save_draft(text,jsonb,jsonb,integer) to authenticated;
grant execute on function public.aster_publish_case(text,integer) to authenticated;
grant execute on function public.aster_unpublish_case(text,integer) to authenticated;

commit;
