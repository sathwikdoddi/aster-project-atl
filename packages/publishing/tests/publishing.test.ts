import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { mockPublishedCaseRepository } from "@aster/content/mock";
import { buildSnapshot, defaultSettings, sourceCaseSchema } from "../src/model";
import { createLocalDemoStore } from "../src/local-store";

async function source() {
  return sourceCaseSchema.parse({
    record: (await mockPublishedCaseRepository.list())[0],
    fingerprint: "test-source-v1",
    photoCount: 0,
    linkedDocumentCount: 0,
    linkedDetailCount: 0,
  });
}
test("the public projection excludes unchecked values, milestones, and source references", async () => {
  const input = await source();
  input.record.agency = "PRIVATE_AGENCY_VALUE";
  const settings = {
    ...defaultSettings(input),
    visibleFields: [],
    visibleSections: [],
    visibleEvents: [],
    showTimeline: false,
    showSources: false,
  };
  const snapshot = buildSnapshot(input, settings)!;
  assert.equal(snapshot.birthDate, null);
  assert.equal(snapshot.incidentDate, null);
  assert.equal(snapshot.deathDate, null);
  assert.equal(snapshot.agency, null);
  assert.equal(snapshot.location.city, null);
  assert.deepEqual(snapshot.sections, []);
  assert.deepEqual(snapshot.events, []);
  assert.deepEqual(snapshot.sources, []);
  assert.equal(snapshot.display?.birthDate, false);
  assert.ok(!JSON.stringify(snapshot).includes("PRIVATE_AGENCY_VALUE"));
  assert.ok(!JSON.stringify(snapshot).includes(input.fingerprint));
});
test("real profiles default to no selected facts and require an owner-written introduction", async () => {
  const input = await source();
  input.record.isDemo = false;
  input.record.summary = "Unreviewed source text";
  const settings = defaultSettings(input);
  assert.equal(settings.introduction, "");
  assert.deepEqual(settings.visibleFields, []);
  assert.equal(buildSnapshot(input, settings), null);
  assert.throws(
    () => buildSnapshot(input, { ...settings, sourceFingerprint: "stale" }),
    /changed/,
  );
});
test("draft saves preserve the approved public version until explicit publish; conflicts do not overwrite", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "aster-publishing-"));
  try {
    const store = createLocalDemoStore(path.join(folder, "state.json"));
    const input = await source();
    const config = defaultSettings(input);
    const one = await store.save(
      input.record.id,
      config,
      buildSnapshot(input, config),
      0,
      "test-owner",
    );
    assert.deepEqual(await store.publicRepository.list(), []);
    await store.publish(input.record.id, one.revision, "test-owner");
    const changed = {
      ...config,
      introduction: "A new introduction awaiting publication.",
    };
    const two = await store.save(
      input.record.id,
      changed,
      buildSnapshot(input, changed),
      one.revision,
      "test-owner",
    );
    assert.equal(
      (await store.publicRepository.list())[0].summary,
      config.introduction,
    );
    await assert.rejects(
      store.publish(input.record.id, one.revision, "test-owner"),
      /changed/,
    );
    await assert.rejects(
      store.save(
        input.record.id,
        config,
        buildSnapshot(input, config),
        one.revision,
        "test-owner",
      ),
      /changed/,
    );
    await store.publish(input.record.id, two.revision, "test-owner");
    assert.equal(
      (await store.publicRepository.list())[0].summary,
      changed.introduction,
    );
    await assert.rejects(
      store.unpublish(input.record.id, one.revision, "test-owner"),
      /changed/,
    );
    await store.unpublish(input.record.id, two.revision, "test-owner");
    assert.equal(await store.publicRepository.findBySlug(config.slug), null);
    assert.equal((await store.list()).drafts.length, 1);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
test("local demo storage refuses real-person snapshots", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "aster-demo-only-"));
  try {
    const store = createLocalDemoStore(path.join(folder, "state.json"));
    const input = await source();
    const config = defaultSettings(input);
    const snapshot = buildSnapshot(input, config)!;
    snapshot.isDemo = false;
    await assert.rejects(
      store.save(snapshot.id, config, snapshot, 0, "test-owner"),
      /fictional/,
    );
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
