import { GiftListItem } from '@/lib/lists/types'

export const DEMO_RESERVATION_DURATION_MS = 5 * 60 * 1000

export type DemoReservation = {
  itemId: string
  reservedAt: number
  expiresAt: number
  reservedByName: string | null
  reservedNamePublic: boolean
  reservedMessage: string | null
}

export type DemoReservationState = Record<string, DemoReservation>

export const buildDemoReservationStorageKey = (slug: string) => {
  return `giftlist-demo-reservations:${slug}`
}

const isFiniteTimestamp = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export const pruneDemoReservations = (
  reservations: DemoReservationState,
  now = Date.now()
): DemoReservationState => {
  return Object.fromEntries(
    Object.entries(reservations).filter(([, reservation]) => {
      return reservation.expiresAt > now
    })
  )
}

export const isSameDemoReservationState = (
  left: DemoReservationState,
  right: DemoReservationState
) => {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every((key) => {
    const leftReservation = left[key]
    const rightReservation = right[key]

    return Boolean(
      rightReservation
      && leftReservation.itemId === rightReservation.itemId
      && leftReservation.reservedAt === rightReservation.reservedAt
      && leftReservation.expiresAt === rightReservation.expiresAt
      && leftReservation.reservedByName === rightReservation.reservedByName
      && leftReservation.reservedNamePublic === rightReservation.reservedNamePublic
      && leftReservation.reservedMessage === rightReservation.reservedMessage
    )
  })
}

export const parseDemoReservationState = (
  raw: string | null | undefined,
  now = Date.now()
): DemoReservationState => {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const nextReservations: DemoReservationState = {}

    for (const [itemId, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== 'object') {
        continue
      }

      const reservation = entry as Record<string, unknown>
      const reservedAt = reservation.reservedAt
      const expiresAt = reservation.expiresAt

      if (!isFiniteTimestamp(reservedAt) || !isFiniteTimestamp(expiresAt)) {
        continue
      }

      if (expiresAt <= now || expiresAt <= reservedAt) {
        continue
      }

      nextReservations[itemId] = {
        itemId,
        reservedAt,
        expiresAt,
        reservedByName: typeof reservation.reservedByName === 'string'
          ? reservation.reservedByName
          : null,
        reservedNamePublic: reservation.reservedNamePublic === true,
        reservedMessage: typeof reservation.reservedMessage === 'string'
          ? reservation.reservedMessage
          : null,
      }
    }

    return nextReservations
  } catch {
    return {}
  }
}

export const applyDemoReservations = (
  items: GiftListItem[],
  reservations: DemoReservationState,
  now = Date.now()
) => {
  return items.map((item) => {
    const reservation = reservations[item.id]

    if (!reservation || reservation.expiresAt <= now || item.status !== 'available') {
      return item
    }

    return {
      ...item,
      status: 'reserved' as const,
      reservedAt: reservation.reservedAt,
      reservedByName: reservation.reservedByName,
      reservedNamePublic: reservation.reservedNamePublic,
      reservedMessage: reservation.reservedMessage,
    }
  })
}
