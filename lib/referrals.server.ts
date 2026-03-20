import 'server-only'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { hasServerSideComplimentaryEntitlement } from '@/lib/account-entitlements.server'
import { adminDb } from '@/lib/firebase/admin'
import {
  countReferralCodesTowardActiveLimit,
  createReferralCode,
  formatReferralCode,
  getRewardCreditsToConsume,
  getRewardDiscountPercentFromCredits,
  normalizeReferralCode,
  REFERRAL_CODE_DISCOUNT_PERCENT,
  REFERRAL_MAX_ACTIVE_CODES,
  ReferralCodeSummary,
  ReferralDashboardSummary,
  ReferralCodeStatus,
} from '@/lib/referrals'

export type ReferralCheckoutDiscountType = 'none' | 'referral' | 'reward'

type ReferralAccountRecord = {
  userId: string
  pendingRewardCredits: number
  totalRewardCreditsEarned: number
  totalRewardCreditsConsumed: number
  totalSuccessfulPaidPurchases: number
  totalReferralPurchasesAsBuyer: number
  totalRedeemedCodesAsOwner: number
  createdAt: number | null
  updatedAt: number | null
}

export type PreparedCheckoutDiscount = {
  discountType: ReferralCheckoutDiscountType
  discountPercent: number
  rewardCreditsToConsume: number
  referralCodeId: string | null
  referralCode: string | null
  referralOwnerUserId: string | null
}

type ReferralCodeValidationResult = {
  codeId: string
  code: string
  ownerUserId: string
  discountPercent: number
}

const toMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  return null
}

const toCount = (value: unknown) => {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0
}

const mapReferralCodeDoc = (
  id: string,
  data: Record<string, unknown>
): ReferralCodeSummary => ({
  id,
  code: typeof data.code === 'string' ? data.code : id,
  ownerUserId: typeof data.ownerUserId === 'string' ? data.ownerUserId : '',
  status: (typeof data.status === 'string'
    ? data.status
    : 'active') as ReferralCodeStatus,
  discountPercent: typeof data.discountPercent === 'number'
    ? data.discountPercent
    : REFERRAL_CODE_DISCOUNT_PERCENT,
  createdAt: toMillis(data.createdAt),
  updatedAt: toMillis(data.updatedAt),
  reservedAt: toMillis(data.reservedAt),
  reservedByUserId: typeof data.reservedByUserId === 'string' ? data.reservedByUserId : null,
  reservedListId: typeof data.reservedListId === 'string' ? data.reservedListId : null,
  reservedCheckoutSessionId: typeof data.reservedCheckoutSessionId === 'string' ? data.reservedCheckoutSessionId : null,
  redeemedAt: toMillis(data.redeemedAt),
  redeemedByUserId: typeof data.redeemedByUserId === 'string' ? data.redeemedByUserId : null,
  redeemedListId: typeof data.redeemedListId === 'string' ? data.redeemedListId : null,
})

const mapReferralAccountDoc = (
  userId: string,
  data?: Record<string, unknown>
): ReferralAccountRecord => ({
  userId,
  pendingRewardCredits: toCount(data?.pendingRewardCredits),
  totalRewardCreditsEarned: toCount(data?.totalRewardCreditsEarned),
  totalRewardCreditsConsumed: toCount(data?.totalRewardCreditsConsumed),
  totalSuccessfulPaidPurchases: toCount(data?.totalSuccessfulPaidPurchases),
  totalReferralPurchasesAsBuyer: toCount(data?.totalReferralPurchasesAsBuyer),
  totalRedeemedCodesAsOwner: toCount(data?.totalRedeemedCodesAsOwner),
  createdAt: toMillis(data?.createdAt),
  updatedAt: toMillis(data?.updatedAt),
})

const referralCodesCollection = adminDb.collection('referralCodes')
const referralAccountsCollection = adminDb.collection('referralAccounts')
const billingPaymentsCollection = adminDb.collection('billingPayments')

const hasSuccessfulPaidPurchase = async (userId: string) => {
  const snapshot = await billingPaymentsCollection
    .where('ownerId', '==', userId)
    .limit(1)
    .get()

  return !snapshot.empty
}

const getReferralAccountRecord = async (userId: string) => {
  const snapshot = await referralAccountsCollection.doc(userId).get()
  return mapReferralAccountDoc(
    userId,
    snapshot.exists ? snapshot.data() as Record<string, unknown> : undefined
  )
}

