import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import {
  getPublicAccessCookieName,
  verifyPublicAccessToken,
} from '@/lib/lists/password.server'
import { getPublicListBySlug } from '@/lib/lists/public-server'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

const GUEST_NAME_MAX_LENGTH = 80
const GUEST_MESSAGE_MAX_LENGTH = 240

type SaveReservationDetailsBody = {
  itemId?: string
  guestName?: string
  guestMessage?: string
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

  if (guestName.length > GUEST_NAME_MAX_LENGTH) {
    return NextResponse.json({ error: 'invalid_guest_name' }, { status: 400 })
  }

  if (guestMessage.length > GUEST_MESSAGE_MAX_LENGTH) {
    return NextResponse.json({ error: 'invalid_guest_message' }, { status: 400 })
  }

  const itemRef = adminDb
    .collection('lists')
    .doc(list.id)
    .collection('items')
    .doc(itemId)

  const itemSnap = await itemRef.get()
  if (!itemSnap.exists) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const itemData = itemSnap.data() as Record<string, unknown>
  if (itemData.status !== 'reserved') {
    return NextResponse.json({ error: 'item_not_reserved' }, { status: 409 })
  }

  await itemRef.update({
    reservedByName: guestName || null,
    reservedMessage: guestMessage || null,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
