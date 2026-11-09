# Verification

## November 9, 2026 — Airtable demo integration

| Check                         | Result                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                    | Passed: 10 tests (4 Airtable mapping/access-boundary tests and 6 shared content tests).                                                     |
| `npm run typecheck`           | Passed for the public app and shared package, including route type generation.                                                              |
| `npm run build`               | Passed production compilation, TypeScript validation, and static page generation. The homepage and case endpoints render dynamically.       |
| `npm run test:e2e`            | Passed: all 8 desktop/mobile tests using isolated local fixtures.                                                                           |
| Live Airtable adapter         | Returned exactly Taylor Brooks and Morgan Reed from the demo Cases table. Missing birth date and unknown modification date remain null.     |
| Live production browser check | Passed on desktop and mobile: archive/grid, both profiles, milestone selection, no horizontal overflow, and no browser script errors.       |
| Public data boundary          | Verified API/HTML exclude the seeded internal-note marker and API credential. Browser requests go to the website, not directly to Airtable. |
| Seed command rerun            | Passed: both existing fictional records were preserved; no duplicate cases were created.                                                    |

The two fictional records were added only to **Asterx180 demo → Cases**. The other base was not modified. Screenshots were reviewed locally and kept outside Git.

Validated against the root lockfile: Node.js 22.14.0, Next.js 16.4.1, React 19.3.1, TypeScript 5.9.3, and Playwright 1.64.1. Final checks used a temporary native Apple Silicon Node runtime because the existing x86 Node installation made cold checks slow under Rosetta; no global Node settings were changed.

The ignored root `.env` selects the live demo locally. Fresh clones default to mock content until configured. The local production server runs at http://127.0.0.1:3000 and reads demo updates on refresh after the 30-second cache interval.

## Remaining work

The owner dashboard is a reserved workspace. Authentication, display selections, approved snapshots, publishing/unpublishing, Supabase, and hosted deployment are not implemented. The current live reader is restricted to the two explicit fictional demo IDs, not all Airtable records. See `docs/architecture.md` for the planned publication boundary.

The repository reorganization was committed and pushed separately before the Airtable demo was seeded.