const listVisibleReferralCodesForUser = async (userId: string) => {
  const snapshot = await referralCodesCollection
    .where('ownerUserId', '==', userId)
    .where('status', 'in', ['active', 'reserved', 'redeemed'])
    .get()

  return snapshot.docs
    .map((entry) => mapReferralCodeDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0))
}

export const getReferralDashboardSummary = async (
  userId: string
): Promise<ReferralDashboardSummary> => {
  const [isComplimentaryAccount, referralAccount, codes, eligibleFromPayments] = await Promise.all([
    hasServerSideComplimentaryEntitlement(userId),
    getReferralAccountRecord(userId),
    listVisibleReferralCodesForUser(userId),
    hasSuccessfulPaidPurchase(userId),
  ])
  const activeCodeCount = countReferralCodesTowardActiveLimit(codes)

  const totalSuccessfulPaidPurchases = Math.max(
    referralAccount.totalSuccessfulPaidPurchases,
    eligibleFromPayments ? 1 : 0
  )
  const isEligible = !isComplimentaryAccount && totalSuccessfulPaidPurchases > 0

  return {
    isEligible,
    isComplimentaryAccount,
    activeCodeCount,
    maxActiveCodes: REFERRAL_MAX_ACTIVE_CODES,
    canGenerate: isEligible && activeCodeCount < REFERRAL_MAX_ACTIVE_CODES,
    pendingRewardCredits: referralAccount.pendingRewardCredits,
    nextRewardDiscountPercent: getRewardDiscountPercentFromCredits(
      referralAccount.pendingRewardCredits
    ),
    totalRedeemedCodesAsOwner: referralAccount.totalRedeemedCodesAsOwner,
    totalSuccessfulPaidPurchases,
    codes,
  }
}

export class ReferralError extends Error {
  code:
    | 'referral_locked'
    | 'referral_max_active_reached'
    | 'referral_invalid'
    | 'self_referral_not_allowed'
    | 'referral_already_used'
    | 'referral_not_allowed'
    | 'referral_reservation_failed'

  constructor(
    code:
      | 'referral_locked'
      | 'referral_max_active_reached'
      | 'referral_invalid'
      | 'self_referral_not_allowed'
      | 'referral_already_used'
      | 'referral_not_allowed'
      | 'referral_reservation_failed'
  ) {
    super(code)
    this.code = code
  }
}

export const generateReferralCodeForUser = async (userId: string) => {
  const summary = await getReferralDashboardSummary(userId)
  if (!summary.isEligible) {
    throw new ReferralError('referral_locked')
  }

  if (summary.activeCodeCount >= REFERRAL_MAX_ACTIVE_CODES) {
    throw new ReferralError('referral_max_active_reached')
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = createReferralCode()
    try {
      await referralCodesCollection.doc(code).create({
        code,
        ownerUserId: userId,
        status: 'active',
        discountPercent: REFERRAL_CODE_DISCOUNT_PERCENT,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        reservedAt: null,
        reservedByUserId: null,
        reservedListId: null,
        reservedCheckoutSessionId: null,
        redeemedAt: null,
        redeemedByUserId: null,
        redeemedListId: null,
      })

      return code
    } catch {
      continue
    }
  }

  throw new ReferralError('referral_reservation_failed')
}

const validateReferralCodeInternal = async (params: {
  buyerUserId: string
  code: string
}) : Promise<ReferralCodeValidationResult> => {
  const normalizedCode = formatReferralCode(normalizeReferralCode(params.code))
  if (!normalizedCode || normalizedCode.length < 8) {
    throw new ReferralError('referral_invalid')
  }

  const [isComplimentaryAccount, referralAccount, codeSnapshot] = await Promise.all([
    hasServerSideComplimentaryEntitlement(params.buyerUserId),
    getReferralAccountRecord(params.buyerUserId),
    referralCodesCollection.doc(normalizedCode).get(),
  ])

  if (isComplimentaryAccount) {
    throw new ReferralError('referral_not_allowed')
  }

  if (referralAccount.totalReferralPurchasesAsBuyer > 0) {
    throw new ReferralError('referral_already_used')
  }

  if (!codeSnapshot.exists) {
    throw new ReferralError('referral_invalid')
  }

  const codeData = codeSnapshot.data() as Record<string, unknown>
  const status = typeof codeData.status === 'string' ? codeData.status : 'active'
  const ownerUserId = typeof codeData.ownerUserId === 'string' ? codeData.ownerUserId : ''

  if (!ownerUserId || ownerUserId === params.buyerUserId) {
    throw new ReferralError('self_referral_not_allowed')
  }

  if (status !== 'active') {
    throw new ReferralError('referral_invalid')
  }

  return {
    codeId: codeSnapshot.id,
    code: normalizedCode,
    ownerUserId,
    discountPercent: typeof codeData.discountPercent === 'number'
      ? codeData.discountPercent
      : REFERRAL_CODE_DISCOUNT_PERCENT,
  }
}

