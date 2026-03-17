import { FirebaseError } from 'firebase/app'
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  addDays,
  getListPurgeDate,
  resolveListAccessStatus,
  TRIAL_DAYS,
} from '@/lib/lists/access'
import { BILLING_PLAN_IDS, BillingPlanId } from '@/lib/lists/plans'
import {
  isReservedSlug,
  isValidSlug,
  sanitizeSlug,
} from '@/lib/lists/slug'
import {
  CreateGiftItemInput,
  CreateListStoryInput,
  CreateWheelEntryInput,
  CreateGiftListInput,
  CreateGiftListResult,
  UpdateGiftListIntroInput,
  UpdateGiftItemInput,
  UpdateListStoryInput,
  UpdateWheelEntryInput,
  GiftListItem,
  GiftList,
  ListStoryEntry,
  ReserveGiftItemInput,
  WheelEntry,
  isEventType,
  isTemplateAllowedForEvent,
  normalizeTemplateId,
} from '@/lib/lists/types'

export class SlugTakenError extends Error {
  constructor() {
    super('slug_taken')
  }
}

export class InvalidSlugError extends Error {
  constructor() {
    super('invalid_slug')
  }
}

export class ReservedSlugError extends Error {
  constructor() {
    super('reserved_slug')
  }
}

export class ItemUnavailableError extends Error {
  constructor() {
    super('item_unavailable')
  }
}

export class ListNotFoundError extends Error {
  constructor() {
    super('list_not_found')
  }
}

export class ListExpiredError extends Error {
  constructor() {
    super('list_expired')
  }
}

