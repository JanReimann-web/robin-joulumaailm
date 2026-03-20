import {
  formatBillingPlanPrice,
  getBillingUpgradePriceCents,
  isBillingPlanDowngrade,
  resolveBillingChargeQuote,
  resolveBillingCurrencyFromCountryCode,
} from '@/lib/billing/pricing'
import { applyPercentageDiscount } from '@/lib/referrals'

describe('billing pricing helpers', () => {
  it('uses EUR for EU27 countries', () => {
    expect(resolveBillingCurrencyFromCountryCode('EE')).toBe('EUR')
    expect(resolveBillingCurrencyFromCountryCode('de')).toBe('EUR')
  })

  it('uses USD outside the configured launch EU pricing region or when country is missing', () => {
    expect(resolveBillingCurrencyFromCountryCode('US')).toBe('USD')
    expect(resolveBillingCurrencyFromCountryCode('GB')).toBe('USD')
    expect(resolveBillingCurrencyFromCountryCode('AU')).toBe('USD')
    expect(resolveBillingCurrencyFromCountryCode(null)).toBe('USD')
  })

  it('formats billing prices with the selected currency and locale duration label', () => {
    expect(formatBillingPlanPrice('base', 'EUR', 'et')).toBe('9.95 EUR / 90 päeva')
    expect(formatBillingPlanPrice('premium', 'USD', 'en')).toBe('19.95 USD / 90 days')
  })

  it('returns configured upgrade prices for supported upgrade paths', () => {
    expect(getBillingUpgradePriceCents('base', 'premium', 'EUR')).toBe(1295)
    expect(getBillingUpgradePriceCents('base', 'platinum', 'USD')).toBe(2495)
    expect(getBillingUpgradePriceCents('premium', 'platinum', 'EUR')).toBe(1295)
  })

  it('returns full price for a new plan purchase or same-plan extension', () => {
    expect(resolveBillingChargeQuote({
      targetPlanId: 'base',
      currentPlanId: null,
      hasActivePaidPlan: false,
      currency: 'EUR',
    })).toMatchObject({
      mode: 'full',
      priceCents: 995,
      catalogPriceCents: 995,
      upgradeFromPlanId: null,
      resetsAccessPeriod: false,
    })

    expect(resolveBillingChargeQuote({
      targetPlanId: 'premium',
      currentPlanId: 'premium',
      hasActivePaidPlan: true,
      currency: 'USD',
    })).toMatchObject({
      mode: 'full',
      priceCents: 1995,
      catalogPriceCents: 1995,
      upgradeFromPlanId: null,
      resetsAccessPeriod: false,
    })
  })

  it('returns upgrade pricing for supported active-plan upgrades', () => {
    expect(resolveBillingChargeQuote({
      targetPlanId: 'premium',
      currentPlanId: 'base',
      hasActivePaidPlan: true,
      currency: 'EUR',
    })).toMatchObject({
      mode: 'upgrade',
      priceCents: 1295,
      catalogPriceCents: 1995,
      upgradeFromPlanId: 'base',
      resetsAccessPeriod: true,
    })

    expect(resolveBillingChargeQuote({
      targetPlanId: 'platinum',
      currentPlanId: 'base',
      hasActivePaidPlan: true,
      currency: 'USD',
    })).toMatchObject({
      mode: 'upgrade',
      priceCents: 2495,
      catalogPriceCents: 2995,
      upgradeFromPlanId: 'base',
      resetsAccessPeriod: true,
    })
  })

  it('supports applying referral and reward discounts to upgrade quotes', () => {
    const premiumUpgrade = resolveBillingChargeQuote({
      targetPlanId: 'premium',
      currentPlanId: 'base',
      hasActivePaidPlan: true,
      currency: 'EUR',
    })

    expect(premiumUpgrade.mode).toBe('upgrade')
    expect(applyPercentageDiscount(premiumUpgrade.priceCents, 20)).toBe(1036)
    expect(applyPercentageDiscount(premiumUpgrade.priceCents, 10)).toBe(1166)
  })

  it('keeps downgrade detection separate from charge quoting', () => {
    expect(isBillingPlanDowngrade('premium', 'base')).toBe(true)
    expect(resolveBillingChargeQuote({
      targetPlanId: 'base',
      currentPlanId: 'premium',
      hasActivePaidPlan: true,
      currency: 'EUR',
    })).toMatchObject({
      mode: 'full',
      priceCents: 995,
      catalogPriceCents: 995,
      upgradeFromPlanId: null,
      resetsAccessPeriod: false,
    })
  })
})
