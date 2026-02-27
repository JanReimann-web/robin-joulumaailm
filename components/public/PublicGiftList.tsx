'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ItemUnavailableError,
  ListExpiredError,
  reserveGiftItem,
  subscribeToListItems,
  subscribeToPublicListBySlug,
} from '@/lib/lists/client'
import { GiftList, GiftListItem } from '@/lib/lists/types'

type PublicGiftListProps = {
  slug: string
}

const statusLabel = (status: GiftListItem['status']) => {
  if (status === 'available') return 'Available'
  if (status === 'reserved') return 'Reserved'
  return 'Gifted'
}

export default function PublicGiftList({ slug }: PublicGiftListProps) {
  const [list, setList] = useState<GiftList | null>(null)
  const [items, setItems] = useState<GiftListItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestMessage, setGuestMessage] = useState('')
  const [reservingItemId, setReservingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToPublicListBySlug(
      slug,
      (nextList) => {
        setList(nextList)
        setLoadingList(false)
      },
      () => {
        setError('Failed to load list.')
        setLoadingList(false)
      }
    )

    return () => unsubscribe()
  }, [slug])

  useEffect(() => {
    if (!list) {
      setItems([])
      return
    }

    setLoadingItems(true)

    const unsubscribe = subscribeToListItems(
      list.id,
      (nextItems) => {
        setItems(nextItems)
        setLoadingItems(false)
      },
      () => {
        setError('Failed to load gift items.')
        setLoadingItems(false)
      }
    )

    return () => unsubscribe()
  }, [list])

  const availableCount = useMemo(
    () => items.filter((item) => item.status === 'available').length,
    [items]
  )
  const isListExpired = list?.accessStatus === 'expired'

  const handleReserve = async (itemId: string) => {
    if (!list) {
      return
    }

    setError(null)
    setSuccess(null)
    setReservingItemId(itemId)

    try {
      await reserveGiftItem({
        listId: list.id,
        itemId,
        guestName,
        guestMessage,
      })

      setSuccess('Reservation saved.')
    } catch (rawError) {
      if (rawError instanceof ListExpiredError) {
        setError('This list has expired and no longer accepts reservations.')
      } else if (rawError instanceof ItemUnavailableError) {
        setError('This gift has already been reserved.')
      } else {
        setError('Reservation failed. Please try again.')
      }
    } finally {
      setReservingItemId(null)
    }
  }

  if (loadingList) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
        <p className="text-slate-200">Loading list...</p>
      </main>
    )
  }

  if (!list) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">List not found</h1>
        <p className="mt-3 text-slate-300">
          This page may be private, deleted, or the URL is incorrect.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-14">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{list.title}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Event: {list.eventType} - {availableCount} gifts available
        </p>
        <p className="mt-1 text-xs text-slate-400">/{list.slug}</p>
        {isListExpired && (
          <p className="mt-3 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            This list has expired and is now read-only.
          </p>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-white">Your details (optional)</h2>
            <p className="mt-2 text-sm text-slate-300">
              Add your name so the host can thank you later.
            </p>

            <div className="mt-4 grid gap-3">
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Your name"
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
              <input
                value={guestMessage}
                onChange={(event) => setGuestMessage(event.target.value)}
                placeholder="Message (optional)"
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </div>

            {success && (
              <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            )}
          </section>
        </aside>

        <section className="grid gap-4">
          {loadingItems && <p className="text-sm text-slate-300">Loading gifts...</p>}

          {!loadingItems && items.length === 0 && (
            <p className="text-sm text-slate-300">No gift items added yet.</p>
          )}

          {items.map((item) => {
            const isAvailable = item.status === 'available'

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm text-emerald-300 underline"
                      >
                        Open product link
                      </a>
                    )}
                  </div>

                  <span className="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                    {statusLabel(item.status)}
                  </span>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={Boolean(isListExpired) || !isAvailable || reservingItemId === item.id}
                    onClick={() => handleReserve(item.id)}
                    className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {reservingItemId === item.id ? 'Reserving...' : 'Reserve this gift'}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
