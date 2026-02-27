# Giftlist Studio SaaS

Multi-language gift list SaaS built with Next.js + Firebase.

Hosts can create event lists, share unique slug URLs, collect reservations without duplicates, add story timeline content, and add wheel-of-fortune style Q&A.

## MVP Status

- Authentication: Google + email/password
- Multi-tenant list ownership model
- Unique slug claim flow
- Public list page with reservation safety checks
- Trial + 90-day pass lifecycle model
- Story timeline and wheel modules
- QR generation and dashboard live preview
- i18n: English (default) + Estonian

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind
- Firebase Auth, Firestore, Storage
- Firebase Security Rules
- Stripe-ready billing backend (manual fallback currently supported)
- Vercel runtime + cron endpoint

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Start local app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Test Commands

```bash
npm run test:unit
npm run test:security
npm run test:e2e
npm run ci:checks
```

## Documentation

- [Master plan](docs/KINGID_SAAS_MASTER_PLAN.md)
- [Environment setup](docs/ENVIRONMENTS.md)
- [Stripe-ready setup](docs/STRIPE_READY_SETUP.md)
- [Lifecycle cleanup](docs/LIFECYCLE_CLEANUP.md)
- [CI checks](docs/CI_CHECKS.md)
- [Ops and alerting](docs/OPS_ALERTING.md)
- [Budget alerts](docs/BUDGET_ALERTS.md)
- [Soft launch runbook](docs/SOFT_LAUNCH_RUNBOOK.md)
- [Public launch checklist](docs/PUBLIC_LAUNCH_CHECKLIST.md)
