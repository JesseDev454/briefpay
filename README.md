# BriefPay

BriefPay is a freelancer back-office MVP for proposals, client acceptance, external payment instructions, and manual payment verification.

## Local setup

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Create a PostgreSQL database and set `DATABASE_URL`.
3. Run `npm.cmd install`.
4. Run `npm.cmd run migration:run`.
5. Run `npm.cmd run dev`.

The web app runs at `http://localhost:5173` and the API at `http://localhost:4000/api/v1`.

## Important boundary

BriefPay does not process, hold, or automatically verify payments. Clients pay through external methods and submit a confirmation for freelancer review.
