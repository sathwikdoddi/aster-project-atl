# Verification

## November 9, 2026 — Owner dashboard and publishing

| Check                | Result                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`           | Passed: 18 tests covering normalization, origin checks, production demo restrictions, content contracts, projection, persistence, and the actual SQL migration.                                                                                                |
| `npm run typecheck`  | Passed across both apps and both shared packages.                                                                                                                                                                                                              |
| `npm run build`      | Production builds validated for both Next.js apps.                                                                                                                                                                                                             |
| Public browser suite | Passed: 8 desktop/mobile tests for timeline/grid navigation, case pages, partial records, and public API responses.                                                                                                                                            |
| Admin browser suite  | Passed: 4 desktop/mobile tests for search, empty states, saving, previewing, publishing, revising, and unpublishing fictional profiles.                                                                                                                        |
| Publication boundary | Unchecked birth date and its milestone are absent from the public payload. Draft revisions leave the current public snapshot unchanged; unpublishing returns a public API 404.                                                                                 |
| SQL authorization    | Executed the migration and owner bootstrap in isolated PostgreSQL via PGlite. Owner operations succeed; nonowners and anonymous clients cannot modify publications or read private drafts/history; self-authorization is denied. Stale revisions are rejected. |
| Live Supabase setup  | Auth endpoint responds; anonymous publication reads succeed, while private draft and membership reads are denied. No live publication records were created during automated tests.                                                                             |

The browser publishing suite uses fictional fixtures and an isolated temporary local store. It never writes to Airtable or Supabase. The real Family Case Management Base remains read-only; family contact fields and attachment URLs are excluded from the admin source payload.

The first browser run exposed a localhost/127.0.0.1 origin mismatch that blocked saving. The origin check now uses the browser's destination host locally, with an explicit `ADMIN_ORIGIN` setting for hosted deployments; a regression test covers allowed and rejected origins. Browser assertion timeouts allow cold Next.js development compilation.

Validated with Node.js 22.14.0, Next.js 16.4.1, React 19.3.1, TypeScript 5.9.3, and Playwright 1.64.1. Checks used a temporary native Apple Silicon Node runtime; no global runtime settings were changed. Fictional dashboard/editor screenshots were reviewed locally and kept outside Git.

## Live owner check

The owner enters the password they created for `admin@admin.com` in the dashboard login form. A positive sign-in against that actual account has not been automated because its password is not available to the development agent. The SQL owner workflow and fictional UI workflow are tested separately as described above.

Local configuration selects approved Supabase snapshots. The public site starts empty until the owner explicitly publishes a profile. Existing fictional Airtable demo records remain available through the separate development mode.

## Remaining work

Photo/document publication, editable source links, invitation/password recovery screens, and an audit-history viewer are not included. The dashboard shows media/link availability counts. Hosted deployment remains separate from the local servers and GitHub source. Setup and workflow documentation is in [docs/admin-setup.md](docs/admin-setup.md).
