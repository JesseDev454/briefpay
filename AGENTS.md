# AGENTS.md

## Project
BriefPay is a SaaS back-office tool for freelancers. It helps users create proposals, send public proposal links, track client acceptance, show manual payment instructions, upload optional receipts, and track payment verification.

## MVP Rule
Build only the MVP. Do not add payment processor integrations, AI proposal generation, chat, marketplace features, advanced analytics, multi-team agency roles, or mobile apps unless explicitly requested.

## Tech Stack
Frontend:
- React + Vite + TypeScript
- Tailwind CSS
- React Router
- TanStack Query for API state
- React Hook Form + Zod for forms

Backend:
- Node.js + Express + TypeScript
- TypeORM
- MySQL or PostgreSQL depending on project config
- JWT auth with refresh token rotation
- bcrypt for password hashing
- Zod/Joi validation

General:
- Use clean modular architecture.
- Keep frontend and backend separated.
- Use environment variables for secrets.
- Never hardcode credentials.
- Keep JWT payloads minimal.
- Hash stored tokens.
- Separate authentication middleware from authorization middleware.
- Avoid leaking whether an email exists in auth error messages.

## UI Rules
Follow the Stitch design direction:
- Linear-meets-Stripe aesthetic
- Primary color: #2962FF
- Background: #F8FAFC
- Surface: #FFFFFF
- Text: #0F172A
- Muted: #64748B
- Accent: #00BFA5
- Dark Navy: #0A0F24
- Use crisp 1px borders, clean spacing, subtle shadows, and premium SaaS layout.
- Build responsive pages, especially public proposal and payment pages.

## MVP Features
1. Auth: sign up, sign in, logout.
2. Dashboard: proposal stats, payment status summary, recent proposals.
3. Proposal builder: create proposal with client info, project title, scope, deliverables, timeline, amount, currency, deposit amount, payment instructions.
4. Public proposal link: client can view proposal and accept it.
5. Manual payment tracking: client sees payment instructions and can optionally upload receipt.
6. Freelancer can mark payment as verified.
7. Settings: freelancer profile, business name, bank/payment details, default currency.

## Code Quality
- Use TypeScript strictly.
- Use meaningful names.
- Avoid huge files.
- Keep controllers thin and services reusable.
- Add validation for every request body.
- Add error handling middleware.
- Add basic tests for important backend services/routes where practical.

## Done Means
A task is only complete when:
- The app builds successfully.
- TypeScript passes.
- Linting passes if configured.
- Main user flow works manually.
- Relevant tests pass.
- Codex summarizes changed files and explains how to test the feature.