'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { EventType, GiftList, GiftListItem, ListStoryEntry, WheelEntry } from '@/lib/lists/types'
import { resolveEventThemeId } from '@/lib/lists/event-theme'

type PublicGiftListProps = {
  slug: string
}

type PublicListView = Pick<
  GiftList,
  | 'id'
  | 'title'
  | 'slug'
  | 'eventType'
  | 'templateId'
  | 'visibility'
  | 'accessStatus'
  | 'introTitle'
  | 'introBody'
  | 'introMediaUrl'
  | 'introMediaType'
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

type PublicLocale = 'en' | 'et'

const GUEST_MESSAGE_MAX_LENGTH = 240
const GUEST_NAME_MAX_LENGTH = 80

const PUBLIC_COPY = {
  en: {
    loadingList: 'Loading list...',
    loadingContent: 'Loading list content...',
    listNotFoundTitle: 'List not found',
    listNotFoundBody: 'This page may be private, deleted, expired, or the URL is incorrect.',
    failedLoadList: 'Failed to load list.',
    failedLoadContent: 'Failed to load list content.',
    eventLabel: 'Event',
    giftsAvailable: 'gifts available',
    continueFallbackText: 'Continue to gifts, story moments, and the wheel section.',
    continueAction: 'Continue to list',
    opening: 'Opening...',
    passwordProtectedPrompt: 'This list is password protected. Enter the password to continue.',
    passwordIncorrect: 'Incorrect password. Please try again.',
    passwordCheckFailed: 'Password check failed. Please try again.',
    passwordLabel: 'Password',
    hidePasswordAria: 'Hide password',
    showPasswordAria: 'Show password',
    unlockAction: 'Unlock',
    checkingPassword: 'Checking...',
    listExpired: 'This list has expired and is now read-only.',
    storySubtitle: 'Personal moments from the host.',
    wheelSubtitle: 'Spin the wheel, get a question, then reveal the host answer.',
    noWheelQuestions: 'No wheel questions added yet.',
    spinAction: 'Spin the wheel',
    spinning: 'Spinning...',
    wheelIntro: 'Spin the wheel to pick a random question.',
    revealAnswerAction: 'Reveal answer',
    noAnswerForQuestion: 'No answer media has been added for this question yet.',
    productLinkAction: 'Open product link',
    reserveAction: 'Reserve this gift',
    reserving: 'Reserving...',
    yourDetailsTitle: 'Your details (optional)',
    yourDetailsSubtitle: 'You can add your details now so the host can thank you later.',
    yourNamePlaceholder: 'Your name',
    yourMessagePlaceholder: 'Message (optional)',
    messageCounterLabel: 'Message',
    detailsSkipAction: 'Skip',
    detailsSaveAction: 'Save details',
    detailsSaving: 'Saving...',
    detailsNameTooLong: 'Name is too long.',
    detailsMessageTooLong: 'Message is too long.',
    detailsSaved: 'Details saved.',
    detailsSaveFailed: 'Failed to save details.',
    reservationSaved: 'Reservation saved.',
    reservationExpired: 'This list has expired and no longer accepts reservations.',
    reservationUnavailable: 'This gift has already been reserved.',
    reservationFailed: 'Reservation failed. Please try again.',
    thankYouTitle: 'Thank you!',
    thankYouBody: 'Your reservation was saved successfully.',
    storyTitleDefault: 'Our story',
    wheelTitleDefault: 'Wheel of Wisdom',
    kidsStoryTitle: 'Birthday story adventure',
    kidsWheelTitle: 'Kids fun wheel',
    birthdayStoryTitle: 'Celebration story',
    birthdayWheelTitle: 'Party question wheel',
    statusAvailable: 'Available',
    statusReserved: 'Reserved',
    statusGifted: 'Gifted',
    noGiftItems: 'No gift items added yet.',
    eventWedding: 'Wedding',
    eventBirthday: 'Birthday',
    eventKidsBirthday: 'Birthday (kids)',
    eventBabyShower: 'Baby shower',
    eventGraduation: 'Graduation',
    eventHousewarming: 'Housewarming',
    eventChristmas: 'Christmas',
    languageLabel: 'Language',
  },
  et: {
    loadingList: 'Laen nimekirja...',
    loadingContent: 'Laen nimekirja sisu...',
    listNotFoundTitle: 'Nimekirja ei leitud',
    listNotFoundBody: 'See leht võib olla privaatne, kustutatud, aegunud või URL on vale.',
    failedLoadList: 'Nimekirja laadimine ebaõnnestus.',
    failedLoadContent: 'Nimekirja sisu laadimine ebaõnnestus.',
    eventLabel: 'Sündmus',
    giftsAvailable: 'kingitust saadaval',
    continueFallbackText: 'Jätka kingituste, loohetkede ja tarkuseratta sektsiooni.',
    continueAction: 'Jätka nimekirja',
    opening: 'Avan...',
    passwordProtectedPrompt: 'See nimekiri on parooliga kaitstud. Jätkamiseks sisesta parool.',
    passwordIncorrect: 'Vale parool. Proovi uuesti.',
    passwordCheckFailed: 'Parooli kontroll ebaõnnestus. Proovi uuesti.',
    passwordLabel: 'Parool',
    hidePasswordAria: 'Peida parool',
    showPasswordAria: 'Näita parooli',
    unlockAction: 'Ava',
    checkingPassword: 'Kontrollin...',
    listExpired: 'See nimekiri on aegunud ja ainult vaatamiseks.',
    storySubtitle: 'Isiklikud hetked nimekirja loojalt.',
    wheelSubtitle: 'Keera ratast, saa küsimus ja ava seejärel looja vastus.',
    noWheelQuestions: 'Ratta küsimusi pole veel lisatud.',
    spinAction: 'Keera ratast',
    spinning: 'Keeran...',
    wheelIntro: 'Keera ratast, et valida juhuslik küsimus.',
    revealAnswerAction: 'Näita vastust',
    noAnswerForQuestion: 'Sellele küsimusele pole veel vastust lisatud.',
    productLinkAction: 'Ava toote link',
    reserveAction: 'Broneeri see kingitus',
    reserving: 'Broneerin...',
    yourDetailsTitle: 'Sinu andmed (valikuline)',
    yourDetailsSubtitle: 'Soovi korral lisa nüüd andmed, et nimekirja looja saaks sind tänada.',
    yourNamePlaceholder: 'Sinu nimi',
    yourMessagePlaceholder: 'Sõnum (valikuline)',
    messageCounterLabel: 'Sõnum',
    detailsSkipAction: 'Jäta vahele',
    detailsSaveAction: 'Salvesta andmed',
    detailsSaving: 'Salvestan...',
    detailsNameTooLong: 'Nimi on liiga pikk.',
    detailsMessageTooLong: 'Sõnum on liiga pikk.',
    detailsSaved: 'Andmed salvestatud.',
    detailsSaveFailed: 'Andmete salvestamine ebaõnnestus.',
    reservationSaved: 'Broneering salvestatud.',
    reservationExpired: 'See nimekiri on aegunud ja ei võta enam broneeringuid vastu.',
    reservationUnavailable: 'See kingitus on juba broneeritud.',
    reservationFailed: 'Broneerimine ebaõnnestus. Proovi uuesti.',
    thankYouTitle: 'Aitäh!',
    thankYouBody: 'Sinu broneering salvestati edukalt.',
    storyTitleDefault: 'Meie lugu',
    wheelTitleDefault: 'Tarkuseratas',
    kidsStoryTitle: 'Sünnipäeva seikluslugu',
    kidsWheelTitle: 'Laste lustiratas',
    birthdayStoryTitle: 'Peolugu',
    birthdayWheelTitle: 'Peoküsimuste ratas',
    statusAvailable: 'Vaba',
    statusReserved: 'Broneeritud',
    statusGifted: 'Kingitud',
    noGiftItems: 'Kingitusi pole veel lisatud.',
    eventWedding: 'Pulm',
    eventBirthday: 'Sünnipäev',
    eventKidsBirthday: 'Sünnipäev (lastele)',
    eventBabyShower: 'Baby shower',
    eventGraduation: 'Lõpetamine',
    eventHousewarming: 'Soolaleib',
    eventChristmas: 'Jõulud',
    languageLabel: 'Keel',
  },
} as const

