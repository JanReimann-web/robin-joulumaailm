import 'server-only'
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import {
  isValidVisibilityPassword as isValidVisibilityPasswordByPolicy,
} from '@/lib/lists/password-policy'

const PASSWORD_HASH_LENGTH = 64
const ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30
const ACCESS_TOKEN_VERSION = 1
const PUBLIC_ACCESS_COOKIE_PREFIX = 'giftlist_access_'
const RESERVATION_ACCESS_COOKIE_PREFIX = 'giftlist_reservation_'
const RESERVATION_ACCESS_TOKEN_VERSION = 1
const RESERVATION_ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30

const getAccessTokenSecret = () => {
  const configured =
    process.env.PUBLIC_LIST_ACCESS_SECRET
    ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (configured) {
    return configured
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('missing_public_list_access_secret')
  }

  return 'dev-public-list-access-secret'
}

const toBase64Url = (value: string) => {
  return Buffer.from(value, 'utf8').toString('base64url')
}

const fromBase64Url = (value: string) => {
  return Buffer.from(value, 'base64url').toString('utf8')
}

const sign = (payload: string) => {
  return createHmac('sha256', getAccessTokenSecret())
    .update(payload)
    .digest('base64url')
}

export const isValidVisibilityPassword = isValidVisibilityPasswordByPolicy

export const hashVisibilityPassword = (
  password: string,
  salt = randomBytes(16).toString('hex')
) => {
  const normalized = password.trim()
  const hash = scryptSync(normalized, salt, PASSWORD_HASH_LENGTH).toString('hex')

  return {
    salt,
    hash,
  }
}

export const verifyVisibilityPassword = (params: {
  password: string
  salt: string
  hash: string
}) => {
  const candidate = scryptSync(
    params.password.trim(),
    params.salt,
    PASSWORD_HASH_LENGTH
  )
  const source = Buffer.from(params.hash, 'hex')

  if (source.length !== candidate.length) {
    return false
  }

  return timingSafeEqual(source, candidate)
}

export const createPublicAccessToken = (params: {
  listId: string
  slug: string
}) => {
  const payload = toBase64Url(
    JSON.stringify({
      v: ACCESS_TOKEN_VERSION,
      listId: params.listId,
      slug: params.slug,
      exp: Date.now() + ACCESS_TOKEN_TTL_MS,
    })
  )
  const signature = sign(payload)

  return `${payload}.${signature}`
}

export const getPublicAccessCookieName = (slug: string) => {
  return `${PUBLIC_ACCESS_COOKIE_PREFIX}${slug}`
}

const getReservationCookieSuffix = (itemId: string) => {
  return createHash('sha256').update(itemId).digest('hex').slice(0, 24)
}

export const getReservationAccessCookieName = (params: {
  slug: string
  itemId: string
}) => {
  return `${RESERVATION_ACCESS_COOKIE_PREFIX}${params.slug}_${getReservationCookieSuffix(params.itemId)}`
}

export const createReservationAccessToken = (params: {
  listId: string
  slug: string
  itemId: string
  reservationId: string
}) => {
  const payload = toBase64Url(
    JSON.stringify({
      v: RESERVATION_ACCESS_TOKEN_VERSION,
      listId: params.listId,
      slug: params.slug,
      itemId: params.itemId,
      reservationId: params.reservationId,
      exp: Date.now() + RESERVATION_ACCESS_TOKEN_TTL_MS,
    })
  )
  const signature = sign(payload)

  return `${payload}.${signature}`
}

export const verifyReservationAccessToken = (params: {
  token: string
  listId: string
  slug: string
  itemId: string
  reservationId: string
}) => {
  const parsed = readReservationAccessToken(params.token)
  if (!parsed) {
    return false
  }

  return (
    parsed.listId === params.listId
    && parsed.slug === params.slug
    && parsed.itemId === params.itemId
    && parsed.reservationId === params.reservationId
  )
}

export const readReservationAccessToken = (token: string) => {
  const parts = token.split('.')
  if (parts.length !== 2) {
    return null
  }

  const [payload, signature] = parts
  const expectedSignature = sign(payload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as {
      v?: number
      listId?: string
      slug?: string
      itemId?: string
      reservationId?: string
      exp?: number
    }

    const isValid = (
      parsed.v === RESERVATION_ACCESS_TOKEN_VERSION
      && typeof parsed.exp === 'number'
      && parsed.exp > Date.now()
    )

    if (!isValid) {
      return null
    }

    return {
      listId: parsed.listId ?? '',
      slug: parsed.slug ?? '',
      itemId: parsed.itemId ?? '',
      reservationId: parsed.reservationId ?? '',
    }
  } catch {
    return null
  }
}

export const verifyPublicAccessToken = (params: {
  token: string
  listId: string
  slug: string
}) => {
  const parts = params.token.split('.')
  if (parts.length !== 2) {
    return false
  }

  const [payload, signature] = parts
  if (!payload || !signature) {
    return false
  }

  const expectedSignature = sign(payload)
  const signatureBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return false
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as {
      v?: number
      listId?: string
      slug?: string
      exp?: number
    }

    if (parsed.v !== ACCESS_TOKEN_VERSION) {
      return false
    }

    if (parsed.listId !== params.listId || parsed.slug !== params.slug) {
      return false
    }

    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) {
      return false
    }

    return true
  } catch {
    return false
  }
}
