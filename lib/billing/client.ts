import { BillingPlanId } from '@/lib/lists/plans'
import {
  BillingCheckoutResult,
  BillingReturnConfirmationResult,
} from '@/lib/billing/types'

export class BillingCheckoutError extends Error {
  code: string

  constructor(code: string) {
    super(code)
    this.code = code
  }
}

export const startBillingCheckout = async (params: {
  listId: string
  planId: BillingPlanId
  locale: string
  idToken: string
  referralCode?: string | null
}): Promise<BillingCheckoutResult> => {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${params.idToken}`,
    },
    body: JSON.stringify({
      listId: params.listId,
      planId: params.planId,
      locale: params.locale,
      referralCode: params.referralCode ?? undefined,
    }),
  })

  const payload = await response.json() as Partial<BillingCheckoutResult> & {
    error?: string
  }

  if (!response.ok) {
    throw new BillingCheckoutError(payload.error ?? 'billing_failed')
  }

  if (payload.mode === 'stripe') {
    if (!payload.checkoutUrl || !payload.sessionId) {
      throw new BillingCheckoutError('invalid_checkout_response')
    }

    return {
      mode: 'stripe',
      checkoutUrl: payload.checkoutUrl,
      sessionId: payload.sessionId,
    }
  }

  return {
    mode: 'manual',
    activated: true,
  }
}

export const confirmBillingReturn = async (params: {
  sessionId: string
  listId: string | null
  idToken: string
}): Promise<BillingReturnConfirmationResult> => {
  const response = await fetch('/api/billing/confirm', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${params.idToken}`,
    },
    body: JSON.stringify({
      sessionId: params.sessionId,
      listId: params.listId ?? undefined,
    }),
  })

  const payload = await response.json() as Partial<BillingReturnConfirmationResult> & {
    error?: string
  }

  if (!response.ok) {
    throw new BillingCheckoutError(payload.error ?? 'billing_failed')
  }

  if (!payload.sessionId) {
    throw new BillingCheckoutError('invalid_checkout_confirmation')
  }

  return {
    confirmed: payload.confirmed === true,
    sessionId: payload.sessionId,
  }
}

export type BillingRuntimeMode = 'stripe' | 'manual'

export interface BillingRuntimeConfig {
  mode: BillingRuntimeMode
  manualFallbackEnabled: boolean
  stripeCheckoutConfigured: boolean
  stripeWebhookConfigured: boolean
  stripeTaxEnabled: boolean
}

export const fetchBillingRuntimeConfig = async (): Promise<BillingRuntimeConfig> => {
  const response = await fetch('/api/billing/config', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new BillingCheckoutError('billing_config_unavailable')
  }

  const payload = await response.json() as Partial<BillingRuntimeConfig>

  return {
    mode: payload.mode === 'stripe' ? 'stripe' : 'manual',
    manualFallbackEnabled: Boolean(payload.manualFallbackEnabled),
    stripeCheckoutConfigured: Boolean(payload.stripeCheckoutConfigured),
    stripeWebhookConfigured: Boolean(payload.stripeWebhookConfigured),
    stripeTaxEnabled: Boolean(payload.stripeTaxEnabled),
  }
}
