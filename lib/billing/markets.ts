import type { BillingCurrency } from '@/lib/billing/pricing'

export const EU27_COUNTRY_CODES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
])

export const LAUNCH_ALLOWED_COUNTRY_CODES = new Set([
  ...Array.from(EU27_COUNTRY_CODES),
  'US',
])

export const SANCTIONED_COUNTRY_CODES = new Set([
  'BY',
  'CU',
  'IR',
  'KP',
  'RU',
  'SY',
])

export type BillingMarketAvailability =
  | 'allowed'
  | 'blocked_unsupported'
  | 'blocked_sanctioned'
  | 'unknown'

export type BillingMarket = {
  countryCode: string | null
  billingCurrency: BillingCurrency
  availability: BillingMarketAvailability
}

export const normalizeBillingCountryCode = (
  countryCode: string | null | undefined
) => {
  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? ''
  return normalizedCountryCode.length > 0 ? normalizedCountryCode : null
}

export const resolveBillingMarketFromCountryCode = (
  countryCode: string | null | undefined
): BillingMarket => {
  const normalizedCountryCode = normalizeBillingCountryCode(countryCode)

  if (!normalizedCountryCode) {
    return {
      countryCode: null,
      billingCurrency: 'USD',
      availability: 'unknown',
    }
  }

  if (SANCTIONED_COUNTRY_CODES.has(normalizedCountryCode)) {
    return {
      countryCode: normalizedCountryCode,
      billingCurrency: 'USD',
      availability: 'blocked_sanctioned',
    }
  }

  if (LAUNCH_ALLOWED_COUNTRY_CODES.has(normalizedCountryCode)) {
    return {
      countryCode: normalizedCountryCode,
      billingCurrency: EU27_COUNTRY_CODES.has(normalizedCountryCode) ? 'EUR' : 'USD',
      availability: 'allowed',
    }
  }

  return {
    countryCode: normalizedCountryCode,
    billingCurrency: 'USD',
    availability: 'blocked_unsupported',
  }
}
