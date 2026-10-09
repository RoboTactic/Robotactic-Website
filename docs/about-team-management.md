# About and event-team management

This feature targets `8c939af`, the latest Refined Dark public design and accessible motion updates. The administrator's final scope is About and the organizing team only. The existing automatic timeline is unchanged. Do not combine this patch with the earlier About/Team/Timeline patch.

## Local setup before committing

Save `robotactic-about-team-refined.patch` beside `frontend` and `backend`. Stop the development servers. If the older feature patch is already applied, keep those changes and resolve the overlap before applying this replacement; do not apply both.

```powershell
cd "$env:USERPROFILE\Desktop\Robotactic-Website"
git status --short
git stash push -u -m "backup previous dashboard feature" -- frontend backend docs
git pull --ff-only origin master
git apply --check robotactic-about-team-refined.patch
git apply robotactic-about-team-refined.patch
```

The stash preserves the earlier local feature files before pulling. Do not pop it onto the new replacement feature. Only proceed when the tracked working tree is clean before applying, and the checks succeed. Never apply the same patch twice.

Use the administrator's new Neon settings as `backend/.env`. The current settings have `DATABASE_SSL=true` and no `DATABASE_SSL_CA_PATH`. The backend uses the system trust store in this case; the old missing `prod-ca-2021.crt` is not required. Do not copy the old CA path back or disable certificate validation. Environment files are local and must not be committed.

```powershell
cd backend
npm ci
node --test tests/aboutTeam.test.js
npm run db:migrate
npm start
```

The existing migration runner applies migration 005, adding `about_page` and `event_team_members` without replacing event records or creating accounts. The already-approved About copy is inserted only when absent; repeating the migration preserves edits. Do not apply the full schema or run seed scripts on the shared database.

In a second terminal:

```powershell
cd "$env:USERPROFILE\Desktop\Robotactic-Website\frontend"
npm ci
npm run build
npm run dev
```

Open the displayed local URL at `/dashboard` and use the administrator's supplied account. Real API/database connectivity is required for the account dropdown and saved content.

## Review

- About: edit bilingual title, introduction, body, values (one per line), optional image URL/alternative text and publication state. Published content appears on `/about` and the Home section, retaining the latest two-column Home composition. Hidden content shows an explicit unavailable state.
- Event team: add/edit/delete bilingual names, roles, biographies, portraits, order and approved public contacts. Draft/hidden profiles stay out of `/team`. Public profiles are separate from competition-registration teams and sign-in accounts.
- Both sections require Super Admin on the server, including image endpoints. Draft is the default for new team profiles. Unknown fields, unsafe URLs, invalid contacts, order and required values are rejected before SQL.
- The Refined Dark surface tokens and layered panels are shared with the dashboard. Fonts, sidebar icons, mobile menu, compact three-card desktop lists, adjacent detail panels and branded date/file controls are preserved. Public About/Team circuits and reduced-motion behavior are retained; the Team endpoint sits below the complete profile grid.
- The existing uploader is retained, but Neon supplies PostgreSQL, not the old image storage integration. The supplied Neon settings have no Supabase storage credentials. Image URLs work; file upload still requires the administrator to configure the existing storage service. This feature does not introduce a replacement storage provider.

## Verification

Run `node --test backend/tests/aboutTeam.test.js` and the frontend production build. The tests cover validation, partial About image edits, server-side roles and HTTP authentication/Origin checks for each new operation.

Browser checks use an isolated PostgreSQL engine and an ephemeral test account, with real Express routes: dropdown login, saved About on Home and About, hide/republish, image URL and alternative text, team draft/publish/edit/delete, three-column desktop lists, adjacent details and restricted roles. Responsive checks cover 320, 375, 390, 1024 and 1440px, dashboard language switching, and public About/Team Arabic and English, without horizontal overflow or page errors. They do not mutate the administrator's Neon database or use the supplied account. A read-only connection attempt from this workspace could not resolve the Neon hostname, so hosted connectivity remains to be confirmed locally.

Suggested commit after review:

```text
feat: add about and team content management
```
