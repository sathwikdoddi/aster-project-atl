# Owner dashboard — planned

This folder reserves a separate app for the Aster Project owner. It contains no running dashboard, authentication, admin API, or publish controls yet.

The intended dashboard will:

- Require owner authentication and enforce authorization on every server action/API.
- Read the evolving Airtable case records, including incomplete cases.
- Let the owner choose cases, sections, milestones, and media for public display.
- Preview the selected public content without making drafts public.
- Publish a validated snapshot, republish changes, or unpublish a case.

Private Airtable fields and credentials stay on the server. Use `@aster/content/schema` for the published output; introduce separate private-record and selection contracts when the Airtable fields are agreed. Do not put private fixtures in the public content package.

See [the architecture plan](../../docs/architecture.md) for storage, permissions, and setup decisions. A future Next.js app here can run on a separate port/domain; no admin start command exists yet.
