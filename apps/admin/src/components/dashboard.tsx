"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildSnapshot,
  defaultSettings,
  fieldLabels,
  publicFields,
  sourceFieldValue,
  milestoneField,
  type SourceCase,
  type DisplaySettings,
  type Draft,
  type Publication,
} from "@aster/publishing/model";
import { categoryLabels, type CaseRecord } from "@aster/content/schema";
import { formatDate, formatLocation } from "@aster/content/format";
import { Mark } from "./mark";

type Workspace = {
  mode: "demo" | "supabase";
  email: string;
  sources: SourceCase[];
  drafts: Draft[];
  publications: Publication[];
  sourceError: string | null;
  publicUrl: string;
};
type View = "profiles" | "publications" | "setup";

function PublicPreview({
  record,
  draft,
}: {
  record: CaseRecord | null;
  draft: boolean;
}) {
  return (
    <div className="preview-document">
      {!record ? (
        <div className="preview-empty">
          <Mark />
          <h3>Make room for the story.</h3>
          <p>
            Write a public introduction to see the preview. Nothing here becomes
            public until you publish.
          </p>
        </div>
      ) : (
        <>
          <div className={`preview-cover ${record.color}`}>
            <p className="eyebrow">
              {record.isDemo ? "FICTIONAL SAMPLE" : "A LIFE TO REMEMBER"}
            </p>
            <h2>{record.name}</h2>
            <p>{record.summary}</p>
            <Mark />
          </div>
          <div className="preview-body">
            <dl className="preview-facts">
              {record.display?.birthDate && (
                <div>
                  <dt>Born</dt>
                  <dd>{formatDate(record.birthDate)}</dd>
                </div>
              )}
              {record.display?.deathDate && (
                <div>
                  <dt>Date of death</dt>
                  <dd>{formatDate(record.deathDate)}</dd>
                </div>
              )}
              {record.display?.incidentDate && (
                <div>
                  <dt>Incident date</dt>
                  <dd>{formatDate(record.incidentDate)}</dd>
                </div>
              )}
              {record.display?.location && (
                <div>
                  <dt>Place</dt>
                  <dd>{formatLocation(record.location)}</dd>
                </div>
              )}
              {record.display?.agency && (
                <div>
                  <dt>Agency</dt>
                  <dd>{record.agency}</dd>
                </div>
              )}
              {record.display?.caseStatus && (
                <div>
                  <dt>Case status as recorded</dt>
                  <dd>{record.caseStatus}</dd>
                </div>
              )}
            </dl>
            {record.sections.map((section) => (
              <section key={section.category}>
                <p className="eyebrow">{categoryLabels[section.category]}</p>
                <h3>{section.title}</h3>
                {section.paragraphs.map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
              </section>
            ))}
            {record.display?.timeline && record.events.length > 0 && (
              <section>
                <p className="eyebrow">MOMENTS ALONG THE WAY</p>
                <h3>A continuing story.</h3>
                {record.events.map((event) => (
                  <div className="preview-event" key={event.id}>
                    <span>{formatDate(event.date)}</span>
                    <strong>{event.title}</strong>
                  </div>
                ))}
              </section>
            )}
            {record.display?.sources && record.sources.length > 0 && (
              <section>
                <h3>Sources</h3>
                {record.sources.map((source) => (
                  <p key={source.id}>{source.title}</p>
                ))}
              </section>
            )}
            <div className="preview-ending">
              <Mark />
              <p>Every life leaves a story.</p>
            </div>
          </div>
        </>
      )}
      <div className="preview-watermark">
        {draft ? "DRAFT PREVIEW · NOT PUBLIC" : "CURRENTLY PUBLISHED VERSION"}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [view, setView] = useState<View>("profiles");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<DisplaySettings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editorTab, setEditorTab] = useState<"content" | "source">("content");
  const [previewTab, setPreviewTab] = useState<"draft" | "published">("draft");

  const source =
    workspace?.sources.find((entry) => entry.record.id === selectedId) ?? null;
  const draft = workspace?.drafts.find((entry) => entry.caseKey === selectedId);
  const publication = workspace?.publications.find(
    (entry) => entry.caseKey === selectedId,
  );
  const sourceChanged =
    !!source &&
    !!draft &&
    draft.settings.sourceFingerprint !== source.fingerprint;
  const publishedKeys = useMemo(
    () => new Set(workspace?.publications.map((entry) => entry.caseKey) ?? []),
    [workspace],
  );
  const draftKeys = useMemo(
    () => new Set(workspace?.drafts.map((entry) => entry.caseKey) ?? []),
    [workspace],
  );
  const preview = useMemo(() => {
    if (previewTab === "published") return publication?.snapshot ?? null;
    if (!dirty && draft) return draft.snapshot;
    if (!source || !settings) return null;
    try {
      return buildSnapshot(source, settings);
    } catch {
      return null;
    }
  }, [source, settings, draft, dirty, publication, previewTab]);

  async function refresh() {
    if (
      dirty &&
      !window.confirm("Discard the unsaved changes and reload the workspace?")
    )
      return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "The workspace could not be loaded.");
      setWorkspace(data);
      setSelectedId(null);
      setSettings(null);
      setDirty(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The workspace could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []); // Load only after the server verifies the owner.
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  function choose(entry: SourceCase) {
    if (
      dirty &&
      !window.confirm("Discard unsaved changes before opening another profile?")
    )
      return;
    setSelectedId(entry.record.id);
    setSettings(
      structuredClone(
        workspace?.drafts.find((d) => d.caseKey === entry.record.id)
          ?.settings ?? defaultSettings(entry),
      ),
    );
    setDirty(false);
    setView("profiles");
    setEditorTab("content");
    setPreviewTab("draft");
    setError("");
    setMessage("");
  }
  function leave(next: View) {
    if (
      dirty &&
      !window.confirm("Discard unsaved changes before leaving this profile?")
    )
      return;
    setView(next);
    setSelectedId(null);
    setSettings(null);
    setDirty(false);
    setError("");
    setMessage("");
  }
  function update(patch: Partial<DisplaySettings>) {
    if (!source) return;
    setSettings((current) =>
      current
        ? { ...current, ...patch, sourceFingerprint: source.fingerprint }
        : current,
    );
    setDirty(true);
    setMessage("");
    setPreviewTab("draft");
  }
  async function command(id: string, body: unknown) {
    const response = await fetch(`/api/cases/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.status === 401) {
      window.location.assign("/login");
      throw new Error("Please sign in again.");
    }
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error ?? "This action could not be completed.");
    return result;
  }
  async function saveOrPublish(publish: boolean) {
    if (!source || !settings || !workspace) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let saved = draft;
      if (dirty || !saved) {
        const result = await command(source.record.id, {
          action: "save",
          expectedRevision: draft?.revision ?? 0,
          settings,
        });
        saved = result.draft as Draft;
        setWorkspace((current) =>
          current
            ? {
                ...current,
                drafts: [
                  ...current.drafts.filter(
                    (entry) => entry.caseKey !== saved!.caseKey,
                  ),
                  saved!,
                ],
              }
            : current,
        );
        setDirty(false);
      }
      if (publish) {
        const result = await command(source.record.id, {
          action: "publish",
          expectedRevision: saved!.revision,
        });
        setWorkspace((current) =>
          current
            ? {
                ...current,
                publications: [
                  ...current.publications.filter(
                    (entry) => entry.caseKey !== source.record.id,
                  ),
                  result.publication,
                ],
              }
            : current,
        );
        setMessage(
          "Published. This approved version is now available to the public website.",
        );
      } else setMessage("Draft saved. The public website is unchanged.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "The action failed.");
    } finally {
      setBusy(false);
    }
  }
  async function unpublish(entry: Publication) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await command(entry.caseKey, {
        action: "unpublish",
        expectedRevision: entry.revision,
      });
      setWorkspace((current) =>
        current
          ? {
              ...current,
              publications: current.publications.filter(
                (item) => item.caseKey !== entry.caseKey,
              ),
            }
          : current,
      );
      setPreviewTab("draft");
      setMessage(
        "Unpublished. This profile is no longer available on the public website.",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unpublishing failed.");
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    if (dirty && !window.confirm("Discard unsaved changes and sign out?"))
      return;
    await fetch("/api/session", { method: "DELETE" });
    window.location.assign("/login");
  }
  const rows = (workspace?.sources ?? []).filter((entry) => {
    const r = entry.record;
    const found = `${r.name} ${r.agency ?? ""} ${formatLocation(r.location)}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return (
      found &&
      (filter === "all" ||
        (filter === "published" && publishedKeys.has(r.id)) ||
        (filter === "draft" &&
          draftKeys.has(r.id) &&
          !publishedKeys.has(r.id)) ||
        (filter === "intro" &&
          !workspace?.drafts
            .find((d) => d.caseKey === r.id)
            ?.settings.introduction.trim()))
    );
  });
  const allCount = workspace?.sources.length ?? 0;
  const needsIntro = (workspace?.sources ?? []).filter(
    (entry) =>
      !workspace?.drafts
        .find((d) => d.caseKey === entry.record.id)
        ?.settings.introduction.trim(),
  ).length;
  const publicLink = (slug?: string) =>
    `${workspace?.publicUrl ?? "http://127.0.0.1:3000"}${slug ? `/cases/${encodeURIComponent(slug)}` : ""}`;

  return (
    <div className="workspace">
      <aside className="sidebar">
        <a href="/" className="admin-brand">
          <Mark />
          <span>
            the aster project<small>OWNER WORKSPACE</small>
          </span>
        </a>
        <div className="sidebar-label">YOUR WORKSPACE</div>
        <nav aria-label="Workspace navigation">
          <button
            className={view === "profiles" ? "active" : ""}
            onClick={() => leave("profiles")}
          >
            <span aria-hidden="true">▦</span>Profiles
            <span className="nav-count">{allCount}</span>
          </button>
          <button
            className={view === "publications" ? "active" : ""}
            onClick={() => leave("publications")}
          >
            <span aria-hidden="true">↗</span>Published stories
            <span className="nav-count">
              {workspace?.publications.length ?? 0}
            </span>
          </button>
          <button
            className={view === "setup" ? "active" : ""}
            onClick={() => leave("setup")}
          >
            <span aria-hidden="true">⚙</span>Connections & setup
          </button>
        </nav>
        <div className="sidebar-purpose">
          <Mark />
          <p>
            A little care
            <br />
            before a story
            <br />
            <em>meets the world.</em>
          </p>
        </div>
        <a
          className="public-site-link"
          href={publicLink()}
          target="_blank"
          rel="noreferrer"
        >
          Open public website <span aria-hidden="true">↗</span>
        </a>
        <div className="owner-card">
          <span className="owner-avatar">A</span>
          <div>
            <strong>Aster owner</strong>
            <span>{workspace?.email ?? "Private workspace"}</span>
          </div>
          {workspace?.mode === "supabase" && (
            <button onClick={signOut} aria-label="Sign out" title="Sign out">
              ↪
            </button>
          )}
        </div>
      </aside>
      <div className="workspace-content">
        <header className="workspace-topbar">
          <p>
            The Aster Project <span>/</span>{" "}
            {view === "publications"
              ? "Published stories"
              : view === "setup"
                ? "Connections"
                : "Profiles"}
          </p>
          <span className="connection-pill">
            <i />
            {workspace?.mode === "demo"
              ? "Local demonstration"
              : "Owner access"}
          </span>
        </header>
        <main id="main" className="dashboard-main">
          {workspace?.mode === "demo" && (
            <div className="notice demo-notice">
              <strong>Fictional demonstration.</strong> Local drafts and
              publications use sample profiles. Real Airtable records require
              owner sign-in.
            </div>
          )}
          {error && (
            <div className="notice error-notice" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}
          {message && (
            <div className="notice success-notice" role="status">
              {message}
            </div>
          )}
          {workspace?.sourceError && (
            <div className="notice warning">
              {workspace.sourceError} Existing publications can still be
              unpublished below.
            </div>
          )}
          {view === "setup" ? (
            <>
              <div className="page-title">
                <div>
                  <p className="eyebrow">THE SHARED FOUNDATION</p>
                  <h1>Connections & setup</h1>
                  <p>
                    Working records stay in Airtable. Approved versions are
                    published separately.
                  </p>
                </div>
              </div>
              <div className="setup-grid">
                <section className="panel">
                  <p className="eyebrow">01 · SOURCE</p>
                  <h2>
                    {workspace?.mode === "demo"
                      ? "Fictional profiles"
                      : "Family Case Management Base"}
                  </h2>
                  <p>
                    {workspace?.mode === "demo"
                      ? "This local demonstration uses the repository’s fictional sample profiles."
                      : "The workspace reads names, life dates, location, agency, summary, and case status from Family Profiles. Family contacts and phone numbers are excluded."}
                  </p>
                  <span className="status-pill">
                    {workspace?.sourceError
                      ? "Needs attention"
                      : `${allCount} available profiles`}
                  </span>
                </section>
                <section className="panel">
                  <p className="eyebrow">02 · PUBLISHING</p>
                  <h2>
                    {workspace?.mode === "demo"
                      ? "Local demo storage"
                      : "Supabase"}
                  </h2>
                  <p>
                    Drafts are private. Publishing saves an approved copy. Later
                    Airtable changes stay out of that version until you review
                    and republish.
                  </p>
                  <span className="status-pill published">
                    {workspace?.publications.length ?? 0} published stories
                  </span>
                </section>
                <section className="panel setup-wide">
                  <p className="eyebrow">THE REVIEW PROCESS</p>
                  <h2>From available information to a public story.</h2>
                  <ol>
                    <li>Open a profile and review the source record.</li>
                    <li>
                      Write a public introduction and choose the facts, story
                      sections, and milestones to include.
                    </li>
                    <li>Save a draft and check its public preview.</li>
                    <li>
                      Publish when the content is ready. You can unpublish it at
                      any time.
                    </li>
                  </ol>
                  <p>
                    Photo and document publication will be added after media
                    hosting and approval are configured.
                  </p>
                </section>
              </div>
            </>
          ) : view === "publications" ? (
            <>
              <div className="page-title">
                <div>
                  <p className="eyebrow">SHARED WITH THE PUBLIC</p>
                  <h1>Published stories</h1>
                  <p>
                    The exact versions currently available on the public
                    website.
                  </p>
                </div>
                <a
                  className="button secondary"
                  href={publicLink()}
                  target="_blank"
                  rel="noreferrer"
                >
                  View website ↗
                </a>
              </div>
              {!workspace?.publications.length ? (
                <div className="empty-panel">
                  <Mark />
                  <h2>A place for stories to be shared.</h2>
                  <p>Publish a reviewed profile to see it here.</p>
                  <button
                    className="button primary"
                    onClick={() => leave("profiles")}
                  >
                    Review profiles →
                  </button>
                </div>
              ) : (
                <div className="publication-grid">
                  {workspace.publications.map((entry) => (
                    <article
                      className="panel publication-card"
                      key={entry.caseKey}
                    >
                      <span className="status-pill published">
                        Published · v{entry.revision}
                      </span>
                      <h2>{entry.snapshot.name}</h2>
                      <p>{entry.snapshot.summary}</p>
                      <small>
                        Published{" "}
                        {new Date(entry.publishedAt).toLocaleDateString(
                          "en-US",
                        )}
                      </small>
                      <div className="publication-actions">
                        <a
                          href={publicLink(entry.snapshot.slug)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View public profile ↗
                        </a>
                        <button
                          className="danger-link"
                          disabled={busy}
                          onClick={() => unpublish(entry)}
                        >
                          Unpublish {entry.snapshot.name}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : source && settings ? (
            <>
              <button className="back-button" onClick={() => leave("profiles")}>
                ← All profiles
              </button>
              <div className="page-title editor-title">
                <div>
                  <p className="eyebrow">REVIEW & PREPARE</p>
                  <h1>{source.record.name}</h1>
                  <div className="editor-meta">
                    <span
                      className={`status-pill ${publication ? "published" : ""}`}
                    >
                      {publication
                        ? dirty || (draft?.revision ?? 0) > publication.revision
                          ? "Unpublished changes"
                          : "Published"
                        : draft
                          ? "Draft"
                          : "Not published"}
                    </span>
                    <span>
                      {dirty
                        ? "Unsaved changes"
                        : draft
                          ? `Draft v${draft.revision} saved`
                          : "No draft saved"}
                    </span>
                  </div>
                </div>
                <div className="editor-actions">
                  {publication && (
                    <button
                      className="button subtle danger-link"
                      disabled={busy}
                      onClick={() => unpublish(publication)}
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    className="button secondary"
                    onClick={() => saveOrPublish(false)}
                    disabled={busy || (!dirty && !!draft)}
                  >
                    {busy ? "Saving…" : "Save draft"}
                  </button>
                  <button
                    className="button primary"
                    onClick={() => saveOrPublish(true)}
                    disabled={
                      busy ||
                      !settings.introduction.trim() ||
                      (!!publication &&
                        !dirty &&
                        publication.revision === draft?.revision)
                    }
                  >
                    {publication ? "Publish update" : "Publish profile"}
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
              <div className="review-layout">
                {sourceChanged && (
                  <div className="notice warning source-change">
                    The source record has changed since this draft was saved.
                    The preview still shows your saved version.
                    <button
                      className="button secondary"
                      onClick={() => update({})}
                    >
                      Review source changes
                    </button>
                  </div>
                )}
                <section className="editor-panel">
                  <div
                    className="editor-tabs"
                    role="group"
                    aria-label="Profile editor view"
                  >
                    <button
                      aria-pressed={editorTab === "content"}
                      onClick={() => setEditorTab("content")}
                    >
                      Public content
                    </button>
                    <button
                      aria-pressed={editorTab === "source"}
                      onClick={() => setEditorTab("source")}
                    >
                      Source record
                    </button>
                  </div>
                  {editorTab === "source" ? (
                    <div className="editor-section">
                      <p className="eyebrow">AVAILABLE INFORMATION</p>
                      <h2>Airtable source record</h2>
                      <p className="muted">
                        Review the available information before choosing what to
                        publish. This view does not edit Airtable.
                      </p>
                      <dl className="source-facts">
                        {publicFields.map((field) => (
                          <div key={field}>
                            <dt>{fieldLabels[field]}</dt>
                            <dd>
                              {sourceFieldValue(source, field) ??
                                "Not recorded"}
                            </dd>
                          </div>
                        ))}
                        <div>
                          <dt>Photos</dt>
                          <dd>{source.photoCount} available</dd>
                        </div>
                        <div>
                          <dt>Linked documents</dt>
                          <dd>{source.linkedDocumentCount}</dd>
                        </div>
                        <div>
                          <dt>Linked case details</dt>
                          <dd>{source.linkedDetailCount}</dd>
                        </div>
                      </dl>
                      <h3>Source summary</h3>
                      <p className="source-summary">
                        {source.record.summary ??
                          "No summary has been added to this Airtable profile."}
                      </p>
                    </div>
                  ) : (
                    <fieldset disabled={busy} className="editor-fields">
                      <div className="editor-section">
                        <p className="eyebrow">01 · THE INTRODUCTION</p>
                        <h2>Begin with the person.</h2>
                        <p className="muted">
                          This is the text visitors see first. Review it in the
                          preview before publishing.
                        </p>
                        <label htmlFor="public-name">Public display name</label>
                        <input
                          id="public-name"
                          value={settings.name}
                          onChange={(event) =>
                            update({ name: event.target.value })
                          }
                        />
                        <label htmlFor="public-slug">Public URL</label>
                        <div className="slug-field">
                          <span>/cases/</span>
                          <input
                            id="public-slug"
                            value={settings.slug}
                            onChange={(event) =>
                              update({ slug: event.target.value })
                            }
                          />
                        </div>
                        <label htmlFor="introduction">
                          Public introduction <span>Required to publish</span>
                        </label>
                        <textarea
                          id="introduction"
                          rows={4}
                          maxLength={3000}
                          value={settings.introduction}
                          placeholder="Write a short, reviewed introduction to this person’s life."
                          onChange={(event) =>
                            update({ introduction: event.target.value })
                          }
                        />
                        <p className="field-help">
                          Nothing is generated automatically from private notes
                          or AI summaries.
                        </p>
                      </div>
                      <div className="editor-section">
                        <p className="eyebrow">02 · WHAT VISITORS CAN SEE</p>
                        <h2>Choose the public facts.</h2>
                        <p className="muted">
                          Only selected fields are included in the published
                          profile.
                        </p>
                        <div className="field-options">
                          {publicFields.map((field) => {
                            const value = sourceFieldValue(source, field);
                            return (
                              <label
                                className={`check-card ${!value ? "unavailable" : ""}`}
                                key={field}
                              >
                                <input
                                  type="checkbox"
                                  disabled={!value || busy}
                                  checked={settings.visibleFields.includes(
                                    field,
                                  )}
                                  onChange={(event) =>
                                    update({
                                      visibleFields: event.target.checked
                                        ? [...settings.visibleFields, field]
                                        : settings.visibleFields.filter(
                                            (value) => value !== field,
                                          ),
                                    })
                                  }
                                />
                                <span>
                                  <strong>{fieldLabels[field]}</strong>
                                  <small>{value ?? "Not recorded"}</small>
                                  {field === "caseStatus" &&
                                    value?.includes("?") && (
                                      <em>Marked uncertain in the source.</em>
                                    )}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div className="editor-section">
                        <p className="eyebrow">03 · THE STORY</p>
                        <h2>Make room for context.</h2>
                        <label className="inline-check">
                          <input
                            type="checkbox"
                            checked={settings.visibleSections.includes(
                              "overview",
                            )}
                            onChange={(event) =>
                              update({
                                visibleSections: event.target.checked
                                  ? [
                                      ...new Set([
                                        ...settings.visibleSections,
                                        "overview" as const,
                                      ]),
                                    ]
                                  : settings.visibleSections.filter(
                                      (value) => value !== "overview",
                                    ),
                              })
                            }
                          />
                          Include a life story section
                        </label>
                        <label htmlFor="public-story">Public life story</label>
                        <textarea
                          id="public-story"
                          rows={7}
                          maxLength={30000}
                          value={settings.story}
                          placeholder="Add reviewed memories, interests, and context. Separate paragraphs with a blank line."
                          onChange={(event) =>
                            update({ story: event.target.value })
                          }
                        />
                        {source.record.sections
                          .filter((section) => section.category !== "overview")
                          .map((section) => (
                            <label
                              className="inline-check"
                              key={section.category}
                            >
                              <input
                                type="checkbox"
                                checked={settings.visibleSections.includes(
                                  section.category,
                                )}
                                onChange={(event) =>
                                  update({
                                    visibleSections: event.target.checked
                                      ? [
                                          ...settings.visibleSections,
                                          section.category,
                                        ]
                                      : settings.visibleSections.filter(
                                          (value) => value !== section.category,
                                        ),
                                  })
                                }
                              />
                              {categoryLabels[section.category]} —{" "}
                              {section.title}
                            </label>
                          ))}
                      </div>
                      <div className="editor-section">
                        <p className="eyebrow">04 · MOMENTS & SOURCES</p>
                        <h2>A timeline with intention.</h2>
                        <label className="inline-check">
                          <input
                            type="checkbox"
                            checked={settings.showTimeline}
                            onChange={(event) =>
                              update({ showTimeline: event.target.checked })
                            }
                          />
                          Show the case timeline
                        </label>
                        {settings.showTimeline &&
                          source.record.events.map((event) => (
                            <label className="check-card" key={event.id}>
                              <input
                                type="checkbox"
                                disabled={
                                  !!milestoneField(event.id) &&
                                  !settings.visibleFields.includes(
                                    milestoneField(event.id)!,
                                  )
                                }
                                checked={
                                  (!milestoneField(event.id) ||
                                    settings.visibleFields.includes(
                                      milestoneField(event.id)!,
                                    )) &&
                                  settings.visibleEvents.includes(event.id)
                                }
                                onChange={(change) =>
                                  update({
                                    visibleEvents: change.target.checked
                                      ? [...settings.visibleEvents, event.id]
                                      : settings.visibleEvents.filter(
                                          (value) => value !== event.id,
                                        ),
                                  })
                                }
                              />
                              <span>
                                <strong>{event.title}</strong>
                                <small>{formatDate(event.date)}</small>
                                {!!milestoneField(event.id) &&
                                  !settings.visibleFields.includes(
                                    milestoneField(event.id)!,
                                  ) && (
                                    <em>
                                      Enable the related date field above to
                                      include this milestone.
                                    </em>
                                  )}
                              </span>
                            </label>
                          ))}
                        {settings.showTimeline &&
                          !source.record.events.length && (
                            <p className="field-help">
                              No dated milestones are available yet.
                            </p>
                          )}
                        <label className="inline-check">
                          <input
                            type="checkbox"
                            disabled={!source.record.sources.length}
                            checked={settings.showSources}
                            onChange={(event) =>
                              update({ showSources: event.target.checked })
                            }
                          />
                          Show selected source references
                        </label>
                        <div className="media-note">
                          <span aria-hidden="true">◈</span>
                          <p>
                            <strong>
                              {source.photoCount} source{" "}
                              {source.photoCount === 1 ? "photo" : "photos"}{" "}
                              available.
                            </strong>{" "}
                            Photo and document publication will be added after
                            media hosting and review are configured.
                          </p>
                        </div>
                      </div>
                    </fieldset>
                  )}
                </section>
                <aside className="preview-panel">
                  <div className="preview-top">
                    <div>
                      <p className="eyebrow">THROUGH A VISITOR’S EYES</p>
                      <h2>Public preview</h2>
                    </div>
                    <span className="preview-size">↔ Desktop</span>
                  </div>
                  <div
                    className="preview-tabs"
                    role="group"
                    aria-label="Preview version"
                  >
                    <button
                      aria-pressed={previewTab === "draft"}
                      onClick={() => setPreviewTab("draft")}
                    >
                      Draft preview{dirty && " •"}
                    </button>
                    {publication && (
                      <button
                        aria-pressed={previewTab === "published"}
                        onClick={() => setPreviewTab("published")}
                      >
                        Published version
                      </button>
                    )}
                  </div>
                  <PublicPreview
                    record={preview}
                    draft={previewTab === "draft"}
                  />
                  <p className="preview-explanation">
                    {previewTab === "published"
                      ? "This is the approved version currently shared with visitors."
                      : "Saving a draft does not update the public website. Publish when the preview is ready."}
                  </p>
                  {publication && (
                    <a
                      className="preview-open"
                      href={publicLink(publication.snapshot.slug)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open the published profile ↗
                    </a>
                  )}
                </aside>
              </div>
            </>
          ) : (
            <>
              <div className="page-title">
                <div>
                  <p className="eyebrow">PEOPLE FIRST. ALWAYS.</p>
                  <h1>
                    A little care before
                    <br />a story is shared.
                  </h1>
                  <p>
                    Review the available profiles and decide what the public
                    sees.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={refresh}
                  disabled={loading}
                >
                  {loading ? "Refreshing…" : "↻ Refresh records"}
                </button>
              </div>
              <div className="stat-grid">
                <div>
                  <span>Available profiles</span>
                  <strong>{allCount}</strong>
                  <small>From your source records</small>
                </div>
                <div>
                  <span>Published stories</span>
                  <strong>{workspace?.publications.length ?? 0}</strong>
                  <small>Visible on the public website</small>
                </div>
                <div>
                  <span>Saved drafts</span>
                  <strong>{workspace?.drafts.length ?? 0}</strong>
                  <small>Ready to continue reviewing</small>
                </div>
                <div>
                  <span>Introductions needed</span>
                  <strong>{needsIntro}</strong>
                  <small>A place for the story to begin</small>
                </div>
              </div>
              <section className="profiles-panel">
                <div className="profiles-heading">
                  <div>
                    <h2>The story workspace</h2>
                    <p>
                      Open a profile to review, select, and prepare its public
                      story.
                    </p>
                  </div>
                  <label className="search-field">
                    <span aria-hidden="true">⌕</span>
                    <span className="sr-only">Search profiles</span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search names, places, agencies…"
                    />
                  </label>
                </div>
                <div
                  className="filter-row"
                  role="group"
                  aria-label="Filter profiles"
                >
                  {[
                    ["all", "All profiles"],
                    ["draft", "Drafts"],
                    ["published", "Published"],
                    ["intro", "Need introduction"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={filter === value}
                      onClick={() => setFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                  <span>
                    {rows.length} {rows.length === 1 ? "profile" : "profiles"}
                  </span>
                </div>
                <div className="profile-table">
                  <div className="profile-table-head">
                    <span>PERSON & STORY</span>
                    <span>CASE INFORMATION</span>
                    <span>PUBLICATION</span>
                    <span />
                  </div>
                  {loading ? (
                    <div className="loading-state" role="status">
                      Gathering the profiles…
                    </div>
                  ) : !rows.length ? (
                    <div className="empty-table">
                      <Mark />
                      <h3>
                        {query
                          ? "No matching profiles."
                          : "A place for profiles to come."}
                      </h3>
                      <p>
                        {query
                          ? "Try another name, place, or agency."
                          : "Refresh when your source records are ready."}
                      </p>
                    </div>
                  ) : (
                    rows.map((entry) => {
                      const r = entry.record;
                      const d = workspace?.drafts.find(
                        (item) => item.caseKey === r.id,
                      );
                      const p = workspace?.publications.find(
                        (item) => item.caseKey === r.id,
                      );
                      return (
                        <div className="profile-row" key={r.id}>
                          <div className="profile-name">
                            <span className={`profile-avatar ${r.color}`}>
                              <Mark />
                            </span>
                            <div>
                              <strong>{r.name}</strong>
                              <small>
                                {r.isDemo
                                  ? "Fictional sample"
                                  : `Record · ${r.id.slice(-6)}`}
                              </small>
                              <span className="readiness">
                                {d?.settings.introduction.trim()
                                  ? "Introduction drafted"
                                  : "Introduction needed"}
                                {entry.photoCount > 0 &&
                                  ` · ${entry.photoCount} photo${entry.photoCount > 1 ? "s" : ""}`}
                              </span>
                            </div>
                          </div>
                          <div className="profile-case">
                            <span>{formatLocation(r.location)}</span>
                            <small>
                              {r.deathDate
                                ? `Died ${formatDate(r.deathDate)}`
                                : r.incidentDate
                                  ? `Incident ${formatDate(r.incidentDate)}`
                                  : "Date not recorded"}
                            </small>
                          </div>
                          <div>
                            <span
                              className={`status-pill ${p ? "published" : d ? "draft" : ""}`}
                            >
                              {p
                                ? d && d.revision > p.revision
                                  ? "Changes pending"
                                  : "Published"
                                : d
                                  ? "Draft"
                                  : "Not published"}
                            </span>
                          </div>
                          <button
                            className="review-link"
                            onClick={() => choose(entry)}
                            aria-label={`Review ${r.name}`}
                          >
                            Review profile <span aria-hidden="true">↗</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="table-footer">
                  <Mark />
                  <p>
                    Working records stay private until you choose to publish.
                  </p>
                </div>
              </section>
              <div className="workflow-note">
                <span>01 · Review</span>
                <i />
                <span>02 · Choose & preview</span>
                <i />
                <span>03 · Publish with care</span>
              </div>
            </>
          )}
        </main>
        <footer className="admin-footer">
          The Aster Project <span>Built for careful stewardship.</span>
        </footer>
      </div>
    </div>
  );
}
