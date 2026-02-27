import { EventType } from '@/lib/lists/types'

const EVENT_TYPE_SLUG_MAP: Record<EventType, string> = {
  wedding: 'wedding',
  birthday: 'birthday',
  babyShower: 'baby-shower',
  christmas: 'christmas',
}

const EVENT_SLUG_TYPE_MAP: Record<string, EventType> = Object.entries(EVENT_TYPE_SLUG_MAP).reduce(
  (accumulator, [eventType, eventSlug]) => {
    accumulator[eventSlug] = eventType as EventType
    return accumulator
  },
  {} as Record<string, EventType>
)

export const EVENT_ROUTE_SLUGS = Object.values(EVENT_TYPE_SLUG_MAP)

export const eventTypeToSlug = (eventType: EventType) => {
  return EVENT_TYPE_SLUG_MAP[eventType]
}

export const eventSlugToType = (eventSlug: string): EventType | null => {
  return EVENT_SLUG_TYPE_MAP[eventSlug] ?? null
}
