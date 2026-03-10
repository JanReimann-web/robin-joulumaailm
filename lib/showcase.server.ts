import 'server-only'
import { Timestamp } from 'firebase-admin/firestore'
import { hasServerSideComplimentaryEntitlement } from '@/lib/account-entitlements.server'
import { adminDb } from '@/lib/firebase/admin'
import { addDays, resolveListAccessStatus, TRIAL_DAYS } from '@/lib/lists/access'
import { getPublicListPreviewMedia } from '@/lib/lists/public-server'
import {
  EventType,
  isEventType,
  normalizeTemplateId,
} from '@/lib/lists/types'
import {
  SHOWCASE_STATUSES,
  ShowcaseGalleryEntry,
  ShowcaseStatus,
} from '@/lib/showcase'

type ShowcaseRecord = {
  id: string
  listId: string
  ownerId: string
  status: ShowcaseStatus
  featuredAt: number | null
  updatedAt: number | null
}

const toMillis = (value: unknown) => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  return null
}

const isShowcaseStatus = (value: unknown): value is ShowcaseStatus => {
  return typeof value === 'string'
    && SHOWCASE_STATUSES.includes(value as ShowcaseStatus)
}

const mapShowcaseRecord = (
  id: string,
  data: Record<string, unknown>
): ShowcaseRecord | null => {
  if (!isShowcaseStatus(data.status)) {
    return null
  }

  const listId = typeof data.listId === 'string' ? data.listId : id
  const ownerId = typeof data.ownerId === 'string' ? data.ownerId : ''

  if (!listId || !ownerId) {
    return null
  }

  return {
    id,
    listId,
    ownerId,
    status: data.status,
    featuredAt: toMillis(data.featuredAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

const toActivePublicGalleryEntry = async (
  showcase: ShowcaseRecord,
  listData: Record<string, unknown>,
  entitlementCache: Map<string, boolean>
): Promise<ShowcaseGalleryEntry | null> => {
  if (listData.visibility !== 'public') {
    return null
  }

  const eventType: EventType = (
    typeof listData.eventType === 'string'
    && isEventType(listData.eventType)
  )
    ? listData.eventType
    : 'birthday'

  const createdAt = toMillis(listData.createdAt)
  const trialEndsAtRaw = toMillis(listData.trialEndsAt)
  const paidAccessEndsAt = toMillis(listData.paidAccessEndsAt)
  const trialEndsAt = trialEndsAtRaw ?? (
    createdAt ? addDays(new Date(createdAt), TRIAL_DAYS).getTime() : null
  )

  let hasComplimentaryAccess = entitlementCache.get(showcase.ownerId)
  if (typeof hasComplimentaryAccess !== 'boolean') {
    hasComplimentaryAccess = await hasServerSideComplimentaryEntitlement(showcase.ownerId)
    entitlementCache.set(showcase.ownerId, hasComplimentaryAccess)
  }

  const accessStatus = resolveListAccessStatus({
    trialEndsAt,
    paidAccessEndsAt,
    complimentaryAccess: hasComplimentaryAccess,
  })

  if (accessStatus !== 'active') {
    return null
  }

  return {
    listId: showcase.listId,
    ownerId: showcase.ownerId,
    slug: typeof listData.slug === 'string' ? listData.slug : '',
    title: typeof listData.title === 'string' ? listData.title : '',
    eventType,
    templateId: normalizeTemplateId(eventType, listData.templateId),
    introTitle: typeof listData.introTitle === 'string' ? listData.introTitle : null,
    introBody: typeof listData.introBody === 'string' ? listData.introBody : null,
    previewMedia: await getPublicListPreviewMedia(showcase.listId),
    featuredAt: showcase.featuredAt,
    updatedAt: showcase.updatedAt,
  }
}

export const getPublishedShowcaseEntries = async (): Promise<ShowcaseGalleryEntry[]> => {
  const showcaseSnap = await adminDb.collection('showcaseLists').get()
  const showcaseRecords = showcaseSnap.docs
    .map((entry) => mapShowcaseRecord(entry.id, entry.data() as Record<string, unknown>))
    .filter((entry): entry is ShowcaseRecord => entry?.status === 'published')

  if (showcaseRecords.length === 0) {
    return []
  }

  const listRefs = showcaseRecords.map((entry) => adminDb.collection('lists').doc(entry.listId))
  const listSnaps = await adminDb.getAll(...listRefs)
  const listSnapById = new Map(
    listSnaps
      .filter((entry) => entry.exists)
      .map((entry) => [entry.id, entry.data() as Record<string, unknown>])
  )

  const entitlementCache = new Map<string, boolean>()
  const galleryEntries = await Promise.all(
    showcaseRecords.map(async (showcase) => {
      const listData = listSnapById.get(showcase.listId)
      if (!listData) {
        return null
      }

      return await toActivePublicGalleryEntry(showcase, listData, entitlementCache)
    })
  )

  return galleryEntries
    .filter((entry): entry is ShowcaseGalleryEntry => Boolean(entry?.slug && entry.title))
    .sort((left, right) => {
      const leftOrder = left.featuredAt ?? left.updatedAt ?? 0
      const rightOrder = right.featuredAt ?? right.updatedAt ?? 0
      return rightOrder - leftOrder
    })
}
