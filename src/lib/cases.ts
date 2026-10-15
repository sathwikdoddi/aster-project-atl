import "server-only";
import mockCases from "@/data/cases.json";
import { caseCollectionSchema, type CaseRecord } from "./case-schema";
import { sortByDate } from "./format";

export interface CaseRepository {
  list(): Promise<CaseRecord[]>;
  findBySlug(slug: string): Promise<CaseRecord | null>;
}

// Replace this adapter with Airtable/another datastore after the shared format is agreed.
// Credentials must stay in this server-only layer, never in a client component.
const mockRepository: CaseRepository = {
  async list() {
    return sortByDate(
      caseCollectionSchema.parse(mockCases),
      (record) => record.deathDate,
      "desc",
    );
  },
  async findBySlug(slug) {
    return (await this.list()).find((record) => record.slug === slug) ?? null;
  },
};

export const caseRepository: CaseRepository = mockRepository;
