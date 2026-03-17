'use client'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export type AnalyticsEventName =
  | 'view_example'
  | 'click_start_trial'
  | 'view_pricing'
  | 'begin_signup'
  | 'create_account'
  | 'create_list'
  | 'copy_link'
  | 'begin_checkout'
  | 'purchase'
  | 'referral_generated'
  | 'referral_redeemed'
  | 'generate_lead'

export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>

export const trackAnalyticsEvent = (
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams = {}
) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return
  }

  const normalizedParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined)
  )

  window.gtag('event', eventName, normalizedParams)
}

