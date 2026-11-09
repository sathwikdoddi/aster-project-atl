import type { CaseRecord } from "./case-schema";

// This contract returns public, published content only. Raw Airtable records and
// owner-only configuration will have separate server-side contracts in the admin app.
export interface PublicCaseRepository {
  list(): Promise<CaseRecord[]>;
  findBySlug(slug: string): Promise<CaseRecord | null>;
}
