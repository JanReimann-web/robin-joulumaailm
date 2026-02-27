'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ItemUnavailableError,
  ListExpiredError,
  reserveGiftItem,
  subscribeToListItems,
  subscribeToListStories,
  subscribeToPublicListBySlug,
  subscribeToWheelEntries,
} from '@/lib/lists/client'
import { EventType, GiftList, GiftListItem, ListStoryEntry, WheelEntry } from '@/lib/lists/types'

type PublicGiftListProps = {
  slug: string
}

const statusLabel = (status: GiftListItem['status']) => {
  if (status === 'available') return 'Available'
  if (status === 'reserved') return 'Reserved'
  return 'Gifted'
}

const renderItemMedia = (item: GiftListItem) => {
  if (!item.mediaUrl || !item.mediaType) {
    return null
  }

  if (item.mediaType.startsWith('image/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.mediaUrl}
        alt={item.name}
        className="mt-3 h-48 w-full rounded-xl border border-white/20 object-cover sm:h-56"
        loading="lazy"
      />
    )
  }

  if (item.mediaType.startsWith('video/')) {
    return (
      <video
        src={item.mediaUrl}
        controls
        preload="metadata"
        className="mt-3 h-48 w-full rounded-xl border border-white/20 object-cover sm:h-56"
      />
    )
  }

  if (item.mediaType.startsWith('audio/')) {
    return (
      <audio
        controls
        preload="metadata"
        className="mt-3 w-full"
        src={item.mediaUrl}
      />
    )
  }

  return null
}

const renderStoryMedia = (story: ListStoryEntry) => {
  if (!story.mediaUrl || !story.mediaType) {
    return null
  }

  if (story.mediaType.startsWith('image/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={story.mediaUrl}
        alt={story.title}
        className="mt-3 h-56 w-full rounded-xl border border-white/20 object-cover sm:h-64"
        loading="lazy"
      />
    )
  }

  if (story.mediaType.startsWith('video/')) {
    return (
      <video
        src={story.mediaUrl}
        controls
        preload="metadata"
        className="mt-3 h-56 w-full rounded-xl border border-white/20 object-cover sm:h-64"
      />
    )
  }

  return null
}

const wheelPalette = [
  '#10b981',
  '#22d3ee',
  '#38bdf8',
  '#6366f1',
  '#14b8a6',
  '#0ea5e9',
]

type EventTheme = {
  panelClass: string
  cardClass: string
  wheelPalette: string[]
  storyTitle: string
  wheelTitle: string
}

const getEventTheme = (eventType: EventType): EventTheme => {
  if (eventType === 'kidsBirthday') {
    return {
      panelClass: 'border-pink-300/40 bg-pink-300/10',
      cardClass: 'border-pink-200/30 bg-pink-950/30',
      wheelPalette: ['#f472b6', '#fb7185', '#f97316', '#facc15', '#34d399', '#60a5fa'],
      storyTitle: 'Birthday story adventure',
      wheelTitle: 'Kids fun wheel',
    }
  }

  if (eventType === 'birthday') {
    return {
      panelClass: 'border-cyan-300/40 bg-cyan-300/10',
      cardClass: 'border-cyan-200/30 bg-cyan-950/30',
      wheelPalette: ['#22d3ee', '#06b6d4', '#0ea5e9', '#6366f1', '#14b8a6', '#2dd4bf'],
      storyTitle: 'Celebration story',
      wheelTitle: 'Party question wheel',
    }
  }

  return {
    panelClass: 'border-white/10 bg-white/5',
    cardClass: 'border-white/10 bg-slate-950/60',
    wheelPalette,
    storyTitle: 'Our story',
    wheelTitle: 'Wheel of fortune',
  }
}

