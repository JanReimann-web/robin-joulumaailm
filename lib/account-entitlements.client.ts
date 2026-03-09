import { FirebaseError } from 'firebase/app'
import { Timestamp, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  ACCOUNT_ENTITLEMENT_STATUSES,
  ACCOUNT_ENTITLEMENT_TIERS,
  AccountEntitlement,
  AccountEntitlementStatus,
  AccountEntitlementTier,
} from '@/lib/account-entitlements'

const toMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  return null
}

const toTier = (value: unknown): AccountEntitlementTier | null => {
  return typeof value === 'string'
    && ACCOUNT_ENTITLEMENT_TIERS.includes(value as AccountEntitlementTier)
    ? value as AccountEntitlementTier
    : null
}

const toStatus = (value: unknown): AccountEntitlementStatus => {
  return typeof value === 'string'
    && ACCOUNT_ENTITLEMENT_STATUSES.includes(value as AccountEntitlementStatus)
    ? value as AccountEntitlementStatus
    : 'revoked'
}

const mapEntitlementDoc = (
  userId: string,
  data: Record<string, unknown>
): AccountEntitlement | null => {
  const tier = toTier(data.tier)
  if (!tier) {
    return null
  }

  return {
    userId,
    tier,
    status: toStatus(data.status),
    grantedBy: typeof data.grantedBy === 'string' ? data.grantedBy : null,
    note: typeof data.note === 'string' ? data.note : null,
    expiresAt: toMillis(data.expiresAt),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

export const subscribeToAccountEntitlement = (
  userId: string,
  onChange: (entitlement: AccountEntitlement | null) => void,
  onError: (error: Error) => void
) => {
  const entitlementRef = doc(db, 'accountEntitlements', userId)

  return onSnapshot(
    entitlementRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null)
        return
      }

      onChange(mapEntitlementDoc(userId, snapshot.data()) ?? null)
    },
    (rawError) => {
      if (rawError instanceof FirebaseError) {
        onError(rawError)
        return
      }

      onError(new Error('failed_to_subscribe_account_entitlement'))
    }
  )
}
