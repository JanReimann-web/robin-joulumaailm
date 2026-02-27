import { isReservedSlug, isValidSlug, sanitizeSlug } from '@/lib/lists/slug'

describe('slug helpers', () => {
  it('sanitizes mixed input with diacritics and symbols', () => {
    const value = sanitizeSlug('  Märko & Liisa Pulm!! ')
    expect(value).toBe('marko-liisa-pulm')
  })

  it('accepts valid slug', () => {
    expect(isValidSlug('marko-liisa-2026')).toBe(true)
  })

  it('rejects invalid slug formats', () => {
    expect(isValidSlug('aa')).toBe(false)
    expect(isValidSlug('Marko')).toBe(false)
    expect(isValidSlug('marko__liisa')).toBe(false)
  })

  it('detects reserved slugs', () => {
    expect(isReservedSlug('admin')).toBe(true)
    expect(isReservedSlug('pricing')).toBe(true)
    expect(isReservedSlug('marko')).toBe(false)
  })
})

