import assert from "node:assert/strict";
import test from "node:test";
import cases from "../src/mock/published-cases.json";
import {
  caseCollectionSchema,
  caseSchema,
  partialDateSchema,
} from "../src/case-schema";
import { formatDate, formatLocation, sortByDate } from "../src/format";

test("all sample records are valid, fictional, and cover full and partial stories", () => {
  const records = caseCollectionSchema.parse(cases);
  assert.ok(records.every((record) => record.isDemo));
  assert.equal(records[0].sections.length, 5);
  assert.ok(
    records.some((record) => !record.sections.length && !record.deathDate),
  );
});

test("date precision is preserved and impossible dates are rejected", () => {
  for (const value of ["1995", "2022-06", "2024-02-29"])
    assert.ok(partialDateSchema.safeParse(value).success);
  for (const value of [
    "2023-02-29",
    "2024-02-30",
    "2022-00",
    "2022-13",
    "2022-04-31",
    "June 2022",
  ])
    assert.equal(partialDateSchema.safeParse(value).success, false);
  assert.equal(formatDate("2022"), "2022");
  assert.equal(formatDate("2022-06"), "June 2022");
  assert.equal(formatDate("2022-06-01"), "June 1, 2022");
  assert.equal(formatDate(null), "Date not yet documented");
});

test("minimal records and unknown locations remain valid without invented data", () => {
  const record = caseSchema.parse(cases[2]);
  assert.equal(record.birthDate, null);
  assert.equal(formatLocation(record.location), "Location not yet documented");
  assert.equal(formatLocation({ city: null, state: "Georgia" }), "Georgia");
});

test("duplicate IDs, slugs, categories, and missing source references are rejected", () => {
  assert.equal(
    caseCollectionSchema.safeParse([cases[0], cases[0]]).success,
    false,
  );
  const duplicateSection = {
    ...cases[0],
    sections: [...cases[0].sections, cases[0].sections[0]],
  };
  assert.equal(caseSchema.safeParse(duplicateSection).success, false);
  const badSource = { ...cases[0], sources: [] };
  assert.equal(caseSchema.safeParse(badSource).success, false);
});

test("source links accept only web protocols", () => {
  const record = structuredClone(cases[0]);
  const source = { ...record.sources[0], url: "javascript:alert(1)" };
  assert.equal(
    caseSchema.safeParse({ ...record, sources: [source] }).success,
    false,
  );
  assert.ok(
    caseSchema.safeParse({
      ...record,
      sources: [{ ...source, url: "https://example.org/source" }],
    }).success,
  );
});

test("master timeline is newest first with unknown dates last; individual events are oldest first", () => {
  const records = caseCollectionSchema.parse(cases);
  const original = records.map((record) => record.id);
  const ordered = sortByDate(records, (record) => record.deathDate, "desc");
  assert.deepEqual(
    ordered.map((record) => record.slug),
    ["jordan-ellis", "maya-bennett", "sam-rivera"],
  );
  const events = sortByDate(records[0].events, (event) => event.date);
  assert.equal(events[0].date, "1995");
  assert.equal(events.at(-1)?.date, null);
  assert.deepEqual(
    records.map((record) => record.id),
    original,
  );
});
