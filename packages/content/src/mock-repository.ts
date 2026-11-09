import mockPublishedCases from "./mock/published-cases.json";
import { caseCollectionSchema } from "./case-schema";
import { sortByDate } from "./format";
import type { PublicCaseRepository } from "./repository";

// Fictional stand-ins for the future publication store, not raw Airtable records.
export const mockPublishedCaseRepository: PublicCaseRepository = {
  async list() {
    return sortByDate(
      caseCollectionSchema.parse(mockPublishedCases),
      (record) => record.deathDate,
      "desc",
    );
  },
  async findBySlug(slug) {
    return (await this.list()).find((record) => record.slug === slug) ?? null;
  },
};
