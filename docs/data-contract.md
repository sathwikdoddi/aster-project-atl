# Public content contract — v1.0

This is the current **public display payload**, not the raw Airtable schema or a finalized publishing contract. Airtable will hold working records; the future owner dashboard will select content and publish approved snapshots. See [architecture](architecture.md). The live integration and admin workflow are not implemented yet.

The executable schema is `packages/content/src/case-schema.ts`. Fictional published-output fixtures are in `packages/content/src/mock/published-cases.json`. The collection validator also rejects duplicate case IDs/slugs, duplicate section categories/event IDs/source IDs, invalid dates, missing source references, and non-HTTP source links.

## Case shape

| Field                    | Type                                              | Meaning                                                               |
| ------------------------ | ------------------------------------------------- | --------------------------------------------------------------------- |
| `id`                     | string                                            | Stable source-system identifier; independent of public name.          |
| `slug`                   | string                                            | Unique lowercase URL identifier, such as `jordan-ellis`.              |
| `name`                   | string                                            | Approved public display name.                                         |
| `isDemo`                 | boolean                                           | True for fictional examples. All current records are demos.           |
| `summary`                | string                                            | Short person-centered introduction.                                   |
| `remembrance`            | string or null                                    | Optional closing remembrance.                                         |
| `location`               | `{ city: string or null, state: string or null }` | Public location; either field can be unknown.                         |
| `birthDate`, `deathDate` | partial date or null                              | Preserve precision; do not infer a missing month/day.                 |
| `passions`               | string array                                      | Interests displayed as labels. Empty is valid.                        |
| `color`                  | `lavender`, `sage`, or `peach`                    | Prototype display accent; can be derived in a future adapter.         |
| `sections`               | section array                                     | Zero to five categories. Missing sections show a placeholder.         |
| `events`                 | event array                                       | Dated or undated moments for the individual timeline. Empty is valid. |
| `sources`                | source array                                      | Sources referenced by sections and events. Empty is valid.            |
| `updatedAt`              | partial date                                      | Date the public record was last updated.                              |

A partial date is `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. Unknown dates use `null`. No dummy dates such as January 1. The master timeline uses `deathDate` for year grouping, newest first, with undated cases last. Each case timeline sorts dated events oldest first, then undated memories. Equal/overlapping partial dates do not imply a known exact order.

Sections: `{ category, title, paragraphs: string[], sourceIds: string[] }`. Categories: `early-life`, `passions`, `death`, `investigation`, `legacy`.

Events: `{ id, date: partial date or null, category, title, description, sourceIds: string[] }`.

Sources: `{ id, title, url: HTTP(S) URL or null, note: string or null }`. A source without a public URL may be listed without exposing private files. Private Drive links, personal data, and internal notes should never be sent to the public UI.

## API

`GET /api/cases` → HTTP 200:

```json
{
  "data": ["<CaseRecord objects>"],
  "meta": { "count": 3, "schemaVersion": "1.0", "dataSource": "mock" }
}
```

`GET /api/cases/:slug` → HTTP 200:

```json
{
  "data": "<CaseRecord object>",
  "meta": { "schemaVersion": "1.0", "dataSource": "mock" }
}
```

Unknown case: HTTP 404, `{ "error": { "code": "CASE_NOT_FOUND", "message": "This story could not be found." } }`.

Unavailable data: HTTP 500 with `CASES_UNAVAILABLE` or `CASE_UNAVAILABLE` and a public message. Internal diagnostics remain in server logs.

These read-only endpoints belong to `apps/web` and have no search, pagination, authentication, or writes in this milestone. The server-rendered pages use the same public repository as the API; there is no extra request from the server to itself. Client components receive serialized public records from Next.js. The future admin dashboard must have separate authenticated private endpoints.

## Integration checklist for the meeting

1. Confirm exact Airtable tables and fields, including where public story text, dated events, and source references live.
2. Match stable IDs, public slugs, categories, partial dates, and source links to the shared format.
3. Agree how family consent, review status, display selections, and explicit publishing are represented. The public adapter must return approved snapshots only; the mock schema does not implement that workflow.
4. Agree which Drive material can become public, who owns corrections, and who approves updates.
5. Define a sample export with one complete and one partial record. Validate it before switching the adapter.
6. Choose the publication store, server-side credentials, cache invalidation, pagination, and error handling.

Implement a read-only `PublicCaseRepository` adapter in `apps/web/src/server/public-cases.ts` when the publication store is ready. Its shared interface is `packages/content/src/repository.ts`. Airtable-specific field mapping belongs behind the future admin backend. Update demo labels and copy when replacing fictional content with approved material.
