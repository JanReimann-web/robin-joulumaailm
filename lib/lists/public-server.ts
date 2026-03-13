import 'server-only'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { hasServerSideComplimentaryEntitlement } from '@/lib/account-entitlements.server'
import { addDays, resolveListAccessStatus, TRIAL_DAYS } from '@/lib/lists/access'
import { BILLING_PLAN_IDS, BillingPlanId } from '@/lib/lists/plans'
import { isReservedSlug, isValidSlug, sanitizeSlug } from '@/lib/lists/slug'
import {
  GiftList,
  GiftListItem,
  ListStoryEntry,
  WheelEntry,
  isEventType,
  normalizeTemplateId,
} from '@/lib/lists/types'

type PublicVisibility = 'public' | 'public_password'

export type PublicListRecord = GiftList & {
  visibility: PublicVisibility
}

type PublicPreviewMedia = {
  url: string
  type: string
} | null

const isPublicVisibility = (value: unknown): value is PublicVisibility => {
  return value === 'public' || value === 'public_password'
}

const toMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  return null
}

const toNullableNumber = (value: unknown): number | null => {
  return typeof value === 'number' && !Number.isNaN(value)
    ? value
    : null
}

const toBillingPlanId = (value: unknown): BillingPlanId | null => {
  return typeof value === 'string' && BILLING_PLAN_IDS.includes(value as BillingPlanId)
    ? value as BillingPlanId
    : null
}

const mapListDoc = (
  id: string,
  data: Record<string, unknown>,
  hasComplimentaryAccess: boolean
): PublicListRecord | null => {
  if (!isPublicVisibility(data.visibility)) {
    return null
  }

  const eventType = typeof data.eventType === 'string' && isEventType(data.eventType)
    ? data.eventType
    : 'birthday'

  const createdAt = toMillis(data.createdAt)
  const trialEndsAtRaw = toMillis(data.trialEndsAt)
  const trialEndsAt = trialEndsAtRaw ?? (
    createdAt ? addDays(new Date(createdAt), TRIAL_DAYS).getTime() : null
  )
  const paidAccessEndsAt = toMillis(data.paidAccessEndsAt)

  return {
    id,
    ownerId: String(data.ownerId ?? ''),
    title: String(data.title ?? ''),
    slug: String(data.slug ?? ''),
    eventType,
    templateId: normalizeTemplateId(eventType, data.templateId),
    visibility: data.visibility,
    status: (data.status as GiftList['status']) ?? 'draft',
    billingModel: (data.billingModel as GiftList['billingModel']) ?? 'one_time_90d',
    billingPlanId: toBillingPlanId(data.billingPlanId),
    trialEndsAt,
    paidAccessEndsAt,
    purgeAt: toMillis(data.purgeAt),
    accessStatus: resolveListAccessStatus({
      trialEndsAt,
      paidAccessEndsAt,
      complimentaryAccess: hasComplimentaryAccess,
    }),
    introTitle: data.introTitle ? String(data.introTitle) : null,
    introBody: data.introBody ? String(data.introBody) : null,
    introEventDate: data.introEventDate ? String(data.introEventDate) : null,
    introEventTime: data.introEventTime ? String(data.introEventTime) : null,
    introEventLocation: data.introEventLocation ? String(data.introEventLocation) : null,
    introMediaUrl: data.introMediaUrl ? String(data.introMediaUrl) : null,
    introMediaPath: data.introMediaPath ? String(data.introMediaPath) : null,
    introMediaType: data.introMediaType ? String(data.introMediaType) : null,
    introMediaSizeBytes: toNullableNumber(data.introMediaSizeBytes),
    introMediaDurationSeconds: toNullableNumber(data.introMediaDurationSeconds),
    createdAt,
    updatedAt: toMillis(data.updatedAt),
  }
}

