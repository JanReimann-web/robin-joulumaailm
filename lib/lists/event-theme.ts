import { EventType, TemplateId } from '@/lib/lists/types'

export type EventThemeId =
  | 'default-dark'
  | 'birthday-classic'
  | 'birthday-modern'
  | 'birthday-minimal'
  | 'birthday-playful'
  | 'baby-shower-classic-boy'
  | 'baby-shower-modern-girl'
  | 'baby-shower-minimal-neutral'
  | 'baby-shower-playful-neutral'
  | 'graduation-classic-high-school'
  | 'graduation-modern-bachelor'
  | 'graduation-minimal-master'
  | 'graduation-playful-phd'
  | 'housewarming-classic'
  | 'housewarming-modern'
  | 'housewarming-minimal'
  | 'housewarming-playful'
  | 'christmas-classic'
  | 'christmas-modern'
  | 'christmas-minimal'
  | 'christmas-playful'
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
  babyShower: {
    classic: 'baby-shower-classic-boy',
    modern: 'baby-shower-modern-girl',
    minimal: 'baby-shower-minimal-neutral',
    playful: 'baby-shower-playful-neutral',
  },
  graduation: {
    classic: 'graduation-classic-high-school',
    modern: 'graduation-modern-bachelor',
    minimal: 'graduation-minimal-master',
    playful: 'graduation-playful-phd',
  },
  housewarming: {
    classic: 'housewarming-classic',
    modern: 'housewarming-modern',
    minimal: 'housewarming-minimal',
    playful: 'housewarming-playful',
  },
  christmas: {
    classic: 'christmas-classic',
    modern: 'christmas-modern',
    minimal: 'christmas-minimal',
    playful: 'christmas-playful',
  },
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
