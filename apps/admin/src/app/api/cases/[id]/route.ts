import { z } from "zod";
import {
  buildSnapshot,
  settingsSchema,
  PublishingError,
} from "@aster/publishing/model";
import { ownerWorkspace } from "@/server/workspace";
import { listSources } from "@/server/sources";
import { checkOrigin } from "@/server/auth";
import { readJson, reply, replyError } from "@/server/http";
export const dynamic = "force-dynamic";

const actionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("save"),
      expectedRevision: z.number().int().nonnegative(),
      settings: settingsSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("publish"),
      expectedRevision: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal("unpublish"),
      expectedRevision: z.number().int().positive(),
    })
    .strict(),
]);
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    const { owner, store } = await ownerWorkspace();
    const input = actionSchema.parse(await readJson(request));
    const { id } = await params;
    if (input.action === "save") {
      const source = (await listSources(owner.mode)).find(
        (entry) => entry.record.id === id,
      );
      if (!source)
        throw new PublishingError(
          "This profile is no longer available in the source.",
          404,
        );
      const snapshot = buildSnapshot(source, input.settings);
      return reply({
        draft: await store.save(
          id,
          input.settings,
          snapshot,
          input.expectedRevision,
          owner.actor,
        ),
      });
    }
    if (input.action === "publish")
      return reply({
        publication: await store.publish(
          id,
          input.expectedRevision,
          owner.actor,
        ),
      });
    await store.unpublish(id, input.expectedRevision, owner.actor);
    return reply({ unpublished: true });
  } catch (error) {
    return replyError(error);
  }
}