const mapItemDoc = (
  id: string,
  data: Record<string, unknown>
): GiftListItem => {
  return {
    id,
    listId: String(data.listId ?? ''),
    order: typeof data.order === 'number' ? data.order : null,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    link: data.link ? String(data.link) : null,
    mediaUrl: data.mediaUrl ? String(data.mediaUrl) : null,
    mediaPath: data.mediaPath ? String(data.mediaPath) : null,
    mediaType: data.mediaType ? String(data.mediaType) : null,
    mediaSizeBytes: toNullableNumber(data.mediaSizeBytes),
    mediaDurationSeconds: toNullableNumber(data.mediaDurationSeconds),
    status: (data.status as GiftListItem['status']) ?? 'available',
    reservedByName: data.reservedByName ? String(data.reservedByName) : null,
    reservedMessage: data.reservedMessage ? String(data.reservedMessage) : null,
    reservedAt: toMillis(data.reservedAt),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

const mapStoryDoc = (
  id: string,
  data: Record<string, unknown>
): ListStoryEntry => {
  return {
    id,
    listId: String(data.listId ?? ''),
    order: typeof data.order === 'number' ? data.order : null,
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    mediaUrl: data.mediaUrl ? String(data.mediaUrl) : null,
    mediaPath: data.mediaPath ? String(data.mediaPath) : null,
    mediaType: data.mediaType ? String(data.mediaType) : null,
    mediaSizeBytes: toNullableNumber(data.mediaSizeBytes),
    mediaDurationSeconds: toNullableNumber(data.mediaDurationSeconds),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

const mapWheelEntryDoc = (
  id: string,
  data: Record<string, unknown>
): WheelEntry => {
  return {
    id,
    listId: String(data.listId ?? ''),
    order: typeof data.order === 'number' ? data.order : null,
    question: String(data.question ?? ''),
    answerText: data.answerText ? String(data.answerText) : null,
    answerAudioUrl: data.answerAudioUrl ? String(data.answerAudioUrl) : null,
    answerAudioPath: data.answerAudioPath ? String(data.answerAudioPath) : null,
    answerAudioType: data.answerAudioType ? String(data.answerAudioType) : null,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

const compareOrderedEntries = (
  leftOrder: number | null,
  rightOrder: number | null,
  leftFallback: number,
  rightFallback: number,
  fallbackDirection: 'asc' | 'desc'
) => {
  const leftHasOrder = typeof leftOrder === 'number'
  const rightHasOrder = typeof rightOrder === 'number'

  if (leftHasOrder && rightHasOrder) {
    return leftOrder - rightOrder
  }

  if (leftHasOrder) {
    return -1
  }

  if (rightHasOrder) {
    return 1
  }

  return fallbackDirection === 'asc'
    ? leftFallback - rightFallback
    : rightFallback - leftFallback
}

const isPreviewMediaType = (mediaType: string | null) => {
  if (!mediaType) {
    return false
  }

  return mediaType.startsWith('image/') || mediaType.startsWith('video/')
}

export const getPublicListBySlug = async (
  rawSlug: string
): Promise<PublicListRecord | null> => {
  const slug = sanitizeSlug(rawSlug)

  if (!isValidSlug(slug) || isReservedSlug(slug)) {
    return null
  }

  const slugClaimSnap = await adminDb.collection('slugClaims').doc(slug).get()
  const listId = slugClaimSnap.data()?.listId

  if (typeof listId !== 'string' || listId.length === 0) {
    return null
  }

  const listSnap = await adminDb.collection('lists').doc(listId).get()
  if (!listSnap.exists) {
    return null
  }

  const listData = listSnap.data() as Record<string, unknown>
  const ownerId = typeof listData.ownerId === 'string' ? listData.ownerId : ''
  const hasComplimentaryAccess = ownerId
    ? await hasServerSideComplimentaryEntitlement(ownerId)
    : false

  return mapListDoc(
    listSnap.id,
    listData,
    hasComplimentaryAccess
  )
}

export const getPublicListContent = async (listId: string) => {
  const listRef = adminDb.collection('lists').doc(listId)
  const [itemsSnap, storiesSnap, wheelSnap] = await Promise.all([
    listRef.collection('items').get(),
    listRef.collection('stories').get(),
    listRef.collection('wheelEntries').get(),
  ])

  const items = itemsSnap.docs
    .map((entry) => mapItemDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => {
      const leftCreated = left.createdAt ?? 0
      const rightCreated = right.createdAt ?? 0
      return compareOrderedEntries(
        left.order,
        right.order,
        leftCreated,
        rightCreated,
        'desc'
      )
    })

  const stories = storiesSnap.docs
    .map((entry) => mapStoryDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => {
      const leftCreated = left.createdAt ?? 0
      const rightCreated = right.createdAt ?? 0
      return compareOrderedEntries(
        left.order,
        right.order,
        leftCreated,
        rightCreated,
        'asc'
      )
    })

  const wheelEntries = wheelSnap.docs
    .map((entry) => mapWheelEntryDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => {
      const leftCreated = left.createdAt ?? 0
      const rightCreated = right.createdAt ?? 0
      return compareOrderedEntries(
        left.order,
        right.order,
        leftCreated,
        rightCreated,
        'asc'
      )
    })

  return {
    items,
    stories,
    wheelEntries,
  }
}

export const getPublicListPreviewMedia = async (
  listId: string
): Promise<PublicPreviewMedia> => {
  const listRef = adminDb.collection('lists').doc(listId)
  const listSnap = await listRef.get()
  const listData = listSnap.data() as Record<string, unknown> | undefined
  const introMediaUrl = listData?.introMediaUrl
  const introMediaType = listData?.introMediaType

  if (
    typeof introMediaUrl === 'string'
    && typeof introMediaType === 'string'
    && isPreviewMediaType(introMediaType)
  ) {
    return {
      url: introMediaUrl,
      type: introMediaType,
    }
  }

  const [storiesSnap, itemsSnap] = await Promise.all([
    listRef.collection('stories').get(),
    listRef.collection('items').get(),
  ])

  const stories = storiesSnap.docs
    .map((entry) => mapStoryDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => {
      const leftCreated = left.createdAt ?? 0
      const rightCreated = right.createdAt ?? 0
      return compareOrderedEntries(
        left.order,
        right.order,
        leftCreated,
        rightCreated,
        'asc'
      )
    })

  for (const story of stories) {
    if (story.mediaUrl && isPreviewMediaType(story.mediaType)) {
      return {
        url: story.mediaUrl,
        type: story.mediaType as string,
      }
    }
  }

  const items = itemsSnap.docs
    .map((entry) => mapItemDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => {
      const leftCreated = left.createdAt ?? 0
      const rightCreated = right.createdAt ?? 0
      return compareOrderedEntries(
        left.order,
        right.order,
        leftCreated,
        rightCreated,
        'asc'
      )
    })

  for (const item of items) {
    if (item.mediaUrl && isPreviewMediaType(item.mediaType)) {
      return {
        url: item.mediaUrl,
        type: item.mediaType as string,
      }
    }
  }

  return null
}


