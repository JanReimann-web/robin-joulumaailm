export type BillingCheckoutResult =
  | {
      mode: 'stripe'
      checkoutUrl: string
      sessionId: string
    }
  | {
      mode: 'manual'
      activated: true
    }

export type BillingReturnConfirmationResult = {
  confirmed: boolean
  sessionId: string
}
