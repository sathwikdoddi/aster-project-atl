"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="setup-page" role="alert">
      <p className="eyebrow">A MOMENT TO PAUSE</p>
      <h1>The workspace couldn’t load.</h1>
      <p>Your published stories have not been changed.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
