# Backend setup

## Local configuration

Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_TOKEN_SECRET`, and the trusted browser origins in `CORS_ORIGINS`. Keep `.env` local; it is ignored by Git. The browser app also accepts `VITE_API_BASE_URL` in `frontend/.env` and defaults to `http://localhost:3000/api`.

`AUTH_TOKEN_SECRET` must be a random value of at least 32 bytes. Generate a value with a local password manager or cryptographic random generator; do not commit it. Set `DATABASE_SSL=true` when the PostgreSQL provider requires TLS. If Node.js does not trust the provider's CA, download the database CA certificate and set `DATABASE_SSL_CA_PATH` to its local path; certificate verification stays enabled.

## Database and first administrator

From the `backend` directory, run `npm run schema` to apply `database/schema.sql` to the PostgreSQL database in `DATABASE_URL`. The command applies the SQL in a transaction and refuses to run if it finds the RoboTactic `admin_users` table. The SQL is an initial schema, not a repeatable migration; run it only once on a new database.

For an existing RoboTactic database, run `npm run db:migrate`. It adds workshop speakers, image storage, account login names, and per-account section permissions. Existing managers keep their previous section access. The migration is safe to repeat. After applying the schema, create the first administrator from an interactive terminal:

Workshop managers and super admins can manage speakers at `/api/admin/speakers`. Creating a speaker assigns one workshop; the same speaker can then be linked to more workshops. Each link starts private unless `is_public` is explicitly enabled. Only public speaker names for published workshops appear in `/api/public/workshops`. The migration also enables row level security and revokes Supabase Data API access to speaker contact tables and the legacy participant table.

`GET /api/admin/stats` returns total record counts for the sections allowed by the signed-in administrator's current permissions. Counts include draft and unpublished records.

## Image uploads

Run `npm run db:migrate` to create the public `robotactic-images` Supabase Storage bucket. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the backend's local `.env`; create the secret key in Supabase Project Settings > API Keys. Keep it on the backend only. The authenticated admin API accepts JPEG, PNG, and WebP files up to 5 MB at `POST /api/admin/images/:resource`, where `resource` is `competitions`, `workshops`, `projects`, or `announcements`. The endpoint checks the caller's server-side role, the file size, and the file signature before upload. The dashboard saves the returned public URL in `image_url`. Images uploaded to this bucket are publicly readable, so use approved website images only. Manual HTTPS image URLs remain supported.

```sh
npm run admin:create
```

The command prompts for a name, login name, optional email, role and password. Password entry is masked and the stored value is a salted scrypt hash. Create the first `super_admin`; there is no seeded/default account or password. Existing accounts receive a generated login name such as `super-admin-1` during migration. A Super Admin can change it in Users and permissions. The public sign-in list exposes only active login names and roles, never names, emails, or contact details.

To add the included demo records, run `npm run seed` from the `backend` directory. It is safe to repeat and only inserts missing demo records. Seeded content is marked as draft or inactive and stays out of the public API until reviewed. To intentionally publish/activate the public demo content, run `npm run seed:publish`; its labels remain marked as demo. To populate the rest of the tables too, run `npm run seed:full`. That also inserts fictional teams, speakers, workshop assignments, project members, sponsors, messages, sample site settings and inactive admin-account examples for each role. Their emails use the reserved `.invalid` domain, contact details are synthetic, and demo admin accounts have random unusable passwords. The role codes are stored on admin accounts rather than in a separate roles table. This full command publishes the public demo records; replace them with approved event information before production use. It does not overwrite an existing site-settings row or create a loginable admin account. Speaker contact details and notes are available only through the authorized admin API; only names explicitly marked public appear on published workshops.

Start the API with `npm run dev` or `npm start`. It verifies PostgreSQL before opening the HTTP port, then closes the pool on `SIGINT` or `SIGTERM`. If configuration is missing or PostgreSQL is unavailable, startup fails with a sanitized message.

## API behavior

- Public content routes live under `/api/public/*` and return published rows only.
- Administrative routes live under `/api/admin/*`. The server reloads the active account and section permissions on every request. Super Admin can manage users and all sections; other accounts receive explicit section permissions.
- Admin sign-in uses an eight-hour `HttpOnly`, `SameSite=Strict` cookie. Mutating requests require an allowed `Origin`; list `CORS_ORIGINS` explicitly. Sign-in and admin writes are rate-limited per process.
- Competition and workshop registration URLs remain external links. Google Forms responses are not imported into PostgreSQL automatically.
- Participant and team personal data is only available behind the server-side role checks; there is no public endpoint for those tables.

## About and event-team content

Apply pending migrations with the existing `npm run db:migrate` command. Migration 005 adds the singleton About page and public event-team profiles. About's approved text is inserted only when missing; existing edits survive reruns. Super Admin manages both sections; published content is exposed by `/api/public/about` and `/api/public/team-members`. See [local testing and API details](../docs/about-team-management.md).
