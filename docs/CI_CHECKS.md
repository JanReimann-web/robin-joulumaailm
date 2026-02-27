# CI Checks

GitHub Actions workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

## What CI Runs

`quality` job:

1. `npm ci`
2. `npm run ci:checks`
   - lint
   - typecheck
   - unit tests
   - production build

`emulator-tests` job:

1. `npm ci`
2. `npm run test:security`
3. `npm run test:e2e`

## Local Pre-Push Command

```bash
npm run ci:checks:full
```

## Notes

1. Emulator tests run against `demo-kingid-tests`.
2. CI injects dummy public Firebase env values needed for build-time checks.
3. Stripe keys are not required for current CI scope.
