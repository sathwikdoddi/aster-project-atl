import "server-only";
import { z } from "zod";
import { demoIdentities } from "@aster/content/demo";
import { caseCollectionSchema, type CaseRecord } from "@aster/content/schema";
import { sortByDate } from "@aster/content/format";
import type { PublicCaseRepository } from "@aster/content/repository";

const publicFields = [
  "Case ID",
  "Victim / Individual",
  "Case Summary",
  "Date of Birth",
  "Incident Date",
  "Incident Location",
];
const pageSchema = z.object({
  records: z.array(
    z.object({ id: z.string(), fields: z.record(z.string(), z.unknown()) }),
  ),
  offset: z.string().optional(),
});

type Config = { token: string; baseId: string; tableId: string };
type Fetcher = typeof fetch;

export function createAirtableDemoRepository(
  config: Config,
  fetcher: Fetcher = fetch,
  cacheTtlMs = 30_000,
): PublicCaseRepository {
  if (
    !config.token ||
    !/^app[a-zA-Z0-9]+$/.test(config.baseId) ||
    !config.tableId.trim()
  ) {
    throw new Error(
      "Airtable demo requires AIRTABLE_API, AIRTABLE_BASE_ID, and AIRTABLE_CASES_TABLE.",
    );
  }
  let cached: { records: CaseRecord[]; expires: number } | null = null;
  let pending: Promise<CaseRecord[]> | null = null;

  async function readCases(): Promise<CaseRecord[]> {
    try {
      const records: z.infer<typeof pageSchema>["records"] = [];
      let offset: string | undefined;
      const seenOffsets = new Set<string>();
      do {
        const url = new URL(
          `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableId)}`,
        );
        url.searchParams.set(
          "filterByFormula",
          `OR(${demoIdentities.map((entry) => `{Case ID}="${entry.caseId}"`).join(",")})`,
        );
        url.searchParams.set("pageSize", "100");
        for (const field of publicFields)
          url.searchParams.append("fields[]", field);
        if (offset) url.searchParams.set("offset", offset);
        const response = await fetcher(url, {
          headers: { Authorization: `Bearer ${config.token}` },
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error("Airtable request failed");
        const page = pageSchema.parse(await response.json());
        records.push(...page.records);
        offset = page.offset;
        if (offset) {
          if (seenOffsets.has(offset) || seenOffsets.size >= 10)
            throw new Error("Invalid Airtable pagination");
          seenOffsets.add(offset);
        }
      } while (offset);

      const mapped = records.flatMap((record): CaseRecord[] => {
        const fields = record.fields;
        const text = (key: string): string | null =>
          typeof fields[key] === "string" && (fields[key] as string).trim()
            ? (fields[key] as string).trim()
            : null;
        const identity = demoIdentities.find(
          (entry) => entry.caseId === text("Case ID"),
        );
        if (!identity) return [];
        const name = text("Victim / Individual");
        if (!name) throw new Error("Demo profile is missing a public name");
        const paragraphs = (
          text("Case Summary") ??
          "This fictional story is still being documented."
        )
          .split(/\n\s*\n/)
          .map((part) => part.trim())
          .filter(Boolean);
        const birthDate = text("Date of Birth");
        const incidentDate = text("Incident Date");
        const sourceIds = ["airtable-demo-case"];
        return [
          {
            id: identity.caseId,
            slug: identity.slug,
            name,
            isDemo: true,
            summary: paragraphs[0],
            remembrance: null,
            location: {
              city: null,
              state: null,
              label: text("Incident Location"),
            },
            birthDate,
            incidentDate,
            deathDate: null,
            agency: null,
            caseStatus: null,
            passions: [],
            color: identity.color,
            sections:
              paragraphs.length > 1
                ? [
                    {
                      category: "overview",
                      title: "Life, interests & community",
                      paragraphs: paragraphs.slice(1),
                      sourceIds,
                    },
                  ]
                : [],
            events: [
              ...(birthDate
                ? [
                    {
                      id: `${identity.slug}-birth`,
                      date: birthDate,
                      category: "early-life" as const,
                      title: "A life begins",
                      description:
                        "The date of birth supplied in this fictional demonstration record.",
                      sourceIds,
                    },
                  ]
                : []),
              ...(incidentDate
                ? [
                    {
                      id: `${identity.slug}-incident`,
                      date: incidentDate,
                      category: "overview" as const,
                      title: "Incident date documented",
                      description:
                        "A fictional incident date used to demonstrate the case timeline. This is not a record of an actual event.",
                      sourceIds,
                    },
                  ]
                : []),
            ],
            sources: [
              {
                id: "airtable-demo-case",
                title: "Fictional Airtable demonstration record",
                url: null,
                note: "Sample content entered in the demo Cases table. It is not evidence or a record of a real person.",
              },
            ],
            // Airtable's createdTime is not a last-modified timestamp.
            updatedAt: null,
          },
        ];
      });
      return sortByDate(
        caseCollectionSchema.parse(mapped),
        (record) => record.incidentDate,
        "desc",
      );
    } catch {
      // Do not expose provider response bodies, credentials, or internal records.
      throw new Error(
        "Airtable demo stories are temporarily unavailable. Check the server configuration or try again shortly.",
      );
    }
  }

  const repository: PublicCaseRepository = {
    async list() {
      if (cached && cached.expires > Date.now()) return cached.records;
      if (!pending)
        pending = readCases()
          .then((records) => {
            cached = { records, expires: Date.now() + cacheTtlMs };
            return records;
          })
          .finally(() => {
            pending = null;
          });
      return pending;
    },
    async findBySlug(slug) {
      if (!demoIdentities.some((entry) => entry.slug === slug)) return null;
      return (
        (await repository.list()).find((record) => record.slug === slug) ?? null
      );
    },
  };
  return repository;
}
