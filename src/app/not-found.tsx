import Link from "next/link";
import { AsterMark, Arrow } from "@/components/icons";

export default function NotFound() {
  return (
    <main id="main" className="status-page">
      <AsterMark />
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>This story isn’t here yet.</h1>
      <p>The link may have changed, or the story may not have been added.</p>
      <Link href="/#explore" className="button primary">
        Return to the stories <Arrow />
      </Link>
    </main>
  );
}
