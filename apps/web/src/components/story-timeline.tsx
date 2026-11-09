"use client";

import { useState } from "react";
import type { CaseRecord } from "@aster/content/schema";
import { categoryLabels } from "@aster/content/schema";
import { formatDate, sortByDate } from "@aster/content/format";

export function StoryTimeline({
  events,
  sources,
}: Pick<CaseRecord, "events" | "sources">) {
  const sorted = sortByDate(events, (event) => event.date);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? null);
  const selected = sorted.find((event) => event.id === selectedId);
  return (
    <section className="story-timeline" aria-labelledby="milestones-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MOMENTS ALONG THE WAY</p>
          <h2 id="milestones-heading">A life. A case. A continuing story.</h2>
        </div>
      </div>
      {!selected ? (
        <div className="empty-state compact">
          <p>No milestones have been documented yet.</p>
        </div>
      ) : (
        <div className="milestone-layout">
          <div
            className="milestone-list"
            role="group"
            aria-label="Choose a story milestone"
          >
            {sorted.map((event) => (
              <button
                type="button"
                key={event.id}
                aria-pressed={event.id === selected.id}
                aria-controls="milestone-detail"
                onClick={() => setSelectedId(event.id)}
              >
                <span className="milestone-dot" />
                <span>
                  <span className="milestone-date">
                    {formatDate(event.date)}
                  </span>
                  <span className="milestone-title">{event.title}</span>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <div
            className="milestone-detail"
            id="milestone-detail"
            role="region"
            aria-label="Selected milestone"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="eyebrow">{categoryLabels[selected.category]}</p>
            <h3>{selected.title}</h3>
            <p className="muted">{formatDate(selected.date)}</p>
            <p>{selected.description}</p>
            <p className="source-note">
              Source:{" "}
              {selected.sourceIds
                .map((id) => sources.find((source) => source.id === id)?.title)
                .filter(Boolean)
                .join(", ") || "No source documented"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
