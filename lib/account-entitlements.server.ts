import 'server-only'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import {
  ACCOUNT_ENTITLEMENT_STATUSES,
  ACCOUNT_ENTITLEMENT_TIERS,
  AccountEntitlement,
  AccountEntitlementStatus,
  AccountEntitlementTier,
  hasActiveComplimentaryEntitlement,
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

export const getAccountEntitlement = async (
  userId: string
): Promise<AccountEntitlement | null> => {
  if (!userId) {
    return null
  }

  const entitlementSnap = await adminDb
    .collection('accountEntitlements')
    .doc(userId)
    .get()

  if (!entitlementSnap.exists) {
    return null
  }

  const data = entitlementSnap.data() as Record<string, unknown>
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

export const hasServerSideComplimentaryEntitlement = async (userId: string) => {
  const entitlement = await getAccountEntitlement(userId)
  return hasActiveComplimentaryEntitlement(entitlement)
}
