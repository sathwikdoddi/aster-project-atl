import { redirect } from "next/navigation";
import { adminMode } from "@/server/config";
import { requireOwner } from "@/server/auth";
import { LoginForm } from "@/components/login-form";
export const dynamic = "force-dynamic";
export default async function Login() {
  const mode = adminMode();
  if (mode === "demo") redirect("/");
  let authorized = false;
  if (mode === "supabase")
    try {
      await requireOwner();
      authorized = true;
    } catch {}
  if (authorized) redirect("/");
  return <LoginForm configured={mode === "supabase"} />;
}
