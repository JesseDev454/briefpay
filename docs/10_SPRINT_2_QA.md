# Sprint 2 QA and Staging Readiness

This checklist verifies the existing BriefPay MVP. BriefPay tracks external payments; it does not process or hold funds.

## Automated verification

Prepare a migrated PostgreSQL database, then run:

```txt
npm.cmd run migration:run
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

The API integration suite covers:

- Signup, workspace creation, authenticated user lookup, login safety, refresh rotation, and logout invalidation
- Workspace-scoped client create, update, archive, read protection, and ownership protection
- Proposal creation, ownership protection, send lifecycle, invalid public tokens, and public-safe proposal data
- Client acceptance and exactly one automatic deposit request
- Public payment instructions, confirmation without a receipt, duplicate-confirmation protection, rejection, resubmission, and verification
- Dashboard awaiting-verification, accepted-proposal, and verified-payment totals

## Manual freelancer flow

Run `npm.cmd run dev`, then use `http://localhost:5173`.

- [ ] Create a freelancer account.
- [ ] Open Settings and save business identity, bank details, and external payment instructions.
- [ ] Create a client.
- [ ] Create a proposal with at least one priced line item and a fixed deposit or deposit percentage.
- [ ] Save the draft and open its details page.
- [ ] Send the proposal and copy its secure public link.
- [ ] Open the public link in an incognito window.
- [ ] Accept the proposal with a client name and email address.
- [ ] Confirm that the deposit page shows the expected amount, due date, bank details, and external-payment disclaimer.
- [ ] Submit a payment confirmation without a receipt.
- [ ] Return to the freelancer invoice view and confirm that the status is `awaiting verification`.
- [ ] Mark the confirmation as verified.
- [ ] Confirm that the dashboard paid total updates.

Repeat the confirmation flow once with a JPG, PNG, or PDF receipt during staging storage QA.

## Browser smoke checks

Use browser responsive mode at approximately `390 x 844` for client-facing pages:

- [ ] `/p/:token` keeps proposal content readable and acceptance actions accessible.
- [ ] `/p/:token/payment` keeps amount, bank details, copy actions, and confirmation form readable.
- [ ] `/p/:token/payment/done` clearly says that the freelancer will review the confirmation.
- [ ] Desktop `/dashboard`, `/proposals/new`, `/invoices/:id`, and `/settings` remain usable.
- [ ] No UI uses payment-processor wording such as `Pay Now`, `Payment Successful`, wallet, escrow, or automated verification.

## Staging configuration

Set backend variables from `apps/api/.env.example` and frontend variables from `.env.example`.

Deploy in this order:

1. Provision a staging PostgreSQL database.
2. Deploy the API from the repository root with `npm install`, `npm run build -w @briefpay/api`, and `npm run start -w @briefpay/api`.
3. Run `npm run migration:run` against the staging database.
4. Deploy `apps/web` to Vercel with `VITE_API_URL=https://<api-host>/api/v1`.
5. Set `CORS_ORIGIN` and `PUBLIC_WEB_URL` to the staging frontend origin.
6. Run the manual freelancer flow above.

## Remaining deployment blockers

- The implemented `StorageAdapter` writes to local disk. Replace it with a private object-storage implementation before relying on staging receipt or logo persistence. Render and Railway filesystems may be ephemeral.
- Error monitoring is not configured yet. Add a platform log review process for staging and connect error monitoring before production.
- Transactional email is intentionally a placeholder boundary in the MVP; the manual share-link flow remains the supported path.
- Confirm a managed PostgreSQL backup policy before production launch.
