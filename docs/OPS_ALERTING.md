# Ops Alerting Plan

This document defines the minimum monitoring baseline before public launch.

## 1. Error Monitoring Targets

1. Auth failures (`/dashboard` login and token issues)
2. Billing API failures (`/api/billing/*`)
3. Cron purge failures (`/api/cron/purge-expired`)
4. Firestore/Storage permission errors on core user flows

## 2. Recommended Channels

1. Vercel deployment notifications to email
2. Vercel runtime error notifications (project alerts)
3. Firebase/GCP log-based alert for repeated API 5xx
4. Optional: Sentry for client + server exception grouping

## 3. Minimum Alert Rules

1. Alert if any deployment fails on `main`
2. Alert if billing webhook returns non-2xx in production
3. Alert if cron purge endpoint fails for 2 consecutive runs
4. Alert if API error rate > 5% for 5 minutes

## 4. Operational Response

1. Assign one owner for each alert channel
2. Define response SLA:
   - P1 (checkout/webhook down): 30 minutes
   - P2 (dashboard/public list issues): 2 hours
3. Log incident start/end and root cause in release notes
