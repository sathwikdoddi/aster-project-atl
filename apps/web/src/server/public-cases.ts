import "server-only";
import { mockPublishedCaseRepository } from "@aster/content/mock";
import type { PublicCaseRepository } from "@aster/content/repository";

// Replace with a read-only adapter for approved snapshots once publishing exists.
// This public app must never read raw Airtable records or owner-only settings.
export const publicCaseRepository: PublicCaseRepository =
  mockPublishedCaseRepository;
