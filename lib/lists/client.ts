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
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  addDays,
  resolveListAccessStatus,
  TRIAL_DAYS,
} from '@/lib/lists/access'
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
  GiftListItem,
  GiftList,
  ListStoryEntry,
  ReserveGiftItemInput,
  WheelEntry,
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

const mapListDoc = (
  id: string,
  data: Record<string, unknown>
): GiftList => {
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
    visibility: data.visibility as GiftList['visibility'],
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

    transaction.set(listRef, {
      ownerId: input.ownerId,
      title: input.title.trim(),
      slug: normalizedSlug,
      eventType: input.eventType,
      templateId: input.templateId,
      visibility: input.visibility,
      status: 'draft',
      billingModel: 'one_time_90d',
      trialEndsAt,
      paidAccessEndsAt: null,
      purgeAt: trialEndsAt,
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
    name: input.name.trim(),
    description: input.description.trim(),
    link: input.link?.trim() || null,
    mediaUrl: input.media?.url ?? null,
    mediaPath: input.media?.path ?? null,
    mediaType: input.media?.type ?? null,
    status: 'available',
    reservedByName: null,
    reservedMessage: null,
    reservedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
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
          return rightCreated - leftCreated
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
    title: input.title.trim(),
    body: input.body.trim(),
    mediaUrl: input.media?.url ?? null,
    mediaPath: input.media?.path ?? null,
    mediaType: input.media?.type ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
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
          return leftCreated - rightCreated
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
    question: input.question.trim(),
    answerText: input.answerText?.trim() || null,
    answerAudioUrl: input.answerAudio?.url ?? null,
    answerAudioPath: input.answerAudio?.path ?? null,
    answerAudioType: input.answerAudio?.type ?? null,
    createdAt: serverTimestamp(),
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
          return leftCreated - rightCreated
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
      if (mapped.accessStatus === 'expired') {
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

    if (listAccessStatus === 'expired') {
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
      reservedByName: input.guestName?.trim() || null,
      reservedMessage: input.guestMessage?.trim() || null,
      reservedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    transaction.set(reservationRef, {
      itemId: input.itemId,
      guestName: input.guestName?.trim() || null,
      guestMessage: input.guestMessage?.trim() || null,
      status: 'active',
      createdAt: serverTimestamp(),
    })
  })
}
