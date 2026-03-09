import 'server-only'
import { adminDb, adminStorage } from '@/lib/firebase/admin'
import {
  PersistedMediaMetadata,
  calculateListMediaUsageSummary,
  createPersistedMediaMetadata,
} from '@/lib/lists/plans'

const toNullableNumber = (value: unknown) => {
  return typeof value === 'number' && !Number.isNaN(value)
    ? value
    : null
}

const toNullableString = (value: unknown) => {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : null
}

const readStorageObjectSize = async (mediaPath: string | null) => {
  if (!mediaPath) {
    return null
  }

  try {
    const [metadata] = await adminStorage
      .bucket()
      .file(mediaPath)
      .getMetadata()

    const rawSize = metadata.size
    if (typeof rawSize !== 'string') {
      return null
    }

    const parsedSize = Number.parseInt(rawSize, 10)
    return Number.isNaN(parsedSize) ? null : parsedSize
  } catch {
    return null
  }
}

const resolvePersistedMediaMetadata = async (
  data: Record<string, unknown>,
  fieldPrefix: 'introMedia' | 'media'
): Promise<PersistedMediaMetadata> => {
  const mediaType = toNullableString(data[`${fieldPrefix}Type`])
  const mediaSizeBytes = toNullableNumber(data[`${fieldPrefix}SizeBytes`])
  const mediaDurationSeconds = toNullableNumber(data[`${fieldPrefix}DurationSeconds`])
  const mediaPath = toNullableString(data[`${fieldPrefix}Path`])

  const resolvedSizeBytes = mediaSizeBytes ?? await readStorageObjectSize(mediaPath)

  return createPersistedMediaMetadata({
    mediaType,
    mediaSizeBytes: resolvedSizeBytes,
    mediaDurationSeconds,
  })
}

export const computeListMediaUsageSummary = async (listId: string) => {
  const listRef = adminDb.collection('lists').doc(listId)
  const [listSnap, itemsSnap, storiesSnap] = await Promise.all([
    listRef.get(),
    listRef.collection('items').get(),
    listRef.collection('stories').get(),
  ])

  if (!listSnap.exists) {
    throw new Error('list_not_found')
  }

  const listData = listSnap.data() as Record<string, unknown>
  const itemEntries = itemsSnap.docs.map((entry) => entry.data() as Record<string, unknown>)
  const storyEntries = storiesSnap.docs.map((entry) => entry.data() as Record<string, unknown>)

  const persistedEntries = await Promise.all([
    resolvePersistedMediaMetadata(listData, 'introMedia'),
    ...itemEntries.map((entry) => resolvePersistedMediaMetadata(entry, 'media')),
    ...storyEntries.map((entry) => resolvePersistedMediaMetadata(entry, 'media')),
  ])

  return calculateListMediaUsageSummary(persistedEntries)
}
