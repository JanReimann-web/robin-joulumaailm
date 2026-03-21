import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  createPublicAccessToken,
  getPublicAccessCookieName,
  hashVisibilityPassword,
} from '@/lib/lists/password.server'

const {
  getPublicListBySlugMock,
  getPublicListContentMock,
  secretGetMock,
  consumeRateLimitMock,
} = vi.hoisted(() => ({
  getPublicListBySlugMock: vi.fn(),
  getPublicListContentMock: vi.fn(),
  secretGetMock: vi.fn(),
  consumeRateLimitMock: vi.fn(),
}))

vi.mock('@/lib/lists/public-server', () => ({
  getPublicListBySlug: getPublicListBySlugMock,
  getPublicListContent: getPublicListContentMock,
}))

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: secretGetMock,
      })),
    })),
  },
}))

vi.mock('@/lib/security/request-rate-limit.server', () => ({
  consumeRateLimit: consumeRateLimitMock,
  createRateLimitResponse: vi.fn((retryAfterSeconds: number) => {
    return Response.json(
      { error: 'rate_limited' },
      {
        status: 429,
        headers: {
          'retry-after': String(retryAfterSeconds),
        },
      }
    )
  }),
  getRateLimitFingerprint: vi.fn(() => 'test-fingerprint'),
}))

import { GET as getPublicListContentRoute } from '@/app/api/public-list/[slug]/content/route'
import { POST as unlockPublicListRoute } from '@/app/api/public-list/[slug]/unlock/route'
import {
  getVisibilityPasswordValidationError,
  isValidVisibilityPassword,
} from '@/lib/lists/password-policy'

const createProtectedList = () => ({
  id: 'list-1',
  slug: 'sample-list',
  visibility: 'public_password',
  accessStatus: 'active',
  title: 'Sample list',
  eventType: 'birthday',
  templateId: 'classic',
  introTitle: null,
  introBody: null,
  introEventDate: null,
  introEventTime: null,
  introEventLocation: null,
  introMediaUrl: null,
  introMediaType: null,
})

describe('public password protection routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consumeRateLimitMock.mockResolvedValue({
      ok: true,
      limit: 10,
      remaining: 9,
      retryAfterSeconds: 60,
    })
    getPublicListContentMock.mockResolvedValue({
      items: [],
      stories: [],
      wheelEntries: [],
    })
  })

  it('rejects invalid passwords and clears any stale access cookie', async () => {
    const secret = hashVisibilityPassword('correct-password')
    getPublicListBySlugMock.mockResolvedValue(createProtectedList())
    secretGetMock.mockResolvedValue({
      data: () => ({
        passwordSalt: secret.salt,
        passwordHash: secret.hash,
      }),
    })

    const response = await unlockPublicListRoute(
      new NextRequest('http://localhost/api/public-list/sample-list/unlock', {
        method: 'POST',
        body: JSON.stringify({ password: 'wrong-password' }),
        headers: {
          'content-type': 'application/json',
        },
      }),
      {
        params: {
          slug: 'sample-list',
        },
      }
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'invalid_password' })
    expect(response.headers.get('set-cookie')).toContain(`${getPublicAccessCookieName('sample-list')}=;`)
  })

  it('sets an access cookie only for a valid password', async () => {
    const secret = hashVisibilityPassword('correct-password')
    getPublicListBySlugMock.mockResolvedValue(createProtectedList())
    secretGetMock.mockResolvedValue({
      data: () => ({
        passwordSalt: secret.salt,
        passwordHash: secret.hash,
      }),
    })

    const response = await unlockPublicListRoute(
      new NextRequest('http://localhost/api/public-list/sample-list/unlock', {
        method: 'POST',
        body: JSON.stringify({ password: 'correct-password' }),
        headers: {
          'content-type': 'application/json',
        },
      }),
      {
        params: {
          slug: 'sample-list',
        },
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(response.headers.get('set-cookie')).toContain(getPublicAccessCookieName('sample-list'))
  })

  it('still accepts an older weak password value when it matches the stored hash', async () => {
    const legacyPassword = 'legacy1'
    const secret = hashVisibilityPassword(legacyPassword)
    getPublicListBySlugMock.mockResolvedValue(createProtectedList())
    secretGetMock.mockResolvedValue({
      data: () => ({
        passwordSalt: secret.salt,
        passwordHash: secret.hash,
      }),
    })

    const response = await unlockPublicListRoute(
      new NextRequest('http://localhost/api/public-list/sample-list/unlock', {
        method: 'POST',
        body: JSON.stringify({ password: legacyPassword }),
        headers: {
          'content-type': 'application/json',
        },
      }),
      {
        params: {
          slug: 'sample-list',
        },
      }
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  it('blocks content without a valid unlock cookie and allows it with a valid token', async () => {
    const list = createProtectedList()
    getPublicListBySlugMock.mockResolvedValue(list)

    const blockedResponse = await getPublicListContentRoute(
      new NextRequest('http://localhost/api/public-list/sample-list/content'),
      {
        params: {
          slug: 'sample-list',
        },
      }
    )

    expect(blockedResponse.status).toBe(401)
    expect(await blockedResponse.json()).toEqual({ error: 'password_required' })
    expect(getPublicListContentMock).not.toHaveBeenCalled()

    const token = createPublicAccessToken({
      listId: list.id,
      slug: list.slug,
    })

    const allowedResponse = await getPublicListContentRoute(
      new NextRequest('http://localhost/api/public-list/sample-list/content', {
        headers: {
          cookie: `${getPublicAccessCookieName(list.slug)}=${token}`,
        },
      }),
      {
        params: {
          slug: 'sample-list',
        },
      }
    )

    expect(allowedResponse.status).toBe(200)
    expect(getPublicListContentMock).toHaveBeenCalledWith(list.id)
  })

  it('requires a strong password for newly configured list protection', () => {
    expect(getVisibilityPasswordValidationError('short1!')).toBe('too_short')
    expect(getVisibilityPasswordValidationError('lowercase1!')).toBe('missing_uppercase')
    expect(getVisibilityPasswordValidationError('UPPERCASE1!')).toBe('missing_lowercase')
    expect(getVisibilityPasswordValidationError('NoSymbol12')).toBe('missing_symbol')
    expect(getVisibilityPasswordValidationError('NoNumber!!')).toBe('missing_number')
    expect(isValidVisibilityPassword('Stronger1!')).toBe(true)
  })
})
