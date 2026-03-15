import { describe, expect, it } from 'vitest'
import {
  applyDemoReservations,
  DEMO_RESERVATION_DURATION_MS,
  parseDemoReservationState,
  pruneDemoReservations,
} from '@/lib/lists/demo-reservations'
import { GiftListItem } from '@/lib/lists/types'

const createItem = (overrides: Partial<GiftListItem> = {}): GiftListItem => ({
  id: 'item-1',
  listId: 'list-1',
  name: 'Mixer',
  description: 'Kitchen helper',
  link: null,
  status: 'available',
  mediaUrl: null,
  mediaPath: null,
  mediaType: null,
  mediaSizeBytes: null,
  mediaDurationSeconds: null,
  reservedByName: null,
  reservedNamePublic: false,
  reservedMessage: null,
  reservedAt: null,
  order: 1,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
})

describe('demo reservations', () => {
  it('prunes expired reservations', () => {
    const now = 1_000
    const activeReservation = {
      itemId: 'item-1',
      reservedAt: now,
      expiresAt: now + DEMO_RESERVATION_DURATION_MS,
      reservedByName: null,
      reservedNamePublic: false,
      reservedMessage: null,
    }
    const expiredReservation = {
      itemId: 'item-2',
      reservedAt: now - DEMO_RESERVATION_DURATION_MS,
      expiresAt: now - 1,
      reservedByName: null,
      reservedNamePublic: false,
      reservedMessage: null,
    }

    const nextReservations = pruneDemoReservations({
      'item-1': activeReservation,
      'item-2': expiredReservation,
    }, now)

    expect(nextReservations).toEqual({
      'item-1': activeReservation,
    })
  })

  it('overlays only available items with active demo reservations', () => {
    const now = 10_000
    const items = [
      createItem(),
      createItem({
        id: 'item-2',
        status: 'gifted',
      }),
    ]

    const nextItems = applyDemoReservations(items, {
      'item-1': {
        itemId: 'item-1',
        reservedAt: now,
        expiresAt: now + DEMO_RESERVATION_DURATION_MS,
        reservedByName: 'Jane',
        reservedNamePublic: true,
        reservedMessage: 'See you there',
      },
      'item-2': {
        itemId: 'item-2',
        reservedAt: now,
        expiresAt: now + DEMO_RESERVATION_DURATION_MS,
        reservedByName: 'Guest',
        reservedNamePublic: false,
        reservedMessage: null,
      },
    }, now)

    expect(nextItems[0]).toMatchObject({
      status: 'reserved',
      reservedByName: 'Jane',
      reservedNamePublic: true,
      reservedMessage: 'See you there',
      reservedAt: now,
    })
    expect(nextItems[1].status).toBe('gifted')
  })

  it('parses only valid unexpired reservations from storage', () => {
    const now = 5_000
    const parsed = parseDemoReservationState(JSON.stringify({
      'item-1': {
        reservedAt: now,
        expiresAt: now + DEMO_RESERVATION_DURATION_MS,
        reservedByName: 'Jane',
        reservedNamePublic: true,
        reservedMessage: 'Hello',
      },
      'item-2': {
        reservedAt: now - DEMO_RESERVATION_DURATION_MS,
        expiresAt: now - 1,
        reservedByName: 'Old guest',
        reservedNamePublic: false,
        reservedMessage: null,
      },
      'item-3': {
        reservedAt: 'bad',
        expiresAt: 'data',
      },
    }), now)

    expect(parsed).toEqual({
      'item-1': {
        itemId: 'item-1',
        reservedAt: now,
        expiresAt: now + DEMO_RESERVATION_DURATION_MS,
        reservedByName: 'Jane',
        reservedNamePublic: true,
        reservedMessage: 'Hello',
      },
    })
  })
})
