import { EU27_COUNTRY_CODES } from '@/lib/billing/markets'
import { Locale } from '@/lib/i18n/config'
import { BILLING_PLAN_IDS, BillingPlanId, BILLING_PLAN_DEFINITIONS } from '@/lib/lists/plans'

export const BILLING_CURRENCIES = ['EUR', 'USD'] as const
export type BillingCurrency = (typeof BILLING_CURRENCIES)[number]
export type BillingChargeMode = 'full' | 'upgrade'

type UpgradePriceKey = `${BillingPlanId}:${BillingPlanId}`

export type BillingChargeQuote = {
  mode: BillingChargeMode
  currentPlanId: BillingPlanId | null
  targetPlanId: BillingPlanId
  upgradeFromPlanId: BillingPlanId | null
  priceCents: number
  catalogPriceCents: number
  resetsAccessPeriod: boolean
}

const DEFAULT_BILLING_CURRENCY: BillingCurrency = 'USD'
const billingDurationLabels: Record<Locale, string> = {
  en: '90 days',
  et: '90 päeva',
  fi: '90 päivää',
  sv: '90 dagar',
  no: '90 dager',
  da: '90 dage',
  de: '90 Tage',
  fr: '90 jours',
  es: '90 días',
  pt: '90 dias',
  it: '90 giorni',
  pl: '90 dni',
  ru: '90 дней',
  lv: '90 dienas',
  lt: '90 dienų',
}

const BILLING_PLAN_PRIORITY: Record<BillingPlanId, number> = {
  base: 0,
  premium: 1,
  platinum: 2,
}

const BILLING_UPGRADE_PRICE_CENTS: Partial<Record<UpgradePriceKey, Record<BillingCurrency, number>>> = {
  'base:premium': {
    EUR: 1295,
    USD: 1295,
  },
  'base:platinum': {
    EUR: 2495,
    USD: 2495,
  },
  'premium:platinum': {
    EUR: 1295,
    USD: 1295,
  },
}

export const isBillingCurrency = (value: string): value is BillingCurrency => {
  return BILLING_CURRENCIES.includes(value as BillingCurrency)
}

export const isBillingPlanId = (value: string | null | undefined): value is BillingPlanId => {
  return Boolean(value) && BILLING_PLAN_IDS.includes(value as BillingPlanId)
}

export const resolveBillingCurrencyFromCountryCode = (
  countryCode: string | null | undefined
): BillingCurrency => {
  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? ''
  if (normalizedCountryCode && EU27_COUNTRY_CODES.has(normalizedCountryCode)) {
    return 'EUR'
  }

  return DEFAULT_BILLING_CURRENCY
}

export const getBillingPlanPriceCents = (
  planId: BillingPlanId,
  currency: BillingCurrency
) => {
  const priceByCurrency: Record<BillingCurrency, number> = {
    EUR: BILLING_PLAN_DEFINITIONS[planId].priceCents,
    USD: BILLING_PLAN_DEFINITIONS[planId].priceCents,
  }

  return priceByCurrency[currency]
}

export const getBillingUpgradePriceCents = (
  currentPlanId: BillingPlanId,
  targetPlanId: BillingPlanId,
  currency: BillingCurrency
) => {
  const key = `${currentPlanId}:${targetPlanId}` as UpgradePriceKey
  return BILLING_UPGRADE_PRICE_CENTS[key]?.[currency] ?? null
}

export const compareBillingPlanPriority = (
  left: BillingPlanId,
  right: BillingPlanId
) => {
  return BILLING_PLAN_PRIORITY[left] - BILLING_PLAN_PRIORITY[right]
}

export const isBillingPlanUpgrade = (
  currentPlanId: BillingPlanId,
  targetPlanId: BillingPlanId
) => {
  return compareBillingPlanPriority(currentPlanId, targetPlanId) < 0
}

export const isBillingPlanDowngrade = (
  currentPlanId: BillingPlanId,
  targetPlanId: BillingPlanId
) => {
  return compareBillingPlanPriority(currentPlanId, targetPlanId) > 0
}

export const resolveBillingChargeQuote = (params: {
  targetPlanId: BillingPlanId
  currentPlanId?: BillingPlanId | null
  hasActivePaidPlan?: boolean
  currency: BillingCurrency
}): BillingChargeQuote => {
  const currentPlanId = params.hasActivePaidPlan
    ? (params.currentPlanId ?? null)
    : null
  const catalogPriceCents = getBillingPlanPriceCents(params.targetPlanId, params.currency)

  if (!currentPlanId || currentPlanId === params.targetPlanId) {
    return {
      mode: 'full',
      currentPlanId,
      targetPlanId: params.targetPlanId,
      upgradeFromPlanId: null,
      priceCents: catalogPriceCents,
      catalogPriceCents,
      resetsAccessPeriod: false,
    }
  }

  const upgradePriceCents = getBillingUpgradePriceCents(
    currentPlanId,
    params.targetPlanId,
    params.currency
  )

  if (upgradePriceCents !== null && isBillingPlanUpgrade(currentPlanId, params.targetPlanId)) {
    return {
      mode: 'upgrade',
      currentPlanId,
      targetPlanId: params.targetPlanId,
      upgradeFromPlanId: currentPlanId,
      priceCents: upgradePriceCents,
      catalogPriceCents,
      resetsAccessPeriod: true,
    }
  }

  return {
    mode: 'full',
    currentPlanId,
    targetPlanId: params.targetPlanId,
    upgradeFromPlanId: null,
    priceCents: catalogPriceCents,
    catalogPriceCents,
    resetsAccessPeriod: false,
  }
}

export const formatBillingPriceCents = (
  priceCents: number,
  currency: BillingCurrency,
  locale: Locale
) => {
  const amount = (priceCents / 100).toFixed(2)
  const durationLabel = billingDurationLabels[locale]

  return `${amount} ${currency} / ${durationLabel}`
}

export const formatBillingPlanPrice = (
  planId: BillingPlanId,
  currency: BillingCurrency,
  locale: Locale
) => {
  return formatBillingPriceCents(
    getBillingPlanPriceCents(planId, currency),
    currency,
    locale
  )
}

export const toStripeCurrencyCode = (currency: BillingCurrency) => {
  return currency.toLowerCase() as Lowercase<BillingCurrency>
}
