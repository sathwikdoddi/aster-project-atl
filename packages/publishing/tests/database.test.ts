import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

test("the actual SQL migration enforces owner access, immutable drafts, revisions, and unpublishing", async () => {
  const db = await PGlite.create();
  const owner = "00000000-0000-4000-8000-000000000001";
  const other = "00000000-0000-4000-8000-000000000002";
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key,email text);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;
      insert into auth.users values ('${owner}','admin@admin.com'),('${other}','other@example.test');`);
    await db.exec(
      await readFile(
        path.resolve(
          __dirname,
          "../../../supabase/migrations/001_owner_publishing.sql",
        ),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        path.resolve(__dirname, "../../../supabase/authorize-owner.sql"),
        "utf8",
      ),
    );
    const changeRole = async (
      role: "anon" | "authenticated",
      user: string = "",
    ) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        user,
      ]);
      await db.exec(`set role ${role}`);
    };
    const denied = (error: unknown) =>
      (error as { code: string }).code === "42501";
    await changeRole("anon");
    await assert.rejects(
      db.query("select * from public.aster_case_drafts"),
      denied,
    );
    await assert.rejects(
      db.query("select * from public.aster_admin_members"),
      denied,
    );
    assert.equal(
      (await db.query("select * from public.aster_publications")).rows.length,
      0,
    );
    await changeRole("authenticated", other);
    assert.equal(
      (await db.query("select * from public.aster_case_drafts")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select public.aster_publish_case('profile',1)"),
      denied,
    );
    await assert.rejects(
      db.query("insert into public.aster_admin_members(user_id) values ($1)", [
        other,
      ]),
      denied,
    );
    await changeRole("authenticated", owner);
    const snapshot = {
      id: "test-profile",
      slug: "test-profile",
      name: "Fictional Test Profile",
      summary: "Approved introduction",
      isDemo: true,
    };
    await db.query("select public.aster_save_draft($1,$2::jsonb,$3::jsonb,0)", [
      snapshot.id,
      JSON.stringify({}),
      JSON.stringify(snapshot),
    ]);
    await db.query("select public.aster_publish_case($1,1)", [snapshot.id]);
    const next = { ...snapshot, summary: "Unpublished changes" };
    await db.query("select public.aster_save_draft($1,$2::jsonb,$3::jsonb,1)", [
      snapshot.id,
      JSON.stringify({}),
      JSON.stringify(next),
    ]);
    await assert.rejects(
      db.query("select public.aster_publish_case($1,1)", [snapshot.id]),
      (error: unknown) => (error as { code: string }).code === "40001",
    );
    await changeRole("anon");
    const live = await db.query<{ snapshot: { summary: string } }>(
      "select snapshot from public.aster_publications",
    );
    assert.equal(live.rows[0].snapshot.summary, "Approved introduction");
    await assert.rejects(
      db.query("select * from public.aster_publication_history"),
      denied,
    );
    await changeRole("authenticated", owner);
    await db.query("select public.aster_publish_case($1,2)", [snapshot.id]);
    await db.query("select public.aster_unpublish_case($1,2)", [snapshot.id]);
    assert.equal(
      (await db.query("select * from public.aster_publication_history")).rows
        .length,
      3,
    );
    await changeRole("anon");
    assert.equal(
      (await db.query("select * from public.aster_publications")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
