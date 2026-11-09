import { z } from "zod";
import { caseSchema, categories, type CaseRecord } from "@aster/content/schema";

export const fieldLabels = {
  birthDate: "Date of birth",
  deathDate: "Date of death",
  incidentDate: "Incident date",
  location: "Incident location",
  agency: "Police department / agency",
  caseStatus: "Case status",
} as const;
export const publicFields = [
  "birthDate",
  "deathDate",
  "incidentDate",
  "location",
  "agency",
  "caseStatus",
] as const;
export type PublicField = (typeof publicFields)[number];

export const sourceCaseSchema = z.object({
  record: z.object({ ...caseSchema.shape, summary: z.string().nullable() }),
  fingerprint: z.string(),
  photoCount: z.number().int().nonnegative(),
  linkedDocumentCount: z.number().int().nonnegative(),
  linkedDetailCount: z.number().int().nonnegative(),
});
export type SourceCase = z.infer<typeof sourceCaseSchema>;

export const settingsSchema = z
  .object({
    sourceFingerprint: z.string().min(1),
    name: z.string().trim().min(1).max(300),
    slug: z
      .string()
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    introduction: z.string().max(3000),
    story: z.string().max(30000),
    visibleFields: z.array(z.enum(publicFields)),
    visibleSections: z.array(z.enum(categories)),
    visibleEvents: z.array(z.string()),
    showTimeline: z.boolean(),
    showSources: z.boolean(),
  })
  .strict();
export type DisplaySettings = z.infer<typeof settingsSchema>;

export const draftSchema = z.object({
  caseKey: z.string(),
  settings: settingsSchema,
  snapshot: caseSchema.nullable(),
  revision: z.number().int().positive(),
  updatedAt: z.string(),
});
export const publicationSchema = z.object({
  caseKey: z.string(),
  snapshot: caseSchema,
  revision: z.number().int().positive(),
  publishedAt: z.string(),
});
export type Draft = z.infer<typeof draftSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type WorkspaceState = { drafts: Draft[]; publications: Publication[] };

export class PublishingError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "PublishingError";
  }
}

export interface OwnerStore {
  list(): Promise<WorkspaceState>;
  save(
    caseKey: string,
    settings: DisplaySettings,
    snapshot: CaseRecord | null,
    expectedRevision: number,
    actor: string,
  ): Promise<Draft>;
  publish(
    caseKey: string,
    expectedRevision: number,
    actor: string,
  ): Promise<Publication>;
  unpublish(
    caseKey: string,
    expectedRevision: number,
    actor: string,
  ): Promise<void>;
}

export function sourceFieldValue(
  source: SourceCase,
  field: PublicField,
): string | null {
  if (field === "location")
    return (
      source.record.location.label ||
      [source.record.location.city, source.record.location.state]
        .filter(Boolean)
        .join(", ") ||
      null
    );
  return source.record[field];
}

export function milestoneField(id: string): PublicField | null {
  if (id.endsWith(":birth") || id.endsWith("-birth")) return "birthDate";
  if (id.endsWith(":death")) return "deathDate";
  if (
    id.endsWith(":incident") ||
    id.endsWith("-incident") ||
    id.endsWith("-death")
  )
    return "incidentDate";
  return null;
}

export function defaultSettings(source: SourceCase): DisplaySettings {
  const r = source.record;
  return {
    sourceFingerprint: source.fingerprint,
    name: r.name,
    slug: r.slug,
    introduction: r.isDemo ? (r.summary ?? "") : "",
    story: "",
    visibleFields: r.isDemo
      ? publicFields.filter((field) => !!sourceFieldValue(source, field))
      : [],
    visibleSections: r.isDemo
      ? r.sections.map((section) => section.category)
      : ["overview"],
    visibleEvents: r.isDemo ? r.events.map((event) => event.id) : [],
    showTimeline: r.isDemo,
    showSources: r.isDemo,
  };
}

// The source comes from the authenticated server. Settings never contain raw contacts,
// source URLs, arbitrary JSON snapshots, or authorization decisions supplied by a browser.
export function buildSnapshot(
  source: SourceCase,
  input: DisplaySettings,
): CaseRecord | null {
  const settings = settingsSchema.parse(input);
  if (settings.sourceFingerprint !== source.fingerprint) {
    throw new PublishingError(
      "The Airtable record changed. Refresh the source before saving.",
      409,
    );
  }
  if (!settings.introduction.trim()) return null;
  const r = source.record;
  const visible = (field: PublicField) =>
    settings.visibleFields.includes(field);
  const sections = r.sections
    .filter((section) => settings.visibleSections.includes(section.category))
    .filter(
      (section) => !(section.category === "overview" && settings.story.trim()),
    );
  if (settings.story.trim() && settings.visibleSections.includes("overview")) {
    sections.unshift({
      category: "overview",
      title: "Their story",
      paragraphs: settings.story
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      sourceIds: [],
    });
  }
  const events = settings.showTimeline
    ? r.events
        .filter((event) => settings.visibleEvents.includes(event.id))
        .filter((event) => {
          const field = milestoneField(event.id);
          return !field || visible(field);
        })
    : [];
  const usedSources = new Set(
    [...sections, ...events].flatMap((item) => item.sourceIds),
  );
  return caseSchema.parse({
    id: r.id,
    slug: settings.slug,
    name: settings.name,
    isDemo: r.isDemo,
    summary: settings.introduction.trim(),
    remembrance: null,
    location: visible("location")
      ? r.location
      : { city: null, state: null, label: null },
    birthDate: visible("birthDate") ? r.birthDate : null,
    deathDate: visible("deathDate") ? r.deathDate : null,
    incidentDate: visible("incidentDate") ? r.incidentDate : null,
    agency: visible("agency") ? r.agency : null,
    caseStatus: visible("caseStatus") ? r.caseStatus : null,
    passions: [],
    color: r.color,
    sections: sections.map((section) => ({
      ...section,
      sourceIds: settings.showSources ? section.sourceIds : [],
    })),
    events: events.map((event) => ({
      ...event,
      sourceIds: settings.showSources ? event.sourceIds : [],
    })),
    sources: settings.showSources
      ? r.sources.filter((entry) => usedSources.has(entry.id))
      : [],
    display: {
      birthDate: visible("birthDate"),
      deathDate: visible("deathDate"),
      incidentDate: visible("incidentDate"),
      location: visible("location"),
      agency: visible("agency"),
      caseStatus: visible("caseStatus"),
      timeline: settings.showTimeline,
      sources: settings.showSources,
    },
    updatedAt: null,
  });
}
