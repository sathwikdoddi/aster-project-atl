"use client";

import { useState } from "react";
import Link from "next/link";
import type { CaseRecord } from "@aster/content/schema";
import { categoryLabels } from "@aster/content/schema";
import { formatDate, formatLocation } from "@aster/content/format";
import { Arrow, AsterMark, Pin, ViewIcon } from "./icons";

function CaseCard({ record, index }: { record: CaseRecord; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article
      className={`case-card ${record.color}`}
      aria-labelledby={`name-${record.id}`}
    >
      <div className="card-art" aria-hidden="true">
        <span className="art-number">{String(index + 1).padStart(2, "0")}</span>
        <AsterMark className="card-flower" />
        <span className="art-label">A LIFE TO REMEMBER</span>
      </div>
      <div className="card-content">
        <div className="card-overline">
          <span>Fictional sample</span>
          <span>
            {record.sections.length
              ? `${record.sections.length} of 5 sections`
              : "Story in progress"}
          </span>
        </div>
        <h3 id={`name-${record.id}`}>
          <Link href={`/cases/${record.slug}`}>{record.name}</Link>
        </h3>
        <p className="location">
          <Pin />
          {formatLocation(record.location)}
        </p>
        <p className="card-summary">{record.summary}</p>
        <div className="tags">
          {record.passions.map((passion) => (
            <span key={passion}>{passion}</span>
          ))}
          {!record.passions.length && <span>More to be documented</span>}
        </div>
        <div className="card-actions">
          <Link className="text-link" href={`/cases/${record.slug}`}>
            Explore the story <Arrow />
          </Link>
          <button
            className="expand-button"
            type="button"
            aria-expanded={expanded}
            aria-controls={`preview-${record.id}`}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${record.name} case preview`}
            onClick={() => setExpanded(!expanded)}
          >
            <span aria-hidden="true">{expanded ? "−" : "+"}</span>
          </button>
        </div>
        {expanded && (
          <div id={`preview-${record.id}`} className="case-preview">
            <p className="eyebrow">Inside this story</p>
            <p>
              {record.sections.length
                ? record.sections
                    .map((section) => categoryLabels[section.category])
                    .join(" · ")
                : "Sections will appear as information is added."}
            </p>
            <p>
              <strong>Timeline date:</strong> {formatDate(record.deathDate)}
            </p>
            <p>
              {record.events.length
                ? `${record.events.length} sample milestones, including undated memories.`
                : "No individual milestones have been added yet."}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export function CaseExplorer({ cases }: { cases: CaseRecord[] }) {
  const [view, setView] = useState<"timeline" | "grid">("timeline");
  const groups = Array.from(
    new Set(cases.map((record) => record.deathDate?.slice(0, 4) ?? "Undated")),
  );

  return (
    <section
      id="explore"
      className="explore-section"
      aria-labelledby="explore-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span className="tiny-star">✳</span> THE STORY ARCHIVE
          </p>
          <h2 id="explore-heading">Begin with a life.</h2>
          <p>Take your time. There is more to every story.</p>
        </div>
        <span className="record-count">
          {cases.length} sample {cases.length === 1 ? "story" : "stories"}
          <span className="count-dot" />
        </span>
      </div>
      <div className="explorer-toolbar">
        <p>
          {view === "timeline"
            ? "Organized by incident year"
            : "All stories, side by side"}
          <span className="toolbar-note"> · Most recent first</span>
        </p>
        <div className="view-switch" role="group" aria-label="Archive view">
          <button
            type="button"
            aria-pressed={view === "timeline"}
            onClick={() => setView("timeline")}
          >
            <ViewIcon />
            Timeline
          </button>
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <ViewIcon grid />
            Grid
          </button>
        </div>
      </div>
      <p className="sr-only" role="status">
        Showing {cases.length} sample stories in {view} view.
      </p>
      {!cases.length ? (
        <div className="empty-state">
          <AsterMark />
          <h3>A place for stories to come.</h3>
          <p>No stories have been added yet. Please check back later.</p>
        </div>
      ) : view === "grid" ? (
        <div className="case-grid">
          {cases.map((record, index) => (
            <CaseCard key={record.id} record={record} index={index} />
          ))}
        </div>
      ) : (
        <div className="archive-timeline">
          {groups.map((year) => (
            <section
              className="year-group"
              key={year}
              aria-labelledby={`year-${year}`}
            >
              <div className="year-label">
                <span className="timeline-dot" />
                <h3 id={`year-${year}`}>{year}</h3>
                {year === "Undated" && (
                  <span>Room for what’s still unknown</span>
                )}
              </div>
              <div className="year-cases">
                {cases
                  .filter(
                    (record) =>
                      (record.deathDate?.slice(0, 4) ?? "Undated") === year,
                  )
                  .map((record) => (
                    <CaseCard
                      key={record.id}
                      record={record}
                      index={cases.indexOf(record)}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <div className="archive-end">
        <AsterMark />
        <p>A beginning, with room to grow.</p>
        <span>
          This archive will grow as stories are documented and reviewed.
        </span>
      </div>
    </section>
  );
}
