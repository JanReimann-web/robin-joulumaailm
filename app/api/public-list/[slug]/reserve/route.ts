import { NextRequest, NextResponse } from 'next/server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { addDays, resolveListAccessStatus, TRIAL_DAYS } from '@/lib/lists/access'
import {
  getPublicAccessCookieName,
  verifyPublicAccessToken,
} from '@/lib/lists/password.server'
import { getPublicListBySlug } from '@/lib/lists/public-server'
import { GiftListItem } from '@/lib/lists/types'

export const runtime = 'nodejs'

type ReserveBody = {
  itemId?: string
  guestName?: string
  guestMessage?: string
}

type RouteContext = {
  params: {
    slug: string
  }
}

const toMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  return null
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const list = await getPublicListBySlug(context.params.slug)
  if (!list) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
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

  let body: ReserveBody
  try {
    body = (await request.json()) as ReserveBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const itemId = body.itemId?.trim()
  if (!itemId) {
    return NextResponse.json({ error: 'missing_item_id' }, { status: 400 })
  }

  const listRef = adminDb.collection('lists').doc(list.id)
  const itemRef = listRef.collection('items').doc(itemId)
  const reservationRef = listRef.collection('reservations').doc()

  try {
    await adminDb.runTransaction(async (transaction) => {
      const listSnap = await transaction.get(listRef)
      if (!listSnap.exists) {
        throw new Error('not_found')
      }

      const listData = listSnap.data() as Record<string, unknown>
      const listCreatedAt = toMillis(listData.createdAt)
      const listTrialEndsAtRaw = toMillis(listData.trialEndsAt)
      const listAccessStatus = resolveListAccessStatus({
        trialEndsAt: listTrialEndsAtRaw ?? (
          listCreatedAt ? addDays(new Date(listCreatedAt), TRIAL_DAYS).getTime() : null
        ),
        paidAccessEndsAt: toMillis(listData.paidAccessEndsAt),
      })

      if (listAccessStatus === 'expired') {
        throw new Error('list_expired')
      }

      const itemSnap = await transaction.get(itemRef)
      if (!itemSnap.exists) {
        throw new Error('not_found')
      }

      const itemData = itemSnap.data() as Record<string, unknown>
      const currentStatus = itemData.status as GiftListItem['status']
      if (currentStatus !== 'available') {
        throw new Error('item_unavailable')
      }

      transaction.update(itemRef, {
        status: 'reserved',
        reservedByName: body.guestName?.trim() || null,
        reservedMessage: body.guestMessage?.trim() || null,
        reservedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      transaction.set(reservationRef, {
        itemId,
        guestName: body.guestName?.trim() || null,
        guestMessage: body.guestMessage?.trim() || null,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (!(error instanceof Error)) {
      return NextResponse.json({ error: 'reserve_failed' }, { status: 500 })
    }

    if (error.message === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    if (error.message === 'item_unavailable') {
      return NextResponse.json({ error: 'item_unavailable' }, { status: 409 })
    }

    if (error.message === 'list_expired') {
      return NextResponse.json({ error: 'list_expired' }, { status: 410 })
    }

    return NextResponse.json({ error: 'reserve_failed' }, { status: 500 })
  }
}

