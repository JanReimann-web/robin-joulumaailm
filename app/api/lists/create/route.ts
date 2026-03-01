import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { addDays, TRIAL_DAYS } from '@/lib/lists/access'
import { hashVisibilityPassword, isValidVisibilityPassword } from '@/lib/lists/password.server'
import { isReservedSlug, isValidSlug, sanitizeSlug } from '@/lib/lists/slug'
import { EVENT_TYPES, TEMPLATE_IDS, VISIBILITY_OPTIONS } from '@/lib/lists/types'

export const runtime = 'nodejs'

type CreateListBody = {
  title?: string
  slug?: string
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

const isEventType = (value: string): value is (typeof EVENT_TYPES)[number] => {
  return EVENT_TYPES.includes(value as (typeof EVENT_TYPES)[number])
}

const isTemplateId = (
  value: string
): value is (typeof TEMPLATE_IDS)[number] => {
  return TEMPLATE_IDS.includes(value as (typeof TEMPLATE_IDS)[number])
}

const isVisibility = (
  value: string
): value is (typeof VISIBILITY_OPTIONS)[number] => {
  return VISIBILITY_OPTIONS.includes(value as (typeof VISIBILITY_OPTIONS)[number])
}

export async function POST(request: NextRequest) {
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

  let body: CreateListBody
  try {
    body = (await request.json()) as CreateListBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const title = body.title?.trim() ?? ''
  const normalizedSlug = sanitizeSlug(body.slug ?? '')
  const eventType = body.eventType ?? ''
  const templateId = body.templateId ?? ''
  const visibility = body.visibility ?? ''

  if (!title) {
    return NextResponse.json({ error: 'missing_title' }, { status: 400 })
  }

  if (!isValidSlug(normalizedSlug)) {
    return NextResponse.json({ error: 'invalid_slug' }, { status: 400 })
  }

  if (isReservedSlug(normalizedSlug)) {
    return NextResponse.json({ error: 'reserved_slug' }, { status: 400 })
  }

  if (!isEventType(eventType)) {
    return NextResponse.json({ error: 'invalid_event_type' }, { status: 400 })
  }

  if (!isTemplateId(templateId)) {
    return NextResponse.json({ error: 'invalid_template_id' }, { status: 400 })
  }

  if (!isVisibility(visibility)) {
    return NextResponse.json({ error: 'invalid_visibility' }, { status: 400 })
  }

  const visibilityPassword = body.visibilityPassword?.trim() ?? ''
  if (visibility === 'public_password' && !isValidVisibilityPassword(visibilityPassword)) {
    return NextResponse.json({ error: 'invalid_visibility_password' }, { status: 400 })
  }

  const listsCollection = adminDb.collection('lists')
  const listRef = listsCollection.doc()
  const slugRef = adminDb.collection('slugClaims').doc(normalizedSlug)
  const secretRef = adminDb.collection('listAccessSecrets').doc(listRef.id)

  try {
    await adminDb.runTransaction(async (transaction) => {
      const slugSnap = await transaction.get(slugRef)
      if (slugSnap.exists) {
        throw new Error('slug_taken')
      }

      const now = new Date()
      const trialEndsAt = Timestamp.fromDate(addDays(now, TRIAL_DAYS))

      transaction.set(listRef, {
        ownerId: decodedToken.uid,
        title,
        slug: normalizedSlug,
        eventType,
        templateId,
        visibility,
        status: 'draft',
        billingModel: 'one_time_90d',
        trialEndsAt,
        paidAccessEndsAt: null,
        purgeAt: trialEndsAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      transaction.set(slugRef, {
        slug: normalizedSlug,
        ownerId: decodedToken.uid,
        listId: listRef.id,
        createdAt: FieldValue.serverTimestamp(),
      })

      if (visibility === 'public_password') {
        const secret = hashVisibilityPassword(visibilityPassword)
        transaction.set(secretRef, {
          listId: listRef.id,
          passwordHash: secret.hash,
          passwordSalt: secret.salt,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
    })

    return NextResponse.json({
      listId: listRef.id,
      slug: normalizedSlug,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'slug_taken') {
      return NextResponse.json({ error: 'slug_taken' }, { status: 409 })
    }

    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}