export class VisibilityPasswordRequiredError extends Error {
  constructor() {
    super('invalid_visibility_password')
  }
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
  data: Record<string, unknown>
): GiftList => {
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
    visibility: data.visibility as GiftList['visibility'],
    status: (data.status as GiftList['status']) ?? 'draft',
    billingModel: (data.billingModel as GiftList['billingModel']) ?? 'one_time_90d',
    billingPlanId: toBillingPlanId(data.billingPlanId),
    trialEndsAt,
    paidAccessEndsAt,
    purgeAt: toMillis(data.purgeAt),
    accessStatus: resolveListAccessStatus({
      trialEndsAt,
      paidAccessEndsAt,
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
    reservedNamePublic: data.reservedNamePublic === true,
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

const reorderCollectionDocs = async (
  listId: string,
  collectionName: 'items' | 'stories' | 'wheelEntries',
  orderedIds: string[]
) => {
  const batch = writeBatch(db)

  orderedIds.forEach((entryId, index) => {
    const entryRef = doc(db, 'lists', listId, collectionName, entryId)
    batch.update(entryRef, {
      order: index,
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

export const createGiftList = async (
  input: CreateGiftListInput
): Promise<CreateGiftListResult> => {
  const normalizedSlug = sanitizeSlug(input.slug)

  if (!isValidSlug(normalizedSlug)) {
    throw new InvalidSlugError()
  }

  if (isReservedSlug(normalizedSlug)) {
    throw new ReservedSlugError()
  }

  if (!isTemplateAllowedForEvent(input.eventType, input.templateId)) {
    throw new Error('invalid_template_id')
  }

  if (input.idToken) {
    const response = await fetch('/api/lists/create', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${input.idToken}`,
      },
      body: JSON.stringify({
        title: input.title,
        slug: normalizedSlug,
        eventType: input.eventType,
        templateId: input.templateId,
        visibility: input.visibility,
        visibilityPassword: input.visibilityPassword,
      }),
    })

    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({ error: 'create_failed' })) as { error?: string }

      if (payload.error === 'invalid_slug') {
        throw new InvalidSlugError()
      }
      if (payload.error === 'reserved_slug') {
        throw new ReservedSlugError()
      }
      if (payload.error === 'slug_taken') {
        throw new SlugTakenError()
      }
      if (payload.error === 'invalid_visibility_password') {
        throw new VisibilityPasswordRequiredError()
      }

      throw new Error(payload.error ?? 'create_failed')
    }

    return await response.json() as CreateGiftListResult
  }

  if (input.visibility === 'public_password') {
    throw new VisibilityPasswordRequiredError()
  }

  const listsCollection = collection(db, 'lists')
  const listRef = doc(listsCollection)
  const slugRef = doc(db, 'slugClaims', normalizedSlug)

  await runTransaction(db, async (transaction) => {
    const slugSnap = await transaction.get(slugRef)
    if (slugSnap.exists()) {
      throw new SlugTakenError()
    }

    const now = new Date()
    const trialEndsAt = Timestamp.fromDate(addDays(now, TRIAL_DAYS))
    const purgeAt = Timestamp.fromDate(getListPurgeDate(trialEndsAt.toDate()))

    transaction.set(listRef, {
      ownerId: input.ownerId,
      title: input.title.trim(),
      slug: normalizedSlug,
      eventType: input.eventType,
      templateId: input.templateId,
      visibility: input.visibility,
      status: 'draft',
      billingModel: 'one_time_90d',
      billingPlanId: null,
      trialEndsAt,
      paidAccessEndsAt: null,
      purgeAt,
      introTitle: null,
      introBody: null,
      introEventDate: null,
      introEventTime: null,
      introEventLocation: null,
      introMediaUrl: null,
      introMediaPath: null,
      introMediaType: null,
      introMediaSizeBytes: null,
      introMediaDurationSeconds: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    transaction.set(slugRef, {
      slug: normalizedSlug,
      ownerId: input.ownerId,
      listId: listRef.id,
      createdAt: serverTimestamp(),
    })
  })

  return {
    listId: listRef.id,
    slug: normalizedSlug,
  }
}

export const updateGiftListSettings = async (input: {
  listId: string
  eventType: CreateGiftListInput['eventType']
  templateId: CreateGiftListInput['templateId']
  visibility: CreateGiftListInput['visibility']
  visibilityPassword?: string
  idToken: string
}) => {
  if (!isTemplateAllowedForEvent(input.eventType, input.templateId)) {
    throw new Error('invalid_template_id')
  }

  if (input.visibility === 'public_password') {
    const normalizedPassword = input.visibilityPassword?.trim() ?? ''
    if (normalizedPassword.length > 0 && normalizedPassword.length < 6) {
      throw new VisibilityPasswordRequiredError()
    }
  }

  const response = await fetch(`/api/lists/${encodeURIComponent(input.listId)}/settings`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${input.idToken}`,
    },
    body: JSON.stringify({
      eventType: input.eventType,
      templateId: input.templateId,
      visibility: input.visibility,
      visibilityPassword: input.visibilityPassword,
    }),
  })

  if (response.ok) {
    return
  }

  const payload = await response
    .json()
    .catch(() => ({ error: 'update_failed' })) as { error?: string }

  if (payload.error === 'invalid_visibility_password') {
    throw new VisibilityPasswordRequiredError()
  }

  throw new Error(payload.error ?? 'update_failed')
}

export const deleteGiftList = async (input: {
  listId: string
  idToken: string
}) => {
  const response = await fetch(`/api/lists/${encodeURIComponent(input.listId)}/delete`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.idToken}`,
    },
  })

  if (response.ok) {
    return
  }

  const payload = await response
    .json()
    .catch(() => ({ error: 'delete_failed' })) as { error?: string }
  throw new Error(payload.error ?? 'delete_failed')
}

export const subscribeToUserLists = (
  userId: string,
  onChange: (lists: GiftList[]) => void,
  onError: (error: Error) => void
) => {
  const listsQuery = query(
    collection(db, 'lists'),
    where('ownerId', '==', userId)
  )

  return onSnapshot(
    listsQuery,
    (snapshot) => {
      const nextLists = snapshot.docs
        .map((entry) => mapListDoc(entry.id, entry.data()))
        .sort((left, right) => {
          const leftCreated = left.createdAt ?? 0
          const rightCreated = right.createdAt ?? 0
          return rightCreated - leftCreated
        })

      onChange(nextLists)
    },
    (rawError) => {
      if (rawError instanceof FirebaseError) {
        onError(rawError)
        return
      }

      onError(new Error('failed_to_subscribe'))
    }
  )
}

export const createGiftItem = async (input: CreateGiftItemInput) => {
  const itemsCollection = collection(db, 'lists', input.listId, 'items')

  await addDoc(itemsCollection, {
    listId: input.listId,
    order: input.order ?? Date.now(),
    name: input.name.trim(),
    description: input.description.trim(),
    link: input.link?.trim() || null,
    mediaUrl: input.media?.url ?? null,
    mediaPath: input.media?.path ?? null,
    mediaType: input.media?.type ?? null,
    mediaSizeBytes: input.media?.sizeBytes ?? null,
    mediaDurationSeconds: input.media?.durationSeconds ?? null,
    status: 'available',
    reservedByName: null,
    reservedNamePublic: false,
    reservedMessage: null,
    reservedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateGiftItem = async (input: UpdateGiftItemInput) => {
  const itemRef = doc(db, 'lists', input.listId, 'items', input.itemId)
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    description: input.description.trim(),
    link: input.link?.trim() || null,
    updatedAt: serverTimestamp(),
  }

  if (input.media !== undefined) {
    payload.mediaUrl = input.media?.url ?? null
    payload.mediaPath = input.media?.path ?? null
    payload.mediaType = input.media?.type ?? null
    payload.mediaSizeBytes = input.media?.sizeBytes ?? null
    payload.mediaDurationSeconds = input.media?.durationSeconds ?? null
  }

  await updateDoc(itemRef, payload)
}

export const updateGiftListIntro = async (input: UpdateGiftListIntroInput) => {
  const listRef = doc(db, 'lists', input.listId)
  const payload: Record<string, unknown> = {
    introTitle: input.introTitle.trim() || null,
    introBody: input.introBody.trim() || null,
    introEventDate: input.introEventDate.trim() || null,
    introEventTime: input.introEventTime.trim() || null,
    introEventLocation: input.introEventLocation.trim() || null,
    updatedAt: serverTimestamp(),
  }

  if (input.introMedia !== undefined) {
    payload.introMediaUrl = input.introMedia?.url ?? null
    payload.introMediaPath = input.introMedia?.path ?? null
    payload.introMediaType = input.introMedia?.type ?? null
    payload.introMediaSizeBytes = input.introMedia?.sizeBytes ?? null
    payload.introMediaDurationSeconds = input.introMedia?.durationSeconds ?? null
  }

  await updateDoc(listRef, payload)
}

export const deleteGiftItem = async (listId: string, itemId: string) => {
  const itemRef = doc(db, 'lists', listId, 'items', itemId)
  const itemSnapshot = await getDoc(itemRef)
  const itemData = itemSnapshot.data() as Record<string, unknown> | undefined
  const mediaPath = itemData?.mediaPath

  return {
    mediaPath: typeof mediaPath === 'string' ? mediaPath : null,
    removeItem: async () => {
      await deleteDoc(itemRef)
    },
  }
}

export const setGiftItemStatus = async (
  listId: string,
  itemId: string,
  status: GiftListItem['status']
) => {
  const itemRef = doc(db, 'lists', listId, 'items', itemId)
  const payload: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  }

  if (status === 'available') {
    payload.reservedByName = null
    payload.reservedNamePublic = false
    payload.reservedMessage = null
    payload.reservedAt = null
  }

  await updateDoc(itemRef, {
    ...payload,
  })
}

export const subscribeToListItems = (
  listId: string,
  onChange: (items: GiftListItem[]) => void,
  onError: (error: Error) => void
) => {
  const itemsCollection = collection(db, 'lists', listId, 'items')
  const itemsQuery = query(itemsCollection)

  return onSnapshot(
    itemsQuery,
    (snapshot) => {
      const nextItems = snapshot.docs
        .map((entry) => mapItemDoc(entry.id, entry.data()))
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

      onChange(nextItems)
    },
    (rawError) => {
      if (rawError instanceof FirebaseError) {
        onError(rawError)
        return
      }

      onError(new Error('failed_to_subscribe_items'))
    }
  )
}

export const createListStory = async (input: CreateListStoryInput) => {
  const storiesCollection = collection(db, 'lists', input.listId, 'stories')

  await addDoc(storiesCollection, {
    listId: input.listId,
    order: input.order ?? Date.now(),
    title: input.title.trim(),
    body: input.body.trim(),
    mediaUrl: input.media?.url ?? null,
    mediaPath: input.media?.path ?? null,
    mediaType: input.media?.type ?? null,
    mediaSizeBytes: input.media?.sizeBytes ?? null,
    mediaDurationSeconds: input.media?.durationSeconds ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateListStory = async (input: UpdateListStoryInput) => {
  const storyRef = doc(db, 'lists', input.listId, 'stories', input.storyId)
  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    body: input.body.trim(),
    updatedAt: serverTimestamp(),
  }

  if (input.media !== undefined) {
    payload.mediaUrl = input.media?.url ?? null
    payload.mediaPath = input.media?.path ?? null
    payload.mediaType = input.media?.type ?? null
    payload.mediaSizeBytes = input.media?.sizeBytes ?? null
    payload.mediaDurationSeconds = input.media?.durationSeconds ?? null
  }

  await updateDoc(storyRef, payload)
}

export const deleteListStory = async (listId: string, storyId: string) => {
  const storyRef = doc(db, 'lists', listId, 'stories', storyId)
  const storySnapshot = await getDoc(storyRef)
  const storyData = storySnapshot.data() as Record<string, unknown> | undefined
  const mediaPath = storyData?.mediaPath

  return {
    mediaPath: typeof mediaPath === 'string' ? mediaPath : null,
    removeStory: async () => {
      await deleteDoc(storyRef)
    },
  }
}

export const subscribeToListStories = (
  listId: string,
  onChange: (stories: ListStoryEntry[]) => void,
  onError: (error: Error) => void
) => {
  const storiesCollection = collection(db, 'lists', listId, 'stories')
  const storiesQuery = query(storiesCollection)

  return onSnapshot(
    storiesQuery,
    (snapshot) => {
      const nextStories = snapshot.docs
        .map((entry) => mapStoryDoc(entry.id, entry.data()))
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

      onChange(nextStories)
    },
    (rawError) => {
      if (rawError instanceof FirebaseError) {
        onError(rawError)
        return
      }

      onError(new Error('failed_to_subscribe_stories'))
    }
  )
}

export const createWheelEntry = async (input: CreateWheelEntryInput) => {
  const entriesCollection = collection(db, 'lists', input.listId, 'wheelEntries')

  await addDoc(entriesCollection, {
    listId: input.listId,
    order: input.order ?? Date.now(),
    question: input.question.trim(),
    answerText: input.answerText.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateWheelEntry = async (input: UpdateWheelEntryInput) => {
  const entryRef = doc(db, 'lists', input.listId, 'wheelEntries', input.entryId)

  await updateDoc(entryRef, {
    question: input.question.trim(),
    answerText: input.answerText.trim(),
    answerAudioUrl: null,
    answerAudioPath: null,
    answerAudioType: null,
    updatedAt: serverTimestamp(),
  })
}

export const deleteWheelEntry = async (listId: string, wheelEntryId: string) => {
  const wheelRef = doc(db, 'lists', listId, 'wheelEntries', wheelEntryId)
  const wheelSnapshot = await getDoc(wheelRef)
  const wheelData = wheelSnapshot.data() as Record<string, unknown> | undefined
  const answerAudioPath = wheelData?.answerAudioPath

  return {
    answerAudioPath: typeof answerAudioPath === 'string' ? answerAudioPath : null,
    removeWheelEntry: async () => {
      await deleteDoc(wheelRef)
    },
  }
}

export const subscribeToWheelEntries = (
  listId: string,
  onChange: (entries: WheelEntry[]) => void,
  onError: (error: Error) => void
) => {
  const entriesCollection = collection(db, 'lists', listId, 'wheelEntries')
  const entriesQuery = query(entriesCollection)

  return onSnapshot(
    entriesQuery,
    (snapshot) => {
      const nextEntries = snapshot.docs
        .map((entry) => mapWheelEntryDoc(entry.id, entry.data()))
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

      onChange(nextEntries)
    },
    (rawError) => {
      if (rawError instanceof FirebaseError) {
        onError(rawError)
        return
      }

      onError(new Error('failed_to_subscribe_wheel_entries'))
    }
  )
}

export const reorderGiftItems = async (listId: string, orderedIds: string[]) => {
  await reorderCollectionDocs(listId, 'items', orderedIds)
}

export const reorderListStories = async (listId: string, orderedIds: string[]) => {
  await reorderCollectionDocs(listId, 'stories', orderedIds)
}

export const reorderWheelEntries = async (listId: string, orderedIds: string[]) => {
  await reorderCollectionDocs(listId, 'wheelEntries', orderedIds)
}

export const subscribeToPublicListBySlug = (
  rawSlug: string,
  onChange: (list: GiftList | null) => void,
  onError: (error: Error) => void
) => {
  const slug = sanitizeSlug(rawSlug)
  const listsQuery = query(
    collection(db, 'lists'),
    where('slug', '==', slug),
    limit(1)
  )

  return onSnapshot(
    listsQuery,
    (snapshot) => {
      if (snapshot.empty) {
        onChange(null)
        return
      }

      const mapped = mapListDoc(snapshot.docs[0].id, snapshot.docs[0].data())
      if (mapped.visibility !== 'public') {
        onChange(null)
        return
      }
      if (mapped.accessStatus !== 'active') {
        onChange(null)
        return
      }

      onChange(mapped)
    },
    (rawError) => {
      if (rawError instanceof FirebaseError) {
        onError(rawError)
        return
      }

      onError(new Error('failed_to_subscribe_public_list'))
    }
  )
}

export const reserveGiftItem = async (input: ReserveGiftItemInput) => {
  const itemRef = doc(db, 'lists', input.listId, 'items', input.itemId)
  const listRef = doc(db, 'lists', input.listId)
  const reservationRef = doc(collection(db, 'lists', input.listId, 'reservations'))

  await runTransaction(db, async (transaction) => {
    const listSnap = await transaction.get(listRef)
    if (!listSnap.exists()) {
      throw new ListNotFoundError()
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

    if (listAccessStatus !== 'active') {
      throw new ListExpiredError()
    }

    const itemSnap = await transaction.get(itemRef)

    if (!itemSnap.exists()) {
      throw new ListNotFoundError()
    }

    const itemData = itemSnap.data() as Record<string, unknown>
    const currentStatus = itemData.status as GiftListItem['status']

    if (currentStatus !== 'available') {
      throw new ItemUnavailableError()
    }

    transaction.update(itemRef, {
      status: 'reserved',
      reservedByName: input.guestName.trim() || null,
      reservedNamePublic: input.reservedNamePublic === true,
      reservedMessage: input.guestMessage?.trim() || null,
      reservedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    transaction.set(reservationRef, {
      itemId: input.itemId,
      guestName: input.guestName.trim(),
      reservedNamePublic: input.reservedNamePublic === true,
      guestMessage: input.guestMessage?.trim() || null,
      status: 'active',
      createdAt: serverTimestamp(),
    })
  })
}
