import {
  formatBillingPlanPrice,
  resolveBillingCurrencyFromCountryCode,
} from '@/lib/billing/pricing'

describe('billing pricing helpers', () => {
  it('uses EUR for configured European countries', () => {
    expect(resolveBillingCurrencyFromCountryCode('EE')).toBe('EUR')
    expect(resolveBillingCurrencyFromCountryCode('de')).toBe('EUR')
    expect(resolveBillingCurrencyFromCountryCode('GB')).toBe('EUR')
  })

  it('uses USD outside the configured Europe region or when country is missing', () => {
    expect(resolveBillingCurrencyFromCountryCode('US')).toBe('USD')
    expect(resolveBillingCurrencyFromCountryCode('AU')).toBe('USD')
    expect(resolveBillingCurrencyFromCountryCode(null)).toBe('USD')
  })

  it('formats billing prices with the selected currency and locale duration label', () => {
    expect(formatBillingPlanPrice('base', 'EUR', 'et')).toBe('9.95 EUR / 90 päeva')
    expect(formatBillingPlanPrice('premium', 'USD', 'en')).toBe('19.95 USD / 90 days')
  })
})
