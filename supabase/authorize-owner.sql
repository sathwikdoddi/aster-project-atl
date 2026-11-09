-- First create the owner in Supabase Authentication -> Users.
-- Run this in the SQL Editor after the migration. Change this test email for production.
do $$
declare owner_id uuid;
begin
  select id into owner_id from auth.users where lower(email) = lower('admin@admin.com');
  if owner_id is null then raise exception 'Create this owner in Authentication -> Users first'; end if;
  insert into public.aster_admin_members(user_id) values (owner_id) on conflict do nothing;
end;
$$;
