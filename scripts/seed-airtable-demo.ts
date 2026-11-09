import { demoIdentities } from "@aster/content/demo";

const token = process.env.AIRTABLE_API;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token || !baseId)
  throw new Error("Set AIRTABLE_API and AIRTABLE_BASE_ID in the root .env.");

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.airtable.com/v0/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(
      `Airtable demo setup failed (HTTP ${response.status}). Check base access and token scopes.`,
    );
  return response.json();
}

async function main() {
  const bases = (await request("meta/bases")) as {
    bases: { id: string; name: string }[];
  };
  if (
    !bases.bases.some(
      (base) => base.id === baseId && base.name === "Asterx180 demo",
    )
  ) {
    throw new Error(
      "This seed script only writes to the base named Asterx180 demo.",
    );
  }
  const schema = (await request(`meta/bases/${baseId}/tables`)) as {
    tables: { id: string; name: string }[];
  };
  const table = schema.tables.find(
    (entry) =>
      entry.id === process.env.AIRTABLE_CASES_TABLE ||
      entry.name === (process.env.AIRTABLE_CASES_TABLE ?? "Cases"),
  );
  if (!table)
    throw new Error(
      "The configured Cases table could not be found. No tables were changed.",
    );

  const filter = `OR(${demoIdentities.map((entry) => `{Case ID}="${entry.caseId}"`).join(",")})`;
  const params = new URLSearchParams({ filterByFormula: filter });
  params.append("fields[]", "Case ID");
  const existing = (await request(`${baseId}/${table.id}?${params}`)) as {
    records: { fields: { "Case ID"?: string } }[];
  };
  const existingIds = new Set(
    existing.records.map((record) => record.fields["Case ID"]),
  );

  const records = [
    {
      fields: {
        "Case ID": demoIdentities[0].caseId,
        "Case Name": "DEMO — Taylor Brooks",
        "Victim / Individual": "Taylor Brooks",
        "Date of Birth": "1994-03-12",
        "Incident Date": "2023-04-18",
        "Incident Location": "Atlanta, Georgia",
        "Case Summary":
          "Taylor Brooks is a fictional demo profile: a music lover, neighborhood volunteer, and enthusiastic home cook.\n\nIn this invented story, Taylor grew up surrounded by music. Afternoons often ended with a borrowed guitar, a new recipe, and a table with room for one more person. Friends remembered the care Taylor put into bringing people together.\n\nTaylor enjoyed helping with neighborhood food drives and sharing playlists with friends. This fictional profile makes space for everyday interests and community connections alongside the basic case information.\n\nThe incident date is invented for this demonstration. This record does not describe a real person, death, or police incident.",
        "Internal Notes":
          "DEMO_INTERNAL_DO_NOT_PUBLISH: this fictional staff note must never appear in the public website or API.",
      },
    },
    {
      fields: {
        "Case ID": demoIdentities[1].caseId,
        "Case Name": "DEMO — Morgan Reed",
        "Victim / Individual": "Morgan Reed",
        "Incident Date": "2020-11-08",
        "Incident Location": "Decatur, Georgia",
        "Case Summary":
          "Morgan Reed is a fictional demo profile about an aspiring illustrator who loved community gardens and making art with friends.\n\nIn this invented story, Morgan carried a sketchbook everywhere, collecting drawings of familiar streets, plants, and small everyday moments. A weekend in the garden was a chance to catch up with neighbors and exchange ideas.\n\nFriends in this fictional narrative remember Morgan's patience and curiosity. The story has room to grow as more memories are shared.\n\nThe incident date is invented. This demonstration record does not describe an actual person or police incident.",
        "Internal Notes":
          "DEMO_INTERNAL_DO_NOT_PUBLISH: date of birth is intentionally absent. Do not invent a date or expose staff notes.",
      },
    },
  ].filter((record) => !existingIds.has(record.fields["Case ID"]));

  if (!records.length) {
    console.log(
      "Both fictional demo cases already exist; existing content was preserved.",
    );
    return;
  }
  const created = (await request(`${baseId}/${table.id}`, {
    method: "POST",
    body: JSON.stringify({ records }),
  })) as { records: { id: string; fields: { "Case ID": string } }[] };
  console.log(
    JSON.stringify(
      {
        base: "Asterx180 demo",
        table: table.name,
        created: created.records.map((record) => ({
          id: record.id,
          caseId: record.fields["Case ID"],
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Demo setup failed.");
  process.exitCode = 1;
});
