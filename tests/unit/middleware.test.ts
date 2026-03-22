import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { middleware } from '@/middleware'

describe('middleware sensitive POST API protection', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('blocks cross-site POST requests to sensitive public endpoints', () => {
    const response = middleware(
      new NextRequest('https://www.giftliststudio.com/api/public-list/demo/unlock', {
        method: 'POST',
        headers: {
          host: 'www.giftliststudio.com',
          'sec-fetch-site': 'cross-site',
        },
      })
    )

    expect(response.status).toBe(403)
  })

  it('allows same-origin POST requests to sensitive public endpoints', () => {
    const response = middleware(
      new NextRequest('https://www.giftliststudio.com/api/public-list/demo/unlock', {
        method: 'POST',
        headers: {
          host: 'www.giftliststudio.com',
          'sec-fetch-site': 'same-origin',
        },
      })
    )

    expect(response.status).toBe(200)
  })

  it('allows same-origin POST requests when origin matches the canonical host', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.giftliststudio.com')

    const response = middleware(
      new NextRequest('https://robin-joulumaailm.vercel.app/api/leads', {
        method: 'POST',
        headers: {
          host: 'robin-joulumaailm.vercel.app',
          origin: 'https://www.giftliststudio.com',
        },
      })
    )

    expect(response.status).toBe(200)
  })
})
