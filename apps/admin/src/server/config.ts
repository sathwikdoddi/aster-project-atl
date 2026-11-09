import "server-only";
import path from "node:path";

export function adminMode(): "demo" | "supabase" | "setup" {
  if (process.env.ADMIN_MODE === "demo")
    return process.env.NODE_ENV === "production" ? "setup" : "demo";
  if (process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY)
    return "supabase";
  return "setup";
}
export function localStorePath() {
  return (
    process.env.ASTER_LOCAL_STORE ??
    path.resolve(process.cwd(), "../../.aster-local/publishing.json")
  );
}
