import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { canManageGalleryExamples } from '@/lib/gallery-curator.server'
import { isEventType } from '@/lib/lists/types'

export const runtime = 'nodejs'

type ManageShowcaseBody = {
  listId?: string
  publish?: boolean
}

const parseBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

const verifyRequestUser = async (request: NextRequest) => {
  const token = parseBearerToken(request)
  if (!token) {
    return { error: 'missing_auth' as const }
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return {
      uid: decodedToken.uid,
      canManageGallery: await canManageGalleryExamples(decodedToken),
    }
  } catch {
    return { error: 'invalid_auth' as const }
  }
}

export async function GET(request: NextRequest) {
  const verifiedUser = await verifyRequestUser(request)
  if ('error' in verifiedUser) {
    return NextResponse.json({ error: verifiedUser.error }, { status: 401 })
  }

  if (!verifiedUser.canManageGallery) {
    return NextResponse.json({
      canManageGallery: false,
      listIds: [],
    })
  }

  const showcaseSnap = await adminDb
    .collection('galleryExamples')
    .where('ownerId', '==', verifiedUser.uid)
    .get()

  const showcaseEntries = showcaseSnap.docs.map((entry) => ({
    eventType: entry.id,
    listId: entry.data()?.listId,
  }))
  const listRefs = showcaseEntries
    .map((entry) => {
      return typeof entry.listId === 'string' && entry.listId.length > 0
        ? adminDb.collection('lists').doc(entry.listId)
        : null
    })
    .filter((entry): entry is FirebaseFirestore.DocumentReference => Boolean(entry))
  const listSnaps = listRefs.length > 0 ? await adminDb.getAll(...listRefs) : []
  const listSnapById = new Map(
    listSnaps
      .filter((entry) => entry.exists)
      .map((entry) => [entry.id, entry.data() as Record<string, unknown>])
  )
  const listIds = showcaseEntries
    .filter((entry) => isEventType(entry.eventType) && typeof entry.listId === 'string')
    .filter((entry) => {
      const listData = listSnapById.get(entry.listId)
      return listData?.ownerId === verifiedUser.uid
        && listData.visibility === 'public'
        && listData.eventType === entry.eventType
    })
    .map((entry) => entry.listId)

  return NextResponse.json({
    canManageGallery: true,
    listIds,
  })
}

export async function POST(request: NextRequest) {
  const verifiedUser = await verifyRequestUser(request)
  if ('error' in verifiedUser) {
    return NextResponse.json({ error: verifiedUser.error }, { status: 401 })
  }

  if (!verifiedUser.canManageGallery) {
    return NextResponse.json({ error: 'showcase_not_allowed' }, { status: 403 })
  }

  let body: ManageShowcaseBody
  try {
    body = (await request.json()) as ManageShowcaseBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const listId = body.listId?.trim() ?? ''
  if (!listId || typeof body.publish !== 'boolean') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const listRef = adminDb.collection('lists').doc(listId)
  const listSnap = await listRef.get()

  if (!listSnap.exists) {
    return NextResponse.json({ error: 'list_not_found' }, { status: 404 })
  }

  const listData = listSnap.data() as Record<string, unknown>
  if (listData.ownerId !== verifiedUser.uid) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const eventType = typeof listData.eventType === 'string'
    && isEventType(listData.eventType)
    ? listData.eventType
    : null

  if (!eventType) {
    return NextResponse.json({ error: 'invalid_event_type' }, { status: 400 })
  }

  if (body.publish && listData.visibility !== 'public') {
    return NextResponse.json({ error: 'showcase_requires_public' }, { status: 400 })
  }

  const existingMappingsSnap = await adminDb
    .collection('galleryExamples')
    .where('listId', '==', listId)
    .get()
  const showcaseRef = adminDb.collection('galleryExamples').doc(eventType)

  if (!body.publish) {
    if (!existingMappingsSnap.empty) {
      const batch = adminDb.batch()
      existingMappingsSnap.docs.forEach((entry) => batch.delete(entry.ref))
      await batch.commit()
    }

    return NextResponse.json({
      listId,
      showcased: false,
    })
  }

  await adminDb.runTransaction(async (transaction) => {
    const showcaseSnap = await transaction.get(showcaseRef)
    const nextPayload: Record<string, unknown> = {
      eventType,
      listId,
      ownerId: verifiedUser.uid,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (!showcaseSnap.exists) {
      nextPayload.createdAt = FieldValue.serverTimestamp()
    }

    transaction.set(showcaseRef, nextPayload)

    existingMappingsSnap.docs.forEach((entry) => {
      if (entry.id !== eventType) {
        transaction.delete(entry.ref)
      }
    })
  })

  return NextResponse.json({
    listId,
    showcased: true,
  })
}
