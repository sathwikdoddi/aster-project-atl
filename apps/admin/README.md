# Aster owner workspace

Authenticated profile review and publishing app, normally at http://127.0.0.1:3001.

From the repository root, run `npm run dev:admin`. Supabase URL/publishable key, the SQL migration, and an authorized Auth user are required. See [admin setup](../../docs/admin-setup.md).

- `src/server/auth.ts`: verified owner sessions and same-origin mutation checks.
- `src/server/sources.ts`: read-only, allowlisted fields from Airtable Family Profiles; contact details and attachment URLs are excluded.
- `src/app/api`: authenticated workspace, draft, publish/unpublish, and session endpoints.
- `src/components/dashboard.tsx`: profile search, source review, display settings, and draft/published previews.
- `src/proxy.ts`: session cookie refresh; server endpoints independently enforce authorization.

Shared projection/storage code lives in `packages/publishing`. Publication functions and access policies live in `supabase/migrations`. The public app reads approved snapshots only in published mode.

For a fictional local-only development workflow, use `ADMIN_MODE=demo npm run dev:admin`. This bypass is disabled in production and restricted to loopback hosts. It never reads the real Airtable base or writes real-person snapshots to local storage.

The first version supports text, facts, sections, and timeline selections. Photo/document publication and a history viewer are not included yet.
