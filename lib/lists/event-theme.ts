import { EventType, TemplateId } from '@/lib/lists/types'

export type EventThemeId =
  | 'default-dark'
  | 'birthday-classic'
  | 'birthday-modern'
  | 'birthday-minimal'
  | 'birthday-playful'
  | 'wedding-classic'
  | 'wedding-modern'
  | 'wedding-minimal'
  | 'wedding-playful'
  | 'kids-boy-tiny-pilot'
  | 'kids-boy-dino-ranger'
  | 'kids-boy-galaxy-racer'
  | 'kids-girl-tiny-bloom'
  | 'kids-girl-fairy-garden'
  | 'kids-girl-starlight-pop'

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
    kidsGirlTinyBloom: 'kids-girl-tiny-bloom',
    kidsGirlFairyGarden: 'kids-girl-fairy-garden',
    kidsGirlStarlightPop: 'kids-girl-starlight-pop',
  },
  birthday: {
    classic: 'birthday-classic',
    modern: 'birthday-modern',
    minimal: 'birthday-minimal',
    playful: 'birthday-playful',
  },
  // Placeholders for future event-specific themes.
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
