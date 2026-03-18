import 'server-only'
import Stripe from 'stripe'
import { hasServerSideComplimentaryEntitlement } from '@/lib/account-entitlements.server'
import { BillingMarketAvailability } from '@/lib/billing/markets'
import {
  BillingChargeMode,
  BillingCurrency,
  isBillingPlanDowngrade,
  isBillingPlanId,
  getBillingPlanPriceCents,
  resolveBillingChargeQuote,
  toStripeCurrencyCode,
} from '@/lib/billing/pricing'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { addDays, getListPurgeDate, PAID_ACCESS_DAYS } from '@/lib/lists/access'
import { adminDb } from '@/lib/firebase/admin'
import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore'
import { BillingCheckoutResult } from '@/lib/billing/types'
import {
  BILLING_PLAN_DEFINITIONS,
  BillingPlanId,
  getMediaUsageIssue,
  isBillingPlanEligible,
  resolveRequiredBillingPlanId,
} from '@/lib/lists/plans'
import { computeListMediaUsageSummary } from '@/lib/lists/media-usage.server'
import {
  applyPercentageDiscount,
} from '@/lib/referrals'
import {
  getReferralAccountRef,
  getReferralCodeRef,
  prepareCheckoutDiscount,
  PreparedCheckoutDiscount,
  ReferralError,
  releaseReferralCodeReservation,
  reserveReferralCodeForCheckout,
} from '@/lib/referrals.server'
import { getSiteUrl } from '@/lib/site/url'

const SITE_URL = getSiteUrl()
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ''
const STRIPE_PRICE_ID_90D = process.env.STRIPE_PRICE_ID_90D ?? ''
const STRIPE_PRICE_ID_90D_USD = process.env.STRIPE_PRICE_ID_90D_USD ?? ''
const STRIPE_PRICE_ID_BASE_90D_EUR = process.env.STRIPE_PRICE_ID_BASE_90D_EUR
  ?? process.env.STRIPE_PRICE_ID_BASE_90D
  ?? STRIPE_PRICE_ID_90D
const STRIPE_PRICE_ID_PREMIUM_90D_EUR = process.env.STRIPE_PRICE_ID_PREMIUM_90D_EUR
  ?? process.env.STRIPE_PRICE_ID_PREMIUM_90D
  ?? STRIPE_PRICE_ID_90D
const STRIPE_PRICE_ID_PLATINUM_90D_EUR = process.env.STRIPE_PRICE_ID_PLATINUM_90D_EUR
  ?? process.env.STRIPE_PRICE_ID_PLATINUM_90D
  ?? STRIPE_PRICE_ID_90D
const STRIPE_PRICE_ID_BASE_90D_USD = process.env.STRIPE_PRICE_ID_BASE_90D_USD ?? STRIPE_PRICE_ID_90D_USD
const STRIPE_PRICE_ID_PREMIUM_90D_USD = process.env.STRIPE_PRICE_ID_PREMIUM_90D_USD ?? STRIPE_PRICE_ID_90D_USD
const STRIPE_PRICE_ID_PLATINUM_90D_USD = process.env.STRIPE_PRICE_ID_PLATINUM_90D_USD ?? STRIPE_PRICE_ID_90D_USD
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''
const MANUAL_FALLBACK_ENABLED = (process.env.BILLING_MANUAL_FALLBACK ?? 'true') === 'true'
const STRIPE_TAX_ENABLED = (process.env.STRIPE_TAX_ENABLED ?? 'false') === 'true'
const SHOULD_ENFORCE_MARKET_HEADERS = process.env.NODE_ENV === 'production'

const stripeClient = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null

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

const resolveLocale = (locale: string | undefined) => {
  if (!locale) {
    return defaultLocale
  }

  return isLocale(locale) ? locale : defaultLocale
}

const resolveStripePriceId = (
  planId: BillingPlanId,
  currency: BillingCurrency
) => {
  if (planId === 'base') {
    return currency === 'EUR' ? STRIPE_PRICE_ID_BASE_90D_EUR : STRIPE_PRICE_ID_BASE_90D_USD
  }

  if (planId === 'premium') {
    return currency === 'EUR' ? STRIPE_PRICE_ID_PREMIUM_90D_EUR : STRIPE_PRICE_ID_PREMIUM_90D_USD
  }

  return currency === 'EUR' ? STRIPE_PRICE_ID_PLATINUM_90D_EUR : STRIPE_PRICE_ID_PLATINUM_90D_USD
}

