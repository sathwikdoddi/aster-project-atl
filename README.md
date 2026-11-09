# The Aster Project

A public archive of lives and cases, with an owner dashboard for deciding what visitors can see. This repository uses npm workspaces so both websites can share content contracts while being deployed separately.

**Current status:** the owner dashboard supports Supabase sign-in, Airtable profile review, private drafts, field/section selection, preview, and publish/unpublish. The public website reads approved Supabase snapshots in published mode. Photo/document publication is following work.

## Structure

```text
apps/
  web/                  Existing public website, case pages, and read-only API
  admin/                Authenticated owner dashboard, port 3001
packages/
  content/              Public schemas, helpers, and fictional fixtures
  publishing/           Selection projection, draft/publication stores, and tests
supabase/               SQL schema, access policies, and owner authorization
docs/
  architecture.md       Publishing flow and setup needed next
  data-contract.md      Current public payload and API contract
```

## Run locally

Requires Node.js 22+ and npm. From the repository root:

```sh
npm ci
npm run dev          # Public site, port 3000
# In another terminal:
npm run dev:admin    # Owner workspace, port 3001
```

Open http://127.0.0.1:3000. Without a configured `.env`, the site uses local fixtures. For live demo records, see [Airtable setup](docs/airtable.md). For another port: `npm run dev -- --port 3001`. Set up the owner login using [admin setup](docs/admin-setup.md).

## Content and publishing

The intended flow is **Airtable working records → owner review and selection → published snapshot → public website**. New or edited Airtable information stays private until the owner publishes it. Editing a draft after publication should leave the existing published version unchanged.

The fixtures represent the **public output** of this workflow, not Airtable's internal tables. Edit `packages/content/src/mock/published-cases.json` to change the demo. Unknown dates use `null`; structured values hidden by the owner are omitted from the public display and removed from the public snapshot. Keep all sample content fictional.

The public app reads through `apps/web/src/server/public-cases.ts`. Its pages and `/api/cases` endpoints share this repository. In `CONTENT_SOURCE=published` mode, only approved snapshots from Supabase are shown. The public website starts empty until the owner publishes a profile. The older fixture/Airtable demo modes remain available for development.

See [architecture and next setup](docs/architecture.md) and [the public data contract](docs/data-contract.md).

## Checks

```sh
npm test                 # Mapping, publishing, and SQL permission tests
npm run typecheck        # Both apps and shared packages
npm run build            # Both production builds
npx playwright install chromium
npm run test:e2e         # Public app desktop/mobile checks, port 3100
npm run test:e2e --workspace=@aster/admin # Isolated fictional publishing flow
```

`npm start` serves the public production build; `npm run start:admin` serves the admin production build; `npm run format` formats source and docs. Run installation at the repository root and commit the single root lockfile. When setting up hosting, deploy each app from this repository with its own environment settings; the public app lives in `apps/web`.

Actual verification results are recorded in [VERIFICATION.md](VERIFICATION.md).
