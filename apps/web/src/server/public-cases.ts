import "server-only";
import { mockPublishedCaseRepository } from "@aster/content/mock";
import type { PublicCaseRepository } from "@aster/content/repository";
import { createAirtableDemoRepository } from "./airtable-demo";
import { createSupabasePublicRepository } from "@aster/publishing/supabase";
import { createLocalDemoStore } from "@aster/publishing/local";
import path from "node:path";

export const publicDataSource = process.env.CONTENT_SOURCE ?? "mock";
if (!["mock", "airtable-demo", "published"].includes(publicDataSource)) {
  throw new Error("CONTENT_SOURCE must be mock, airtable-demo, or published.");
}

// Published mode reads approved snapshots only. The separate Airtable demo mode
// remains restricted to two allowlisted fictional records for development.
export const publicCaseRepository: PublicCaseRepository =
  publicDataSource === "published"
    ? process.env.PUBLICATION_STORE === "local-demo"
      ? createLocalDemoStore(
          process.env.ASTER_LOCAL_STORE ??
            path.resolve(process.cwd(), "../../.aster-local/publishing.json"),
        ).publicRepository
      : createSupabasePublicRepository(
          process.env.SUPABASE_URL ?? "",
          process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
        )
    : publicDataSource === "airtable-demo"
      ? createAirtableDemoRepository({
          token: process.env.AIRTABLE_API ?? "",
          baseId: process.env.AIRTABLE_BASE_ID ?? "",
          tableId: process.env.AIRTABLE_CASES_TABLE ?? "Cases",
        })
      : mockPublishedCaseRepository;
