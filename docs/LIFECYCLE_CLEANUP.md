# List Lifecycle Cleanup (One-Time 90-Day Model)

## Policy

1. New list gets a 14-day trial (`trialEndsAt`).
2. After activation, list access is extended to 90 days (`paidAccessEndsAt`).
3. `purgeAt` is set to the access end timestamp.
4. When `purgeAt <= now`, list data should be deleted.

## Cleanup Script

Dry-run:

```bash
npm run purge:expired:dry
```

Delete:

```bash
npm run purge:expired
```

## Required Environment

1. Google credentials with Firestore + Storage admin access:
   - `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`
2. Optional explicit bucket:
   - `FIREBASE_STORAGE_BUCKET=your-project.appspot.com`
3. Optional batch size:
   - `PURGE_BATCH_SIZE=25`

## Deployed Automation (Vercel Cron)

1. Endpoint: `GET /api/cron/purge-expired`
2. Protection: set `CRON_SECRET` in Vercel environment variables
3. Schedule is configured in `vercel.json`: `0 3 * * *` (daily at 03:00 UTC)
4. Manual dry-run call:
   - `GET /api/cron/purge-expired?dryRun=1`
5. Optional batch size override:
   - `GET /api/cron/purge-expired?limit=50`

## What The Script Deletes

1. `lists/{listId}`
2. `lists/{listId}/items/*`
3. `lists/{listId}/reservations/*`
4. `slugClaims` references for the list
5. Storage files under `lists/{listId}/`

## Scheduling Recommendation

Run once per day (for example 03:00 UTC) via Cloud Scheduler, GitHub Actions cron, or your server cron.
