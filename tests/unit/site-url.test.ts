import { beforeEach, afterEach, describe, expect, it } from 'vitest'

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

describe('site url helpers', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://giftliststudio.com/'
  })

  afterEach(() => {
    if (typeof ORIGINAL_SITE_URL === 'string') {
      process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL
    }
  })

  it('trims trailing slashes when building localized URLs', async () => {
    const { buildLocalizedUrl } = await import('@/lib/site/url')

    expect(buildLocalizedUrl('en', '/pricing')).toBe('https://giftliststudio.com/en/pricing')
  })

  it('builds public list URLs under /l/', async () => {
    const { buildPublicListUrl } = await import('@/lib/site/url')

    expect(buildPublicListUrl('Anna & Marko Wedding')).toBe(
      'https://giftliststudio.com/l/anna-marko-wedding'
    )
  })
})
