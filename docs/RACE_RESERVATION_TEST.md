# Race Reservation Test

This script validates that concurrent reservations on the same gift item do not produce duplicate successful reservations.

## Prerequisites

1. A public list exists.
2. The selected item status is `available`.
3. Firestore rules are published from `firestore.rules`.

## Run

```bash
node scripts/race-reservation.mjs --listId <LIST_ID> --itemId <ITEM_ID> --attempts 10
```

Optional:

```bash
node scripts/race-reservation.mjs --listId <LIST_ID> --itemId <ITEM_ID> --attempts 10 --guestPrefix bot
```

## Expected Result

1. Exactly one attempt succeeds.
2. Remaining attempts fail with `item_unavailable`.
3. If more than one attempt succeeds, the script exits with code `2`.
