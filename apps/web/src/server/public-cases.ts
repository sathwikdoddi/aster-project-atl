import "server-only";
import { mockPublishedCaseRepository } from "@aster/content/mock";
import type { PublicCaseRepository } from "@aster/content/repository";
import { createAirtableDemoRepository } from "./airtable-demo";

export const publicDataSource = process.env.CONTENT_SOURCE ?? "mock";
if (!["mock", "airtable-demo"].includes(publicDataSource)) {
  throw new Error("CONTENT_SOURCE must be mock or airtable-demo.");
}

// The temporary live adapter reads only two allowlisted fictional demo records.
// Replace it with approved snapshots when the authenticated publishing flow exists.
export const publicCaseRepository: PublicCaseRepository =
  publicDataSource === "airtable-demo"
    ? createAirtableDemoRepository({
        token: process.env.AIRTABLE_API ?? "",
        baseId: process.env.AIRTABLE_BASE_ID ?? "",
        tableId: process.env.AIRTABLE_CASES_TABLE ?? "Cases",
      })
    : mockPublishedCaseRepository;
