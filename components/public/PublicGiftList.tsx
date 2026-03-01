'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { EventType, GiftList, GiftListItem, ListStoryEntry, WheelEntry } from '@/lib/lists/types'

type PublicGiftListProps = {
  slug: string
}

type PublicListView = Pick<
  GiftList,
  'id' | 'title' | 'slug' | 'eventType' | 'visibility' | 'accessStatus'
>

type PreviewMedia = {
  url: string
  type: string
} | null

type PublicListMetaResponse = {
  list: PublicListView
  requiresPassword: boolean
  previewMedia: PreviewMedia
}

type PublicListContentResponse = {
  list: PublicListView
  items: GiftListItem[]
  stories: ListStoryEntry[]
  wheelEntries: WheelEntry[]
  previewMedia: PreviewMedia
}

const statusLabel = (status: GiftListItem['status']) => {
  if (status === 'available') return 'Available'
  if (status === 'reserved') return 'Reserved'
  return 'Gifted'
}

const eventLabel = (eventType: EventType) => {
  if (eventType === 'kidsBirthday') return 'Birthday (kids)'
  if (eventType === 'babyShower') return 'Baby shower'
  if (eventType === 'housewarming') return 'Housewarming'
  return eventType[0].toUpperCase() + eventType.slice(1)
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
      wheelTitle: 'Wheel of Wisdom',
  }
}

const toListNotFoundMessage = () => {
  return 'This page may be private, deleted, expired, or the URL is incorrect.'
}

