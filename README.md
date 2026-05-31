# BriefPay

BriefPay is a freelancer back-office MVP for proposals, client acceptance, external payment instructions, and manual payment verification.

## Local setup

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Create a PostgreSQL database and set `DATABASE_URL`.
3. Run `npm.cmd install`.
4. Run `npm.cmd run migration:run`.
5. Run `npm.cmd run dev`.

The web app runs at `http://localhost:5173` and the API at `http://localhost:4000/api/v1`.

## Quality checks

Run migrations against a local QA database before executing the integration suite:

```txt
npm.cmd run migration:run
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

See `docs/10_SPRINT_2_QA.md` for the full browser workflow and staging checklist.

## Staging note

The current `StorageAdapter` is suitable for local development only. Replace local disk storage with a private object-storage implementation before relying on staging receipt or logo persistence.

## Important boundary

BriefPay does not process, hold, or automatically verify payments. Clients pay through external methods and submit a confirmation for freelancer review.