const resolvePlanDisplayName = (planId: BillingPlanId) => {
  if (planId === 'base') {
    return 'Base'
  }

  if (planId === 'premium') {
    return 'Premium'
  }

  return 'Platinum'
}

const validateListOwnership = async (listId: string, ownerId: string) => {
  const listRef = adminDb.collection('lists').doc(listId)
  const listSnapshot = await listRef.get()

  if (!listSnapshot.exists) {
    throw new Error('list_not_found')
  }

  const payload = listSnapshot.data() as Record<string, unknown>
  if (payload.ownerId !== ownerId) {
    throw new Error('forbidden')
  }

  return {
    listRef,
    listData: payload,
  }
}

type StripeCheckoutGrantPayload = {
  listId: string
  ownerId: string
  planId: BillingPlanId
  currency: BillingCurrency
  amountCents: number
  chargeAmountCents: number
  catalogAmountCents: number
  pricingMode: BillingChargeMode
  upgradeFromPlanId: BillingPlanId | null
  discount: PreparedCheckoutDiscount
}

const parseStripeCheckoutGrantPayload = (
  session: Stripe.Checkout.Session
): StripeCheckoutGrantPayload => {
  const listId = session.metadata?.listId?.trim()
  const ownerId = session.metadata?.ownerId?.trim()
  const planId = session.metadata?.plan?.trim()
  const pricingMode = session.metadata?.pricingMode === 'upgrade' ? 'upgrade' : 'full'
  const discountType = session.metadata?.discountType
  const discountPercent = Number.parseInt(session.metadata?.discountPercent ?? '0', 10)
  const rewardCreditsToConsume = Number.parseInt(session.metadata?.rewardCreditsToConsume ?? '0', 10)
  const referralCodeId = session.metadata?.referralCodeId?.trim() || null
  const referralCode = session.metadata?.referralCode?.trim() || null
  const referralOwnerUserId = session.metadata?.referralOwnerUserId?.trim() || null
  const upgradeFromPlanIdRaw = session.metadata?.upgradeFromPlanId ?? ''
  const upgradeFromPlanId = isBillingPlanId(upgradeFromPlanIdRaw)
    ? upgradeFromPlanIdRaw
    : null
  const chargeAmountCents = Number.parseInt(session.metadata?.chargeAmountCents ?? '0', 10)
  const catalogAmountCents = Number.parseInt(session.metadata?.catalogAmountCents ?? '0', 10)

  if (!listId || !ownerId || !planId || !isBillingPlanId(planId)) {
    throw new Error('missing_metadata')
  }

  const currency = session.currency?.toUpperCase() === 'EUR' ? 'EUR' : 'USD'

  return {
    listId,
    ownerId,
    planId,
    currency,
    amountCents: session.amount_total ?? BILLING_PLAN_DEFINITIONS[planId].priceCents,
    chargeAmountCents: Number.isFinite(chargeAmountCents) && chargeAmountCents > 0
      ? chargeAmountCents
      : BILLING_PLAN_DEFINITIONS[planId].priceCents,
    catalogAmountCents: Number.isFinite(catalogAmountCents) && catalogAmountCents > 0
      ? catalogAmountCents
      : getBillingPlanPriceCents(planId, currency),
    pricingMode,
    upgradeFromPlanId,
    discount: {
      discountType: discountType === 'referral' || discountType === 'reward'
        ? discountType
        : 'none',
      discountPercent: Number.isFinite(discountPercent) ? Math.max(0, discountPercent) : 0,
      rewardCreditsToConsume: Number.isFinite(rewardCreditsToConsume)
        ? Math.max(0, rewardCreditsToConsume)
        : 0,
      referralCodeId,
      referralCode,
      referralOwnerUserId,
    },
  }
}

