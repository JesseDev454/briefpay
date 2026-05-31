# BriefPay Software Requirements Specification (SRS)

**Product Name:** BriefPay  
**Product Type:** SaaS web application  
**Primary Market:** African freelancers and independent service providers  
**Secondary Market:** Global freelancers, small agencies, consultants, and service exporters  
**Version:** MVP v1.0  
**Prepared for:** Codex implementation planning and development

---

## 1. Product Overview

BriefPay is a freelancer back-office SaaS that helps freelancers move from client brief to proposal acceptance to payment tracking in one clean workflow.

BriefPay does **not** process payments directly in the MVP. It helps freelancers create professional proposals, send public proposal links, request deposits, show payment instructions, collect proof of payment, and manually verify payments.

### One-Line Pitch
BriefPay helps freelancers send proposals, request deposits, and track client payments without juggling Google Docs, WhatsApp, Excel, and invoice tools.

### Core Brand Message
**Send the brief. Get paid.**

---

## 2. Problem Statement

Freelancers often manage client work using scattered tools:

- Google Docs for proposals
- WhatsApp for negotiation and reminders
- Manual bank details for payment instructions
- Invoice generators for payment requests
- Excel or notes apps for income tracking
- Screenshots/receipts sent randomly through chat

This causes missed payments, weak professionalism, unclear proposal status, poor income visibility, and inconsistent client follow-up.

BriefPay solves this by combining proposal creation, public client approval, payment instruction sharing, and manual verification tracking in a single freelancer-focused workflow.

---

## 3. Product Goals

1. Help freelancers look more professional to clients.
2. Reduce scattered admin work across multiple tools.
3. Make proposal status and payment status easy to track.
4. Support local and international payment instruction workflows.
5. Provide a simple MVP that can generate revenue quickly.
6. Keep the system cheap, maintainable, and scalable.

---

## 4. Target Users

### Primary Users
- Freelance developers
- Designers
- Writers
- Virtual assistants
- Social media managers
- Video editors
- Independent consultants
- Small service-based agencies

### Secondary Users
- Client-side users who receive proposal/payment links
- Small business owners managing client projects
- Coaches and consultants selling service packages

---

## 5. MVP Scope

### In Scope
- User sign up/sign in
- Workspace creation
- Freelancer profile and payment settings
- Client management
- Proposal creation and editing
- Public proposal links
- Proposal acceptance by client
- Deposit/payment request display
- Manual payment confirmation form
- Required receipt upload for payment confirmation
- Freelancer manual payment verification
- Dashboard summary
- Basic email notifications or placeholders for later integration

### Out of Scope for MVP
- Direct payment processing
- Wallet/balance system
- Escrow
- Legal-grade e-signatures
- Automated tax filing
- Advanced accounting
- AI proposal generation
- Marketplace for finding clients
- Team/agency permissions beyond simple owner structure
- Native mobile app
- Complex analytics

---

## 6. Functional Requirements

### FR-001: User Registration
Users must be able to create an account using name, email, password, business/profession, and default currency.

### FR-002: User Login
Users must be able to log in securely using email and password.

### FR-003: Workspace Creation
A workspace must be created for each user during sign-up. Future team support should be possible.

### FR-004: Client Management
Users must be able to create, view, update, archive, and list clients.

Required client fields:
- Name
- Email
- Phone number (optional)
- Company name (optional)
- Notes (optional)

### FR-005: Proposal Creation
Users must be able to create proposals with:
- Client
- Proposal title
- Problem/brief summary
- Proposed solution
- Deliverables
- Timeline
- Price/line items
- Currency
- Deposit amount or percentage
- Payment terms
- Call-to-action text

### FR-006: Proposal Drafting
Users must be able to save proposals as drafts before sending.

### FR-007: Send Proposal
Users must be able to mark a proposal as sent and generate a public proposal link.

### FR-008: Public Proposal View
Clients must be able to view a public proposal without signing in.

### FR-009: Proposal Acceptance
Clients must be able to accept a proposal by entering name and email and clicking **Accept Proposal**.

### FR-010: Request Changes
Clients must be able to request changes from the public proposal page using a simple note field.

### FR-011: Deposit/Payment Instructions
After acceptance, clients should be able to view payment/deposit instructions.

### FR-012: Payment Confirmation
Clients must be able to submit payment confirmation using:
- Client name
- Payment method
- Amount paid
- Optional transaction reference or note
- Required receipt upload

### FR-013: Manual Payment Verification
Freelancers must be able to mark submitted payments as verified or rejected.

### FR-014: Dashboard
Users must see dashboard metrics including:
- Total paid
- Unpaid amount
- Awaiting verification
- Active proposals
- Accepted proposals
- Recent activity

### FR-015: Settings
Users must be able to update:
- Name
- Business name
- Logo/avatar
- Default currency
- Brand color
- Bank details
- Foreign account details
- Payment links
- WhatsApp number

---

## 7. Status Models

### Proposal Status
- `draft`
- `sent`
- `viewed`
- `accepted`
- `changes_requested`
- `cancelled`

### Payment Request Status
- `unpaid`
- `awaiting_verification`
- `paid`
- `rejected`
- `cancelled`

### Public Link Status
- Active
- Revoked
- Expired

---

## 8. Non-Functional Requirements

### Performance
- Dashboard should load within 2 seconds under normal MVP usage.
- Public proposal pages should be lightweight and mobile-friendly.
- Database queries must be indexed by `workspace_id`, `client_id`, `proposal_id`, and status fields.

### Security
- Passwords must be hashed.
- Stored refresh tokens and public tokens must be hashed.
- Public links must use random tokens, not predictable IDs.
- Every private resource query must be scoped by workspace ownership.
- Uploaded files must be stored privately.
- Sensitive operations should be audit logged.

### Reliability
- App should handle failed uploads gracefully.
- Email/reminder failures must not break core proposal/payment flows.
- Public proposal pages should show clear expired/revoked states.

### Maintainability
- Use modular backend structure.
- Keep controllers thin.
- Put business logic in service classes/functions.
- Use shared validation schemas.
- Keep UI components reusable.

### Accessibility
- Forms must have labels.
- Buttons must have clear focus states.
- Text contrast should meet readable standards.
- Public proposal and payment pages must work well on mobile.

---

## 9. MVP User Flow

1. Freelancer signs up.
2. Freelancer sets profile/payment instructions.
3. Freelancer creates a client.
4. Freelancer creates a proposal.
5. Freelancer sends the proposal link.
6. Client opens public proposal link.
7. Client accepts proposal.
8. Client views deposit/payment request.
9. Client submits payment confirmation with a receipt.
10. Freelancer sees status as **Awaiting Verification**.
11. Freelancer verifies payment manually.
12. Dashboard updates payment/proposal status.

---

## 10. Content Rules

BriefPay must not sound like it processes money directly.

### Use
- Accept Proposal
- View Payment Instructions
- I Have Paid
- Payment confirmation submitted
- Awaiting Verification
- Payment receipt required
- Mark as Verified

### Avoid
- Pay Now
- Payment Successful
- Payment Received
- Wallet
- Balance Held
- Accept & Pay
- Processing Payment

---

## 11. Success Criteria

The MVP is successful when:

- A user can sign up and create a workspace.
- A user can create and send a proposal.
- A public proposal link works without login.
- A client can accept the proposal.
- A client can submit payment confirmation.
- A freelancer can verify payment.
- Dashboard reflects the correct statuses.
- Public pages work well on mobile.
- The product can be deployed cheaply and maintained by one technical founder.
