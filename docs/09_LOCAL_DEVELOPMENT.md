# BriefPay Local Development

## Setup

1. Install PostgreSQL and create a `briefpay` database.
2. Copy `apps/api/.env.example` to `apps/api/.env`.
3. Update `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.
4. Run `npm.cmd install`.
5. Run `npm.cmd run migration:run`.
6. Optionally run `npm.cmd run seed`.
7. Run `npm.cmd run dev`.

## Deployment shape

- Deploy `apps/web` to Vercel with `VITE_API_URL`.
- Deploy `apps/api` to Render or Railway with the variables in `apps/api/.env.example`.
- Run `npm.cmd run migration:run` against the managed PostgreSQL database during release.
- Replace the local `StorageAdapter` with a private S3-compatible implementation before production receipt uploads.

The local storage provider deliberately writes outside public web directories. Receipts and logos are exposed only through short-lived API download URLs.
