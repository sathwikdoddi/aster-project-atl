"use client";

import Link from "next/link";
import { AsterMark } from "@/components/icons";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="status-page" role="alert">
      <AsterMark />
      <p className="eyebrow">A MOMENT TO PAUSE</p>
      <h1>We couldn’t load this story.</h1>
      <p>Please try again in a moment.</p>
      <button className="button primary" type="button" onClick={reset}>
        Try again
      </button>
      <Link href="/">Return home</Link>
    </main>
  );
}
