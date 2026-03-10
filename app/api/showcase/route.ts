import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { hasServerSideComplimentaryEntitlement } from '@/lib/account-entitlements.server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

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
    return { uid: decodedToken.uid }
  } catch {
    return { error: 'invalid_auth' as const }
  }
}

export async function GET(request: NextRequest) {
  const verifiedUser = await verifyRequestUser(request)
  if ('error' in verifiedUser) {
    return NextResponse.json({ error: verifiedUser.error }, { status: 401 })
  }

  const hasComplimentaryAccess = await hasServerSideComplimentaryEntitlement(verifiedUser.uid)
  if (!hasComplimentaryAccess) {
    return NextResponse.json({ error: 'showcase_not_allowed' }, { status: 403 })
  }

  const showcaseSnap = await adminDb
    .collection('showcaseLists')
    .where('ownerId', '==', verifiedUser.uid)
    .get()

  const listIds = showcaseSnap.docs
    .filter((entry) => entry.data()?.status === 'published')
    .map((entry) => entry.id)

  return NextResponse.json({ listIds })
}

export async function POST(request: NextRequest) {
  const verifiedUser = await verifyRequestUser(request)
  if ('error' in verifiedUser) {
    return NextResponse.json({ error: verifiedUser.error }, { status: 401 })
  }

  const hasComplimentaryAccess = await hasServerSideComplimentaryEntitlement(verifiedUser.uid)
  if (!hasComplimentaryAccess) {
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
  const showcaseRef = adminDb.collection('showcaseLists').doc(listId)
  const listSnap = await listRef.get()

  if (!listSnap.exists) {
    return NextResponse.json({ error: 'list_not_found' }, { status: 404 })
  }

  const listData = listSnap.data() as Record<string, unknown>
  if (listData.ownerId !== verifiedUser.uid) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (body.publish && listData.visibility !== 'public') {
    return NextResponse.json({ error: 'showcase_requires_public' }, { status: 400 })
  }

  if (!body.publish) {
    await showcaseRef.delete()
    return NextResponse.json({
      listId,
      showcased: false,
    })
  }

  await adminDb.runTransaction(async (transaction) => {
    const showcaseSnap = await transaction.get(showcaseRef)
    const nextPayload: Record<string, unknown> = {
      listId,
      ownerId: verifiedUser.uid,
      status: 'published',
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (!showcaseSnap.exists) {
      nextPayload.createdAt = FieldValue.serverTimestamp()
      nextPayload.featuredAt = FieldValue.serverTimestamp()
    }

    transaction.set(showcaseRef, nextPayload, { merge: true })
  })

  return NextResponse.json({
    listId,
    showcased: true,
  })
}