export default function PublicGiftList({ slug }: PublicGiftListProps) {
  const [meta, setMeta] = useState<PublicListMetaResponse | null>(null)
  const [list, setList] = useState<PublicListView | null>(null)
  const [items, setItems] = useState<GiftListItem[]>([])
  const [stories, setStories] = useState<ListStoryEntry[]>([])
  const [wheelEntries, setWheelEntries] = useState<WheelEntry[]>([])
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestMessage, setGuestMessage] = useState('')
  const [reservingItemId, setReservingItemId] = useState<string | null>(null)
  const [isSpinningWheel, setIsSpinningWheel] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [selectedWheelEntryId, setSelectedWheelEntryId] = useState<string | null>(null)
  const [isWheelAnswerVisible, setIsWheelAnswerVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadMeta = async () => {
      setMetaLoading(true)
      setError(null)
      setNotFound(false)

      try {
        const response = await fetch(
          `/api/public-list/${encodeURIComponent(slug)}/meta`,
          { cache: 'no-store' }
        )

        if (!response.ok) {
          if (response.status === 404 && !cancelled) {
            setMeta(null)
            setNotFound(true)
          }
          return
        }

        const payload = await response.json() as PublicListMetaResponse
        if (cancelled) {
          return
        }

        setMeta(payload)
        setPreviewMedia(payload.previewMedia)
      } catch {
        if (!cancelled) {
          setError('Failed to load list.')
        }
      } finally {
        if (!cancelled) {
          setMetaLoading(false)
        }
      }
    }

    void loadMeta()

    return () => {
      cancelled = true
    }
  }, [slug])

  const loadContent = useCallback(async () => {
    setContentLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/public-list/${encodeURIComponent(slug)}/content`,
        { cache: 'no-store' }
      )

      if (response.status === 401) {
        setIsPasswordPromptOpen(true)
        setIsPasswordVisible(false)
        return false
      }

      if (response.status === 404) {
        setNotFound(true)
        setMeta(null)
        setHasEntered(false)
        return false
      }

      if (!response.ok) {
        setError('Failed to load list content.')
        return false
      }

      const payload = await response.json() as PublicListContentResponse
      setList(payload.list)
      setItems(payload.items)
      setStories(payload.stories)
      setWheelEntries(payload.wheelEntries)
      if (payload.previewMedia) {
        setPreviewMedia(payload.previewMedia)
      }
      setIsPasswordPromptOpen(false)
      setIsPasswordVisible(false)
      setSuccess(null)
      return true
    } catch {
      setError('Failed to load list content.')
      return false
    } finally {
      setContentLoading(false)
    }
  }, [slug])

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

  const handleContinue = async () => {
    const ok = await loadContent()
    if (ok) {
      setHasEntered(true)
    }
  }

  const handleUnlock = async () => {
    if (!meta || !meta.requiresPassword) {
      return
    }

    setIsUnlocking(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/public-list/${encodeURIComponent(slug)}/unlock`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            password,
          }),
        }
      )

      if (!response.ok) {
        setError('Incorrect password. Please try again.')
        return
      }

      setPassword('')
      setIsPasswordVisible(false)
      const ok = await loadContent()
      if (ok) {
        setHasEntered(true)
      }
    } catch {
      setError('Password check failed. Please try again.')
    } finally {
      setIsUnlocking(false)
    }
  }

  const availableCount = useMemo(
    () => items.filter((item) => item.status === 'available').length,
    [items]
  )
  const activeEventType = list?.eventType ?? meta?.list.eventType
  const eventTheme = activeEventType ? getEventTheme(activeEventType) : null
  const isListExpired = (list ?? meta?.list)?.accessStatus === 'expired'
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
      const response = await fetch(
        `/api/public-list/${encodeURIComponent(slug)}/reserve`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            itemId,
            guestName,
            guestMessage,
          }),
        }
      )

      const payload = await response
        .json()
        .catch(() => ({ error: 'reserve_failed' })) as { error?: string }

      if (!response.ok) {
        if (payload.error === 'list_expired') {
          setError('This list has expired and no longer accepts reservations.')
          return
        }
        if (payload.error === 'item_unavailable') {
          setError('This gift has already been reserved.')
          await loadContent()
          return
        }
        if (payload.error === 'password_required') {
          setHasEntered(false)
          setIsPasswordPromptOpen(true)
          return
        }

        setError('Reservation failed. Please try again.')
        return
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === itemId
            ? {
                ...entry,
                status: 'reserved',
                reservedByName: guestName.trim() || null,
                reservedMessage: guestMessage.trim() || null,
                reservedAt: Date.now(),
              }
            : entry
        )
      )
      setSuccess('Reservation saved.')
    } catch {
      setError('Reservation failed. Please try again.')
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

  if (metaLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
        <p className="text-slate-200">Loading list...</p>
      </main>
    )
  }

  if (notFound || !meta) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">List not found</h1>
        <p className="mt-3 text-slate-300">
          {toListNotFoundMessage()}
        </p>
      </main>
    )
  }

  const panelClass = eventTheme?.panelClass ?? 'border-white/10 bg-white/5'
  const cardClass = eventTheme?.cardClass ?? 'border-white/10 bg-slate-950/60'

  if (!hasEntered) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-14">
        <section className={`overflow-hidden rounded-2xl border ${panelClass}`}>
          {previewMedia?.url && previewMedia.type.startsWith('image/') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewMedia.url}
              alt={meta.list.title}
              className="h-52 w-full object-cover sm:h-64"
            />
          )}
          {previewMedia?.url && previewMedia.type.startsWith('video/') && (
            <video
              src={previewMedia.url}
              className="h-52 w-full object-cover sm:h-64"
              autoPlay
              muted
              loop
              playsInline
            />
          )}

          <div className="p-5 sm:p-7">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{meta.list.title}</h1>
            <p className="mt-2 text-sm text-slate-300">
              Event: {eventLabel(meta.list.eventType)}
            </p>
            <p className="mt-1 text-xs text-slate-400">/{meta.list.slug}</p>

            <p className="mt-5 text-sm text-slate-200">
              Continue to gifts, story moments, and the wheel section.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleContinue}
                disabled={contentLoading}
                className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {contentLoading ? 'Opening...' : 'Continue to list'}
              </button>
            </div>

            {isPasswordPromptOpen && (
              <div className="mt-5 rounded-xl border border-white/20 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-200">
                  This list is password protected. Enter the password to continue.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr),auto] sm:items-end">
                  <label className="grid gap-1 text-sm text-slate-200">
                    <span>Password</span>
                    <div className="relative">
                      <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 pr-11 text-white"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible((current) => !current)}
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-300 transition hover:text-white"
                      >
                        {isPasswordVisible
                          ? <EyeOff size={16} />
                          : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={handleUnlock}
                    disabled={isUnlocking || password.trim().length < 6}
                    className="rounded-full border border-emerald-300/50 px-5 py-2 text-sm font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUnlocking ? 'Checking...' : 'Unlock'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            )}
          </div>
        </section>
      </main>
    )
  }

  if (contentLoading || !list) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
        <p className="text-slate-200">Loading list content...</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-14">
      <header className={`rounded-2xl border p-4 sm:p-6 ${panelClass}`}>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{list.title}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Event: {eventLabel(list.eventType)} - {availableCount} gifts available
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
          {stories.length === 0 && (
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
        <h2 className="text-xl font-semibold text-white">{eventTheme?.wheelTitle ?? 'Wheel of Wisdom'}</h2>
        <p className="mt-2 text-sm text-slate-300">
          Spin the wheel, get a question, then reveal the host answer.
        </p>

        {wheelEntries.length === 0 && (
          <p className="mt-4 text-sm text-slate-300">No wheel questions added yet.</p>
        )}

        {wheelEntries.length > 0 && (
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
          {items.length === 0 && (
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
