import 'server-only'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { addDays, resolveListAccessStatus, TRIAL_DAYS } from '@/lib/lists/access'
import { isReservedSlug, isValidSlug, sanitizeSlug } from '@/lib/lists/slug'
import { GiftList, GiftListItem, ListStoryEntry, WheelEntry } from '@/lib/lists/types'

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

const mapListDoc = (
  id: string,
  data: Record<string, unknown>
): PublicListRecord | null => {
  if (!isPublicVisibility(data.visibility)) {
    return null
  }

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
    eventType: data.eventType as GiftList['eventType'],
    templateId: data.templateId as GiftList['templateId'],
    visibility: data.visibility,
    status: (data.status as GiftList['status']) ?? 'draft',
    billingModel: (data.billingModel as GiftList['billingModel']) ?? 'one_time_90d',
    trialEndsAt,
    paidAccessEndsAt,
    purgeAt: toMillis(data.purgeAt),
    accessStatus: resolveListAccessStatus({
      trialEndsAt,
      paidAccessEndsAt,
    }),
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
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    link: data.link ? String(data.link) : null,
    mediaUrl: data.mediaUrl ? String(data.mediaUrl) : null,
    mediaPath: data.mediaPath ? String(data.mediaPath) : null,
    mediaType: data.mediaType ? String(data.mediaType) : null,
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
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    mediaUrl: data.mediaUrl ? String(data.mediaUrl) : null,
    mediaPath: data.mediaPath ? String(data.mediaPath) : null,
    mediaType: data.mediaType ? String(data.mediaType) : null,
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
    question: String(data.question ?? ''),
    answerText: data.answerText ? String(data.answerText) : null,
    answerAudioUrl: data.answerAudioUrl ? String(data.answerAudioUrl) : null,
    answerAudioPath: data.answerAudioPath ? String(data.answerAudioPath) : null,
    answerAudioType: data.answerAudioType ? String(data.answerAudioType) : null,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
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

  return mapListDoc(
    listSnap.id,
    listSnap.data() as Record<string, unknown>
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
      return rightCreated - leftCreated
    })

  const stories = storiesSnap.docs
    .map((entry) => mapStoryDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => {
      const leftCreated = left.createdAt ?? 0
      const rightCreated = right.createdAt ?? 0
      return leftCreated - rightCreated
    })

  const wheelEntries = wheelSnap.docs
    .map((entry) => mapWheelEntryDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => {
      const leftCreated = left.createdAt ?? 0
      const rightCreated = right.createdAt ?? 0
      return leftCreated - rightCreated
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
  const [storiesSnap, itemsSnap] = await Promise.all([
    listRef.collection('stories').get(),
    listRef.collection('items').get(),
  ])

  const stories = storiesSnap.docs
    .map((entry) => mapStoryDoc(entry.id, entry.data() as Record<string, unknown>))
    .sort((left, right) => {
      const leftCreated = left.createdAt ?? 0
      const rightCreated = right.createdAt ?? 0
      return leftCreated - rightCreated
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
      return leftCreated - rightCreated
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

