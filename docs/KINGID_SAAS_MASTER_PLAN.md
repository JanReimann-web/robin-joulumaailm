# Kingid SaaS Master Plan v1.1

Date: 2026-02-27  
Owner: jaane  
Execution model: rebuild core as SaaS, keep legacy as reference

## 1. Product Goal

Build a scalable paid gift-list service where event hosts create and share a unique page (for example `gifts.com/marko`) and guests reserve gifts without duplicate bookings.

Primary event types for MVP:

1. Wedding
2. Birthday (adults)
3. Birthday (kids)
4. Baby shower
5. Graduation (school, kindergarten, university)
6. Housewarming
7. Christmas

## 2. MVP Scope

1. Authentication: Google + email/password
2. Multi-tenant data model (per-user ownership and isolation)
3. Unique slug per list
4. Gift list builder in admin dashboard
5. Public list page with transaction-safe reservation
6. Trial period + one-time 90-day pass + auto-expiry/purge workflow
7. SEO-ready marketing pages
8. Multilingual UI
9. Language support: default `en`, secondary `et`
10. UI/UX implementation follows mobile-first responsive approach

## 3. Non-Goals (Phase 2+)

1. Team accounts and advanced roles
2. Full CMS for content editing
3. Advanced analytics suite
4. Affiliate partner system

## 4. Core Technical Direction

1. Frontend: Next.js (App Router) + TypeScript
2. Backend services: Firebase Auth + Firestore + Storage + Cloud Functions
3. Billing: Stripe one-time Checkout + webhooks
4. Security: strict Firestore/Storage rules, server-side writes for critical flows
5. Reliability: transaction-based reservation and slug claim

## 5. Milestones

1. M1 (2026-03-08): secure foundation done
2. M2 (2026-03-22): list creation + slug + templates done
3. M3 (2026-03-29): public list + duplicate prevention done
4. M4 (2026-04-12): trial + billing done
5. M5 (2026-04-19): SEO + launch hardening done
6. M6 (2026-04-26): soft launch and public launch

## 6. Execution Checklist

Status legend: `[ ]` not started, `[-]` in progress, `[x]` done

### P0 - Project setup and safety

- [x] P0-01 Create legacy snapshot branch and tag
- [x] P0-02 Save current working tree diff as patch backup
- [x] P0-03 Scaffold clean SaaS base structure
- [x] P0-04 Configure environments (`dev`, `staging`, `prod`)
- [x] P0-05 Configure CI checks (`lint`, `typecheck`, `build`)

### P1 - Auth and security baseline

- [x] P1-01 Integrate Firebase Auth (Google)
- [x] P1-02 Integrate Firebase Auth (email/password)
- [x] P1-03 Implement route guards
- [x] P1-04 Create `users/{uid}` profile document
- [x] P1-05 Implement password reset and email verification
- [x] P1-06 Lock Firestore security rules
- [x] P1-07 Lock Storage security rules
- [x] P1-08 Add security regression tests

### P2 - Multi-tenant model and builder

- [x] P2-01 Define collections: `users`, `lists`, `listItems`, `slugClaims`, `subscriptions`
- [x] P2-02 Build list creation wizard (event type + template + slug)
- [x] P2-03 Implement server transaction for slug claim
- [x] P2-04 Build dashboard CRUD for gift items
- [x] P2-05 Implement media upload with limits and validation
- [x] P2-06 Add story timeline module (title + text + image/video)
- [x] P2-07 Add wheel module (questions + reveal answer text/audio)

### P3 - Public flow and reservations

- [x] P3-01 Implement public route `/{slug}`
- [x] P3-02 Generate dynamic metadata for public pages
- [x] P3-03 Implement transaction-safe reservation flow
- [x] P3-04 Implement release/cancel reservation flow
- [x] P3-05 Add race-condition test for duplicate booking prevention

### P4 - Monetization and lifecycle

- [x] P4-01 Add trial logic (`trialEndsAt`, `status`)
- [x] P4-02 Implement plan gating
- [-] P4-03 Create Stripe plans + checkout flow
- [-] P4-04 Implement webhook state sync with idempotency
- [x] P4-05 Implement scheduled archive/delete for expired trials

### P5 - SEO and marketing

- [x] P5-01 Build marketing landing page
- [x] P5-02 Build event-specific pages
- [x] P5-03 Add `sitemap.ts`
- [x] P5-04 Add `robots.ts`
- [x] P5-05 Add structured data (`Organization`, `WebSite`)
- [x] P5-06 Ensure canonical and OG tags

### P6 - Quality and launch

- [x] P6-01 Add unit tests for validators and core business logic
- [x] P6-02 Add E2E happy-path test
- [x] P6-03 Add E2E payment/trial expiry test
- [-] P6-04 Add error tracking and alerting
- [-] P6-05 Configure Firebase/GCP budget alerts
- [ ] P6-06 Soft launch with pilot users
- [ ] P6-07 Public launch

## 7. Internationalization (MVP)

1. Locale routes use prefix: `/en/...`, `/et/...`
2. Default locale is English (`en`)
3. Locale switcher in primary navigation
4. Fallback locale is English
5. Translation keys are centralized and type-safe
6. MVP coverage:
   - Marketing pages
   - Auth screens
   - Dashboard core labels and actions
   - Public list page and reservation flow

## 8. Definition of Done (MVP)

1. User can sign up, create list, choose template, claim slug, and share URL
2. Guests can reserve gifts without duplicate booking
3. Trial and paid package flow works end-to-end
4. Data access is tenant-safe by rules and server validations
5. English and Estonian flows are both usable in production
6. Technical SEO baseline is complete
7. Core user flows are usable on mobile-first layouts (320px+), tablet, and desktop

## 9. Progress Log Template

Copy this block for daily updates:

```text
Date:
Done:
In progress:
Blockers:
Next:
Decision needed:
```