const detectInitialLocale = (): PublicLocale => {
  if (typeof navigator === 'undefined') {
    return 'en'
  }

  return navigator.language.toLowerCase().startsWith('et') ? 'et' : 'en'
}

const eventLabel = (eventType: EventType, locale: PublicLocale) => {
  const copy = PUBLIC_COPY[locale]
  if (eventType === 'wedding') return copy.eventWedding
  if (eventType === 'birthday') return copy.eventBirthday
  if (eventType === 'kidsBirthday') return copy.eventKidsBirthday
  if (eventType === 'babyShower') return copy.eventBabyShower
  if (eventType === 'graduation') return copy.eventGraduation
  if (eventType === 'housewarming') return copy.eventHousewarming
  return copy.eventChristmas
}

const statusLabel = (
  status: GiftListItem['status'],
  locale: PublicLocale
) => {
  const copy = PUBLIC_COPY[locale]
  if (status === 'available') return copy.statusAvailable
  if (status === 'reserved') return copy.statusReserved
  return copy.statusGifted
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

type EventSectionCopy = {
  storyTitle: string
  wheelTitle: string
}

const getEventSectionCopy = (
  eventType: EventType,
  locale: PublicLocale
): EventSectionCopy => {
  const copy = PUBLIC_COPY[locale]
  if (eventType === 'kidsBirthday') {
    return {
      storyTitle: copy.kidsStoryTitle,
      wheelTitle: copy.kidsWheelTitle,
    }
  }

  if (eventType === 'birthday') {
    return {
      storyTitle: copy.birthdayStoryTitle,
      wheelTitle: copy.birthdayWheelTitle,
    }
  }

  return {
    storyTitle: copy.storyTitleDefault,
    wheelTitle: copy.wheelTitleDefault,
  }
}

export default function PublicGiftList({ slug }: PublicGiftListProps) {
  const [locale, setLocale] = useState<PublicLocale>(detectInitialLocale)
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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [detailsItemId, setDetailsItemId] = useState<string | null>(null)
  const [detailsGuestName, setDetailsGuestName] = useState('')
  const [detailsGuestMessage, setDetailsGuestMessage] = useState('')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [isThankYouVisible, setIsThankYouVisible] = useState(false)
  const [isThankYouClosing, setIsThankYouClosing] = useState(false)
  const [reservingItemId, setReservingItemId] = useState<string | null>(null)
  const [isSpinningWheel, setIsSpinningWheel] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [selectedWheelEntryId, setSelectedWheelEntryId] = useState<string | null>(null)
  const [isWheelAnswerVisible, setIsWheelAnswerVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const thankYouTimeoutRef = useRef<number | null>(null)
  const thankYouCloseTimeoutRef = useRef<number | null>(null)
  const copy = PUBLIC_COPY[locale]

  useEffect(() => {
    setLocale(detectInitialLocale())
  }, [])

  useEffect(() => {
    return () => {
      if (thankYouTimeoutRef.current) {
        window.clearTimeout(thankYouTimeoutRef.current)
      }
      if (thankYouCloseTimeoutRef.current) {
        window.clearTimeout(thankYouCloseTimeoutRef.current)
      }
    }
  }, [])

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
          setError(copy.failedLoadList)
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
  }, [copy.failedLoadList, slug])

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
        setError(copy.failedLoadContent)
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
      setError(copy.failedLoadContent)
      return false
    } finally {
      setContentLoading(false)
    }
  }, [copy.failedLoadContent, slug])

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
        setError(copy.passwordIncorrect)
        return
      }

      setPassword('')
      setIsPasswordVisible(false)
      const ok = await loadContent()
      if (ok) {
        setHasEntered(true)
      }
    } catch {
      setError(copy.passwordCheckFailed)
    } finally {
      setIsUnlocking(false)
    }
  }

  const availableCount = useMemo(
    () => items.filter((item) => item.status === 'available').length,
    [items]
  )
  const activeEventType = list?.eventType ?? meta?.list.eventType
  const activeTemplateId = list?.templateId ?? meta?.list.templateId
  const eventThemeId = resolveEventThemeId(activeEventType, activeTemplateId)
  const eventSectionCopy = activeEventType ? getEventSectionCopy(activeEventType, locale) : null
  const isListExpired = (list ?? meta?.list)?.accessStatus === 'expired'
  const selectedWheelEntry = useMemo(
    () => wheelEntries.find((entry) => entry.id === selectedWheelEntryId) ?? null,
    [selectedWheelEntryId, wheelEntries]
  )

  const wheelGradient = useMemo(() => {
    if (wheelEntries.length === 0) {
      return 'conic-gradient(#0f172a 0% 100%)'
    }

    const palette = [
      'var(--event-wheel-1)',
      'var(--event-wheel-2)',
      'var(--event-wheel-3)',
      'var(--event-wheel-4)',
      'var(--event-wheel-5)',
      'var(--event-wheel-6)',
    ]

    return `conic-gradient(${wheelEntries
      .map((entry, index) => {
        const start = (index / wheelEntries.length) * 100
        const end = ((index + 1) / wheelEntries.length) * 100
        return `${palette[index % palette.length]} ${start}% ${end}%`
      })
      .join(', ')})`
  }, [wheelEntries])

  const showThankYouCard = () => {
    setIsThankYouVisible(true)
    setIsThankYouClosing(false)
    if (thankYouCloseTimeoutRef.current) {
      window.clearTimeout(thankYouCloseTimeoutRef.current)
    }
    if (thankYouTimeoutRef.current) {
      window.clearTimeout(thankYouTimeoutRef.current)
    }
    thankYouCloseTimeoutRef.current = window.setTimeout(() => {
      setIsThankYouClosing(true)
      thankYouCloseTimeoutRef.current = null
    }, 4300)
    thankYouTimeoutRef.current = window.setTimeout(() => {
      setIsThankYouVisible(false)
      setIsThankYouClosing(false)
      thankYouTimeoutRef.current = null
    }, 5000)
  }

  const handleSaveReservationDetails = async () => {
    if (!detailsItemId) {
      return
    }

    const normalizedName = detailsGuestName.trim()
    const normalizedMessage = detailsGuestMessage.trim()

    if (normalizedName.length > GUEST_NAME_MAX_LENGTH) {
      setDetailsError(copy.detailsNameTooLong)
      return
    }

    if (normalizedMessage.length > GUEST_MESSAGE_MAX_LENGTH) {
      setDetailsError(copy.detailsMessageTooLong)
      return
    }

    setIsSavingDetails(true)
    setDetailsError(null)
    setError(null)

    try {
      const response = await fetch(
        `/api/public-list/${encodeURIComponent(slug)}/reservation-details`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            itemId: detailsItemId,
            guestName: normalizedName,
            guestMessage: normalizedMessage,
          }),
        }
      )

      const payload = await response
        .json()
        .catch(() => ({ error: 'save_failed' })) as { error?: string }

      if (!response.ok) {
        if (payload.error === 'password_required') {
          setHasEntered(false)
          setIsPasswordPromptOpen(true)
          return
        }

        if (payload.error === 'item_not_reserved' || payload.error === 'item_unavailable') {
          await loadContent()
        }

        setDetailsError(copy.detailsSaveFailed)
        return
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === detailsItemId
            ? {
                ...entry,
                reservedByName: normalizedName || null,
                reservedMessage: normalizedMessage || null,
              }
            : entry
        )
      )
      setSuccess(copy.detailsSaved)
      setIsDetailsModalOpen(false)
      setDetailsItemId(null)
      setDetailsGuestName('')
      setDetailsGuestMessage('')
      showThankYouCard()
    } catch {
      setDetailsError(copy.detailsSaveFailed)
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleSkipReservationDetails = () => {
    setIsDetailsModalOpen(false)
    setDetailsItemId(null)
    setDetailsGuestName('')
    setDetailsGuestMessage('')
    setDetailsError(null)
    showThankYouCard()
  }

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
          }),
        }
      )

      const payload = await response
        .json()
        .catch(() => ({ error: 'reserve_failed' })) as { error?: string }

      if (!response.ok) {
        if (payload.error === 'list_expired') {
          setError(copy.reservationExpired)
          return
        }
        if (payload.error === 'item_unavailable') {
          setError(copy.reservationUnavailable)
          await loadContent()
          return
        }
        if (payload.error === 'password_required') {
          setHasEntered(false)
          setIsPasswordPromptOpen(true)
          return
        }

        setError(copy.reservationFailed)
        return
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === itemId
            ? {
                ...entry,
                status: 'reserved',
                reservedByName: null,
                reservedMessage: null,
                reservedAt: Date.now(),
              }
            : entry
        )
      )
      setSuccess(copy.reservationSaved)
      setDetailsItemId(itemId)
      setDetailsGuestName('')
      setDetailsGuestMessage('')
      setDetailsError(null)
      setIsDetailsModalOpen(true)
    } catch {
      setError(copy.reservationFailed)
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

  const languageSwitcher = (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/70 p-1 text-xs">
      <span className="px-2 text-slate-300">{copy.languageLabel}</span>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-full px-3 py-1 font-semibold transition ${
          locale === 'en' ? 'bg-emerald-400 text-black' : 'text-slate-200'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('et')}
        className={`rounded-full px-3 py-1 font-semibold transition ${
          locale === 'et' ? 'bg-emerald-400 text-black' : 'text-slate-200'
        }`}
      >
        ET
      </button>
    </div>
  )

  if (metaLoading) {
    return (
      <main
        className="event-canvas mx-auto w-full max-w-6xl rounded-2xl px-4 py-10 sm:py-16"
        data-event-theme="default-dark"
      >
        <div className="mb-4 flex justify-end">{languageSwitcher}</div>
        <p className="text-slate-200">{copy.loadingList}</p>
      </main>
    )
  }

  if (notFound || !meta) {
    return (
      <main
        className="event-canvas mx-auto w-full max-w-6xl rounded-2xl px-4 py-10 sm:py-16"
        data-event-theme="default-dark"
      >
        <div className="mb-4 flex justify-end">{languageSwitcher}</div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{copy.listNotFoundTitle}</h1>
        <p className="mt-3 text-slate-300">{copy.listNotFoundBody}</p>
      </main>
    )
  }

  if (!hasEntered) {
    return (
      <main
        className="event-canvas mx-auto w-full max-w-4xl rounded-2xl px-4 py-8 sm:py-14"
        data-event-theme={eventThemeId}
      >
        <div className="mb-4 flex justify-end">{languageSwitcher}</div>
        <section
          className="event-surface-panel overflow-hidden rounded-2xl border border-white/10 bg-white/5"
        >
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
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {meta.list.introTitle || meta.list.title}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {copy.eventLabel}: {eventLabel(meta.list.eventType, locale)}
            </p>
            <p className="mt-1 text-xs text-slate-400">/{meta.list.slug}</p>

            {(meta.list.introBody || '').trim() && (
              <p className="mt-5 text-sm text-slate-200">
                {meta.list.introBody}
              </p>
            )}

            {!(meta.list.introBody || '').trim() && (
              <p className="mt-5 text-sm text-slate-200">
                {copy.continueFallbackText}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleContinue}
                disabled={contentLoading}
                className="event-accent-button rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {contentLoading ? copy.opening : copy.continueAction}
              </button>
            </div>

            {isPasswordPromptOpen && (
              <div className="mt-5 rounded-xl border border-white/20 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-200">
                  {copy.passwordProtectedPrompt}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr),auto] sm:items-end">
                  <label className="grid gap-1 text-sm text-slate-200">
                    <span>{copy.passwordLabel}</span>
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
                        aria-label={isPasswordVisible ? copy.hidePasswordAria : copy.showPasswordAria}
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
                    {isUnlocking ? copy.checkingPassword : copy.unlockAction}
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
      <main
        className="event-canvas mx-auto w-full max-w-6xl rounded-2xl px-4 py-10 sm:py-16"
        data-event-theme={eventThemeId}
      >
        <div className="mb-4 flex justify-end">{languageSwitcher}</div>
        <p className="text-slate-200">{copy.loadingContent}</p>
      </main>
    )
  }

  return (
    <main
      className="event-canvas mx-auto w-full max-w-6xl rounded-2xl px-4 py-8 sm:py-14"
      data-event-theme={eventThemeId}
    >
      <div className="mb-4 flex justify-end">{languageSwitcher}</div>
      <header
        className="event-surface-panel rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
      >
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{list.title}</h1>
        <p className="mt-2 text-sm text-slate-300">
          {copy.eventLabel}: {eventLabel(list.eventType, locale)} - {availableCount} {copy.giftsAvailable}
        </p>
        <p className="mt-1 text-xs text-slate-400">/{list.slug}</p>
        {isListExpired && (
          <p className="mt-3 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            {copy.listExpired}
          </p>
        )}
      </header>

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

      {stories.length > 0 && (
        <section
          className="event-surface-panel mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
        >
          <h2 className="text-xl font-semibold text-white">
            {eventSectionCopy?.storyTitle ?? copy.storyTitleDefault}
          </h2>
          <p className="mt-2 text-sm text-slate-300">{copy.storySubtitle}</p>

          <div className="mt-4 grid gap-4">
            {stories.map((story) => (
              <article
                key={story.id}
                className="event-surface-card rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5"
              >
                <h3 className="text-lg font-semibold text-white">{story.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{story.body}</p>
                {renderStoryMedia(story)}
              </article>
            ))}
          </div>
        </section>
      )}

      {wheelEntries.length > 0 && (
        <section
          className="event-surface-panel mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
        >
          <h2 className="text-xl font-semibold text-white">
            {eventSectionCopy?.wheelTitle ?? copy.wheelTitleDefault}
          </h2>
          <p className="mt-2 text-sm text-slate-300">{copy.wheelSubtitle}</p>

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
                className="event-accent-button mt-5 w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSpinningWheel ? copy.spinning : copy.spinAction}
              </button>
            </div>

            <div
              className="event-surface-card rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5"
            >
              {!selectedWheelEntry && (
                <p className="text-sm text-slate-300">{copy.wheelIntro}</p>
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
                      {copy.revealAnswerAction}
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
                        <p className="text-sm text-slate-300">{copy.noAnswerForQuestion}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-300">{copy.noGiftItems}</p>
        )}

        {items.map((item) => {
          const isAvailable = item.status === 'available'

          return (
            <article
              key={item.id}
              className="event-surface-card rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5"
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
                      className="event-accent-link mt-3 inline-block text-sm text-emerald-300 underline"
                    >
                      {copy.productLinkAction}
                    </a>
                  )}
                </div>

                <span className="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                  {statusLabel(item.status, locale)}
                </span>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  disabled={Boolean(isListExpired) || !isAvailable || reservingItemId === item.id}
                  onClick={() => handleReserve(item.id)}
                  className="event-accent-button w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {reservingItemId === item.id ? copy.reserving : copy.reserveAction}
                </button>
              </div>
            </article>
          )
        })}
      </section>

      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={copy.detailsSkipAction}
            onClick={handleSkipReservationDetails}
            className="absolute inset-0 bg-slate-950/85"
          />
          <section
            className="event-surface-panel relative z-10 w-full max-w-lg rounded-2xl border border-white/20 bg-slate-950 p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-white">{copy.yourDetailsTitle}</h2>
            <p className="mt-2 text-sm text-slate-300">{copy.yourDetailsSubtitle}</p>

            <div className="mt-4 grid gap-3">
              <input
                value={detailsGuestName}
                onChange={(event) => setDetailsGuestName(event.target.value.slice(0, GUEST_NAME_MAX_LENGTH))}
                placeholder={copy.yourNamePlaceholder}
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
              <label className="grid gap-1">
                <textarea
                  value={detailsGuestMessage}
                  onChange={(event) => setDetailsGuestMessage(event.target.value.slice(0, GUEST_MESSAGE_MAX_LENGTH))}
                  placeholder={copy.yourMessagePlaceholder}
                  rows={3}
                  maxLength={GUEST_MESSAGE_MAX_LENGTH}
                  className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
                />
                <span className="text-xs text-slate-400">
                  {copy.messageCounterLabel}: {detailsGuestMessage.length}/{GUEST_MESSAGE_MAX_LENGTH}
                </span>
              </label>
            </div>

            {detailsError && (
              <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                {detailsError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleSkipReservationDetails}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white"
              >
                {copy.detailsSkipAction}
              </button>
              <button
                type="button"
                onClick={handleSaveReservationDetails}
                disabled={isSavingDetails}
                className="event-accent-button rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingDetails ? copy.detailsSaving : copy.detailsSaveAction}
              </button>
            </div>
          </section>
        </div>
      )}

      {isThankYouVisible && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-30 w-full max-w-md px-4 sm:px-0">
          <section
            className={`pointer-events-auto toast-success ${
              isThankYouClosing ? 'toast-success--exit' : 'toast-success--enter'
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div>
                <h2 className="text-base font-semibold text-white">{copy.thankYouTitle}</h2>
                <p className="mt-1 text-sm text-emerald-100">{copy.thankYouBody}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