const grantListPass = async (params: {
  listId: string
  ownerId: string
  planId: BillingPlanId
  currency: BillingCurrency
  provider: 'manual' | 'stripe'
  paymentRef: string
  amountCents: number
  chargeAmountCents: number
  catalogAmountCents: number
  pricingMode: BillingChargeMode
  upgradeFromPlanId: BillingPlanId | null
  resetAccessPeriod: boolean
  discount: PreparedCheckoutDiscount
}) => {
  const listRef = adminDb.collection('lists').doc(params.listId)
  const subscriptionRef = adminDb.collection('subscriptions').doc(params.ownerId)
  const paymentRecordRef = adminDb.collection('billingPayments').doc()
  const processedPaymentRef = adminDb
    .collection('billingProcessedPayments')
    .doc(`${params.provider}_${params.paymentRef}`)
  const buyerReferralAccountRef = getReferralAccountRef(params.ownerId)
  const referralCodeRef = params.discount.referralCodeId
    ? getReferralCodeRef(params.discount.referralCodeId)
    : null
  const referralOwnerAccountRef = params.discount.referralOwnerUserId
    ? getReferralAccountRef(params.discount.referralOwnerUserId)
    : null

  await adminDb.runTransaction(async (transaction) => {
    const processedPaymentSnapshot = await transaction.get(processedPaymentRef)
    if (processedPaymentSnapshot.exists) {
      return
    }

    const listSnapshot = await transaction.get(listRef)
    if (!listSnapshot.exists) {
      throw new Error('list_not_found')
    }

    const payload = listSnapshot.data() as Record<string, unknown>
    if (payload.ownerId !== params.ownerId) {
      throw new Error('forbidden')
    }

    const currentPaidAccessEndsAt = toMillis(payload.paidAccessEndsAt)
    const accessBaseDate = !params.resetAccessPeriod
      && currentPaidAccessEndsAt
      && currentPaidAccessEndsAt > Date.now()
      ? new Date(currentPaidAccessEndsAt)
      : new Date()
    const paidAccessEndsAt = Timestamp.fromDate(addDays(accessBaseDate, PAID_ACCESS_DAYS))
    const purgeAt = Timestamp.fromDate(getListPurgeDate(paidAccessEndsAt.toDate()))
    const buyerReferralAccountSnapshot = await transaction.get(buyerReferralAccountRef)
    const buyerReferralData = buyerReferralAccountSnapshot.exists
      ? buyerReferralAccountSnapshot.data() as Record<string, unknown>
      : {}
    const rewardCreditsConsumed = Math.min(
      params.discount.rewardCreditsToConsume,
      toCount(buyerReferralData.pendingRewardCredits)
    )

    if (referralCodeRef) {
      const referralCodeSnapshot = await transaction.get(referralCodeRef)
      if (!referralCodeSnapshot.exists) {
        throw new Error('referral_invalid')
      }

      const referralCodeData = referralCodeSnapshot.data() as Record<string, unknown>
      const status = typeof referralCodeData.status === 'string'
        ? referralCodeData.status
        : 'active'
      const reservedCheckoutSessionId = typeof referralCodeData.reservedCheckoutSessionId === 'string'
        ? referralCodeData.reservedCheckoutSessionId
        : null

      if (status === 'reserved' && reservedCheckoutSessionId !== params.paymentRef) {
        throw new Error('referral_invalid')
      }

      if (status !== 'active' && status !== 'reserved') {
        throw new Error('referral_invalid')
      }

      transaction.update(referralCodeRef, {
        status: 'redeemed',
        redeemedAt: FieldValue.serverTimestamp(),
        redeemedByUserId: params.ownerId,
        redeemedListId: params.listId,
        redeemedPaymentRef: params.paymentRef,
        reservedAt: null,
        reservedByUserId: null,
        reservedListId: null,
        reservedCheckoutSessionId: null,
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    transaction.update(listRef, {
      billingPlanId: params.planId,
      paidAccessEndsAt,
      purgeAt,
      updatedAt: FieldValue.serverTimestamp(),
      billingProvider: params.provider,
      lastPaymentRef: params.paymentRef,
      lastPaymentAt: FieldValue.serverTimestamp(),
    })

    transaction.set(subscriptionRef, {
      userId: params.ownerId,
      billingModel: 'one_time_90d',
      billingPlanId: params.planId,
      status: 'active',
      activeListIds: FieldValue.arrayUnion(params.listId),
      currentPeriodEndsAt: paidAccessEndsAt,
      lastPaymentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    transaction.set(paymentRecordRef, {
      listId: params.listId,
      ownerId: params.ownerId,
      provider: params.provider,
      paymentRef: params.paymentRef,
      billingModel: 'one_time_90d',
      billingPlanId: params.planId,
      amountCents: params.amountCents,
      originalAmountCents: params.chargeAmountCents,
      catalogAmountCents: params.catalogAmountCents,
      currency: params.currency,
      pricingMode: params.pricingMode,
      upgradeFromPlanId: params.upgradeFromPlanId,
      discountType: params.discount.discountType,
      discountPercent: params.discount.discountPercent,
      rewardCreditsConsumed,
      referralCodeId: params.discount.referralCodeId,
      referralCode: params.discount.referralCode,
      referralOwnerUserId: params.discount.referralOwnerUserId,
      paidAccessEndsAt,
      createdAt: FieldValue.serverTimestamp(),
    })

    transaction.set(buyerReferralAccountRef, {
      userId: params.ownerId,
      pendingRewardCredits: Math.max(
        0,
        toCount(buyerReferralData.pendingRewardCredits) - rewardCreditsConsumed
      ),
      totalRewardCreditsEarned: toCount(buyerReferralData.totalRewardCreditsEarned),
      totalRewardCreditsConsumed: toCount(buyerReferralData.totalRewardCreditsConsumed) + rewardCreditsConsumed,
      totalSuccessfulPaidPurchases: toCount(buyerReferralData.totalSuccessfulPaidPurchases) + 1,
      totalReferralPurchasesAsBuyer: toCount(buyerReferralData.totalReferralPurchasesAsBuyer)
        + (params.discount.referralCodeId ? 1 : 0),
      totalRedeemedCodesAsOwner: toCount(buyerReferralData.totalRedeemedCodesAsOwner),
      createdAt: buyerReferralAccountSnapshot.exists
        ? (buyerReferralData.createdAt ?? FieldValue.serverTimestamp())
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    if (referralOwnerAccountRef && params.discount.referralOwnerUserId) {
      const referralOwnerSnapshot = await transaction.get(referralOwnerAccountRef)
      const referralOwnerData = referralOwnerSnapshot.exists
        ? referralOwnerSnapshot.data() as Record<string, unknown>
        : {}

      transaction.set(referralOwnerAccountRef, {
        userId: params.discount.referralOwnerUserId,
        pendingRewardCredits: toCount(referralOwnerData.pendingRewardCredits) + 1,
        totalRewardCreditsEarned: toCount(referralOwnerData.totalRewardCreditsEarned) + 1,
        totalRewardCreditsConsumed: toCount(referralOwnerData.totalRewardCreditsConsumed),
        totalSuccessfulPaidPurchases: toCount(referralOwnerData.totalSuccessfulPaidPurchases),
        totalReferralPurchasesAsBuyer: toCount(referralOwnerData.totalReferralPurchasesAsBuyer),
        totalRedeemedCodesAsOwner: toCount(referralOwnerData.totalRedeemedCodesAsOwner) + 1,
        createdAt: referralOwnerSnapshot.exists
          ? (referralOwnerData.createdAt ?? FieldValue.serverTimestamp())
          : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    transaction.set(processedPaymentRef, {
      listId: params.listId,
      ownerId: params.ownerId,
      provider: params.provider,
      paymentRef: params.paymentRef,
      billingPlanId: params.planId,
      amountCents: params.amountCents,
      chargeAmountCents: params.chargeAmountCents,
      catalogAmountCents: params.catalogAmountCents,
      currency: params.currency,
      pricingMode: params.pricingMode,
      upgradeFromPlanId: params.upgradeFromPlanId,
      processedAt: FieldValue.serverTimestamp(),
    })
  })
}

export const isStripeCheckoutConfigured = (planId?: BillingPlanId) => {
  if (planId) {
    return Boolean(stripeClient)
  }

  return Boolean(stripeClient)
}

export const isStripeWebhookConfigured = () => {
  return Boolean(stripeClient && STRIPE_WEBHOOK_SECRET)
}

export const getBillingRuntimeConfig = () => {
  const stripeCheckoutConfigured = isStripeCheckoutConfigured()
  const stripeWebhookConfigured = isStripeWebhookConfigured()
  const mode = stripeCheckoutConfigured ? 'stripe' : 'manual'

  return {
    mode,
    manualFallbackEnabled: MANUAL_FALLBACK_ENABLED,
    stripeCheckoutConfigured,
    stripeWebhookConfigured,
    stripeTaxEnabled: STRIPE_TAX_ENABLED,
  }
}

export const startListCheckout = async (params: {
  listId: string
  ownerId: string
  planId: BillingPlanId
  currency: BillingCurrency
  marketAvailability: BillingMarketAvailability
  marketCountryCode: string | null
  locale?: string
  referralCode?: string | null
}): Promise<BillingCheckoutResult> => {
  if (!isBillingPlanId(params.planId)) {
    throw new Error('invalid_plan')
  }

  if (params.marketAvailability === 'blocked_sanctioned') {
    throw new Error('billing_market_sanctioned')
  }

  if (params.marketAvailability === 'blocked_unsupported') {
    throw new Error('billing_market_unsupported')
  }

  if (params.marketAvailability === 'unknown' && SHOULD_ENFORCE_MARKET_HEADERS) {
    throw new Error('billing_market_unknown')
  }

  const { listData } = await validateListOwnership(params.listId, params.ownerId)
  const currentPaidAccessEndsAt = toMillis(listData.paidAccessEndsAt)
  const currentBillingPlanId = (
    typeof listData.billingPlanId === 'string'
    && isBillingPlanId(listData.billingPlanId)
    && currentPaidAccessEndsAt !== null
    && currentPaidAccessEndsAt > Date.now()
  )
    ? listData.billingPlanId
    : null

  if (
    currentBillingPlanId
    && isBillingPlanDowngrade(currentBillingPlanId, params.planId)
  ) {
    throw new Error('plan_downgrade_not_allowed')
  }

  const hasComplimentaryAccess = await hasServerSideComplimentaryEntitlement(params.ownerId)
  if (hasComplimentaryAccess) {
    return {
      mode: 'manual',
      activated: true,
    }
  }
  const mediaUsage = await computeListMediaUsageSummary(params.listId)
  const mediaUsageIssue = getMediaUsageIssue(mediaUsage)
  if (mediaUsageIssue) {
    throw new Error(mediaUsageIssue)
  }

  const listVisibility = typeof listData.visibility === 'string'
    ? listData.visibility
    : null
  const requiredPlanId = resolveRequiredBillingPlanId(mediaUsage, {
    visibility: listVisibility === 'public_password'
      ? 'public_password'
      : listVisibility === 'private'
        ? 'private'
        : 'public',
  })
  if (!requiredPlanId) {
    throw new Error('media_limit_exceeded')
  }

  if (!isBillingPlanEligible(params.planId, mediaUsage, {
    visibility: listVisibility === 'public_password'
      ? 'public_password'
      : listVisibility === 'private'
        ? 'private'
        : 'public',
  })) {
    throw new Error('plan_too_small')
  }

  const chargeQuote = resolveBillingChargeQuote({
    targetPlanId: params.planId,
    currentPlanId: currentBillingPlanId,
    hasActivePaidPlan: Boolean(currentBillingPlanId),
    currency: params.currency,
  })

  let preparedDiscount: PreparedCheckoutDiscount
  try {
    preparedDiscount = await prepareCheckoutDiscount({
      buyerUserId: params.ownerId,
      referralCode: params.referralCode,
    })
  } catch (error) {
    if (error instanceof ReferralError) {
      throw new Error(error.code)
    }

    throw error
  }

  const originalAmountCents = chargeQuote.priceCents
  const discountedAmountCents = applyPercentageDiscount(
    originalAmountCents,
    preparedDiscount.discountPercent
  )

  if (!isStripeCheckoutConfigured(params.planId)) {
    if (!MANUAL_FALLBACK_ENABLED) {
      throw new Error('billing_unavailable')
    }

    const paymentRef = `manual_${Date.now()}`
    await grantListPass({
      listId: params.listId,
      ownerId: params.ownerId,
      planId: params.planId,
      currency: params.currency,
      provider: 'manual',
      paymentRef,
      amountCents: discountedAmountCents,
      chargeAmountCents: chargeQuote.priceCents,
      catalogAmountCents: chargeQuote.catalogPriceCents,
      pricingMode: chargeQuote.mode,
      upgradeFromPlanId: chargeQuote.upgradeFromPlanId,
      resetAccessPeriod: chargeQuote.resetsAccessPeriod,
      discount: preparedDiscount,
    })

    return {
      mode: 'manual',
      activated: true,
    }
  }

  const locale = resolveLocale(params.locale)
  const successUrl = `${SITE_URL}/${locale}/dashboard?billing=success&list=${params.listId}&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${SITE_URL}/${locale}/dashboard?billing=cancel&list=${params.listId}`
  const priceId = resolveStripePriceId(params.planId, params.currency)
  const stripeCurrency = toStripeCurrencyCode(params.currency)
  const shouldUseCatalogPrice = preparedDiscount.discountType === 'none' && chargeQuote.mode === 'full' && Boolean(priceId)
  const checkoutProductName = chargeQuote.mode === 'upgrade'
    ? `Giftlist Studio ${resolvePlanDisplayName(params.planId)} upgrade`
    : `Giftlist Studio ${resolvePlanDisplayName(params.planId)} package`
  const checkoutDescription = chargeQuote.mode === 'upgrade' && chargeQuote.upgradeFromPlanId
    ? `90-day upgrade from ${resolvePlanDisplayName(chargeQuote.upgradeFromPlanId)}`
    : '90-day per-list package'

  const session = await stripeClient!.checkout.sessions.create({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: 'required',
    customer_creation: 'always',
    tax_id_collection: {
      enabled: true,
    },
    automatic_tax: {
      enabled: STRIPE_TAX_ENABLED,
    },
    line_items: shouldUseCatalogPrice
      ? [
          {
            price: priceId,
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency: stripeCurrency,
              unit_amount: discountedAmountCents,
              product_data: {
                name: checkoutProductName,
                description: checkoutDescription,
              },
            },
            quantity: 1,
          },
        ],
    metadata: {
      listId: params.listId,
      ownerId: params.ownerId,
      plan: params.planId,
      requiredPlanId,
      discountType: preparedDiscount.discountType,
      discountPercent: String(preparedDiscount.discountPercent),
      rewardCreditsToConsume: String(preparedDiscount.rewardCreditsToConsume),
      referralCodeId: preparedDiscount.referralCodeId ?? '',
      referralCode: preparedDiscount.referralCode ?? '',
      referralOwnerUserId: preparedDiscount.referralOwnerUserId ?? '',
      currentBillingPlanId: currentBillingPlanId ?? '',
      pricingMode: chargeQuote.mode,
      upgradeFromPlanId: chargeQuote.upgradeFromPlanId ?? '',
      chargeAmountCents: String(chargeQuote.priceCents),
      catalogAmountCents: String(chargeQuote.catalogPriceCents),
      currency: params.currency,
      marketAvailability: params.marketAvailability,
      marketCountryCode: params.marketCountryCode ?? '',
    },
    client_reference_id: `${params.ownerId}:${params.listId}`,
    allow_promotion_codes: preparedDiscount.discountType === 'none',
  })

  if (!session.url) {
    throw new Error('checkout_url_missing')
  }

  if (preparedDiscount.referralCodeId) {
    try {
      await reserveReferralCodeForCheckout({
        codeId: preparedDiscount.referralCodeId,
        buyerUserId: params.ownerId,
        listId: params.listId,
        checkoutSessionId: session.id,
      })
    } catch (error) {
      await stripeClient!.checkout.sessions.expire(session.id).catch(() => undefined)

      if (error instanceof ReferralError) {
        throw new Error(error.code)
      }

      throw error
    }
  }

  await adminDb.collection('billingCheckoutSessions').doc(session.id).set({
    sessionId: session.id,
    listId: params.listId,
    ownerId: params.ownerId,
    provider: 'stripe',
    billingPlanId: params.planId,
    status: 'created',
    amountTotal: session.amount_total ?? null,
    amountCents: discountedAmountCents,
    originalAmountCents,
    catalogAmountCents: chargeQuote.catalogPriceCents,
    pricingMode: chargeQuote.mode,
    upgradeFromPlanId: chargeQuote.upgradeFromPlanId,
    discountType: preparedDiscount.discountType,
    discountPercent: preparedDiscount.discountPercent,
    rewardCreditsToConsume: preparedDiscount.rewardCreditsToConsume,
    referralCodeId: preparedDiscount.referralCodeId,
    referralCode: preparedDiscount.referralCode,
    referralOwnerUserId: preparedDiscount.referralOwnerUserId,
    currency: session.currency ?? null,
    marketAvailability: params.marketAvailability,
    marketCountryCode: params.marketCountryCode,
    stripeTaxEnabled: STRIPE_TAX_ENABLED,
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  return {
    mode: 'stripe',
    checkoutUrl: session.url,
    sessionId: session.id,
  }
}

const markCheckoutSession = async (sessionId: string, payload: Record<string, unknown>) => {
  await adminDb.collection('billingCheckoutSessions').doc(sessionId).set({
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
}

export const processStripeWebhook = async (rawBody: string, signature: string) => {
  if (!isStripeWebhookConfigured()) {
    throw new Error('webhook_unavailable')
  }

  const event = stripeClient!.webhooks.constructEvent(
    rawBody,
    signature,
    STRIPE_WEBHOOK_SECRET
  )

  const webhookEventRef = adminDb.collection('billingWebhookEvents').doc(event.id)

  try {
    await webhookEventRef.create({
      eventId: event.id,
      type: event.type,
      status: 'processing',
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch {
    return {
      handled: true,
      duplicate: true,
      eventId: event.id,
    }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const grantPayload = parseStripeCheckoutGrantPayload(session)

      await grantListPass({
        listId: grantPayload.listId,
        ownerId: grantPayload.ownerId,
        planId: grantPayload.planId,
        currency: grantPayload.currency,
        provider: 'stripe',
        paymentRef: session.id,
        amountCents: grantPayload.amountCents,
        chargeAmountCents: grantPayload.chargeAmountCents,
        catalogAmountCents: grantPayload.catalogAmountCents,
        pricingMode: grantPayload.pricingMode,
        upgradeFromPlanId: grantPayload.upgradeFromPlanId,
        resetAccessPeriod: grantPayload.pricingMode === 'upgrade',
        discount: grantPayload.discount,
      })

      await markCheckoutSession(session.id, {
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
        webhookEventId: event.id,
      })
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const referralCodeId = session.metadata?.referralCodeId?.trim() || null

      if (referralCodeId) {
        await releaseReferralCodeReservation({
          codeId: referralCodeId,
          checkoutSessionId: session.id,
        })
      }

      await markCheckoutSession(session.id, {
        status: 'expired',
        expiredAt: FieldValue.serverTimestamp(),
        webhookEventId: event.id,
      })
    }

    await webhookEventRef.set({
      status: 'processed',
      processedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    return {
      handled: true,
      duplicate: false,
      eventId: event.id,
      eventType: event.type,
    }
  } catch (error) {
    await webhookEventRef.set({
      status: 'failed',
      failedAt: FieldValue.serverTimestamp(),
      error: error instanceof Error ? error.message : 'unknown',
    }, { merge: true })

    throw error
  }
}

export const confirmStripeCheckoutSession = async (params: {
  sessionId: string
  ownerId: string
  listId?: string | null
}) => {
  if (!stripeClient) {
    throw new Error('billing_unavailable')
  }

  const session = await stripeClient.checkout.sessions.retrieve(params.sessionId)
  const grantPayload = parseStripeCheckoutGrantPayload(session)

  if (grantPayload.ownerId !== params.ownerId) {
    throw new Error('forbidden')
  }

  if (params.listId && grantPayload.listId !== params.listId) {
    throw new Error('forbidden')
  }

  if (session.payment_status !== 'paid') {
    await markCheckoutSession(session.id, {
      status: session.status ?? 'open',
      paymentStatus: session.payment_status ?? null,
      lastConfirmationAttemptAt: FieldValue.serverTimestamp(),
    })

    return {
      confirmed: false,
      sessionId: session.id,
    }
  }

  await grantListPass({
    listId: grantPayload.listId,
    ownerId: grantPayload.ownerId,
    planId: grantPayload.planId,
    currency: grantPayload.currency,
    provider: 'stripe',
    paymentRef: session.id,
    amountCents: grantPayload.amountCents,
    chargeAmountCents: grantPayload.chargeAmountCents,
    catalogAmountCents: grantPayload.catalogAmountCents,
    pricingMode: grantPayload.pricingMode,
    upgradeFromPlanId: grantPayload.upgradeFromPlanId,
    resetAccessPeriod: grantPayload.pricingMode === 'upgrade',
    discount: grantPayload.discount,
  })

  await markCheckoutSession(session.id, {
    status: 'completed',
    completedAt: FieldValue.serverTimestamp(),
    paymentStatus: session.payment_status ?? null,
    confirmedVia: 'return',
  })

  return {
    confirmed: true,
    sessionId: session.id,
  }
}
