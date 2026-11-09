import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { caseCollectionSchema, caseSchema } from "@aster/content/schema";
import { sortByDate } from "@aster/content/format";
import type { PublicCaseRepository } from "@aster/content/repository";
import {
  draftSchema,
  publicationSchema,
  PublishingError,
  type OwnerStore,
} from "./model";

function fail(error: { code?: string } | null): never {
  if (error?.code === "40001" || error?.code === "23505")
    throw new PublishingError(
      "The record changed or its public URL is already in use. Refresh before continuing.",
      409,
    );
  if (error?.code === "42501")
    throw new PublishingError("This account does not have owner access.", 403);
  if (["42P01", "PGRST202", "PGRST205"].includes(error?.code ?? ""))
    throw new PublishingError(
      "Run the Supabase SQL setup files to finish configuring the dashboard.",
      503,
    );
  throw new PublishingError(
    "The publishing database is unavailable. Your existing published version has been preserved.",
    503,
  );
}
const readDraft = (row: Record<string, unknown>) =>
  draftSchema.parse({
    caseKey: row.case_key,
    settings: row.settings,
    snapshot: row.snapshot,
    revision: row.revision,
    updatedAt: row.updated_at,
  });
const readPublication = (row: Record<string, unknown>) =>
  publicationSchema.parse({
    caseKey: row.case_key,
    snapshot: row.snapshot,
    revision: row.revision,
    publishedAt: row.published_at,
  });

export function createSupabaseOwnerStore(client: SupabaseClient): OwnerStore {
  return {
    async list() {
      const [drafts, publications] = await Promise.all([
        client
          .from("aster_case_drafts")
          .select("case_key,settings,snapshot,revision,updated_at"),
        client
          .from("aster_publications")
          .select("case_key,snapshot,revision,published_at"),
      ]);
      if (drafts.error) fail(drafts.error);
      if (publications.error) fail(publications.error);
      return {
        drafts: (drafts.data ?? []).map(readDraft),
        publications: (publications.data ?? []).map(readPublication),
      };
    },
    async save(caseKey, settings, snapshot, expectedRevision) {
      const result = await client.rpc("aster_save_draft", {
        p_case_key: caseKey,
        p_settings: settings,
        p_snapshot: snapshot,
        p_expected_revision: expectedRevision,
      });
      if (result.error) fail(result.error);
      return readDraft(result.data);
    },
    async publish(caseKey, expectedRevision) {
      const result = await client.rpc("aster_publish_case", {
        p_case_key: caseKey,
        p_expected_revision: expectedRevision,
      });
      if (result.error) fail(result.error);
      return readPublication(result.data);
    },
    async unpublish(caseKey, expectedRevision) {
      const result = await client.rpc("aster_unpublish_case", {
        p_case_key: caseKey,
        p_expected_revision: expectedRevision,
      });
      if (result.error) fail(result.error);
    },
  };
}

// This client has only the publishable key. RLS permits public snapshots only.
export function createSupabasePublicRepository(
  url: string,
  key: string,
): PublicCaseRepository {
  if (!url || !key)
    throw new Error(
      "Published content requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
    );
  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return {
    async list() {
      const records: unknown[] = [];
      for (let start = 0; ; start += 500) {
        const result = await client
          .from("aster_publications")
          .select("snapshot")
          .order("case_key")
          .range(start, start + 499);
        if (result.error) fail(result.error);
        records.push(...(result.data ?? []).map((entry) => entry.snapshot));
        if ((result.data?.length ?? 0) < 500) break;
      }
      return sortByDate(
        caseCollectionSchema.parse(records),
        (record) => record.deathDate ?? record.incidentDate,
        "desc",
      );
    },
    async findBySlug(slug) {
      const result = await client
        .from("aster_publications")
        .select("snapshot")
        .eq("slug", slug)
        .maybeSingle();
      if (result.error) fail(result.error);
      return result.data ? caseSchema.parse(result.data.snapshot) : null;
    },
  };
}
