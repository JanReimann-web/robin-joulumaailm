export const TRIAL_DAYS = 14
export const PAID_ACCESS_DAYS = 90

export type ListAccessStatus = 'trial' | 'active' | 'expired'

export const addDays = (base: Date, days: number) => {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

export const resolveListAccessStatus = (params: {
  trialEndsAt: number | null
  paidAccessEndsAt: number | null
  now?: number
}): ListAccessStatus => {
  const now = params.now ?? Date.now()

  if (params.paidAccessEndsAt && params.paidAccessEndsAt > now) {
    return 'active'
  }

  if (params.trialEndsAt && params.trialEndsAt > now) {
    return 'trial'
  }

  return 'expired'
}

export const hasPublishedListAccess = (
  paidAccessEndsAt: number | null,
  now = Date.now()
) => {
  return Boolean(paidAccessEndsAt && paidAccessEndsAt > now)
}

export const getRemainingDays = (
  timestampMs: number | null,
  now = Date.now()
) => {
  if (!timestampMs) {
    return 0
  }

  const diff = timestampMs - now
  if (diff <= 0) {
    return 0
  }

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
