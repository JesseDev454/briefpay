# BriefPay Testing Plan

The goal of testing BriefPay is to prove that the core freelancer flow works securely and reliably.

---

## 1. Testing Strategy

Use a practical MVP testing approach:

- Unit tests for business logic
- Integration tests for critical API routes
- Manual QA checklist for full product flow
- UI smoke tests for main routes
- Security checks for auth, public links, and workspace isolation

---

## 2. Critical Flows to Test

### Flow 1: Sign Up and Workspace Creation
1. User signs up with valid details.
2. User is created.
3. Workspace is created.
4. User becomes owner of workspace.
5. User can access dashboard.

Expected result: user and workspace exist, dashboard loads.

### Flow 2: Client Creation
1. Authenticated user creates client.
2. Client appears in list.
3. Client can be edited.
4. Client can be archived.

Expected result: only owner workspace can access the client.

### Flow 3: Proposal Creation and Sending
1. User creates proposal draft.
2. User edits proposal.
3. User sends proposal.
4. Public link is generated.
5. Proposal status becomes `sent`.

Expected result: public link works without login.

### Flow 4: Public Proposal Acceptance
1. Client opens public proposal link.
2. Proposal status changes to `viewed` if applicable.
3. Client accepts proposal.
4. Proposal status becomes `accepted`.
5. Acceptance timestamp is recorded.

Expected result: only public-safe data is shown.

### Flow 5: Payment Confirmation
1. Client opens payment request page.
2. Client fills required payment confirmation fields.
3. Receipt upload is optional.
4. Client submits form.
5. Payment request status becomes `awaiting_verification`.

Expected result: freelancer can see submitted confirmation.

### Flow 6: Freelancer Verification
1. Freelancer opens payment request.
2. Freelancer marks as verified.
3. Payment status becomes `paid`.
4. Dashboard total paid updates.

Expected result: no automatic payment wording appears.

---

## 3. Backend Unit Tests

Test:
- Password hashing and validation
- Refresh token hashing/rotation
- Public token generation and hashing
- Proposal status transitions
- Payment request status transitions
- Workspace ownership checks
- Amount/currency validation

---

## 4. Backend Integration Tests

Recommended route tests:

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Clients
- `POST /clients`
- `GET /clients`
- `PATCH /clients/:id`
- `DELETE /clients/:id`

### Proposals
- `POST /proposals`
- `PATCH /proposals/:id`
- `POST /proposals/:id/send`
- `GET /public/proposals/:token`
- `POST /public/proposals/:token/accept`

### Payments
- `POST /proposals/:id/payment-request`
- `GET /public/payment/:token`
- `POST /public/payment/:token/confirm`
- `POST /payment-requests/:id/verify`

---

## 5. Security Tests

### Workspace Isolation
- User A must not read User B's clients.
- User A must not edit User B's proposals.
- User A must not verify User B's payment requests.

### Public Token Security
- Invalid token returns 404 or safe error.
- Revoked token cannot access proposal.
- Expired token cannot access proposal.
- Raw internal IDs do not work as public URLs.

### Auth Safety
- Wrong login credentials return generic error.
- Refresh token rotation invalidates old refresh token.
- Logout invalidates active refresh token.

### File Upload Safety
- Reject unsupported file types.
- Reject files above size limit.
- Do not expose private storage URLs permanently.

---

## 6. Frontend Smoke Tests

Routes must render:

- `/`
- `/signup`
- `/signin`
- `/dashboard`
- `/proposals/new`
- `/p/:token`
- `/p/:token/payment`
- `/p/:token/payment/done`
- `/settings`

Test states:
- Loading state
- Empty state
- Validation error state
- Success state
- Mobile layout for public pages

---

## 7. Manual QA Checklist

Before deployment:

- [ ] Landing page loads and CTA links work.
- [ ] Sign up works.
- [ ] Sign in works.
- [ ] Dashboard loads.
- [ ] Create client works.
- [ ] Create proposal works.
- [ ] Public proposal link works in incognito/private browser.
- [ ] Public proposal looks good on mobile.
- [ ] Accept proposal works.
- [ ] Payment instruction page works.
- [ ] Payment confirmation form works without receipt.
- [ ] Payment confirmation form works with receipt.
- [ ] Freelancer can verify payment.
- [ ] Dashboard metrics update.
- [ ] Settings save correctly.
- [ ] No forbidden payment-processor wording appears.

---

## 8. Suggested Tooling

- Backend: Jest or Vitest + Supertest
- Frontend: Vitest + React Testing Library
- E2E later: Playwright
- Linting: ESLint
- Formatting: Prettier
- Type check: `tsc --noEmit`

---

## 9. Definition of Done

A feature is done only when:

- It builds without TypeScript errors.
- It has validation.
- It respects workspace ownership.
- It handles error states.
- It follows the design system.
- It passes relevant tests or manual QA.
- Codex provides changed files and how to test.
