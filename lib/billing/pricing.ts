import { Locale } from '@/lib/i18n/config'
import { BillingPlanId, BILLING_PLAN_DEFINITIONS } from '@/lib/lists/plans'

export const BILLING_CURRENCIES = ['EUR', 'USD'] as const
export type BillingCurrency = (typeof BILLING_CURRENCIES)[number]
const DEFAULT_BILLING_CURRENCY: BillingCurrency = 'USD'
const EUROPE_PRICING_COUNTRY_CODES = new Set([
  'AD',
  'AL',
  'AT',
  'AX',
  'BA',
  'BE',
  'BG',
  'BY',
  'CH',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FO',
  'FR',
  'GB',
  'GG',
  'GI',
  'GR',
  'HR',
  'HU',
  'IE',
  'IM',
  'IS',
  'IT',
  'JE',
  'LI',
  'LT',
  'LU',
  'LV',
  'MC',
  'MD',
  'ME',
  'MK',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'RS',
  'SE',
  'SI',
  'SJ',
  'SK',
  'SM',
  'UA',
  'VA',
  'XK',
])

export const isBillingCurrency = (value: string): value is BillingCurrency => {
  return BILLING_CURRENCIES.includes(value as BillingCurrency)
}

export const resolveBillingCurrencyFromCountryCode = (
  countryCode: string | null | undefined
): BillingCurrency => {
  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? ''
  if (normalizedCountryCode && EUROPE_PRICING_COUNTRY_CODES.has(normalizedCountryCode)) {
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

export const formatBillingPlanPrice = (
  planId: BillingPlanId,
  currency: BillingCurrency,
  locale: Locale
) => {
  const amount = (getBillingPlanPriceCents(planId, currency) / 100).toFixed(2)
  const durationLabel = locale === 'et' ? '90 päeva' : '90 days'

  return `${amount} ${currency} / ${durationLabel}`
}

export const toStripeCurrencyCode = (currency: BillingCurrency) => {
  return currency.toLowerCase() as Lowercase<BillingCurrency>
}
