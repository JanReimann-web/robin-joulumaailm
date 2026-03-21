import 'server-only'
import { createHash } from 'crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

type RateLimitWindow = {
  count?: number
  resetAt?: Timestamp
}

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

const RATE_LIMITS_COLLECTION = 'requestRateLimits'

const getClientIp = (request: NextRequest) => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) {
      return firstIp
    }
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export const getRateLimitFingerprint = (request: NextRequest) => {
  const userAgent = request.headers.get('user-agent')?.trim() || 'unknown'
  return `${getClientIp(request)}|${createHash('sha256').update(userAgent).digest('hex').slice(0, 16)}`
}

const buildDocId = (scope: string, key: string) => {
  const digest = createHash('sha256').update(`${scope}:${key}`).digest('hex')
  return `${scope}:${digest}`
}

export const consumeRateLimit = async (params: {
  scope: string
  key: string
  limit: number
  windowMs: number
}): Promise<RateLimitResult> => {
  const docRef = adminDb.collection(RATE_LIMITS_COLLECTION).doc(buildDocId(params.scope, params.key))
  const now = Date.now()
  const resetAtMs = now + params.windowMs

  return await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef)
    const data = snapshot.data() as RateLimitWindow | undefined
    const existingResetAtMs = data?.resetAt instanceof Timestamp
      ? data.resetAt.toMillis()
      : 0
    const windowExpired = existingResetAtMs <= now
    const currentCount = windowExpired ? 0 : Math.max(0, Number(data?.count ?? 0))
    const nextCount = currentCount + 1
    const remaining = Math.max(0, params.limit - nextCount)
    const retryAfterSeconds = windowExpired
      ? Math.ceil(params.windowMs / 1000)
      : Math.max(1, Math.ceil((existingResetAtMs - now) / 1000))

    if (!windowExpired && currentCount >= params.limit) {
      transaction.set(docRef, {
        count: currentCount,
        resetAt: data?.resetAt ?? Timestamp.fromMillis(existingResetAtMs),
        expiresAt: data?.resetAt ?? Timestamp.fromMillis(existingResetAtMs),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })

      return {
        ok: false,
        limit: params.limit,
        remaining: 0,
        retryAfterSeconds,
      }
    }

    const nextResetAt = Timestamp.fromMillis(windowExpired ? resetAtMs : existingResetAtMs)
    transaction.set(docRef, {
      count: nextCount,
      resetAt: nextResetAt,
      expiresAt: nextResetAt,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: snapshot.exists ? snapshot.get('createdAt') ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    }, { merge: true })

    return {
      ok: true,
      limit: params.limit,
      remaining,
      retryAfterSeconds,
    }
  })
}

export const createRateLimitResponse = (retryAfterSeconds: number) => {
  return NextResponse.json(
    { error: 'rate_limited' },
    {
      status: 429,
      headers: {
        'retry-after': String(retryAfterSeconds),
      },
    }
  )
}
