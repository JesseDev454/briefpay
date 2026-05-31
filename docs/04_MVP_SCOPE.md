# BriefPay MVP Scope

This document defines exactly what BriefPay v1 should include and what should be excluded so Codex does not overbuild the product.

---

## 1. MVP Objective

Build the smallest useful version of BriefPay that allows a freelancer to:

1. Create an account.
2. Add client details.
3. Create a proposal.
4. Send a public proposal link.
5. Let a client accept the proposal.
6. Show payment/deposit instructions.
7. Let the client submit payment confirmation.
8. Let the freelancer manually verify payment.
9. Track proposal and payment status on a dashboard.

---

## 2. Must-Have Features

### Auth
- Sign up
- Sign in
- Logout
- Current user endpoint
- Workspace creation on sign-up

### Profile and Settings
- Freelancer name
- Business name
- Default currency
- Brand color
- Bank/payment instructions
- Payment links
- WhatsApp number

### Clients
- Create client
- View client
- Edit client
- Archive client
- List clients

### Proposals
- Create proposal
- Save draft
- Edit draft
- Send proposal
- Generate public link
- View proposal status
- Track viewed/accepted timestamps

### Public Proposal
- View proposal without login using secure token
- Accept proposal
- Request changes
- Mobile-first layout

### Payment/Deposit Request
- Show amount due
- Show currency
- Show due date
- Show payment instructions
- Copy payment details
- Client submits payment confirmation
- Required receipt upload for payment confirmation

### Dashboard
- Active proposals
- Sent proposals
- Accepted proposals
- Awaiting verification
- Total paid by currency
- Recent activity

---

## 3. Nice-to-Have Only If Time Remains

- Proposal templates by profession
- Email notification integration
- Basic reminder link generation
- Export proposal as PDF
- Basic activity timeline

These should not block the MVP.

---

## 4. Explicitly Out of Scope

Do not build these in v1:

- Payment gateway processing
- Wallets
- Escrow
- Marketplace/client discovery
- AI proposal generation
- Legal-grade e-signatures
- Team roles and complex permissions
- Advanced accounting/tax filing
- Complex analytics dashboard
- Mobile app
- Chat/messaging system
- Full CRM
- Automated currency conversion

---

## 5. MVP Status Flows

### Proposal Flow
```txt
Draft -> Sent -> Viewed -> Accepted
              -> Changes Requested
              -> Cancelled
```

### Payment Flow
```txt
Unpaid -> Awaiting Verification -> Paid
                              -> Rejected
                              -> Cancelled
```

---

## 6. MVP Definition of Done

The MVP is done when this full flow works:

1. Freelancer signs up.
2. Freelancer adds payment settings.
3. Freelancer creates a client.
4. Freelancer creates a proposal.
5. Freelancer sends/generates a public link.
6. Client opens the proposal link on mobile.
7. Client accepts proposal.
8. Client views payment instructions.
9. Client submits payment confirmation with a receipt.
10. Freelancer sees **Awaiting Verification**.
11. Freelancer marks payment as **Paid**.
12. Dashboard updates correctly.

---

## 7. Codex Guardrails

Codex must:
- Build one module at a time.
- Use mock data only when API is not ready.
- Keep components reusable.
- Avoid adding features outside this scope.
- Use BriefPay wording rules.
- Keep public pages mobile-first.
- Keep private dashboard desktop-first but responsive.

Codex must not:
- Add payment processing.
- Use wallet/balance wording.
- Build unrequested features.
- Hardcode credentials.
- Store uploaded files in the database.
