import 'server-only'
import { sanitizeSlug } from '@/lib/lists/slug'
import { EventType } from '@/lib/lists/types'
import { getPublicListBySlug } from '@/lib/lists/public-server'

export interface PublicListMeta {
  listId: string
  slug: string
  title: string
  eventType: EventType
  visibility: 'public' | 'public_password'
  accessStatus: 'trial' | 'active' | 'expired'
}

export const getPublicListMetaBySlug = async (
  rawSlug: string
): Promise<PublicListMeta | null> => {
  const list = await getPublicListBySlug(sanitizeSlug(rawSlug))

  if (!list || list.accessStatus !== 'active') {
    return null
  }

  return {
    listId: list.id,
    slug: list.slug,
    title: list.title,
    eventType: list.eventType,
    visibility: list.visibility,
    accessStatus: list.accessStatus,
  }
}
