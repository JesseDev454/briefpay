# BriefPay System Design

**Goal:** Build a cheap, scalable, maintainable SaaS MVP that can grow from 0 to 10,000+ users without premature overengineering.

---

## 1. Recommended Architecture

BriefPay should be built as a **modular monolith**.

This means:
- One backend application
- One frontend application
- One relational database
- One optional background worker
- Code organized by modules/domains

Do **not** use microservices for the MVP. Microservices add deployment, debugging, authentication, networking, and observability complexity before BriefPay has enough users to justify them.

---

## 2. High-Level Architecture

```txt
Client Browser
    |
    v
Vercel Frontend (React + Vite)
    |
    v
API Server (Node.js + Express + TypeScript)
    |
    |-- PostgreSQL Database
    |-- Object Storage for receipts/logos
    |-- Email Provider
    |
    v
Background Worker (optional for reminders/emails)
```

---

## 3. Technology Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form
- Zod

### Backend
- Node.js
- Express
- TypeScript
- TypeORM
- Zod/Joi for validation
- bcrypt/argon2 for password hashing
- JWT access tokens + hashed refresh tokens or secure session strategy

### Database
- PostgreSQL preferred
- MySQL acceptable if project constraints require it

PostgreSQL is recommended because BriefPay has both relational data and flexible proposal document content that fits well with JSONB.

### Storage
- Supabase Storage, Cloudflare R2, Backblaze B2, or AWS S3
- Use private buckets and signed URLs

### Email
- Resend, Postmark, or SendGrid

### Deployment
- Frontend: Vercel
- Backend: Render, Railway, Fly.io, or DigitalOcean App Platform
- Database: Neon, Supabase Postgres, Railway Postgres, or Render Postgres

---

## 4. Repo Structure

Recommended monorepo:

```txt
briefpay/
  apps/
    web/
    api/
    worker/
  packages/
    shared/
    config/
  docs/
```

Alternative simpler structure:

```txt
briefpay/
  client/
  server/
  docs/
```

For Codex and maintainability, the monorepo format is cleaner.

---

## 5. Backend Module Structure

```txt
apps/api/src/
  config/
  database/
  middleware/
  modules/
    auth/
    users/
    workspaces/
    clients/
    proposals/
    public-links/
    payment-requests/
    files/
    dashboard/
    settings/
    notifications/
    audit/
  routes/
  utils/
  app.ts
  server.ts
```

Each module should contain:

```txt
module-name/
  entity.ts
  schema.ts
  service.ts
  controller.ts
  routes.ts
```

Keep controllers thin. Put business logic in services.

---

## 6. Frontend Structure

```txt
apps/web/src/
  app/
    router.tsx
    providers.tsx
  components/
    ui/
    layout/
    forms/
    dashboard/
  features/
    auth/
    clients/
    proposals/
    public-proposal/
    payments/
    settings/
  lib/
    api.ts
    utils.ts
    constants.ts
  styles/
  pages/
```

Use shared components for buttons, cards, inputs, badges, tables, modals, and layout shells.

---

## 7. Multi-Tenant Design

Use `workspace_id` on all business tables.

Every private query must be scoped like:

```sql
WHERE workspace_id = :currentWorkspaceId
```

This prevents one user's data from leaking into another user's workspace.

Do not rely only on frontend checks.

---

## 8. Authentication Design

Recommended MVP approach:
- Email/password authentication
- Password hashing with bcrypt or argon2
- Short-lived access token
- Long-lived refresh token stored securely
- Store only hashed refresh tokens in database
- Rotate refresh tokens on refresh
- Logout invalidates refresh token

Security rules:
- Keep JWT payload minimal: `userId`, `workspaceId`, `role`
- Do not store sensitive data in JWT payload
- Do not reveal whether an email exists during login/reset flows
- Separate authentication middleware from authorization middleware

---

## 9. Public Link Design

Public proposal/payment pages must not expose internal IDs.

Use URLs like:

```txt
/p/bp_live_xxxxxxxxxxxxxxxxx
/p/bp_live_xxxxxxxxxxxxxxxxx/payment
```

Store only hashed tokens in the database.

Public link table should support:
- token hash
- resource type
- resource ID
- workspace ID
- expiry date
- revoked date
- last accessed date

Public links should allow clients to view only the specific proposal/payment page, not the freelancer dashboard.

---

## 10. File Upload Design

Receipt uploads and logos should go to object storage, not directly into the database.

Flow:
1. Client or user requests upload URL.
2. Backend validates file type/size/context.
3. Backend creates signed upload URL.
4. Browser uploads file directly to object storage.
5. Backend stores file metadata.

MVP simplification:
- Backend can accept multipart upload first if signed URLs are too much for Sprint 1.
- Still store files in private object storage.

Rules:
- Allow JPG, PNG, PDF for receipts.
- Limit file size, for example 5MB.
- Store metadata in `files` table.
- Use signed download URLs when viewing files.

---

## 11. Background Jobs

Use background jobs for:
- Sending proposal emails
- Sending reminder emails
- Cleaning expired sessions/tokens
- Later: scheduled payment reminders

MVP options:
- Start without a worker and send simple emails inside request lifecycle.
- Add `pg-boss` later for Postgres-backed jobs.
- Avoid Redis/BullMQ until necessary.

---

## 12. Dashboard Metrics

Dashboard metrics should be calculated from the database using workspace-scoped queries.

Recommended metrics:
- Total paid by currency
- Unpaid amount by currency
- Awaiting verification count
- Active proposals count
- Accepted proposals count
- Recent activity

Do not overbuild analytics. Use simple aggregate queries.

---

## 13. Scalability Plan

### 0-100 Users
- One API server
- One Postgres database
- Basic logs
- Object storage
- Manual deployments

### 100-1,000 Users
- Add background worker
- Add better email reliability
- Add database indexes
- Add error tracking
- Improve rate limiting

### 1,000-10,000 Users
- Add read replicas if needed
- Add caching only for expensive reads
- Add queue-based reminders
- Add better audit logs
- Add team roles if customer demand proves it

Do not introduce microservices unless a module has separate scaling needs and the team can handle operational complexity.

---

## 14. Security Checklist

- Hash passwords
- Hash refresh tokens
- Hash public link tokens
- Use HTTPS only in production
- Use httpOnly cookies if using cookie auth
- Add CSRF protection if cookies are used
- Add rate limiting to auth/public routes
- Validate all request bodies
- Validate uploaded files
- Use private object storage
- Scope all private queries by workspace
- Add audit logs for sensitive actions

---

## 15. Recommended Build Order

1. Project skeleton
2. Design system/frontend shell
3. Backend foundation
4. Auth and workspace
5. Client module
6. Proposal module
7. Public proposal link
8. Payment confirmation/manual verification
9. Dashboard metrics
10. Settings/payment instructions
11. Testing and deployment

---

## 16. Architecture Decision

Final recommendation:

```txt
React + Vite + TypeScript frontend
Node.js + Express + TypeScript backend
TypeORM + PostgreSQL
Modular monolith
Vercel for frontend
Render/Railway/Fly.io for backend
Neon/Supabase Postgres for database
Supabase Storage / Cloudflare R2 for files
Resend for emails
```

This setup is simple, cheap, maintainable, and powerful enough for the MVP and early growth.
