import { EventType, TemplateId } from '@/lib/lists/types'

export type EventThemeId =
  | 'default-dark'
  | 'wedding-classic'
  | 'wedding-modern'
  | 'wedding-minimal'
  | 'wedding-playful'

type EventThemeMap = {
  [K in EventType]?: Partial<Record<TemplateId, EventThemeId>>
}

const EVENT_THEME_MAP: EventThemeMap = {
  wedding: {
    classic: 'wedding-classic',
    // Placeholders for future wedding themes.
    modern: 'wedding-modern',
    minimal: 'wedding-minimal',
    playful: 'wedding-playful',
  },
  // Placeholders for future event-specific themes.
  birthday: {},
  kidsBirthday: {},
  babyShower: {},
  graduation: {},
  housewarming: {},
  christmas: {},
}

export const resolveEventThemeId = (
  eventType: EventType | undefined,
  templateId: TemplateId | undefined
): EventThemeId => {
  if (!eventType || !templateId) {
    return 'default-dark'
  }

  const byEventType = EVENT_THEME_MAP[eventType]
  if (!byEventType) {
    return 'default-dark'
  }

  return byEventType[templateId] ?? 'default-dark'
}

