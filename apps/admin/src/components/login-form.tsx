"use client";
import { useState } from "react";
import { Mark } from "./mark";

export function LoginForm({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Sign-in failed. Please try again.");
      setPassword("");
      window.location.assign("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign-in failed.");
      setBusy(false);
    }
  }
  return (
    <main id="main" className="login-page">
      <section className="login-art">
        <div className="login-brand">
          <Mark />
          <span>the aster project</span>
        </div>
        <div>
          <p className="eyebrow">THE OWNER WORKSPACE</p>
          <h1>
            Every story.
            <br />
            Shared with <em>care.</em>
          </h1>
          <p>
            Review the information. Choose what’s public.
            <br />
            Keep the person at the center.
          </p>
        </div>
        <Mark className="login-flower" />
        <small>Stories. Humanity. Remembrance.</small>
      </section>
      <section className="login-panel">
        <p className="eyebrow">WELCOME BACK</p>
        <h2>
          A place to steward
          <br />
          the stories.
        </h2>
        <p className="muted">
          Sign in to review profiles and manage what appears on the public
          website.
        </p>
        {!configured && (
          <div className="notice warning">
            Add the Supabase connection settings to enable owner sign-in.
          </div>
        )}
        <form onSubmit={signIn}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy || !configured}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy || !configured}
          />
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy || !configured}>
            {busy ? "Signing in…" : "Sign in to the workspace"}
            <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="login-footnote">
          Access is limited to authorized Aster Project owners.
        </p>
      </section>
    </main>
  );
}
