import {
  EVENT_ROUTE_SLUGS,
  eventSlugToType,
  eventTypeToSlug,
} from '@/lib/lists/event-route'
import { EVENT_TYPES } from '@/lib/lists/types'

describe('event route mapping', () => {
  it('maps every event type to a route slug', () => {
    for (const eventType of EVENT_TYPES) {
      const slug = eventTypeToSlug(eventType)
      expect(typeof slug).toBe('string')
      expect(slug.length).toBeGreaterThan(0)
    }
  })

  it('maps every route slug back to event type', () => {
    for (const slug of EVENT_ROUTE_SLUGS) {
      const eventType = eventSlugToType(slug)
      expect(eventType).not.toBeNull()
      if (eventType) {
        expect(eventTypeToSlug(eventType)).toBe(slug)
      }
    }
  })

  it('returns null for unknown route slug', () => {
    expect(eventSlugToType('unknown-event')).toBeNull()
  })
})

