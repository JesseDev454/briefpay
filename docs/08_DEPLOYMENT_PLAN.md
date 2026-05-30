# BriefPay Deployment Plan

This plan prioritizes low cost, speed, and maintainability for a solo founder.

---

## 1. Recommended Deployment Setup

### MVP Setup

| Layer | Recommended Service | Reason |
|---|---|---|
| Frontend | Vercel | Easy React/Vite deployment |
| Backend API | Render, Railway, or Fly.io | Simple Node deployment |
| Database | Neon Postgres or Supabase Postgres | Cheap managed PostgreSQL |
| File Storage | Supabase Storage or Cloudflare R2 | Cheap private object storage |
| Email | Resend | Simple developer-friendly transactional email |
| Monitoring | Sentry + platform logs | Error visibility |

---

## 2. Environments

Use three environments:

### Local
- Developer machine
- Local `.env`
- Local or cloud dev database

### Staging
- Preview deployment
- Test database
- Used for QA before production

### Production
- Real users
- Production database
- Production storage
- Production email domain

---

## 3. Environment Variables

### Frontend `.env.example`

```txt
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_NAME=BriefPay
```

### Backend `.env.example`

```txt
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/briefpay
JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
CORS_ORIGIN=http://localhost:5173
STORAGE_PROVIDER=supabase
STORAGE_BUCKET=briefpay-files
STORAGE_ACCESS_KEY=replace_me
STORAGE_SECRET_KEY=replace_me
RESEND_API_KEY=replace_me
EMAIL_FROM=BriefPay <noreply@briefpay.app>
```

Never commit real `.env` files.

---

## 4. Deployment Order

1. Push code to GitHub.
2. Create managed Postgres database.
3. Deploy backend API.
4. Run database migrations.
5. Deploy frontend.
6. Configure CORS.
7. Configure storage bucket.
8. Configure email provider.
9. Test full MVP flow in production.
10. Add monitoring and error alerts.

---

## 5. Database Deployment

Use migrations for every schema change.

Deployment command examples:

```txt
npm run migration:run
npm run migration:revert
```

Rules:
- Never manually edit production schema.
- Back up production database before major changes.
- Do not use `synchronize: true` in production with TypeORM.

---

## 6. Frontend Deployment

Recommended Vercel settings:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL`

Add production API URL after backend deployment.

---

## 7. Backend Deployment

Recommended settings:

- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check path: `/health` or `/api/v1/health`

Make sure backend allows CORS from the frontend domain only.

---

## 8. Storage Setup

Buckets:
- `briefpay-logos`
- `briefpay-receipts`

Rules:
- Buckets should be private.
- Access through signed URLs.
- Limit file size.
- Allow only PDF, JPG, PNG for receipts.

---

## 9. Email Setup

Email types:
- Proposal sent
- Proposal accepted
- Payment confirmation submitted
- Payment verified/rejected
- Reminder email later

MVP can start with basic email placeholders if needed, but the architecture should support transactional email.

---

## 10. Monitoring and Logs

Add:
- Sentry for frontend/backend errors
- Platform logs from Vercel/Render/Railway
- Basic request logging on backend
- Audit logs in database for sensitive actions

Track:
- Auth failures
- Public link errors
- Upload failures
- Email failures
- Payment verification actions

---

## 11. Rate Limiting

Apply rate limiting to:
- Login
- Signup
- Refresh token
- Public proposal access
- Payment confirmation submission
- File upload endpoints

---

## 12. Production Readiness Checklist

Before launch:

- [ ] Frontend deployed.
- [ ] Backend deployed.
- [ ] Database migrations run.
- [ ] CORS configured correctly.
- [ ] HTTPS enabled.
- [ ] Environment variables set.
- [ ] Public links work.
- [ ] Auth works.
- [ ] Receipt upload works.
- [ ] Payment confirmation wording is correct.
- [ ] Dashboard metrics update.
- [ ] Error monitoring installed.
- [ ] Database backup strategy confirmed.

---

## 13. Cost Control

Start with low-cost/free tiers:

- Vercel free/pro depending on usage
- Neon/Supabase free or low tier
- Render/Railway starter tier
- Cloudflare R2/Supabase Storage low usage
- Resend free tier for early email volume

Upgrade only when users force the upgrade.

---

## 14. Future Scaling

When BriefPay grows:

- Add background worker for scheduled reminders.
- Add queue system if email/reminder volume increases.
- Add caching only for expensive dashboard queries.
- Add stronger observability.
- Consider team roles and agency accounts.
- Consider PDF export and payment gateway integrations after traction.

Do not redesign architecture until actual usage justifies it.
