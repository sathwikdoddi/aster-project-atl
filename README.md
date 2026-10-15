# The Aster Project

An initial local Next.js + React prototype for exploring lives and cases. Built for the October 12–18 milestone. **Every current record is fictional**, including names, dates, locations, and narrative content.

## Run locally

Node.js 20.9+ is required (Node 22 recommended).

```sh
cd ~/Desktop/aster-project
npm install
npm run dev
```

Open http://127.0.0.1:3000. No account, database, API key, or environment variables are needed. The dev server binds to your own computer. If port 3000 is occupied, use `npm run dev -- --port 3001`.

Next.js provides both the React frontend and server-side API in this single project. There is no separate Express server to start. The included `package-lock.json` pins the installed dependencies; use `npm ci` for subsequent reproducible installs.

## Included in this milestone

- Responsive archive with an interactive timeline grouped by incident year, expandable case previews, and a grid view.
- Dedicated case pages organized into Early Life, Passions, Death, Investigation, and Legacy.
- Clickable individual milestones with dated and undated events.
- One detailed fictional case, one partial case, and one minimal case.
- A typed, runtime-validated mock-data schema and shared repository adapter.
- Read-only Next.js API routes at `/api/cases` and `/api/cases/:slug`.
- About page, keyboard focus styles, skip navigation, reduced-motion support, deliberate missing-content states, loading/error screens, and unknown-case handling.
- Schema tests and browser integration tests for the main interactions.

Search/filtering, live data, editing tools, authentication, and deployment are deferred to later milestones. No remote Git repository or hosted deployment has been created.

## Where to work

```text
src/
  app/
    page.tsx                   Homepage and archive
    globals.css                Shared responsive styling
    cases/[slug]/page.tsx      Individual case page
    api/cases/                 Read-only JSON endpoints
    about/page.tsx             Purpose and prototype context
  components/
    case-explorer.tsx          Timeline/grid and expandable cards
    story-timeline.tsx         Interactive individual milestones
  data/cases.json              The editable fictional sample records
  lib/
    case-schema.ts             Proposed shared schema and TypeScript types
    cases.ts                   Server-only repository; future integration point
    format.ts                  Partial dates, locations, chronological ordering
docs/data-contract.md          API format and questions for 180 Consulting
tests/                        Schema and browser integration checks
```

## Add or edit a sample

Edit `src/data/cases.json`. Duplicate a record, give it a unique `id` and URL-safe `slug`, and update its content. Use `null` for unknown dates/locations and empty arrays for information that has not been added. Omit a section from `sections` to show its missing-content state. Reference source IDs that exist on the same record. Run `npm test` after changes. No component edits are needed to add another record.

The mock repository validates the records and supplies both the pages and API. Replace that adapter after 180 Consulting confirms the storage system. See [the proposed data contract](docs/data-contract.md) for the field mapping and meeting checklist. The proposal has not yet been agreed with 180 Consulting.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Browser checks start their own server on port 3100:

```sh
npx playwright install chromium
npm run test:e2e
```

The browser suite covers desktop/mobile overflow, timeline/grid switching, expansion, case navigation, milestone selection, missing content, 404s, and the API. The full accessibility and cross-device audit remains a later milestone.

## Verification

See `VERIFICATION.md` for checks actually completed during initial setup and any environment limitations.
