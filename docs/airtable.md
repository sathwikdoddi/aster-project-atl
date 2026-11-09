# Airtable demo

The optional `airtable-demo` mode can read two fictional cases from **Asterx180 demo → Cases**. The other base and the internal Families, Contacts, Activity Logs, Agencies, Records Requests, and Files and Media tables are not used by this adapter.

## Local setup

Use Node.js 22+. Copy `.env.example` to `.env` at the repository root and set:

```dotenv
CONTENT_SOURCE=airtable-demo
AIRTABLE_API=<personal access token>
AIRTABLE_BASE_ID=<Asterx180 demo base ID>
AIRTABLE_CASES_TABLE=Cases
```

Use the Cases table ID instead of its name if desired. Keep the real token in the ignored `.env` or server hosting environment; never use `NEXT_PUBLIC_`. `next.config.ts` loads the root `.env` without overriding shell/hosting variables.

```sh
npm run seed:airtable
npm run dev
```

The seed command verifies the base name and creates only missing `ASTER-DEMO-TAYLOR` and `ASTER-DEMO-MORGAN` records. Running it again preserves existing content. It uses record read/write and base-schema read access. The website itself only reads.

Set `CONTENT_SOURCE=mock` to use the original three local fixtures. Browser tests force this mode and do not write to Airtable.

## Current mapping

| Existing Cases field | Public output                                                                     |
| -------------------- | --------------------------------------------------------------------------------- |
| Case ID              | Stable identity; must match one of the two explicit demo IDs                      |
| Victim / Individual  | Profile name                                                                      |
| Case Summary         | First paragraph is the introduction; remaining paragraphs form the story overview |
| Date of Birth        | Optional birth date and dated milestone                                           |
| Incident Date        | Optional incident date and milestone; never assumed to be the death date          |
| Incident Location    | Location text preserved as supplied                                               |

Slugs and flower colors are presentation settings held in `packages/content/src/demo-identities.ts`. Interests, unknown dates, and last-updated information are not invented. The adapter explicitly requests these six fields and drops unexpected records/fields; internal notes never enter the public payload.

The adapter follows API pagination, times out requests, shares concurrent loads, and caches successful reads in server memory for 30 seconds. Refresh the page after that interval to see Airtable edits. Restart the server after changing `.env`. Provider errors show an unavailable state rather than silently switching back to local fixtures.

## Following phase

The live connection is deliberately a fictional demo. It does not implement approval, authentication, or owner publishing. The owner workspace now reads the real Family Profiles base behind Supabase owner authentication and publishes selected snapshots separately. Use `CONTENT_SOURCE=published` for that workflow. See [admin setup](admin-setup.md) and [architecture](architecture.md).
