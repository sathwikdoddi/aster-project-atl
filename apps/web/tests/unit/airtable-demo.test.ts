import assert from "node:assert/strict";
import test from "node:test";
import { createAirtableDemoRepository } from "../../src/server/airtable-demo";

const config = {
  token: "unit-test-token",
  baseId: "appDemoForTests",
  tableId: "Cases",
};

test("Airtable mapper requests only public fields, preserves dates/locations, and strips internal notes", async () => {
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://api.airtable.com");
    assert.ok(
      url.searchParams.get("filterByFormula")?.includes("ASTER-DEMO-TAYLOR"),
    );
    assert.ok(!url.searchParams.getAll("fields[]").includes("Internal Notes"));
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer unit-test-token",
    );
    return Response.json({
      records: [
        {
          id: "recTaylor",
          fields: {
            "Case ID": "ASTER-DEMO-TAYLOR",
            "Victim / Individual": "Taylor Brooks",
            "Case Summary":
              "A short introduction.\n\nA longer fictional story.",
            "Incident Date": "2023-04-18",
            "Incident Location": "A place, Atlanta, Georgia",
            "Internal Notes": "PRIVATE_STAFF_NOTE",
            Family: ["recPrivateFamily"],
          },
        },
      ],
    });
  };
  const [record] = await createAirtableDemoRepository(config, fetcher).list();
  assert.equal(record.slug, "taylor-brooks");
  assert.equal(record.incidentDate, "2023-04-18");
  assert.equal(record.birthDate, null);
  assert.equal(record.updatedAt, null);
  assert.equal(record.location.label, "A place, Atlanta, Georgia");
  assert.equal(record.sections[0].category, "overview");
  assert.deepEqual(record.sections[0].paragraphs, [
    "A longer fictional story.",
  ]);
  assert.ok(!JSON.stringify(record).includes("PRIVATE_STAFF_NOTE"));
  assert.ok(!JSON.stringify(record).includes("recPrivateFamily"));
  assert.ok(!JSON.stringify(record).includes(config.token));
});

test("pagination is followed and unexpected non-demo records are excluded", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (input) => {
    calls += 1;
    if (calls === 1)
      return Response.json({
        records: [
          {
            id: "recPrivate",
            fields: {
              "Case ID": "REAL-CASE",
              "Victim / Individual": "Do not display",
            },
          },
        ],
        offset: "page-two",
      });
    assert.equal(new URL(String(input)).searchParams.get("offset"), "page-two");
    return Response.json({
      records: [
        {
          id: "recMorgan",
          fields: {
            "Case ID": "ASTER-DEMO-MORGAN",
            "Victim / Individual": "Morgan Reed",
          },
        },
      ],
    });
  };
  const records = await createAirtableDemoRepository(config, fetcher).list();
  assert.equal(calls, 2);
  assert.deepEqual(
    records.map((record) => record.name),
    ["Morgan Reed"],
  );
  assert.equal(records[0].incidentDate, null);
  assert.deepEqual(records[0].events, []);
});

test("concurrent reads share a request and unknown slugs never query Airtable", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls += 1;
    return Response.json({ records: [] });
  };
  const repository = createAirtableDemoRepository(config, fetcher);
  assert.equal(await repository.findBySlug("unapproved-case"), null);
  assert.equal(calls, 0);
  await Promise.all([repository.list(), repository.list(), repository.list()]);
  await repository.list();
  assert.equal(calls, 1);
});

test("provider errors and malformed dates fail without exposing provider bodies or silently falling back", async () => {
  const failed: typeof fetch = async () =>
    new Response("PRIVATE_PROVIDER_BODY", { status: 403 });
  await assert.rejects(
    createAirtableDemoRepository(config, failed).list(),
    (error: Error) => {
      assert.ok(error.message.includes("temporarily unavailable"));
      assert.ok(!error.message.includes("PRIVATE_PROVIDER_BODY"));
      assert.ok(!error.message.includes(config.token));
      return true;
    },
  );
  const malformed: typeof fetch = async () =>
    Response.json({
      records: [
        {
          id: "recTaylor",
          fields: {
            "Case ID": "ASTER-DEMO-TAYLOR",
            "Victim / Individual": "Taylor Brooks",
            "Incident Date": "2023-02-30",
          },
        },
      ],
    });
  await assert.rejects(
    createAirtableDemoRepository(config, malformed).list(),
    /temporarily unavailable/,
  );
});