export default function PublicGiftList({ slug }: PublicGiftListProps) {
  const [list, setList] = useState<GiftList | null>(null)
  const [items, setItems] = useState<GiftListItem[]>([])
  const [stories, setStories] = useState<ListStoryEntry[]>([])
  const [wheelEntries, setWheelEntries] = useState<WheelEntry[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingStories, setLoadingStories] = useState(false)
  const [loadingWheelEntries, setLoadingWheelEntries] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestMessage, setGuestMessage] = useState('')
  const [reservingItemId, setReservingItemId] = useState<string | null>(null)
  const [isSpinningWheel, setIsSpinningWheel] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [selectedWheelEntryId, setSelectedWheelEntryId] = useState<string | null>(null)
  const [isWheelAnswerVisible, setIsWheelAnswerVisible] = useState(false)
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

  useEffect(() => {
    if (!list) {
      setStories([])
      return
    }

    setLoadingStories(true)

    const unsubscribe = subscribeToListStories(
      list.id,
      (nextStories) => {
        setStories(nextStories)
        setLoadingStories(false)
      },
      () => {
        setError('Failed to load story moments.')
        setLoadingStories(false)
      }
    )

    return () => unsubscribe()
  }, [list])

  useEffect(() => {
    if (!list) {
      setWheelEntries([])
      setSelectedWheelEntryId(null)
      setIsWheelAnswerVisible(false)
      return
    }

    setLoadingWheelEntries(true)

    const unsubscribe = subscribeToWheelEntries(
      list.id,
      (nextEntries) => {
        setWheelEntries(nextEntries)
        setLoadingWheelEntries(false)
      },
      () => {
        setError('Failed to load wheel questions.')
        setLoadingWheelEntries(false)
      }
    )

    return () => unsubscribe()
  }, [list])

  useEffect(() => {
    if (!selectedWheelEntryId) {
      return
    }

    const exists = wheelEntries.some((entry) => entry.id === selectedWheelEntryId)
    if (!exists) {
      setSelectedWheelEntryId(null)
      setIsWheelAnswerVisible(false)
    }
  }, [selectedWheelEntryId, wheelEntries])

  const availableCount = useMemo(
    () => items.filter((item) => item.status === 'available').length,
    [items]
  )
  const isListExpired = list?.accessStatus === 'expired'
  const eventTheme = list ? getEventTheme(list.eventType) : null
  const selectedWheelEntry = useMemo(
    () => wheelEntries.find((entry) => entry.id === selectedWheelEntryId) ?? null,
    [selectedWheelEntryId, wheelEntries]
  )
  const wheelGradient = useMemo(() => {
    if (wheelEntries.length === 0) {
      return 'conic-gradient(#0f172a 0% 100%)'
    }

    return `conic-gradient(${wheelEntries
      .map((entry, index) => {
        const start = (index / wheelEntries.length) * 100
        const end = ((index + 1) / wheelEntries.length) * 100
        const palette = eventTheme?.wheelPalette ?? wheelPalette
        return `${palette[index % palette.length]} ${start}% ${end}%`
      })
      .join(', ')})`
  }, [eventTheme, wheelEntries])

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

  const handleSpinWheel = () => {
    if (isSpinningWheel || wheelEntries.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * wheelEntries.length)
    const selectedEntry = wheelEntries[randomIndex]
    const baseTurns = 360 * 5
    const randomOffset = Math.random() * 360

    setIsSpinningWheel(true)
    setIsWheelAnswerVisible(false)
    setSelectedWheelEntryId(null)
    setWheelRotation((previous) => previous + baseTurns + randomOffset)

    window.setTimeout(() => {
      setSelectedWheelEntryId(selectedEntry.id)
      setIsSpinningWheel(false)
    }, 3400)
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

  const panelClass = eventTheme?.panelClass ?? 'border-white/10 bg-white/5'
  const cardClass = eventTheme?.cardClass ?? 'border-white/10 bg-slate-950/60'

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-14">
      <header className={`rounded-2xl border p-4 sm:p-6 ${panelClass}`}>
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

      <section className={`mt-6 rounded-2xl border p-4 sm:p-6 ${panelClass}`}>
        <h2 className="text-xl font-semibold text-white">{eventTheme?.storyTitle ?? 'Our story'}</h2>
        <p className="mt-2 text-sm text-slate-300">
          Personal moments from the host.
        </p>

        <div className="mt-4 grid gap-4">
          {loadingStories && (
            <p className="text-sm text-slate-300">Loading story moments...</p>
          )}

          {!loadingStories && stories.length === 0 && (
            <p className="text-sm text-slate-300">No story moments added yet.</p>
          )}

          {stories.map((story) => (
            <article
              key={story.id}
              className={`rounded-2xl border p-4 sm:p-5 ${cardClass}`}
            >
              <h3 className="text-lg font-semibold text-white">{story.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{story.body}</p>
              {renderStoryMedia(story)}
            </article>
          ))}
        </div>
      </section>

      <section className={`mt-6 rounded-2xl border p-4 sm:p-6 ${panelClass}`}>
        <h2 className="text-xl font-semibold text-white">{eventTheme?.wheelTitle ?? 'Wheel of fortune'}</h2>
        <p className="mt-2 text-sm text-slate-300">
          Spin the wheel, get a question, then reveal the host answer.
        </p>

        {loadingWheelEntries && (
          <p className="mt-4 text-sm text-slate-300">Loading wheel questions...</p>
        )}

        {!loadingWheelEntries && wheelEntries.length === 0 && (
          <p className="mt-4 text-sm text-slate-300">No wheel questions added yet.</p>
        )}

        {!loadingWheelEntries && wheelEntries.length > 0 && (
          <div className="mt-5 grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)] lg:items-start">
            <div className="mx-auto w-full max-w-[280px]">
              <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72">
                <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
                  <div className="h-0 w-0 border-x-[12px] border-b-[18px] border-x-transparent border-b-emerald-300" />
                </div>

                <div
                  className="absolute inset-0 rounded-full border-4 border-white/30 shadow-xl transition-transform duration-[3400ms] ease-out"
                  style={{
                    backgroundImage: wheelGradient,
                    transform: `rotate(${wheelRotation}deg)`,
                  }}
                >
                  <div className="absolute inset-4 rounded-full border border-white/20" />
                </div>

                <div className="absolute left-1/2 top-1/2 z-30 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-slate-950" />
              </div>

              <button
                type="button"
                onClick={handleSpinWheel}
                disabled={isSpinningWheel}
                className="mt-5 w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSpinningWheel ? 'Spinning...' : 'Spin the wheel'}
              </button>
            </div>

            <div className={`rounded-2xl border p-4 sm:p-5 ${cardClass}`}>
              {!selectedWheelEntry && (
                <p className="text-sm text-slate-300">
                  Spin the wheel to pick a random question.
                </p>
              )}

              {selectedWheelEntry && (
                <>
                  <h3 className="text-lg font-semibold text-white">{selectedWheelEntry.question}</h3>

                  {!isWheelAnswerVisible && (
                    <button
                      type="button"
                      onClick={() => setIsWheelAnswerVisible(true)}
                      className="mt-4 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Reveal answer
                    </button>
                  )}

                  {isWheelAnswerVisible && (
                    <div className="mt-4 space-y-3">
                      {selectedWheelEntry.answerText && (
                        <p className="text-sm text-slate-200">{selectedWheelEntry.answerText}</p>
                      )}

                      {selectedWheelEntry.answerAudioUrl && (
                        <audio
                          controls
                          preload="metadata"
                          className="w-full"
                          src={selectedWheelEntry.answerAudioUrl}
                        />
                      )}

                      {!selectedWheelEntry.answerText && !selectedWheelEntry.answerAudioUrl && (
                        <p className="text-sm text-slate-300">
                          No answer media has been added for this question yet.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className={`rounded-2xl border p-4 sm:p-6 ${panelClass}`}>
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
                className={`rounded-2xl border p-4 sm:p-5 ${cardClass}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                    {renderItemMedia(item)}
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
