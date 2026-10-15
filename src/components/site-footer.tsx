import Link from "next/link";
import { AsterMark, Arrow } from "./icons";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-wordmark">
          <AsterMark />
          <span>Every life leaves a story.</span>
        </div>
        <Link href="/about">
          Built with care, for remembrance <Arrow diagonal />
        </Link>
      </div>
      <div className="footer-bottom">
        <p>The Aster Project · Development prototype</p>
        <p>
          All records in this preview are fictional.{" "}
          <Link href="/about#prototype">About this prototype</Link>
        </p>
      </div>
    </footer>
  );
}