export const validateReferralCodeForBuyer = async (params: {
  buyerUserId: string
  code: string
}) => {
  return validateReferralCodeInternal(params)
}

export const prepareCheckoutDiscount = async (params: {
  buyerUserId: string
  referralCode?: string | null
}) : Promise<PreparedCheckoutDiscount> => {
  const normalizedInput = params.referralCode?.trim() ?? ''
  if (normalizedInput.length > 0) {
    const code = await validateReferralCodeInternal({
      buyerUserId: params.buyerUserId,
      code: normalizedInput,
    })

    return {
      discountType: 'referral',
      discountPercent: code.discountPercent,
      rewardCreditsToConsume: 0,
      referralCodeId: code.codeId,
      referralCode: code.code,
      referralOwnerUserId: code.ownerUserId,
    }
  }

  const account = await getReferralAccountRecord(params.buyerUserId)
  const rewardCreditsToConsume = getRewardCreditsToConsume(
    account.pendingRewardCredits
  )

  if (rewardCreditsToConsume <= 0) {
    return {
      discountType: 'none',
      discountPercent: 0,
      rewardCreditsToConsume: 0,
      referralCodeId: null,
      referralCode: null,
      referralOwnerUserId: null,
    }
  }

  return {
    discountType: 'reward',
    discountPercent: getRewardDiscountPercentFromCredits(account.pendingRewardCredits),
    rewardCreditsToConsume,
    referralCodeId: null,
    referralCode: null,
    referralOwnerUserId: null,
  }
}

export const reserveReferralCodeForCheckout = async (params: {
  codeId: string
  buyerUserId: string
  listId: string
  checkoutSessionId: string
}) => {
  const codeRef = referralCodesCollection.doc(params.codeId)

  try {
    await adminDb.runTransaction(async (transaction) => {
      const codeSnapshot = await transaction.get(codeRef)
      if (!codeSnapshot.exists) {
        throw new ReferralError('referral_invalid')
      }

      const codeData = codeSnapshot.data() as Record<string, unknown>
      const status = typeof codeData.status === 'string' ? codeData.status : 'active'
      const ownerUserId = typeof codeData.ownerUserId === 'string' ? codeData.ownerUserId : ''

      if (!ownerUserId || ownerUserId === params.buyerUserId) {
        throw new ReferralError('self_referral_not_allowed')
      }

      if (status !== 'active') {
        throw new ReferralError('referral_invalid')
      }

      transaction.update(codeRef, {
        status: 'reserved',
        reservedAt: FieldValue.serverTimestamp(),
        reservedByUserId: params.buyerUserId,
        reservedListId: params.listId,
        reservedCheckoutSessionId: params.checkoutSessionId,
        updatedAt: FieldValue.serverTimestamp(),
      })
    })
  } catch (error) {
    if (error instanceof ReferralError) {
      throw error
    }

    throw new ReferralError('referral_reservation_failed')
  }
}

export const releaseReferralCodeReservation = async (params: {
  codeId: string
  checkoutSessionId: string
}) => {
  const codeRef = referralCodesCollection.doc(params.codeId)

  await adminDb.runTransaction(async (transaction) => {
    const codeSnapshot = await transaction.get(codeRef)
    if (!codeSnapshot.exists) {
      return
    }

    const codeData = codeSnapshot.data() as Record<string, unknown>
    const status = typeof codeData.status === 'string' ? codeData.status : 'active'
    const reservedCheckoutSessionId = typeof codeData.reservedCheckoutSessionId === 'string'
      ? codeData.reservedCheckoutSessionId
      : ''

    if (status !== 'reserved' || reservedCheckoutSessionId !== params.checkoutSessionId) {
      return
    }

    transaction.update(codeRef, {
      status: 'active',
      reservedAt: null,
      reservedByUserId: null,
      reservedListId: null,
      reservedCheckoutSessionId: null,
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
}

export const getReferralAccountRef = (userId: string) => {
  return referralAccountsCollection.doc(userId)
}

export const getReferralCodeRef = (codeId: string) => {
  return referralCodesCollection.doc(codeId)
}
