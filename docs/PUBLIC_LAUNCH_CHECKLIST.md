# Public Launch Checklist

## Product and UX

1. Mobile-first layouts validated on 320px, 375px, 768px, desktop
2. English and Estonian flows validated end-to-end
3. Public list page, story module, wheel module verified on real devices

## Security and Data

1. Latest `firestore.rules` published
2. Latest `storage.rules` published
3. Auth providers enabled and authorized domains configured
4. Scheduled purge cron enabled and tested with `dryRun=1`

## Reliability

1. `npm run ci:checks:full` passes on `main`
2. Race-condition reservation script validated on production-like data
3. Rollback plan documented (previous stable deployment id)

## Billing

1. Manual fallback mode decision confirmed (`true` or `false`)
2. If Stripe enabled: webhook and checkout smoke-tested

## Operations

1. Alert recipients confirmed
2. Budget alerts configured
3. Incident owner roster assigned

## Communication

1. Support contact shown in footer/help page
2. Privacy and terms links published
3. Launch announcement content approved
