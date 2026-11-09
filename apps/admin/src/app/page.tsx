import { redirect } from "next/navigation";
import { requireOwner } from "@/server/auth";
import { Dashboard } from "@/components/dashboard";
import { PublishingError } from "@aster/publishing/model";
export const dynamic = "force-dynamic";
export default async function Page() {
  let issue: PublishingError | null = null;
  try {
    await requireOwner();
  } catch (error) {
    issue =
      error instanceof PublishingError
        ? error
        : new PublishingError("The owner workspace could not be loaded.", 503);
  }
  if (issue?.status === 401 || issue?.status === 403) redirect("/login");
  if (issue)
    return (
      <main id="main" className="setup-page">
        <p className="eyebrow">OWNER WORKSPACE SETUP</p>
        <h1>
          A shared foundation
          <br />
          for the stories.
        </h1>
        <p>{issue.message}</p>
        <p>
          Follow the setup steps in the project’s{" "}
          <code>docs/admin-setup.md</code>, then refresh this page.
        </p>
        <a className="button primary" href="/login">
          Go to sign-in →
        </a>
      </main>
    );
  return <Dashboard />;
}
