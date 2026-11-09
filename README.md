# The Aster Project

A public archive of lives and cases, with a planned owner dashboard for deciding what visitors can see. This repository uses npm workspaces so both websites can share content contracts while being deployed separately.

**Current status:** the public Next.js website works with fictional sample content. The admin folder is a placeholder; Airtable, login, selection controls, and publishing are not connected yet.

## Structure

```text
apps/
  web/                  Existing public website, case pages, and read-only API
  admin/                Reserved for the future authenticated owner dashboard
packages/
  content/              Shared public schemas, formatting, repository interface,
                        fictional published-content fixtures, and unit tests
docs/
  architecture.md       Publishing flow and setup needed next
  data-contract.md      Current public payload and API contract
```

## Run locally

Requires Node.js 20.9+ and npm (Node 22 recommended). From the repository root:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No credentials or database are required for the mock site. For another port: `npm run dev -- --port 3001`. There is no admin app to start yet.

## Content and publishing

The intended flow is **Airtable working records → owner review and selection → published snapshot → public website**. New or edited Airtable information stays private until the owner publishes it. Editing a draft after publication should leave the existing published version unchanged.

The current fixtures represent the **public output** of that future workflow, not Airtable's internal tables. Edit `packages/content/src/mock/published-cases.json` to change the demo. Unknown dates use `null`; omitted sections show missing-content states. Keep all sample content fictional.

The public app reads through `apps/web/src/server/public-cases.ts`. Its pages and `/api/cases` endpoints share this repository. Later, replace the mock adapter with a read-only published-content adapter; raw Airtable data belongs behind the admin backend.

See [architecture and next setup](docs/architecture.md) and [the public data contract](docs/data-contract.md).

## Checks

```sh
npm test                 # Shared content schema tests
npm run typecheck        # Public app and shared package
npm run build            # Public app production build
npx playwright install chromium
npm run test:e2e         # Desktop/mobile checks; starts a server on port 3100
```

`npm start` serves the public production build; `npm run format` formats source and docs. Run installation at the repository root and commit the single root lockfile. When setting up hosting, deploy each app from this repository with its own environment settings; the public app lives in `apps/web`.

Actual verification results are recorded in [VERIFICATION.md](VERIFICATION.md).
