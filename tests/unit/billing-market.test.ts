import {
  resolveBillingMarketFromCountryCode,
  SANCTIONED_COUNTRY_CODES,
} from '@/lib/billing/markets'

describe('billing market helpers', () => {
  it('allows Estonia, EU27, and United States launch markets', () => {
    expect(resolveBillingMarketFromCountryCode('EE')).toMatchObject({
      availability: 'allowed',
      billingCurrency: 'EUR',
      countryCode: 'EE',
    })
    expect(resolveBillingMarketFromCountryCode('US')).toMatchObject({
      availability: 'allowed',
      billingCurrency: 'USD',
      countryCode: 'US',
    })
  })

  it('blocks sanctioned countries including Russia and Belarus', () => {
    expect(SANCTIONED_COUNTRY_CODES.has('RU')).toBe(true)
    expect(SANCTIONED_COUNTRY_CODES.has('BY')).toBe(true)
    expect(resolveBillingMarketFromCountryCode('RU').availability).toBe('blocked_sanctioned')
    expect(resolveBillingMarketFromCountryCode('BY').availability).toBe('blocked_sanctioned')
  })

  it('blocks unsupported countries outside launch markets', () => {
    expect(resolveBillingMarketFromCountryCode('CA').availability).toBe('blocked_unsupported')
    expect(resolveBillingMarketFromCountryCode('GB').availability).toBe('blocked_unsupported')
  })

  it('returns unknown when country cannot be resolved', () => {
    expect(resolveBillingMarketFromCountryCode(null).availability).toBe('unknown')
  })
})
