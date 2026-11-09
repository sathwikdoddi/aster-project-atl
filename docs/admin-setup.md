# Owner dashboard

The admin app runs at http://127.0.0.1:3001. Airtable remains the working-record system; Supabase stores owner membership, private drafts, approved public snapshots, and publication history.

## One-time Supabase setup

1. Put `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the ignored root `.env`. No secret/service-role key or database password is used by the apps.
2. Run `supabase/migrations/001_owner_publishing.sql` in the project’s SQL Editor.
3. Create the owner under **Authentication → Users** with an email and password. For the local test account `admin@admin.com`, make sure its email is confirmed.
4. Run `supabase/authorize-owner.sql`. It authorizes `admin@admin.com` by looking up the Auth user ID. Change that email when authorizing the eventual Aster owner.

Example root `.env` settings:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
AIRTABLE_API=YOUR_AIRTABLE_TOKEN
ADMIN_AIRTABLE_BASE_ID=YOUR_FAMILY_CASE_MANAGEMENT_BASE_ID
ADMIN_AIRTABLE_PROFILES_TABLE=Family Profiles
PUBLIC_SITE_URL=http://127.0.0.1:3000
CONTENT_SOURCE=published
PUBLICATION_STORE=supabase
```

Restart each app after changing `.env`:

```sh
npm ci
npm run dev          # Public website, port 3000
npm run dev:admin    # Owner dashboard, port 3001, in another terminal
```

Sign in through the dashboard; enter the password only in the login form. An Auth account also needs an `aster_admin_members` entry. Unregistered accounts cannot read Airtable profiles or write publications.

## Review and publish

- Search profiles by name, location, or agency. The source view shows available profile facts and media/link counts; family contact details are excluded.
- Write a public introduction, choose visible fields, select sections and milestones, and review the preview. Source statuses with question marks retain their uncertainty.
- **Save draft** preserves the current public version. Incomplete introductions can be saved, but require completion before publishing.
- **Publish profile / Publish update** saves unsaved changes first, then atomically publishes that saved snapshot. Later Airtable edits never change it automatically.
- **Unpublish** removes the public snapshot, including its public JSON/detail route. The draft remains available.
- Supabase records each publish/unpublish action in the private history table. Draft revision checks reject stale saves and publishes; stale Airtable source checks ask you to refresh before saving.

The public website uses only `aster_publications` in published mode. It starts empty until the owner publishes a profile. Its reader uses the publishable key with anonymous access; it cannot read private drafts or owner membership. The public routes do not cache published snapshots, so a refresh reflects publication changes.

## Local fictional demonstration

For UI development without real records or sign-in:

```sh
ADMIN_MODE=demo npm run dev:admin
```

This mode is permitted only in development on a loopback host and uses the three fictional repository fixtures. It saves to ignored `.aster-local/publishing.json`; the local store refuses real-person snapshots. To view these demo publications on the public site, also start that app with `CONTENT_SOURCE=published PUBLICATION_STORE=local-demo npm run dev`. Keep demo storage separate from real Supabase publications.

## Checks and deployment

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
npm run test:e2e --workspace=@aster/admin
```

The admin browser suite starts an isolated fictional dashboard/public-site pair on ports 3201/3200. The public app must be built first. It never writes to Airtable or Supabase.

For hosting, deploy `apps/admin` and `apps/web` separately from this repository. Set `ADMIN_ORIGIN` to the admin HTTPS origin, `PUBLIC_SITE_URL` to the public origin, and provide each app only its needed environment settings. Demo auth bypass is disabled in production. Keep Supabase sign-in settings and owner membership under the project operator’s control.

Photo/document publication, source linking/editing, invitation/password recovery screens, and an audit-history viewer are following work. The first version exposes photo/document availability counts without publishing attachment URLs.
