import 'server-only'
import { addDays, resolveListAccessStatus, TRIAL_DAYS } from '@/lib/lists/access'
import { isReservedSlug, isValidSlug, sanitizeSlug } from '@/lib/lists/slug'
import { EventType } from '@/lib/lists/types'

type FirestorePrimitive = {
  stringValue?: string
  timestampValue?: string
}

type FirestoreDocument = {
  fields?: Record<string, FirestorePrimitive>
}

const getStringField = (
  doc: FirestoreDocument | null,
  fieldName: string
) => {
  return doc?.fields?.[fieldName]?.stringValue ?? null
}

const getTimestampField = (
  doc: FirestoreDocument | null,
  fieldName: string
) => {
  const value = doc?.fields?.[fieldName]?.timestampValue
  if (!value) {
    return null
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed
}

const getFirestoreDocument = async (path: string) => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

  if (!projectId || !apiKey) {
    return null
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?key=${apiKey}`
  const response = await fetch(url, { next: { revalidate: 60 } })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as FirestoreDocument
}

export interface PublicListMeta {
  listId: string
  slug: string
  title: string
  eventType: EventType
  accessStatus: 'trial' | 'active' | 'expired'
}

export const getPublicListMetaBySlug = async (
  rawSlug: string
): Promise<PublicListMeta | null> => {
  const slug = sanitizeSlug(rawSlug)

  if (!isValidSlug(slug) || isReservedSlug(slug)) {
    return null
  }

  const slugClaimDoc = await getFirestoreDocument(`slugClaims/${slug}`)
  const listId = getStringField(slugClaimDoc, 'listId')

  if (!listId) {
    return null
  }

  const listDoc = await getFirestoreDocument(`lists/${listId}`)
  const visibility = getStringField(listDoc, 'visibility')

  if (visibility !== 'public') {
    return null
  }

  const title = getStringField(listDoc, 'title')
  const eventType = getStringField(listDoc, 'eventType')
  const normalizedSlug = getStringField(listDoc, 'slug') ?? slug
  const createdAt = getTimestampField(listDoc, 'createdAt')
  const trialEndsAtRaw = getTimestampField(listDoc, 'trialEndsAt')
  const trialEndsAt = trialEndsAtRaw ?? (
    createdAt ? addDays(new Date(createdAt), TRIAL_DAYS).getTime() : null
  )
  const paidAccessEndsAt = getTimestampField(listDoc, 'paidAccessEndsAt')
  const accessStatus = resolveListAccessStatus({
    trialEndsAt,
    paidAccessEndsAt,
  })

  if (!title || !eventType) {
    return null
  }

  if (accessStatus === 'expired') {
    return null
  }

  return {
    listId,
    slug: normalizedSlug,
    title,
    eventType: eventType as EventType,
    accessStatus,
  }
}
