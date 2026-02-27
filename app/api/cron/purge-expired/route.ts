import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminStorage } from '@/lib/firebase/admin'
import { DocumentReference, Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_BATCH_SIZE = 25
const MAX_BATCH_SIZE = 100

const parseNumber = (value: string | null) => {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed
}

const parseBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

const isAuthorized = (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return false
  }

  const bearerToken = parseBearerToken(request)
  const headerSecret = request.headers.get('x-cron-secret')

  return bearerToken === cronSecret || headerSecret === cronSecret
}

const deleteSubcollection = async (listRef: DocumentReference, collectionName: string) => {
  let deletedCount = 0

  while (true) {
    const snapshot = await listRef.collection(collectionName).limit(300).get()
    if (snapshot.empty) {
      break
    }

    const batch = adminDb.batch()
    snapshot.docs.forEach((entry) => batch.delete(entry.ref))
    await batch.commit()

    deletedCount += snapshot.size
  }

  return deletedCount
}

const deleteSlugClaimsForList = async (listId: string, slug: string | null) => {
  let deletedCount = 0

  if (slug) {
    const slugRef = adminDb.collection('slugClaims').doc(slug)
    const slugSnapshot = await slugRef.get()
    if (slugSnapshot.exists) {
      await slugRef.delete()
      deletedCount += 1
    }
  }

  const claimSnapshot = await adminDb
    .collection('slugClaims')
    .where('listId', '==', listId)
    .get()

  if (!claimSnapshot.empty) {
    const batch = adminDb.batch()
    claimSnapshot.docs.forEach((entry) => batch.delete(entry.ref))
    await batch.commit()
    deletedCount += claimSnapshot.size
  }

  return deletedCount
}

const deleteListStorage = async (listId: string) => {
  try {
    const bucket = adminStorage.bucket()
    await bucket.deleteFiles({ prefix: `lists/${listId}/`, force: true })
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1'
  const batchSizeInput = parseNumber(request.nextUrl.searchParams.get('limit'))
  const batchSize = Math.min(
    MAX_BATCH_SIZE,
    Math.max(1, batchSizeInput ?? DEFAULT_BATCH_SIZE)
  )

  const now = Timestamp.fromDate(new Date())
  const dueLists = await adminDb
    .collection('lists')
    .where('purgeAt', '<=', now)
    .limit(batchSize)
    .get()

  if (dueLists.empty) {
    return NextResponse.json({
      ok: true,
      mode: dryRun ? 'dry-run' : 'delete',
      scanned: 0,
      deletedLists: 0,
      deletedItems: 0,
      deletedReservations: 0,
      deletedSlugClaims: 0,
      deletedStorageFolders: 0,
    })
  }

  let deletedLists = 0
  let deletedItems = 0
  let deletedReservations = 0
  let deletedSlugClaims = 0
  let deletedStorageFolders = 0

  const preview = dueLists.docs.map((entry) => {
    const payload = entry.data() as Record<string, unknown>
    return {
      listId: entry.id,
      slug: typeof payload.slug === 'string' ? payload.slug : null,
    }
  })

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      mode: 'dry-run',
      scanned: dueLists.size,
      deletedLists,
      deletedItems,
      deletedReservations,
      deletedSlugClaims,
      deletedStorageFolders,
      preview,
    })
  }

  for (const entry of dueLists.docs) {
    const payload = entry.data() as Record<string, unknown>
    const slug = typeof payload.slug === 'string' ? payload.slug : null

    const removedItems = await deleteSubcollection(entry.ref, 'items')
    const removedReservations = await deleteSubcollection(entry.ref, 'reservations')
    const removedSlugClaims = await deleteSlugClaimsForList(entry.id, slug)
    const removedStorage = await deleteListStorage(entry.id)

    await entry.ref.delete()

    deletedLists += 1
    deletedItems += removedItems
    deletedReservations += removedReservations
    deletedSlugClaims += removedSlugClaims
    if (removedStorage) {
      deletedStorageFolders += 1
    }
  }

  return NextResponse.json({
    ok: true,
    mode: 'delete',
    scanned: dueLists.size,
    deletedLists,
    deletedItems,
    deletedReservations,
    deletedSlugClaims,
    deletedStorageFolders,
    preview,
  })
}
