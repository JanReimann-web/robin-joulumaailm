import {
  addDays,
  getRemainingDays,
  resolveListAccessStatus,
} from '@/lib/lists/access'

describe('access helpers', () => {
  it('adds days correctly', () => {
    const base = new Date('2026-02-01T00:00:00.000Z')
    const next = addDays(base, 14)
    expect(next.toISOString()).toBe('2026-02-15T00:00:00.000Z')
  })

  it('returns active when paid access is still valid', () => {
    const now = Date.parse('2026-02-27T00:00:00.000Z')
    const paidAccessEndsAt = Date.parse('2026-03-01T00:00:00.000Z')

    const status = resolveListAccessStatus({
      trialEndsAt: Date.parse('2026-02-20T00:00:00.000Z'),
      paidAccessEndsAt,
      now,
    })

    expect(status).toBe('active')
  })

  it('returns trial when trial is still valid and no paid access', () => {
    const now = Date.parse('2026-02-27T00:00:00.000Z')
    const trialEndsAt = Date.parse('2026-03-01T00:00:00.000Z')

    const status = resolveListAccessStatus({
      trialEndsAt,
      paidAccessEndsAt: null,
      now,
    })

    expect(status).toBe('trial')
  })

  it('returns expired when both trial and paid are over', () => {
    const now = Date.parse('2026-02-27T00:00:00.000Z')

    const status = resolveListAccessStatus({
      trialEndsAt: Date.parse('2026-02-20T00:00:00.000Z'),
      paidAccessEndsAt: Date.parse('2026-02-21T00:00:00.000Z'),
      now,
    })

    expect(status).toBe('expired')
  })

  it('returns remaining days as ceiling and never negative', () => {
    const now = Date.now()
    const inTenHours = now + 10 * 60 * 60 * 1000
    const inThreeDays = now + 3 * 24 * 60 * 60 * 1000 + 1
    const inPast = now - 1000

    expect(getRemainingDays(inTenHours)).toBe(1)
    expect(getRemainingDays(inThreeDays)).toBe(4)
    expect(getRemainingDays(inPast)).toBe(0)
    expect(getRemainingDays(null)).toBe(0)
  })
})

