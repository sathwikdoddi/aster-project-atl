import Link from "next/link";
import { AsterMark, Arrow } from "./icons";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="The Aster Project home">
        <AsterMark />
        <span>
          the aster project
          <span className="brand-caption">Stories. Humanity. Remembrance.</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/#explore">Explore the stories</Link>
        <Link href="/about">
          About the project <Arrow diagonal />
        </Link>
      </nav>
    </header>
  );
}
