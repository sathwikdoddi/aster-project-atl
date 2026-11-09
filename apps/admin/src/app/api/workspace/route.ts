import { ownerWorkspace } from "@/server/workspace";
import { listSources } from "@/server/sources";
import { reply, replyError } from "@/server/http";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { owner, store } = await ownerWorkspace();
    const [state, sources] = await Promise.all([
      store.list(),
      listSources(owner.mode)
        .then((data) => ({ data, error: null as string | null }))
        .catch((error: Error) => ({ data: [], error: error.message })),
    ]);
    return reply({
      mode: owner.mode,
      email: owner.email,
      ...state,
      sources: sources.data,
      sourceError: sources.error,
      publicUrl: process.env.PUBLIC_SITE_URL ?? "http://127.0.0.1:3000",
    });
  } catch (error) {
    return replyError(error);
  }
}
