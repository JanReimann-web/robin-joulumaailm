import { ListAccessStatus } from '@/lib/lists/access'
import { BillingPlanId } from '@/lib/lists/plans'

export const EVENT_TYPES = [
  'wedding',
  'birthday',
  'kidsBirthday',
  'babyShower',
  'graduation',
  'housewarming',
  'christmas',
] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const DEFAULT_TEMPLATE_IDS = [
  'classic',
  'modern',
  'minimal',
  'playful',
] as const
export type DefaultTemplateId = (typeof DEFAULT_TEMPLATE_IDS)[number]

export const KIDS_BIRTHDAY_TEMPLATE_IDS = [
  'kidsBoyTinyPilot',
  'kidsBoyDinoRanger',
  'kidsBoyGalaxyRacer',
  'kidsGirlTinyBloom',
  'kidsGirlFairyGarden',
  'kidsGirlStarlightPop',
] as const
export type KidsBirthdayTemplateId = (typeof KIDS_BIRTHDAY_TEMPLATE_IDS)[number]

export const TEMPLATE_IDS = [
  ...DEFAULT_TEMPLATE_IDS,
  ...KIDS_BIRTHDAY_TEMPLATE_IDS,
] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export const isEventType = (value: string): value is EventType => {
  return EVENT_TYPES.includes(value as EventType)
}

export const isTemplateId = (value: string): value is TemplateId => {
  return TEMPLATE_IDS.includes(value as TemplateId)
}

export const getTemplateIdsForEvent = (
  eventType: EventType
): readonly TemplateId[] => {
  if (eventType === 'kidsBirthday') {
    return KIDS_BIRTHDAY_TEMPLATE_IDS
  }

  return DEFAULT_TEMPLATE_IDS
}

export const isTemplateAllowedForEvent = (
  eventType: EventType,
  templateId: string
): templateId is TemplateId => {
  return getTemplateIdsForEvent(eventType).includes(templateId as TemplateId)
}

export const normalizeTemplateId = (
  eventType: EventType,
  value: unknown
): TemplateId => {
  if (typeof value !== 'string') {
    return getTemplateIdsForEvent(eventType)[0]
  }

  if (value === 'editorial') {
    return eventType === 'kidsBirthday' ? KIDS_BIRTHDAY_TEMPLATE_IDS[0] : 'modern'
  }

  if (isTemplateAllowedForEvent(eventType, value)) {
    return value
  }

  if (isTemplateId(value)) {
    return value
  }

  return getTemplateIdsForEvent(eventType)[0]
}

export const VISIBILITY_OPTIONS = ['public', 'public_password', 'private'] as const
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
  billingPlanId: BillingPlanId | null
  trialEndsAt: number | null
  paidAccessEndsAt: number | null
  purgeAt: number | null
  accessStatus: ListAccessStatus
  introTitle: string | null
  introBody: string | null
  introEventDate: string | null
  introEventTime: string | null
  introEventLocation: string | null
  introMediaUrl: string | null
  introMediaPath: string | null
  introMediaType: string | null
  introMediaSizeBytes: number | null
  introMediaDurationSeconds: number | null
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
  visibilityPassword?: string
  idToken?: string
}

export interface CreateGiftListResult {
  listId: string
  slug: string
}

export interface UpdateGiftListIntroInput {
  listId: string
  introTitle: string
  introBody: string
  introEventDate: string
  introEventTime: string
  introEventLocation: string
  introMedia?: GiftItemMediaInput | null
}

export type GiftItemStatus = 'available' | 'reserved' | 'gifted'

export interface GiftListItem {
  id: string
  listId: string
  order: number | null
  name: string
  description: string
  link: string | null
  mediaUrl: string | null
  mediaPath: string | null
  mediaType: string | null
  mediaSizeBytes: number | null
  mediaDurationSeconds: number | null
  status: GiftItemStatus
  reservedByName: string | null
  reservedNamePublic: boolean
  reservedMessage: string | null
  reservedAt: number | null
  createdAt: number | null
  updatedAt: number | null
}

export interface GiftItemMediaInput {
  url: string
  path: string
  type: string
  sizeBytes: number
  durationSeconds: number | null
}

export interface CreateGiftItemInput {
  listId: string
  order?: number
  name: string
  description: string
  link?: string
  media?: GiftItemMediaInput | null
}

export interface UpdateGiftItemInput {
  listId: string
  itemId: string
  name: string
  description: string
  link?: string
  media?: GiftItemMediaInput | null
}

export interface ReserveGiftItemInput {
  listId: string
  itemId: string
  guestName: string
  guestMessage?: string
  reservedNamePublic?: boolean
}

export interface ListStoryEntry {
  id: string
  listId: string
  order: number | null
  title: string
  body: string
  mediaUrl: string | null
  mediaPath: string | null
  mediaType: string | null
  mediaSizeBytes: number | null
  mediaDurationSeconds: number | null
  createdAt: number | null
  updatedAt: number | null
}

export interface CreateListStoryInput {
  listId: string
  order?: number
  title: string
  body: string
  media?: GiftItemMediaInput | null
}

export interface UpdateListStoryInput {
  listId: string
  storyId: string
  title: string
  body: string
  media?: GiftItemMediaInput | null
}

export interface WheelEntry {
  id: string
  listId: string
  order: number | null
  question: string
  answerText: string | null
  answerAudioUrl: string | null
  answerAudioPath: string | null
  answerAudioType: string | null
  createdAt: number | null
  updatedAt: number | null
}

export interface CreateWheelEntryInput {
  listId: string
  order?: number
  question: string
  answerText: string
}

export interface UpdateWheelEntryInput {
  listId: string
  entryId: string
  question: string
  answerText: string
}
