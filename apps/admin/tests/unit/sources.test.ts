import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProfile } from "../../src/server/sources";
import { adminMode } from "../../src/server/config";

test("real Airtable normalization separates death dates and excludes contact information and attachment links", () => {
  const result = normalizeProfile("recTestPerson01", {
    "Person Impacted (In Memory)": "Test Person",
    "Date of Death": "2021-04-12",
    "Police Department / Agency": "Example agency",
    "Case Status": "closed?",
    "Family Contact Name": "PRIVATE_CONTACT",
    Email: "private@example.test",
    "Phone Number": "PRIVATE_PHONE",
    Photo: [{ url: "https://example.test/private-photo" }],
  })!;
  assert.equal(result.record.deathDate, "2021-04-12");
  assert.equal(result.record.incidentDate, null);
  assert.equal(result.record.birthDate, null);
  assert.equal(result.record.summary, null);
  assert.equal(result.record.caseStatus, "closed?");
  assert.equal(result.photoCount, 1);
  assert.ok(!JSON.stringify(result).includes("PRIVATE_CONTACT"));
  assert.ok(!JSON.stringify(result).includes("private@example.test"));
  assert.ok(!JSON.stringify(result).includes("PRIVATE_PHONE"));
  assert.ok(!JSON.stringify(result).includes("private-photo"));
  assert.equal(
    result.fingerprint,
    normalizeProfile("recTestPerson01", {
      "Person Impacted (In Memory)": "Test Person",
      "Date of Death": "2021-04-12",
      "Police Department / Agency": "Example agency",
      "Case Status": "closed?",
      Photo: [{}],
    })!.fingerprint,
  );
});
test("demo mode cannot bypass authentication in a production build", () => {
  const before = { mode: process.env.ADMIN_MODE, node: process.env.NODE_ENV };
  try {
    process.env.ADMIN_MODE = "demo";
    Object.assign(process.env, { NODE_ENV: "production" });
    assert.equal(adminMode(), "setup");
    Object.assign(process.env, { NODE_ENV: "development" });
    assert.equal(adminMode(), "demo");
  } finally {
    if (before.mode === undefined) delete process.env.ADMIN_MODE;
    else process.env.ADMIN_MODE = before.mode;
    Object.assign(process.env, { NODE_ENV: before.node ?? "test" });
  }
});
