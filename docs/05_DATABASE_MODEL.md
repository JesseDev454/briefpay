# BriefPay Database Model

Recommended database: PostgreSQL.  
ORM: TypeORM.  
Design style: workspace-scoped multi-tenant relational schema with flexible JSONB for proposal content.

---

## 1. Core Rules

1. Every business table must include `workspace_id`.
2. Never expose internal numeric IDs in public URLs.
3. Store only hashed public tokens and hashed refresh tokens.
4. Store uploaded file metadata in the database, not file bytes.
5. Use status enums consistently.
6. Keep proposal content versioned.

---

## 2. Entity List

- users
- sessions / refresh_tokens
- workspaces
- workspace_memberships
- clients
- proposals
- proposal_versions
- public_links
- payment_requests
- payment_confirmations
- files
- notifications
- audit_events

---

## 3. Tables

### users

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| full_name | varchar | required |
| email | varchar | unique, lowercase |
| password_hash | varchar | required unless OAuth-only later |
| avatar_url | varchar nullable | optional |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Indexes:
- unique index on `email`

---

### refresh_tokens

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | FK users.id |
| token_hash | varchar | hashed token only |
| expires_at | timestamp | required |
| revoked_at | timestamp nullable | null if active |
| created_at | timestamp | required |

Indexes:
- `user_id`
- `token_hash`

---

### workspaces

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| owner_user_id | uuid | FK users.id |
| name | varchar | business/workspace name |
| default_currency | varchar(3) | NGN, USD, GBP, KES etc. |
| brand_color | varchar | default #2962FF |
| logo_file_id | uuid nullable | FK files.id |
| whatsapp_number | varchar nullable | optional |
| created_at | timestamp | required |
| updated_at | timestamp | required |

---

### workspace_memberships

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid | FK workspaces.id |
| user_id | uuid | FK users.id |
| role | enum | owner, member |
| created_at | timestamp | required |

Unique:
- `(workspace_id, user_id)`

---

### clients

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid | FK workspaces.id |
| name | varchar | required |
| email | varchar nullable | optional but recommended |
| phone | varchar nullable | optional |
| company_name | varchar nullable | optional |
| notes | text nullable | optional |
| archived_at | timestamp nullable | soft archive |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Indexes:
- `workspace_id`
- `(workspace_id, email)`

---

### proposals

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid | FK workspaces.id |
| client_id | uuid | FK clients.id |
| title | varchar | required |
| status | enum | draft, sent, viewed, accepted, changes_requested, cancelled |
| current_version_id | uuid nullable | FK proposal_versions.id |
| total_amount | numeric(12,2) | stored summary |
| currency | varchar(3) | NGN, USD, GBP etc. |
| deposit_amount | numeric nullable | optional |
| deposit_percent | numeric nullable | optional |
| sent_at | timestamp nullable | when public link generated/sent |
| viewed_at | timestamp nullable | first client view |
| accepted_at | timestamp nullable | accepted by client |
| cancelled_at | timestamp nullable | optional |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Indexes:
- `workspace_id`
- `(workspace_id, status)`
- `(workspace_id, client_id)`

---

### proposal_versions

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid | FK workspaces.id |
| proposal_id | uuid | FK proposals.id |
| version_number | int | 1, 2, 3... |
| content_json | jsonb | proposal sections and line items |
| subtotal | numeric(12,2) | required |
| discount | numeric(12,2) | default 0 |
| tax | numeric(12,2) | default 0 |
| total | numeric(12,2) | required |
| created_at | timestamp | required |

Example `content_json`:

```json
{
  "problemSummary": "Client needs a dashboard for tracking sales.",
  "proposedSolution": "Build a responsive admin dashboard.",
  "deliverables": ["Auth", "Dashboard", "Reports"],
  "timeline": "3 weeks",
  "lineItems": [
    { "description": "Frontend development", "quantity": 1, "rate": 50000 }
  ],
  "paymentTerms": "50% deposit before work begins."
}
```

---

### public_links

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid | FK workspaces.id |
| resource_type | enum | proposal, payment_request |
| resource_id | uuid | proposal/payment request id |
| token_hash | varchar | hash only |
| expires_at | timestamp nullable | optional |
| revoked_at | timestamp nullable | optional |
| last_accessed_at | timestamp nullable | optional |
| created_at | timestamp | required |

Indexes:
- unique `token_hash`
- `(workspace_id, resource_type, resource_id)`

---

### payment_requests

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid | FK workspaces.id |
| proposal_id | uuid | FK proposals.id |
| client_id | uuid | FK clients.id |
| title | varchar | e.g. Project Deposit |
| amount | numeric(12,2) | required |
| currency | varchar(3) | required |
| due_date | date nullable | optional |
| status | enum | unpaid, awaiting_verification, paid, rejected, cancelled |
| instructions | text | payment instructions shown to client |
| created_at | timestamp | required |
| updated_at | timestamp | required |

Indexes:
- `workspace_id`
- `(workspace_id, status)`
- `(proposal_id)`

---

### payment_confirmations

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid | FK workspaces.id |
| payment_request_id | uuid | FK payment_requests.id |
| client_name | varchar | required |
| payment_method | varchar | required |
| amount_paid | numeric(12,2) | required |
| currency | varchar(3) | required |
| transaction_reference | varchar nullable | reference or note |
| note | text nullable | optional |
| receipt_file_id | uuid nullable | FK files.id; required for new confirmations, nullable for legacy records |
| submitted_at | timestamp | required |
| verified_at | timestamp nullable | freelancer verification |
| rejected_at | timestamp nullable | freelancer rejection |
| created_at | timestamp | required |

Indexes:
- `workspace_id`
- `payment_request_id`

---

### files

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid nullable | nullable for public upload until linked if needed |
| uploaded_by_type | enum | user, client |
| storage_key | varchar | object storage path/key |
| file_name | varchar | original file name |
| mime_type | varchar | file MIME type |
| size_bytes | integer | file size |
| scan_status | enum | pending, clean, blocked |
| created_at | timestamp | required |

Indexes:
- `workspace_id`
- `storage_key`

---

### audit_events

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| workspace_id | uuid | FK workspaces.id |
| actor_user_id | uuid nullable | user who performed action |
| actor_type | enum | user, client, system |
| action | varchar | proposal_sent, payment_verified etc. |
| entity_type | varchar | proposal, payment_request etc. |
| entity_id | uuid | related entity id |
| metadata | jsonb | additional details |
| created_at | timestamp | required |

---

## 4. Initial TypeORM Enum Suggestions

```ts
export enum ProposalStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  CHANGES_REQUESTED = 'changes_requested',
  CANCELLED = 'cancelled',
}

export enum PaymentRequestStatus {
  UNPAID = 'unpaid',
  AWAITING_VERIFICATION = 'awaiting_verification',
  PAID = 'paid',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}
```

---

## 5. MVP Index Priorities

Add indexes for:
- `users.email`
- all `workspace_id` columns
- proposal status queries
- payment status queries
- public link token hash
- proposal-client relationship

---

## 6. Data Safety Notes

- Use migrations, never manually mutate production schema.
- Use soft archive for clients/proposals where useful.
- Avoid deleting payment confirmations and audit events.
- Keep proposal versions immutable once sent where possible.
