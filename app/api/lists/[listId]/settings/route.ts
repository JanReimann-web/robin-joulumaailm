import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { hasServerSideComplimentaryEntitlement } from '@/lib/account-entitlements.server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { hasPublishedListAccess, resolveListAccessStatus } from '@/lib/lists/access'
import { hashVisibilityPassword, isValidVisibilityPassword } from '@/lib/lists/password.server'
import { BILLING_PLAN_IDS, type BillingPlanId, isVisibilityAllowedForPlan } from '@/lib/lists/plans'
import {
  VISIBILITY_OPTIONS,
  isEventType,
  isTemplateAllowedForEvent,
} from '@/lib/lists/types'

export const runtime = 'nodejs'

type RouteContext = {
  params: {
    listId: string
  }
}

type UpdateListSettingsBody = {
  eventType?: string
  templateId?: string
  visibility?: string
  visibilityPassword?: string
}

const parseBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

const isVisibility = (
  value: string
): value is (typeof VISIBILITY_OPTIONS)[number] => {
  return VISIBILITY_OPTIONS.includes(value as (typeof VISIBILITY_OPTIONS)[number])
}

const toMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  return null
}

const toBillingPlanId = (value: unknown): BillingPlanId | null => {
  if (typeof value !== 'string') {
    return null
  }

  return BILLING_PLAN_IDS.includes(value as BillingPlanId)
    ? (value as BillingPlanId)
    : null
}

export async function POST(request: NextRequest, context: RouteContext) {
  const token = parseBearerToken(request)
  if (!token) {
    return NextResponse.json({ error: 'missing_auth' }, { status: 401 })
  }

  let decodedToken
  try {
    decodedToken = await adminAuth.verifyIdToken(token)
  } catch {
    return NextResponse.json({ error: 'invalid_auth' }, { status: 401 })
  }

  let body: UpdateListSettingsBody
  try {
    body = (await request.json()) as UpdateListSettingsBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const eventType = body.eventType ?? ''
  const templateId = body.templateId ?? ''
  const visibility = body.visibility ?? ''
  const visibilityPassword = body.visibilityPassword?.trim() ?? ''

  if (!isEventType(eventType)) {
    return NextResponse.json({ error: 'invalid_event_type' }, { status: 400 })
  }

  if (!isTemplateAllowedForEvent(eventType, templateId)) {
    return NextResponse.json({ error: 'invalid_template_id' }, { status: 400 })
  }

  if (!isVisibility(visibility)) {
    return NextResponse.json({ error: 'invalid_visibility' }, { status: 400 })
  }

  const listId = context.params.listId?.trim()
  if (!listId) {
    return NextResponse.json({ error: 'invalid_list_id' }, { status: 400 })
  }

  const listRef = adminDb.collection('lists').doc(listId)
  const secretRef = adminDb.collection('listAccessSecrets').doc(listId)
  const hasComplimentaryAccess = await hasServerSideComplimentaryEntitlement(decodedToken.uid)

  try {
    await adminDb.runTransaction(async (transaction) => {
      const listSnap = await transaction.get(listRef)
      if (!listSnap.exists) {
        throw new Error('not_found')
      }

      const listData = listSnap.data() as Record<string, unknown>
      if (listData.ownerId !== decodedToken.uid) {
        throw new Error('forbidden')
      }

      const trialEndsAt = toMillis(listData.trialEndsAt)
      const paidAccessEndsAt = toMillis(listData.paidAccessEndsAt)
      const billingPlanId = toBillingPlanId(listData.billingPlanId)
      const listAccessStatus = resolveListAccessStatus({
        trialEndsAt,
        paidAccessEndsAt,
        complimentaryAccess: hasComplimentaryAccess,
      })

      if (listAccessStatus === 'expired') {
        throw new Error('access_expired')
      }

      if (
        visibility === 'public_password'
        && hasPublishedListAccess({
          paidAccessEndsAt,
          complimentaryAccess: hasComplimentaryAccess,
        })
        && !hasComplimentaryAccess
        && !isVisibilityAllowedForPlan(billingPlanId, visibility)
      ) {
        throw new Error('visibility_requires_premium')
      }

      const secretSnap = visibility === 'public_password'
        ? await transaction.get(secretRef)
        : null

      const needsNewPassword = visibility === 'public_password' && !(secretSnap?.exists ?? false)
      const hasPasswordInput = visibilityPassword.length > 0

      if (needsNewPassword && !hasPasswordInput) {
        throw new Error('invalid_visibility_password')
      }

      if (hasPasswordInput && !isValidVisibilityPassword(visibilityPassword)) {
        throw new Error('invalid_visibility_password')
      }

      transaction.update(listRef, {
        eventType,
        templateId,
        visibility,
        updatedAt: FieldValue.serverTimestamp(),
      })

      if (visibility !== 'public_password') {
        transaction.delete(secretRef)
        return
      }

      if (!hasPasswordInput) {
        return
      }

      const secret = hashVisibilityPassword(visibilityPassword)
      const payload: Record<string, unknown> = {
        listId,
        passwordHash: secret.hash,
        passwordSalt: secret.salt,
        updatedAt: FieldValue.serverTimestamp(),
      }

      if (!(secretSnap?.exists ?? false)) {
        payload.createdAt = FieldValue.serverTimestamp()
      }

      transaction.set(secretRef, payload, { merge: true })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    if (error instanceof Error && error.message === 'forbidden') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    if (error instanceof Error && error.message === 'invalid_visibility_password') {
      return NextResponse.json({ error: 'invalid_visibility_password' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'visibility_requires_premium') {
      return NextResponse.json({ error: 'visibility_requires_premium' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'access_expired') {
      return NextResponse.json({ error: 'access_expired' }, { status: 403 })
    }

    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}
