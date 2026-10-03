# Backend setup

## Local configuration

Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_TOKEN_SECRET`, and the trusted browser origins in `CORS_ORIGINS`. Keep `.env` local; it is ignored by Git. The browser app also accepts `VITE_API_BASE_URL` in `frontend/.env` and defaults to `http://localhost:3000/api`.

`AUTH_TOKEN_SECRET` must be a random value of at least 32 bytes. Generate a value with a local password manager or cryptographic random generator; do not commit it. Set `DATABASE_SSL=true` when the PostgreSQL provider requires TLS and presents a certificate trusted by Node.js.

## Database and first administrator

Apply `database/schema.sql` to a new PostgreSQL database using your database provider or `psql`. The SQL is a schema definition and is not an idempotent migration; do not apply it a second time to a database that already contains these tables.

After applying the schema, create the first administrator from an interactive terminal:

```sh
npm run admin:create
```

The command prompts for a name, email, role and a password. Password entry is masked and the stored value is a salted scrypt hash. Create the first `super_admin`; there is no seeded/default account or password.

Start the API with `npm run dev` or `npm start`. It verifies PostgreSQL before opening the HTTP port, then closes the pool on `SIGINT` or `SIGTERM`. If configuration is missing or PostgreSQL is unavailable, startup fails with a sanitized message.

## API behavior

- Public content routes live under `/api/public/*` and return published rows only.
- Administrative routes live under `/api/admin/*`. The server reloads the active account and role on every request.
- Admin sign-in uses an eight-hour `HttpOnly`, `SameSite=Strict` cookie. Mutating requests require an allowed `Origin`; list `CORS_ORIGINS` explicitly. Sign-in and admin writes are rate-limited per process.
- Competition and workshop registration URLs remain external links. Google Forms responses are not imported into PostgreSQL automatically.
- Participant and team personal data is only available behind the server-side role checks; there is no public endpoint for those tables.
