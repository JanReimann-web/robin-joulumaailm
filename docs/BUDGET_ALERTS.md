# Firebase and GCP Budget Alerts

Configure budgets in Google Cloud Billing for your Firebase project(s).

## 1. Create Budgets

For each environment project (`staging`, `production`):

1. Open `Google Cloud Console -> Billing -> Budgets & alerts`
2. Create a monthly budget
3. Start with a conservative threshold (example values):
   - 50% forecast
   - 80% actual
   - 100% actual
   - 120% actual (critical overspend)

## 2. Notification Recipients

1. Primary owner email
2. Backup owner email
3. Shared operations mailbox

## 3. Cost Drivers to Watch

1. Firestore reads/writes (high list traffic)
2. Storage usage + egress (media uploads)
3. Cloud Functions/Serverless invocations (billing + cron)
4. Network egress from public media delivery

## 4. Cost-Control Defaults

1. Keep media size limits enforced (`30 MB`)
2. Keep lifecycle purge active daily
3. Avoid storing unused list data after expiry
4. Review top SKUs weekly during launch month
