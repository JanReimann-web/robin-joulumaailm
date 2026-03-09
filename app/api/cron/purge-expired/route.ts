import { NextRequest, NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { hasServerSideComplimentaryEntitlement } from '@/lib/account-entitlements.server'
import { deleteListWithAssets } from '@/lib/lists/delete.server'

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

const getDueListsBatch = async (params: {
  limit: number
  now: Timestamp
}) => {
  const dueEntries: FirebaseFirestore.QueryDocumentSnapshot[] = []
  let scanned = 0
  let lastEntry: FirebaseFirestore.QueryDocumentSnapshot | null = null

  while (dueEntries.length < params.limit) {
    let query = adminDb
      .collection('lists')
      .where('purgeAt', '<=', params.now)
      .orderBy('purgeAt')
      .limit(params.limit)

    if (lastEntry) {
      query = query.startAfter(lastEntry)
    }

    const snapshot = await query.get()
    if (snapshot.empty) {
      break
    }

    scanned += snapshot.size

    for (const entry of snapshot.docs) {
      const payload = entry.data() as Record<string, unknown>
      const ownerId = typeof payload.ownerId === 'string' ? payload.ownerId : null
      const hasComplimentaryAccess = ownerId
        ? await hasServerSideComplimentaryEntitlement(ownerId)
        : false

      if (!hasComplimentaryAccess) {
        dueEntries.push(entry)
      }

      if (dueEntries.length >= params.limit) {
        break
      }
    }

    lastEntry = snapshot.docs[snapshot.docs.length - 1] ?? null
  }

  return {
    dueEntries,
    scanned,
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
  const { dueEntries, scanned } = await getDueListsBatch({
    limit: batchSize,
    now,
  })

  if (dueEntries.length === 0) {
    return NextResponse.json({
      ok: true,
      mode: dryRun ? 'dry-run' : 'delete',
      scanned,
      deletedLists: 0,
      deletedItems: 0,
      deletedReservations: 0,
      deletedStories: 0,
      deletedWheelEntries: 0,
      deletedSlugClaims: 0,
      deletedSecrets: 0,
      deletedStorageFolders: 0,
    })
  }

  let deletedLists = 0
  let deletedItems = 0
  let deletedReservations = 0
  let deletedStories = 0
  let deletedWheelEntries = 0
  let deletedSlugClaims = 0
  let deletedSecrets = 0
  let deletedStorageFolders = 0

  const preview = dueEntries.map((entry) => {
    const payload = entry.data() as Record<string, unknown>
    return {
      listId: entry.id,
      slug: typeof payload.slug === 'string' ? payload.slug : null,
      ownerId: typeof payload.ownerId === 'string' ? payload.ownerId : null,
    }
  })

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      mode: 'dry-run',
      scanned,
      deletedLists,
      deletedItems,
      deletedReservations,
      deletedStories,
      deletedWheelEntries,
      deletedSlugClaims,
      deletedSecrets,
      deletedStorageFolders,
      preview,
    })
  }

  for (const entry of dueEntries) {
    const payload = entry.data() as Record<string, unknown>
    const slug = typeof payload.slug === 'string' ? payload.slug : null
    const ownerId = typeof payload.ownerId === 'string' ? payload.ownerId : null

    const removed = await deleteListWithAssets({
      listId: entry.id,
      slug,
      ownerId,
    })

    deletedLists += removed.deletedList
    deletedItems += removed.deletedItems
    deletedReservations += removed.deletedReservations
    deletedStories += removed.deletedStories
    deletedWheelEntries += removed.deletedWheelEntries
    deletedSlugClaims += removed.deletedSlugClaims
    deletedSecrets += removed.deletedSecrets
    deletedStorageFolders += removed.deletedStoragePrefixes
  }

  return NextResponse.json({
    ok: true,
    mode: 'delete',
    scanned,
    deletedLists,
    deletedItems,
    deletedReservations,
    deletedStories,
    deletedWheelEntries,
    deletedSlugClaims,
    deletedSecrets,
    deletedStorageFolders,
    preview,
  })
}
