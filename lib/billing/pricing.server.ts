import 'server-only'

import { BillingCurrency, resolveBillingCurrencyFromCountryCode } from '@/lib/billing/pricing'

const VERCEL_COUNTRY_HEADER = 'x-vercel-ip-country'
const VERCEL_CONTINENT_HEADER = 'x-vercel-ip-continent'

type HeaderReader = {
  get(name: string): string | null
}

export const resolveBillingCurrencyFromHeaders = (
  headers: HeaderReader
): BillingCurrency => {
  const countryCode = headers.get(VERCEL_COUNTRY_HEADER)
  if (countryCode) {
    return resolveBillingCurrencyFromCountryCode(countryCode)
  }

  const continentCode = headers.get(VERCEL_CONTINENT_HEADER)?.trim().toUpperCase()
  if (continentCode === 'EU') {
    return 'EUR'
  }

  return 'USD'
}
