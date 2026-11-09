import "server-only";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  open,
  unlink,
} from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { caseCollectionSchema } from "@aster/content/schema";
import type { PublicCaseRepository } from "@aster/content/repository";
import { sortByDate } from "@aster/content/format";
import {
  draftSchema,
  publicationSchema,
  settingsSchema,
  PublishingError,
  type OwnerStore,
} from "./model";

const stateSchema = z.object({
  drafts: z.array(draftSchema),
  publications: z.array(publicationSchema),
});
type State = z.infer<typeof stateSchema>;

export function createLocalDemoStore(
  file: string,
): OwnerStore & { publicRepository: PublicCaseRepository } {
  async function load(): Promise<State> {
    try {
      const state = stateSchema.parse(JSON.parse(await readFile(file, "utf8")));
      if (
        [
          ...state.publications.map((p) => p.snapshot),
          ...state.drafts.flatMap((d) => (d.snapshot ? [d.snapshot] : [])),
        ].some((r) => !r.isDemo)
      ) {
        throw new Error(
          "Local storage is restricted to fictional demo records.",
        );
      }
      return state;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return { drafts: [], publications: [] };
      throw error;
    }
  }
  async function mutate<T>(operation: (state: State) => T): Promise<T> {
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    let lock;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        lock = await open(`${file}.lock`, "wx", 0o600);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    if (!lock)
      throw new PublishingError(
        "A save is already in progress. Try again shortly.",
        409,
      );
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      const state = await load();
      const result = operation(state);
      await writeFile(temporary, JSON.stringify(stateSchema.parse(state)), {
        mode: 0o600,
      });
      await rename(temporary, file);
      return result;
    } finally {
      await lock.close();
      await unlink(`${file}.lock`).catch(() => {});
      await unlink(temporary).catch(() => {});
    }
  }
  const store: OwnerStore = {
    list: load,
    async save(caseKey, settings, snapshot, expectedRevision) {
      if (snapshot && (!snapshot.isDemo || snapshot.id !== caseKey))
        throw new PublishingError(
          "Only fictional records can use local demo storage.",
          403,
        );
      return mutate((state) => {
        const existing = state.drafts.find(
          (draft) => draft.caseKey === caseKey,
        );
        if ((existing?.revision ?? 0) !== expectedRevision)
          throw new PublishingError(
            "This draft changed. Reload before saving.",
            409,
          );
        const saved = draftSchema.parse({
          caseKey,
          settings: settingsSchema.parse(settings),
          snapshot,
          revision: expectedRevision + 1,
          updatedAt: new Date().toISOString(),
        });
        state.drafts = [
          ...state.drafts.filter((draft) => draft.caseKey !== caseKey),
          saved,
        ];
        return saved;
      });
    },
    async publish(caseKey, expectedRevision) {
      return mutate((state) => {
        const draft = state.drafts.find((entry) => entry.caseKey === caseKey);
        if (!draft || draft.revision !== expectedRevision)
          throw new PublishingError(
            "This draft changed. Reload before publishing.",
            409,
          );
        if (!draft.snapshot)
          throw new PublishingError(
            "Write a public introduction before publishing.",
          );
        if (
          state.publications.some(
            (entry) =>
              entry.caseKey !== caseKey &&
              entry.snapshot.slug === draft.snapshot?.slug,
          )
        )
          throw new PublishingError(
            "That public URL is already used by another profile.",
            409,
          );
        const publication = publicationSchema.parse({
          caseKey,
          snapshot: structuredClone(draft.snapshot),
          revision: draft.revision,
          publishedAt: new Date().toISOString(),
        });
        state.publications = [
          ...state.publications.filter((entry) => entry.caseKey !== caseKey),
          publication,
        ];
        return publication;
      });
    },
    async unpublish(caseKey, expectedRevision) {
      return mutate((state) => {
        const existing = state.publications.find(
          (entry) => entry.caseKey === caseKey,
        );
        if (existing && existing.revision !== expectedRevision)
          throw new PublishingError(
            "This publication changed. Reload before unpublishing.",
            409,
          );
        state.publications = state.publications.filter(
          (entry) => entry.caseKey !== caseKey,
        );
      });
    },
  };
  return {
    ...store,
    publicRepository: {
      async list() {
        return sortByDate(
          caseCollectionSchema.parse(
            (await load()).publications.map((entry) => entry.snapshot),
          ),
          (record) => record.deathDate ?? record.incidentDate,
          "desc",
        );
      },
      async findBySlug(slug) {
        return (
          (await load()).publications.find(
            (entry) => entry.snapshot.slug === slug,
          )?.snapshot ?? null
        );
      },
    },
  };
}
