import 'server-only'

import { BillingCurrency } from '@/lib/billing/pricing'
import { resolveBillingMarketFromHeaders } from '@/lib/billing/markets.server'

type HeaderReader = {
  get(name: string): string | null
}

export const resolveBillingCurrencyFromHeaders = (
  headers: HeaderReader
): BillingCurrency => {
  return resolveBillingMarketFromHeaders(headers).billingCurrency
}
