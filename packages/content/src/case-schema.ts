import { z } from "zod";

export const categories = [
  "overview",
  "early-life",
  "passions",
  "death",
  "investigation",
  "legacy",
] as const;
export const categoryLabels: Record<(typeof categories)[number], string> = {
  overview: "Their story",
  "early-life": "Early life",
  passions: "Passions",
  death: "Death",
  investigation: "Investigation",
  legacy: "Legacy",
};

// Year, month, and day precision are retained rather than inventing missing dates.
export const partialDateSchema = z
  .string()
  .regex(/^\d{4}(-\d{2})?(-\d{2})?$/)
  .refine((value) => {
    const [year, month = 1, day = 1] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      year >= 1000 &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Use a valid YYYY, YYYY-MM, or YYYY-MM-DD date");

export const caseSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    isDemo: z.boolean(),
    summary: z.string().min(1),
    remembrance: z.string().nullable(),
    location: z.object({
      city: z.string().nullable(),
      state: z.string().nullable(),
      label: z.string().nullable().default(null),
    }),
    birthDate: partialDateSchema.nullable(),
    incidentDate: partialDateSchema.nullable(),
    deathDate: partialDateSchema.nullable().default(null),
    agency: z.string().nullable().default(null),
    caseStatus: z.string().nullable().default(null),
    display: z
      .object({
        birthDate: z.boolean(),
        deathDate: z.boolean(),
        incidentDate: z.boolean(),
        location: z.boolean(),
        agency: z.boolean(),
        caseStatus: z.boolean(),
        timeline: z.boolean(),
        sources: z.boolean(),
      })
      .optional(),
    passions: z.array(z.string().min(1)),
    color: z.enum(["lavender", "sage", "peach"]),
    sections: z.array(
      z.object({
        category: z.enum(categories),
        title: z.string().min(1),
        paragraphs: z.array(z.string().min(1)),
        sourceIds: z.array(z.string()),
      }),
    ),
    events: z.array(
      z.object({
        id: z.string().min(1),
        date: partialDateSchema.nullable(),
        category: z.enum(categories),
        title: z.string().min(1),
        description: z.string().min(1),
        sourceIds: z.array(z.string()),
      }),
    ),
    sources: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        url: z
          .url()
          .refine((url) => ["https:", "http:"].includes(new URL(url).protocol))
          .nullable(),
        note: z.string().nullable(),
      }),
    ),
    updatedAt: partialDateSchema.nullable(),
  })
  .superRefine((record, ctx) => {
    const sourceIds = new Set(record.sources.map((source) => source.id));
    const uniqueFields = [
      record.sources.map((source) => source.id),
      record.events.map((event) => event.id),
      record.sections.map((section) => section.category),
    ];
    if (uniqueFields.some((values) => new Set(values).size !== values.length)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Source IDs, event IDs, and section categories must each be unique",
      });
    }
    for (const item of [...record.sections, ...record.events]) {
      if (item.sourceIds.some((id) => !sourceIds.has(id))) {
        ctx.addIssue({
          code: "custom",
          message: "All source references must exist on the record",
        });
      }
    }
  });

export const caseCollectionSchema = z
  .array(caseSchema)
  .superRefine((records, ctx) => {
    if (
      new Set(records.map((record) => record.slug)).size !== records.length ||
      new Set(records.map((record) => record.id)).size !== records.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Case IDs and slugs must be unique",
      });
    }
  });

export type CaseRecord = z.infer<typeof caseSchema>;
export type CaseCategory = (typeof categories)[number];
