import "server-only";
import { createLocalDemoStore } from "@aster/publishing/local";
import { createSupabaseOwnerStore } from "@aster/publishing/supabase";
import { requireOwner } from "./auth";
import { localStorePath } from "./config";

export async function ownerWorkspace() {
  const owner = await requireOwner();
  const store =
    owner.mode === "demo"
      ? createLocalDemoStore(localStorePath())
      : createSupabaseOwnerStore(owner.client!);
  return { owner, store };
}
