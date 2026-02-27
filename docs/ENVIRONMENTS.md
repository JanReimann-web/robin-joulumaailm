# Environments and Config

This project uses three deployment environments:

1. `development` (local)
2. `staging` (pre-production verification)
3. `production` (live traffic)

## 1. Environment Variable Matrix

| Variable | development | staging | production | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | required | required | required | Firebase web app key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | required | required | required | include environment domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | required | required | required | use separate Firebase projects if possible |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | required | required | required | project bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | required | required | required | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | required | required | required | Firebase web config |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | required | required | canonical app URL |
| `FIREBASE_PROJECT_ID` | optional | required | required | server admin project |
| `FIREBASE_STORAGE_BUCKET` | optional | required | required | server admin bucket |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | optional local, required for server APIs | required | required | single-line JSON |
| `BILLING_MANUAL_FALLBACK` | `true` | `true/false` | `true/false` | set `false` after Stripe go-live |
| `CRON_SECRET` | optional local | required | required | protects purge endpoint |
| `STRIPE_SECRET_KEY` | optional | optional/required | required after Stripe go-live | server-only |
| `STRIPE_PRICE_ID_90D` | optional | optional/required | required after Stripe go-live | server-only |
| `STRIPE_WEBHOOK_SECRET` | optional | optional/required | required after Stripe go-live | server-only |

Start from [.env.example](../.env.example).

## 2. Vercel Setup

1. Add variables in `Project Settings -> Environment Variables`.
2. Scope values correctly:
   - `Development`: local/vercel dev preview work
   - `Preview`: staging/testing deployments
   - `Production`: live domain
3. Redeploy after any environment change.

## 3. Firebase Console Checks Per Environment

1. Enable `Google` and `Email/Password` sign-in providers.
2. Add authorized domains:
   - local: `localhost`
   - staging and production domains
3. Publish `firestore.rules` and `storage.rules` for the target project.
4. Confirm Firestore and Storage locations match your compliance requirements.

## 4. Safe Defaults

1. Keep separate Firebase projects for staging and production.
2. Keep `BILLING_MANUAL_FALLBACK=true` until Stripe webhook is verified.
3. Rotate `CRON_SECRET` and service account keys periodically.
4. Do not commit secret `.env` files.
