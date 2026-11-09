import { z } from "zod";
import { checkOrigin } from "@/server/auth";
import { adminMode } from "@/server/config";
import { userClient } from "@/server/supabase";
import { reply, replyError, readJson } from "@/server/http";
import { PublishingError } from "@aster/publishing/model";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (adminMode() !== "supabase")
      throw new PublishingError(
        "Configure Supabase to sign in to the owner workspace.",
        503,
      );
    const input = z
      .object({
        email: z.email().max(300),
        password: z.string().min(1).max(1024),
      })
      .strict()
      .parse(await readJson(request));
    const client = await userClient();
    const signedIn = await client.auth.signInWithPassword(input);
    if (signedIn.error || !signedIn.data.user)
      throw new PublishingError(
        signedIn.error?.code === "email_not_confirmed"
          ? "Confirm this owner account’s email in Supabase before signing in."
          : "The email or password could not be verified.",
        401,
      );
    const membership = await client
      .from("aster_admin_members")
      .select("user_id")
      .eq("user_id", signedIn.data.user.id)
      .maybeSingle();
    if (membership.error || !membership.data) {
      await client.auth.signOut();
      throw new PublishingError(
        membership.error
          ? "Run the Supabase SQL setup files to finish owner access."
          : "This account is not authorized as an Aster owner.",
        membership.error ? 503 : 403,
      );
    }
    return reply({ signedIn: true });
  } catch (error) {
    return replyError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    if (adminMode() === "supabase") await (await userClient()).auth.signOut();
    return reply({ signedOut: true });
  } catch (error) {
    return replyError(error);
  }
}
