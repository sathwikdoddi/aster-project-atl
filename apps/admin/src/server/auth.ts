import "server-only";
import { headers } from "next/headers";
import { PublishingError } from "@aster/publishing/model";
import { adminMode } from "./config";
import { userClient } from "./supabase";

export async function requireOwner() {
  const mode = adminMode();
  if (mode === "setup")
    throw new PublishingError(
      "Complete the Supabase connection settings to enable owner login.",
      503,
    );
  if (mode === "demo") {
    const host = (await headers()).get("host") ?? "";
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))
      throw new PublishingError(
        "The fictional demo is available on this computer only.",
        403,
      );
    return {
      mode,
      actor: "local-demo",
      email: "Local demonstration",
      client: null,
    } as const;
  }
  const client = await userClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new PublishingError("Sign in to access the owner workspace.", 401);
  const membership = await client
    .from("aster_admin_members")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (membership.error)
    throw new PublishingError(
      "Run the Supabase SQL setup files to enable owner access.",
      503,
    );
  if (!membership.data)
    throw new PublishingError(
      "This account has not been authorized as an Aster owner.",
      403,
    );
  return {
    mode,
    actor: data.user.id,
    email: data.user.email ?? "Aster owner",
    client,
  } as const;
}

export function checkOrigin(request: Request) {
  // Next can normalize request.url to localhost while the browser uses 127.0.0.1.
  // Host is the browser's actual destination; hosted deployments set ADMIN_ORIGIN.
  const destination = new URL(request.url);
  destination.host = request.headers.get("host") ?? destination.host;
  const expected = process.env.ADMIN_ORIGIN ?? destination.origin;
  if (request.headers.get("origin") !== expected)
    throw new PublishingError(
      "This request must come from the owner workspace.",
      403,
    );
}
