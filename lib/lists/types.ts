import { ListAccessStatus } from '@/lib/lists/access'

export const EVENT_TYPES = ['wedding', 'birthday', 'babyShower', 'christmas'] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const TEMPLATE_IDS = [
  'classic',
  'modern',
  'minimal',
  'playful',
  'editorial',
] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export const VISIBILITY_OPTIONS = ['public', 'private'] as const
export type ListVisibility = (typeof VISIBILITY_OPTIONS)[number]

export type GiftListStatus = 'draft'
export type BillingModel = 'one_time_90d'

export interface GiftList {
  id: string
  ownerId: string
  title: string
  slug: string
  eventType: EventType
  templateId: TemplateId
  visibility: ListVisibility
  status: GiftListStatus
  billingModel: BillingModel
  trialEndsAt: number | null
  paidAccessEndsAt: number | null
  purgeAt: number | null
  accessStatus: ListAccessStatus
  createdAt: number | null
  updatedAt: number | null
}

export interface CreateGiftListInput {
  ownerId: string
  title: string
  slug: string
  eventType: EventType
  templateId: TemplateId
  visibility: ListVisibility
}

export interface CreateGiftListResult {
  listId: string
  slug: string
}

export type GiftItemStatus = 'available' | 'reserved' | 'gifted'

export interface GiftListItem {
  id: string
  listId: string
  name: string
  description: string
  link: string | null
  status: GiftItemStatus
  reservedByName: string | null
  reservedMessage: string | null
  reservedAt: number | null
  createdAt: number | null
  updatedAt: number | null
}

export interface CreateGiftItemInput {
  listId: string
  name: string
  description: string
  link?: string
}

export interface ReserveGiftItemInput {
  listId: string
  itemId: string
  guestName?: string
  guestMessage?: string
}
