import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AsterMark, Arrow, Pin } from "@/components/icons";
import { StoryTimeline } from "@/components/story-timeline";
import { publicCaseRepository } from "@/server/public-cases";
import { categoryLabels } from "@aster/content/schema";
import { formatDate, formatLocation } from "@aster/content/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const record = await publicCaseRepository.findBySlug((await params).slug);
  return {
    title: record ? `${record.name} — Sample story` : "Story not found",
  };
}

export default async function CasePage({ params }: Props) {
  const record = await publicCaseRepository.findBySlug((await params).slug);
  if (!record) notFound();
  const sections = record.sections.filter(
    (section) => section.paragraphs.length,
  );
  return (
    <main id="main" className="detail-page">
      <Link className="back-link" href="/#explore">
        <span aria-hidden="true">←</span> Back to the stories
      </Link>
      <section
        className={`detail-hero ${record.color}`}
        aria-labelledby="case-name"
      >
        <div className="detail-hero-copy">
          <p className="eyebrow">
            A LIFE TO REMEMBER{" "}
            <span className="label-pill">Fictional sample</span>
          </p>
          <h1 id="case-name">{record.name}</h1>
          <p className="detail-summary">{record.summary}</p>
          <p className="location">
            <Pin />
            {formatLocation(record.location)}
          </p>
          <div className="tags">
            {record.passions.map((passion) => (
              <span key={passion}>{passion}</span>
            ))}
          </div>
        </div>
        <div className="detail-art" aria-hidden="true">
          <AsterMark />
          <span>A story worth holding.</span>
        </div>
      </section>
      <aside className="fiction-notice">
        <span aria-hidden="true">ⓘ</span>
        <p>
          <strong>This is a fictional demonstration record.</strong> Names,
          memories, locations, and dates are invented for the prototype. This
          page does not describe a real person, incident, or investigation.
        </p>
      </aside>
      {(sections.length > 0 || record.events.length > 0) && (
        <nav className="section-nav" aria-label="Story sections">
          {sections.map(({ category }, index) => (
            <a href={`#${category}`} key={category}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {categoryLabels[category]}
            </a>
          ))}
          {!!record.events.length && (
            <a href="#milestones-heading">
              Timeline <Arrow diagonal />
            </a>
          )}
        </nav>
      )}
      <div className="story-body">
        <aside className="story-sidebar">
          <p className="eyebrow">THE STORY AT A GLANCE</p>
          <dl>
            <div>
              <dt>Born</dt>
              <dd>{formatDate(record.birthDate)}</dd>
            </div>
            <div>
              <dt>Incident date</dt>
              <dd>{formatDate(record.incidentDate)}</dd>
            </div>
            <div>
              <dt>Place</dt>
              <dd>{formatLocation(record.location)}</dd>
            </div>
            <div>
              <dt>Documentation</dt>
              <dd>
                {sections.length} documented{" "}
                {sections.length === 1 ? "section" : "sections"}
              </dd>
            </div>
          </dl>
          <AsterMark />
          <p className="sidebar-note">
            A record can grow without losing sight of the person at its center.
          </p>
        </aside>
        <div className="story-sections">
          {sections.map((section, index) => {
            const { category } = section;
            return (
              <section key={category} id={category} className="story-section">
                <p className="eyebrow">
                  <span className="section-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {categoryLabels[category]}
                </p>
                <h2>{section?.title ?? categoryLabels[category]}</h2>
                {section?.paragraphs.length ? (
                  section.paragraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))
                ) : (
                  <div className="missing-content">
                    <span className="missing-dot" />
                    <p>This part of the story has not been documented yet.</p>
                  </div>
                )}
                {!!section?.sourceIds.length && (
                  <p className="source-note">
                    Source:{" "}
                    {section.sourceIds
                      .map(
                        (id) =>
                          record.sources.find((source) => source.id === id)
                            ?.title,
                      )
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </section>
            );
          })}
          {!sections.length && (
            <section className="story-section">
              <p className="eyebrow">ROOM FOR STORIES TO COME</p>
              <h2>A story still taking shape.</h2>
              <div className="missing-content">
                <span className="missing-dot" />
                <p>This part of the story has not been documented yet.</p>
              </div>
            </section>
          )}
        </div>
      </div>
      <StoryTimeline events={record.events} sources={record.sources} />
      <section className="sources-section" aria-labelledby="sources-heading">
        <p className="eyebrow">CONTEXT & TRANSPARENCY</p>
        <h2 id="sources-heading">Sources & documentation</h2>
        <p className="muted">
          A real record will link to reviewed source material. The content here
          is for demonstration.
        </p>
        {record.sources.length ? (
          <ul>
            {record.sources.map((source) => (
              <li key={source.id}>
                <strong>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.title}{" "}
                      <span className="sr-only">(opens in a new tab)</span>↗
                    </a>
                  ) : (
                    source.title
                  )}
                </strong>
                {source.note && <p>{source.note}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No sources have been added yet.</p>
        )}
        <p className="source-note">
          {record.updatedAt
            ? `Record last updated ${formatDate(record.updatedAt)}`
            : "Record update date not yet documented."}
        </p>
      </section>
      <div className="detail-end">
        <AsterMark />
        <p>{record.remembrance ?? "Every story deserves room to be told."}</p>
        <Link className="text-link" href="/#explore">
          Return to the archive <Arrow />
        </Link>
      </div>
    </main>
  );
}
