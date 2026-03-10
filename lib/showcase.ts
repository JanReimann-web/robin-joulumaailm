import { EventType, TemplateId } from '@/lib/lists/types'

export const SHOWCASE_STATUSES = ['published'] as const
export type ShowcaseStatus = (typeof SHOWCASE_STATUSES)[number]

export type ShowcasePreviewMedia = {
  url: string
  type: string
} | null

export interface ShowcaseGalleryEntry {
  listId: string
  ownerId: string
  slug: string
  title: string
  eventType: EventType
  templateId: TemplateId
  introTitle: string | null
  introBody: string | null
  previewMedia: ShowcasePreviewMedia
  featuredAt: number | null
  updatedAt: number | null
}
