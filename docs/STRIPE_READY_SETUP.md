# Stripe-Ready Billing Setup

This project already supports two billing modes:

1. `Stripe checkout` (production-ready path)
2. `Manual fallback` (temporary mode while Stripe is not connected)

## Current Behavior

1. Dashboard "Activate 90-day pass" calls `POST /api/billing/checkout`.
2. If Stripe env vars are present:
   - returns Stripe Checkout URL and redirects user.
3. If Stripe is not configured and manual fallback is enabled:
   - server grants 90-day pass immediately.

## Required Server Environment

Set these in your hosting environment (for example Vercel):

1. `FIREBASE_PROJECT_ID`
2. `FIREBASE_STORAGE_BUCKET`
3. `FIREBASE_SERVICE_ACCOUNT_JSON`
   - full service-account JSON as one line
4. `NEXT_PUBLIC_SITE_URL`
   - for example `https://yourdomain.com`

Without admin credentials the billing API cannot update Firestore.

## Optional Stripe Environment (when account is ready)

1. `STRIPE_SECRET_KEY`
2. `STRIPE_PRICE_ID_90D`
3. `STRIPE_WEBHOOK_SECRET`
4. `BILLING_MANUAL_FALLBACK=false` (recommended after go-live)
5. `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` (must match deployed domain)

## Stripe Webhook Endpoint

Use this endpoint in Stripe Dashboard:

`POST https://yourdomain.com/api/billing/webhook`

Listen at minimum:

1. `checkout.session.completed`

## Go-Live Checklist (Stripe switch-over)

1. Create Stripe product and one-time price for 90-day pass.
2. Set `STRIPE_PRICE_ID_90D` to that price id.
3. Add `STRIPE_SECRET_KEY` in Vercel env variables.
4. Add webhook endpoint:
   - `https://yourdomain.com/api/billing/webhook`
5. Add `STRIPE_WEBHOOK_SECRET` from Stripe webhook settings.
6. Set `BILLING_MANUAL_FALLBACK=false`.
7. Deploy and test:
   - dashboard shows Stripe mode banner
   - activating pass redirects to Stripe Checkout
   - successful payment returns to `/[locale]/dashboard?billing=success...`

## Firestore Collections Written by Billing

1. `subscriptions/{uid}`
2. `billingCheckoutSessions/{sessionId}`
3. `billingPayments/{autoId}`
4. `billingWebhookEvents/{eventId}`

## Verification Endpoints

1. `GET /api/billing/config`
   - returns runtime mode (`manual` or `stripe`)
2. `POST /api/billing/checkout`
   - starts checkout (Stripe mode) or manual activation (fallback mode)
