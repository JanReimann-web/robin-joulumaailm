import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { deleteListWithAssets } from '@/lib/lists/delete.server'

export const runtime = 'nodejs'

type RouteContext = {
  params: {
    listId: string
  }
}

const parseBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
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

  const listId = context.params.listId?.trim()
  if (!listId) {
    return NextResponse.json({ error: 'invalid_list_id' }, { status: 400 })
  }

  const listRef = adminDb.collection('lists').doc(listId)
  const listSnap = await listRef.get()
  if (!listSnap.exists) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const listData = listSnap.data() as Record<string, unknown>
  if (listData.ownerId !== decodedToken.uid) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const slug = typeof listData.slug === 'string' ? listData.slug : null
  const ownerId = typeof listData.ownerId === 'string' ? listData.ownerId : null

  try {
    const result = await deleteListWithAssets({
      listId,
      slug,
      ownerId,
    })

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}

