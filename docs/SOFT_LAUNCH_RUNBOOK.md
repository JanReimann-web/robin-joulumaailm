# Soft Launch Runbook

Goal: validate production behavior with a small pilot group before public traffic.

## Entry Criteria

1. CI green on `main`
2. Security and e2e tests passing
3. Firebase rules published in production project
4. Required environment variables set in Vercel

## Pilot Scope

1. 5-20 hosts
2. At least 3 event types used in real scenarios
3. Mobile and desktop usage both covered

## Test Scenarios

1. Create account (Google and email/password)
2. Create list with unique slug
3. Add gifts + media
4. Add story entries
5. Add wheel entries with text/audio answer
6. Reserve gifts as guest from public page
7. Verify no duplicate reservation in concurrent attempts
8. Verify trial state and pass activation UI

## Metrics to Track

1. List creation success rate
2. Reservation success/failure rate
3. Frontend errors in browser console reports
4. API error logs (`/api/billing/*`, `/api/cron/*`)

## Exit Criteria

1. No critical blockers from pilot users
2. No unresolved P1 incidents for 7 consecutive days
3. Launch checklist reviewed and signed off
