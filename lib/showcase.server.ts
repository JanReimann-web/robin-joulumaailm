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
  ShowcaseGalleryEntry,
} from '@/lib/showcase'

type ShowcaseRecord = {
  eventType: EventType
  listId: string
  ownerId: string
  updatedAt: number | null
}

const toMillis = (value: unknown) => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  return null
}

const mapShowcaseRecord = (
  id: string,
  data: Record<string, unknown>
): ShowcaseRecord | null => {
  if (!isEventType(id)) {
    return null
  }

  const listId = typeof data.listId === 'string' ? data.listId : ''
  const ownerId = typeof data.ownerId === 'string' ? data.ownerId : ''

  if (!listId || !ownerId) {
    return null
  }

  return {
    eventType: id,
    listId,
    ownerId,
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

  if (listData.ownerId !== showcase.ownerId || listData.eventType !== showcase.eventType) {
    return null
  }

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
    eventType: showcase.eventType,
    templateId: normalizeTemplateId(showcase.eventType, listData.templateId),
    introTitle: typeof listData.introTitle === 'string' ? listData.introTitle : null,
    introBody: typeof listData.introBody === 'string' ? listData.introBody : null,
    previewMedia: await getPublicListPreviewMedia(showcase.listId),
    featuredAt: null,
    updatedAt: showcase.updatedAt,
  }
}

export const getPublishedShowcaseEntries = async (): Promise<ShowcaseGalleryEntry[]> => {
  const showcaseSnap = await adminDb.collection('galleryExamples').get()
  const showcaseRecords = showcaseSnap.docs
    .map((entry) => mapShowcaseRecord(entry.id, entry.data() as Record<string, unknown>))
    .filter((entry): entry is ShowcaseRecord => Boolean(entry))

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
}

export const getPublishedShowcaseEntryForEvent = async (
  eventType: EventType
): Promise<ShowcaseGalleryEntry | null> => {
  const showcaseSnapshot = await adminDb.collection('galleryExamples').doc(eventType).get()

  if (!showcaseSnapshot.exists) {
    return null
  }

  const showcaseRecord = mapShowcaseRecord(
    showcaseSnapshot.id,
    showcaseSnapshot.data() as Record<string, unknown>
  )

  if (!showcaseRecord) {
    return null
  }

  const listSnapshot = await adminDb.collection('lists').doc(showcaseRecord.listId).get()
  if (!listSnapshot.exists) {
    return null
  }

  const entitlementCache = new Map<string, boolean>()
  const entry = await toActivePublicGalleryEntry(
    showcaseRecord,
    listSnapshot.data() as Record<string, unknown>,
    entitlementCache
  )

  return entry?.slug && entry.title ? entry : null
}
