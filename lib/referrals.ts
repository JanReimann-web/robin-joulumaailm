export const REFERRAL_CODE_DISCOUNT_PERCENT = 20
export const REFERRAL_REWARD_CREDIT_PERCENT = 10
export const REFERRAL_MAX_ACTIVE_CODES = 3
export const REFERRAL_MAX_REWARD_CREDITS_PER_PURCHASE = 3
export const REFERRAL_CODE_LENGTH = 8

export const REFERRAL_CODE_STATUSES = [
  'active',
  'reserved',
  'redeemed',
  'revoked',
] as const

export type ReferralCodeStatus = (typeof REFERRAL_CODE_STATUSES)[number]

export type ReferralCodeSummary = {
  id: string
  code: string
  ownerUserId: string
  status: ReferralCodeStatus
  discountPercent: number
  createdAt: number | null
  updatedAt: number | null
  reservedAt: number | null
  reservedByUserId: string | null
  reservedListId: string | null
  reservedCheckoutSessionId: string | null
  redeemedAt: number | null
  redeemedByUserId: string | null
  redeemedListId: string | null
}

export type ReferralDashboardSummary = {
  isEligible: boolean
  isComplimentaryAccount: boolean
  activeCodeCount: number
  maxActiveCodes: number
  canGenerate: boolean
  pendingRewardCredits: number
  nextRewardDiscountPercent: number
  totalRedeemedCodesAsOwner: number
  totalSuccessfulPaidPurchases: number
  codes: ReferralCodeSummary[]
}

const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const normalizeReferralCode = (value: string) => {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, REFERRAL_CODE_LENGTH)
}

export const formatReferralCode = (normalizedCode: string) => {
  const compact = normalizeReferralCode(normalizedCode)
  if (compact.length <= 4) {
    return compact
  }

  return `${compact.slice(0, 4)}-${compact.slice(4)}`
}

export const createReferralCode = () => {
  let nextCode = ''

  for (let index = 0; index < REFERRAL_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * REFERRAL_ALPHABET.length)
    nextCode += REFERRAL_ALPHABET[randomIndex]
  }

  return formatReferralCode(nextCode)
}

export const getRewardDiscountPercentFromCredits = (creditCount: number) => {
  const normalizedCredits = Number.isFinite(creditCount)
    ? Math.max(0, Math.floor(creditCount))
    : 0

  return Math.min(
    REFERRAL_MAX_REWARD_CREDITS_PER_PURCHASE,
    normalizedCredits
  ) * REFERRAL_REWARD_CREDIT_PERCENT
}

export const getRewardCreditsToConsume = (creditCount: number) => {
  const normalizedCredits = Number.isFinite(creditCount)
    ? Math.max(0, Math.floor(creditCount))
    : 0

  return Math.min(
    REFERRAL_MAX_REWARD_CREDITS_PER_PURCHASE,
    normalizedCredits
  )
}

export const applyPercentageDiscount = (
  amountCents: number,
  discountPercent: number
) => {
  const normalizedAmount = Math.max(0, Math.round(amountCents))
  const normalizedDiscount = Math.min(100, Math.max(0, Math.round(discountPercent)))

  return Math.max(
    0,
    Math.round((normalizedAmount * (100 - normalizedDiscount)) / 100)
  )
}
