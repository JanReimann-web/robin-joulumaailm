import { BillingCheckoutResult } from '@/lib/billing/types'

export class BillingCheckoutError extends Error {
  code: string

  constructor(code: string) {
    super(code)
    this.code = code
  }
}

export const startBillingCheckout = async (params: {
  listId: string
  locale: string
  idToken: string
}): Promise<BillingCheckoutResult> => {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${params.idToken}`,
    },
    body: JSON.stringify({
      listId: params.listId,
      locale: params.locale,
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

export type BillingRuntimeMode = 'stripe' | 'manual'

export interface BillingRuntimeConfig {
  mode: BillingRuntimeMode
  manualFallbackEnabled: boolean
  stripeCheckoutConfigured: boolean
  stripeWebhookConfigured: boolean
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
  }
}
