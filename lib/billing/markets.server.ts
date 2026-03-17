import 'server-only'

import { BillingMarket, resolveBillingMarketFromCountryCode } from '@/lib/billing/markets'

const VERCEL_COUNTRY_HEADER = 'x-vercel-ip-country'

type HeaderReader = {
  get(name: string): string | null
}

export const resolveBillingMarketFromHeaders = (
  headers: HeaderReader
): BillingMarket => {
  return resolveBillingMarketFromCountryCode(headers.get(VERCEL_COUNTRY_HEADER))
}
