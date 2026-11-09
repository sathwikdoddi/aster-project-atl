# Verification

## November 9, 2026 — workspace reorganization

- `npm test`: passed all 6 shared content tests.
- `npm run typecheck`: passed for `apps/web` and `packages/content`, including Next.js route type generation.
- `npm run build`: passed production compilation, TypeScript validation, and static page generation. Both API endpoints and the dynamic case page compiled.
- Browser tests are retained in `apps/web/tests/e2e`; they have not yet been rerun for this reorganization.
- `git diff --cached --check`: passed.

Verified using Node.js 22.14.0, Next.js 16.4.1, React 19.3.1, and TypeScript 5.9.3. The root lockfile pins all workspace dependencies. The local x86 Node installation runs through Rosetta, which made cold startup and type checking slow.

At this checkpoint, the public app still uses fictional fixtures. The admin dashboard, Airtable integration, and publishing controls are not implemented. A follow-up Airtable demo connection is the next task.
