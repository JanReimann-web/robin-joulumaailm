import {
  applyPercentageDiscount,
  formatReferralCode,
  getRewardCreditsToConsume,
  getRewardDiscountPercentFromCredits,
  normalizeReferralCode,
} from '@/lib/referrals'

describe('referral helpers', () => {
  it('normalizes referral code input', () => {
    expect(normalizeReferralCode('ab-cd 1234!!!')).toBe('ABCD1234')
  })

  it('formats referral code with one dash', () => {
    expect(formatReferralCode('abcd1234')).toBe('ABCD-1234')
  })

  it('caps reward discount at 30 percent', () => {
    expect(getRewardDiscountPercentFromCredits(0)).toBe(0)
    expect(getRewardDiscountPercentFromCredits(1)).toBe(10)
    expect(getRewardDiscountPercentFromCredits(2)).toBe(20)
    expect(getRewardDiscountPercentFromCredits(3)).toBe(30)
    expect(getRewardDiscountPercentFromCredits(8)).toBe(30)
  })

  it('consumes at most three reward credits per purchase', () => {
    expect(getRewardCreditsToConsume(0)).toBe(0)
    expect(getRewardCreditsToConsume(2)).toBe(2)
    expect(getRewardCreditsToConsume(5)).toBe(3)
  })

  it('applies percentage discount to amount cents', () => {
    expect(applyPercentageDiscount(1995, 20)).toBe(1596)
    expect(applyPercentageDiscount(2995, 30)).toBe(2097)
    expect(applyPercentageDiscount(995, 0)).toBe(995)
  })
})
