export const ACCOUNT_ENTITLEMENT_TIERS = ['complimentary_unlimited'] as const
export type AccountEntitlementTier = (typeof ACCOUNT_ENTITLEMENT_TIERS)[number]

export const ACCOUNT_ENTITLEMENT_STATUSES = ['active', 'revoked'] as const
export type AccountEntitlementStatus = (typeof ACCOUNT_ENTITLEMENT_STATUSES)[number]

export interface AccountEntitlement {
  userId: string
  tier: AccountEntitlementTier
  status: AccountEntitlementStatus
  grantedBy: string | null
  note: string | null
  expiresAt: number | null
  createdAt: number | null
  updatedAt: number | null
}

export const hasActiveComplimentaryEntitlement = (
  entitlement: Pick<AccountEntitlement, 'tier' | 'status' | 'expiresAt'> | null,
  now = Date.now()
) => {
  if (!entitlement) {
    return false
  }

  if (
    entitlement.tier !== 'complimentary_unlimited'
    || entitlement.status !== 'active'
  ) {
    return false
  }

  if (typeof entitlement.expiresAt === 'number' && entitlement.expiresAt <= now) {
    return false
  }

  return true
}
