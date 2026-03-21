import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import {
  getPublicAccessCookieName,
  getReservationAccessCookieName,
  readReservationAccessToken,
  verifyReservationAccessToken,
  verifyPublicAccessToken,
} from '@/lib/lists/password.server'
import { getPublicListBySlug } from '@/lib/lists/public-server'
import { adminDb } from '@/lib/firebase/admin'
import {
  consumeRateLimit,
  createRateLimitResponse,
  getRateLimitFingerprint,
} from '@/lib/security/request-rate-limit.server'

export const runtime = 'nodejs'

const GUEST_NAME_MAX_LENGTH = 80
const GUEST_MESSAGE_MAX_LENGTH = 240

type SaveReservationDetailsBody = {
  itemId?: string
  guestName?: string
  guestMessage?: string
  reservedNamePublic?: boolean
}

type RouteContext = {
  params: {
    slug: string
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const list = await getPublicListBySlug(context.params.slug)
  if (!list) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (list.accessStatus !== 'active') {
    return NextResponse.json({ error: 'list_expired' }, { status: 410 })
  }

  if (list.visibility === 'public_password') {
    const cookieName = getPublicAccessCookieName(list.slug)
    const token = request.cookies.get(cookieName)?.value

    if (
      !token
      || !verifyPublicAccessToken({
        token,
        listId: list.id,
        slug: list.slug,
      })
    ) {
      return NextResponse.json({ error: 'password_required' }, { status: 401 })
    }
  }

  let body: SaveReservationDetailsBody
  try {
    body = (await request.json()) as SaveReservationDetailsBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const itemId = body.itemId?.trim()
  if (!itemId) {
    return NextResponse.json({ error: 'missing_item_id' }, { status: 400 })
  }

  const guestName = body.guestName?.trim() ?? ''
  const guestMessage = body.guestMessage?.trim() ?? ''
  const reservedNamePublic = body.reservedNamePublic === true

  if (!guestName) {
    return NextResponse.json({ error: 'missing_guest_name' }, { status: 400 })
  }

  if (guestName.length > GUEST_NAME_MAX_LENGTH) {
    return NextResponse.json({ error: 'invalid_guest_name' }, { status: 400 })
  }

  if (guestMessage.length > GUEST_MESSAGE_MAX_LENGTH) {
    return NextResponse.json({ error: 'invalid_guest_message' }, { status: 400 })
  }

  const rateLimit = await consumeRateLimit({
    scope: 'public-list-reservation-details',
    key: `${list.slug}:${getRateLimitFingerprint(request)}`,
    limit: 20,
    windowMs: 1000 * 60 * 10,
  })
  if (!rateLimit.ok) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds)
  }

  const reservationCookie = request.cookies.get(
    getReservationAccessCookieName({
      slug: list.slug,
      itemId,
    })
  )?.value
  if (!reservationCookie) {
    return NextResponse.json({ error: 'reservation_session_required' }, { status: 403 })
  }
  const reservationSession = readReservationAccessToken(reservationCookie)
  if (!reservationSession) {
    return NextResponse.json({ error: 'reservation_session_required' }, { status: 403 })
  }

  const itemRef = adminDb
    .collection('lists')
    .doc(list.id)
    .collection('items')
    .doc(itemId)

  const reservationDocRef = adminDb
    .collection('lists')
    .doc(list.id)
    .collection('reservations')
    .doc(reservationSession.reservationId)
  const reservationDoc = await reservationDocRef.get()
  if (!reservationDoc.exists) {
    return NextResponse.json({ error: 'reservation_not_found' }, { status: 404 })
  }
  const reservationData = reservationDoc.data() as Record<string, unknown>

  if (!verifyReservationAccessToken({
    token: reservationCookie,
    listId: list.id,
    slug: list.slug,
    itemId,
    reservationId: reservationDoc.id,
  })) {
    return NextResponse.json({ error: 'reservation_session_required' }, { status: 403 })
  }

  if (reservationData.itemId !== itemId || reservationData.status !== 'active') {
    return NextResponse.json({ error: 'reservation_not_found' }, { status: 404 })
  }

  const itemSnap = await itemRef.get()
  if (!itemSnap.exists) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const itemData = itemSnap.data() as Record<string, unknown>
  if (itemData.status !== 'reserved') {
    return NextResponse.json({ error: 'item_not_reserved' }, { status: 409 })
  }

  await adminDb.runTransaction(async (transaction) => {
    transaction.update(itemRef, {
      reservedByName: guestName,
      reservedNamePublic,
      reservedMessage: guestMessage || null,
      updatedAt: FieldValue.serverTimestamp(),
    })

    transaction.update(reservationDocRef, {
      guestName,
      reservedNamePublic,
      guestMessage: guestMessage || null,
      updatedAt: FieldValue.serverTimestamp(),
    })
  })

  return NextResponse.json({ ok: true })
}
