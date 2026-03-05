import { EventType, TemplateId } from '@/lib/lists/types'

export type EventThemeId =
  | 'default-dark'
  | 'wedding-classic'
  | 'wedding-modern'
  | 'wedding-minimal'
  | 'wedding-playful'
  | 'kids-boy-tiny-pilot'
  | 'kids-boy-dino-ranger'
  | 'kids-boy-galaxy-racer'

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
  kidsBirthday: {
    kidsBoyTinyPilot: 'kids-boy-tiny-pilot',
    kidsBoyDinoRanger: 'kids-boy-dino-ranger',
    kidsBoyGalaxyRacer: 'kids-boy-galaxy-racer',
    // Placeholders for girls themes.
    kidsGirlTinyBloom: 'default-dark',
    kidsGirlFairyGarden: 'default-dark',
    kidsGirlStarlightPop: 'default-dark',
  },
  // Placeholders for future event-specific themes.
  birthday: {},
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
