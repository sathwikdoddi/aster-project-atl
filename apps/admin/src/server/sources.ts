import "server-only";
import { createHash } from "node:crypto";
import { mockPublishedCaseRepository } from "@aster/content/mock";
import { caseSchema, partialDateSchema } from "@aster/content/schema";
import {
  sourceCaseSchema,
  PublishingError,
  type SourceCase,
} from "@aster/publishing/model";

export function fingerprint(record: unknown) {
  return createHash("sha256").update(JSON.stringify(record)).digest("hex");
}

export function normalizeProfile(
  id: string,
  fields: Record<string, unknown>,
): SourceCase | null {
  const text = (key: string) =>
    typeof fields[key] === "string" && (fields[key] as string).trim()
      ? (fields[key] as string).trim()
      : null;
  const name = text("Person Impacted (In Memory)");
  if (!name) return null;
  const date = (key: string) =>
    text(key) ? partialDateSchema.parse(text(key)) : null;
  const birthDate = date("Date of Birth"),
    deathDate = date("Date of Death");
  const slug = `${
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "profile"
  }-${id.slice(-6).toLowerCase()}`;
  const color = (["lavender", "sage", "peach"] as const)[
    parseInt(fingerprint(id).slice(0, 6), 16) % 3
  ];
  const record = {
    id,
    name,
    slug,
    isDemo: false,
    summary: text("Summary"),
    remembrance: null,
    location: { city: null, state: null, label: text("Location of Incident") },
    birthDate,
    deathDate,
    incidentDate: null,
    agency: text("Police Department / Agency"),
    caseStatus: text("Case Status"),
    passions: [],
    color,
    sections: [],
    sources: [],
    updatedAt: null,
    events: [
      ...(birthDate
        ? [
            {
              id: `${id}:birth`,
              date: birthDate,
              category: "early-life",
              title: "A life begins",
              description: "Date of birth recorded by The Aster Project.",
              sourceIds: [],
            },
          ]
        : []),
      ...(deathDate
        ? [
            {
              id: `${id}:death`,
              date: deathDate,
              category: "death",
              title: "Remembering a life",
              description: "Date of death recorded by The Aster Project.",
              sourceIds: [],
            },
          ]
        : []),
    ],
  };
  const metadata = {
    record,
    photoCount: Array.isArray(fields.Photo) ? fields.Photo.length : 0,
    linkedDocumentCount: Array.isArray(fields["Linked Documents"])
      ? fields["Linked Documents"].length
      : 0,
    linkedDetailCount: Array.isArray(fields["Linked Case Details"])
      ? fields["Linked Case Details"].length
      : 0,
  };
  return sourceCaseSchema.parse({
    ...metadata,
    fingerprint: fingerprint(metadata),
  });
}

export async function listSources(
  mode: "demo" | "supabase",
): Promise<SourceCase[]> {
  if (mode === "demo")
    return (await mockPublishedCaseRepository.list()).map((record) =>
      sourceCaseSchema.parse({
        record,
        fingerprint: fingerprint(record),
        photoCount: 0,
        linkedDocumentCount: 0,
        linkedDetailCount: 0,
      }),
    );
  const base = process.env.ADMIN_AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_API;
  const table = process.env.ADMIN_AIRTABLE_PROFILES_TABLE ?? "Family Profiles";
  if (!base || !token)
    throw new PublishingError(
      "Set the admin Airtable base connection to load the family profiles.",
      503,
    );
  const fields = [
    "Person Impacted (In Memory)",
    "Photo",
    "Summary",
    "Date of Birth",
    "Date of Death",
    "Police Department / Agency",
    "Location of Incident",
    "Case Status",
    "Linked Documents",
    "Linked Case Details",
  ];
  try {
    const records: SourceCase[] = [];
    let offset: string | undefined;
    const seen = new Set<string>();
    do {
      const url = new URL(
        `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}`,
      );
      fields.forEach((field) => url.searchParams.append("fields[]", field));
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error("Source request failed");
      const page = (await response.json()) as {
        records: { id: string; fields: Record<string, unknown> }[];
        offset?: string;
      };
      for (const row of page.records) {
        const entry = normalizeProfile(row.id, row.fields);
        if (entry) records.push(entry);
      }
      offset = page.offset;
      if (offset) {
        if (seen.has(offset) || seen.size > 50)
          throw new Error("Invalid pagination");
        seen.add(offset);
      }
    } while (offset);
    return records.sort((a, b) => a.record.name.localeCompare(b.record.name));
  } catch {
    throw new PublishingError(
      "Airtable profiles could not be loaded. Published stories are unchanged; try refreshing shortly.",
      503,
    );
  }
}
