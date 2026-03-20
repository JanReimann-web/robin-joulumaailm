'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, CheckCircle2, Clock3, Globe2, MapPin, X } from 'lucide-react'
import BrandLogo from '@/components/site/BrandLogo'
import EventPasswordPrompt from '@/components/shared/EventPasswordPrompt'
import { publicGiftListCopy as localizedPublicGiftListCopy } from '@/lib/i18n/generated'
import { localeNativeNames, locales, resolveLocale, type Locale } from '@/lib/i18n/config'
import {
  applyDemoReservations,
  buildDemoReservationStorageKey,
  DEMO_RESERVATION_DURATION_MS,
  DemoReservationState,
  isSameDemoReservationState,
  parseDemoReservationState,
  pruneDemoReservations,
} from '@/lib/lists/demo-reservations'
import { formatHeroEventDate, formatHeroEventTime } from '@/lib/lists/hero'
import {
  EventType,
  GiftList,
  GiftListItem,
  isTemplateAllowedForEvent,
  ListStoryEntry,
  TemplateId,
  WheelEntry,
} from '@/lib/lists/types'
import { resolveEventThemeId } from '@/lib/lists/event-theme'

type PublicGiftListProps = {
  slug: string
  previewTemplateId?: string | null
  demoMode?: boolean
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
  | 'introEventDate'
  | 'introEventTime'
  | 'introEventLocation'
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

type PublicLocale = Locale
type LightboxMedia = {
  url: string
  alt: string
} | null

const GUEST_MESSAGE_MAX_LENGTH = 240
const GUEST_NAME_MAX_LENGTH = 80

export const PUBLIC_COPY = {
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
    noAnswerForQuestion: 'No answer has been added for this question yet.',
    productLinkAction: 'Open product link',
    reserveAction: 'Reserve this gift',
    reserving: 'Reserving...',
    yourDetailsTitle: 'Reserve this gift',
    yourDetailsSubtitle: 'Your name is required. Your message is optional and will be shown on this gift card.',
    yourNamePlaceholder: 'Your name',
    yourMessagePlaceholder: 'Message (optional)',
    publicNameCheckboxLabel: 'Show my name publicly on the gift card',
    detailsMessageHelp: 'Your message is visible on the public gift card after reservation.',
    messageCounterLabel: 'Message',
    detailsCancelAction: 'Cancel',
    detailsSaveAction: 'Reserve gift',
    detailsSaving: 'Saving reservation...',
    detailsNameRequired: 'Please enter your name.',
    detailsNameTooLong: 'Name is too long.',
    detailsMessageTooLong: 'Message is too long.',
    detailsSaved: 'Reservation saved.',
    detailsSaveFailed: 'Failed to save the reservation. Please try again.',
    reservationSaved: 'Reservation saved.',
    demoReservationLabel: 'Example mode',
    demoReservationNotice: 'Example mode is active. Reservations on this sample reset automatically after 5 minutes.',
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
    languageLabel: 'View in',
    expandImageAria: 'Open image',
    closeImageAction: 'Close',
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
    yourDetailsTitle: 'Broneeri see kingitus',
    yourDetailsSubtitle: 'Sinu nimi on kohustuslik. Sõnum on valikuline ja seda näidatakse selle kingituse avalikul kaardil.',
    yourNamePlaceholder: 'Sinu nimi',
    yourMessagePlaceholder: 'Sõnum (valikuline)',
    publicNameCheckboxLabel: 'Näita minu nime avalikult kingituse kaardil',
    detailsMessageHelp: 'Sinu sõnum jääb pärast broneerimist avalikult selle kingituse kaardile nähtavaks.',
    messageCounterLabel: 'Sõnum',
    detailsCancelAction: 'Tühista',
    detailsSaveAction: 'Broneeri kingitus',
    detailsSaving: 'Salvestan broneeringut...',
    detailsNameRequired: 'Palun sisesta oma nimi.',
    detailsNameTooLong: 'Nimi on liiga pikk.',
    detailsMessageTooLong: 'Sõnum on liiga pikk.',
    detailsSaved: 'Broneering salvestatud.',
    detailsSaveFailed: 'Broneeringu salvestamine ebaõnnestus. Proovi uuesti.',
    reservationSaved: 'Broneering salvestatud.',
    demoReservationLabel: 'Näidisrežiim',
    demoReservationNotice: 'Näidisrežiim on aktiivne. Selle näidislehe broneeringud nullitakse automaatselt 5 minuti pärast.',
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
    languageLabel: 'Vaata keeles',
    expandImageAria: 'Ava pilt',
    closeImageAction: 'Sulge',
  },
} as const

const detectInitialLocale = (): PublicLocale => {
  return resolveLocale(typeof navigator === 'undefined' ? null : navigator.language)
}

const KIDS_BIRTHDAY_TEMPLATE_SET = new Set<TemplateId>([
  'kidsBoyTinyPilot',
  'kidsBoyDinoRanger',
  'kidsBoyGalaxyRacer',
  'kidsGirlTinyBloom',
  'kidsGirlFairyGarden',
  'kidsGirlStarlightPop',
])

const getDisplayEventType = (
  eventType: EventType,
  templateId: TemplateId
): EventType => {
  if (eventType === 'kidsBirthday' && !KIDS_BIRTHDAY_TEMPLATE_SET.has(templateId)) {
    return 'birthday'
  }

  return eventType
}

const statusLabel = (
  status: GiftListItem['status'],
  locale: PublicLocale
) => {
  const copy = localizedPublicGiftListCopy[locale]
  if (status === 'available') return copy.statusAvailable
  if (status === 'reserved') return copy.statusReserved
  return copy.statusGifted
}

const hasVisualMedia = (
  mediaUrl: string | null,
  mediaType: string | null
) => {
  return Boolean(
    mediaUrl
    && mediaType
    && (
      mediaType.startsWith('image/')
      || mediaType.startsWith('video/')
    )
  )
}

type EventSectionCopy = {
  storyTitle: string
  wheelTitle: string
}

const getEventSectionCopy = (
  eventType: EventType,
  templateId: TemplateId,
  locale: PublicLocale
): EventSectionCopy => {
  const copy = localizedPublicGiftListCopy[locale]
  const displayEventType = getDisplayEventType(eventType, templateId)

  if (displayEventType === 'kidsBirthday') {
    return {
      storyTitle: copy.kidsStoryTitle,
      wheelTitle: copy.kidsWheelTitle,
    }
  }

  if (displayEventType === 'birthday') {
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

const renderHeroEventMeta = (params: {
  eventDate: string | null
  eventTime: string | null
  eventLocation: string | null
  locale: PublicLocale
}) => {
  const formattedDate = formatHeroEventDate(params.eventDate, params.locale)
  const formattedTime = formatHeroEventTime(params.eventTime)
  const normalizedLocation = params.eventLocation?.trim() ?? ''

  if (!formattedDate && !formattedTime && normalizedLocation.length === 0) {
    return null
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {formattedDate && (
        <span className="event-surface-card inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200">
          <CalendarDays size={14} />
          <span>{formattedDate}</span>
        </span>
      )}
      {formattedTime && (
        <span className="event-surface-card inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200">
          <Clock3 size={14} />
          <span>{formattedTime}</span>
        </span>
      )}
      {normalizedLocation.length > 0 && (
        <span className="event-surface-card inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200">
          <MapPin size={14} />
          <span>{normalizedLocation}</span>
        </span>
      )}
    </div>
  )
}

export default function PublicGiftList({
  slug,
  previewTemplateId = null,
  demoMode = false,
}: PublicGiftListProps) {
  const [locale, setLocale] = useState<PublicLocale>(detectInitialLocale)
  const [hasMounted, setHasMounted] = useState(false)
  const [meta, setMeta] = useState<PublicListMetaResponse | null>(null)
  const [list, setList] = useState<PublicListView | null>(null)
  const [items, setItems] = useState<GiftListItem[]>([])
  const [demoReservations, setDemoReservations] = useState<DemoReservationState>({})
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
  const [detailsReservedNamePublic, setDetailsReservedNamePublic] = useState(false)
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
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia>(null)
  const thankYouTimeoutRef = useRef<number | null>(null)
  const thankYouCloseTimeoutRef = useRef<number | null>(null)
  const thankYouLaunchTimeoutRef = useRef<number | null>(null)
  const copy = localizedPublicGiftListCopy[locale]
  const modalRoot = hasMounted ? document.body : null
  const demoStorageKey = useMemo(() => buildDemoReservationStorageKey(slug), [slug])
  const homeHref = `/${locale}`
  const isPasswordProtected = Boolean(
    meta?.requiresPassword
    || meta?.list.visibility === 'public_password'
    || list?.visibility === 'public_password'
  )

  const resetReservationDetails = useCallback(() => {
    setIsDetailsModalOpen(false)
    setDetailsItemId(null)
    setDetailsGuestName('')
    setDetailsReservedNamePublic(false)
    setDetailsGuestMessage('')
    setDetailsError(null)
  }, [])

  useEffect(() => {
    setLocale(detectInitialLocale())
  }, [])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted || !demoMode) {
      setDemoReservations({})
      return
    }

    const nextReservations = pruneDemoReservations(
      parseDemoReservationState(window.sessionStorage.getItem(demoStorageKey))
    )

    if (Object.keys(nextReservations).length === 0) {
      window.sessionStorage.removeItem(demoStorageKey)
    } else {
      window.sessionStorage.setItem(demoStorageKey, JSON.stringify(nextReservations))
    }

    setDemoReservations(nextReservations)
  }, [demoMode, demoStorageKey, hasMounted])

  const persistDemoReservations = useCallback((nextReservations: DemoReservationState) => {
    if (!hasMounted || !demoMode) {
      return
    }

    if (Object.keys(nextReservations).length === 0) {
      window.sessionStorage.removeItem(demoStorageKey)
      return
    }

    window.sessionStorage.setItem(demoStorageKey, JSON.stringify(nextReservations))
  }, [demoMode, demoStorageKey, hasMounted])

  useEffect(() => {
    if (!hasMounted || !demoMode) {
      return
    }

    const nextReservations = pruneDemoReservations(demoReservations)
    if (!isSameDemoReservationState(nextReservations, demoReservations)) {
      persistDemoReservations(nextReservations)
      setDemoReservations(nextReservations)
      return
    }

    const activeReservations = Object.values(nextReservations)
    if (activeReservations.length === 0) {
      return
    }

    const nextExpiryAt = Math.min(...activeReservations.map((reservation) => reservation.expiresAt))
    const timeoutId = window.setTimeout(() => {
      setDemoReservations((current) => {
        const prunedReservations = pruneDemoReservations(current)
        persistDemoReservations(prunedReservations)
        return prunedReservations
      })
    }, Math.max(nextExpiryAt - Date.now(), 0) + 80)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [demoMode, demoReservations, hasMounted, persistDemoReservations])

  useEffect(() => {
    return () => {
      if (thankYouTimeoutRef.current) {
        window.clearTimeout(thankYouTimeoutRef.current)
      }
      if (thankYouCloseTimeoutRef.current) {
        window.clearTimeout(thankYouCloseTimeoutRef.current)
      }
      if (thankYouLaunchTimeoutRef.current) {
        window.clearTimeout(thankYouLaunchTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!lightboxMedia) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxMedia(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxMedia])

  useEffect(() => {
    if (!hasMounted) {
      return
    }

    const isPasswordPromptModalOpen = isPasswordPromptOpen && hasEntered

    if (!lightboxMedia && !isDetailsModalOpen && !isThankYouVisible && !isPasswordPromptModalOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [hasEntered, hasMounted, isDetailsModalOpen, isPasswordPromptOpen, isThankYouVisible, lightboxMedia])

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

        setMeta({
          ...payload,
          requiresPassword: payload.requiresPassword || payload.list.visibility === 'public_password',
        })
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
    if (isPasswordProtected) {
      setError(null)
      setSuccess(null)
      setIsPasswordPromptOpen(true)
      setIsPasswordVisible(false)
      return
    }

    const ok = await loadContent()
    if (ok) {
      setHasEntered(true)
    }
  }

  const handleUnlock = async () => {
    if (!meta || !isPasswordProtected) {
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

  const activeEventType = list?.eventType ?? meta?.list.eventType
  const storedTemplateId = list?.templateId ?? meta?.list.templateId
  const activeTemplateId = activeEventType
    && previewTemplateId
    && isTemplateAllowedForEvent(activeEventType, previewTemplateId)
    ? previewTemplateId
    : storedTemplateId
  const eventThemeId = resolveEventThemeId(activeEventType, activeTemplateId)
  const closePasswordPrompt = useCallback(() => {
    setIsPasswordPromptOpen(false)
    setIsPasswordVisible(false)
    setError(null)
  }, [])
  const eventSectionCopy = activeEventType && activeTemplateId
    ? getEventSectionCopy(activeEventType, activeTemplateId, locale)
    : null
  const isListExpired = (list ?? meta?.list)?.accessStatus === 'expired'
  const visibleItems = useMemo(() => {
    return demoMode
      ? applyDemoReservations(items, demoReservations)
      : items
  }, [demoMode, demoReservations, items])
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

  const renderHeroMedia = (media: PreviewMedia, alt: string) => {
    if (!media?.url || !media.type) {
      return null
    }

    const heroMediaClassName = 'h-[17rem] w-full object-cover sm:h-[21rem] lg:h-[24rem]'

    if (media.type.startsWith('image/')) {
      return (
        <button
          type="button"
          onClick={() => setLightboxMedia({ url: media.url, alt })}
          aria-label={copy.expandImageAria}
          className="block w-full overflow-hidden text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.url}
            alt={alt}
            className={heroMediaClassName}
            loading="lazy"
          />
        </button>
      )
    }

    if (media.type.startsWith('video/')) {
      return (
        <video
          src={media.url}
          className={heroMediaClassName}
          autoPlay
          muted
          loop
          playsInline
        />
      )
    }

    return null
  }

  const renderStaticHeroMedia = (media: PreviewMedia, alt: string) => {
    if (!media?.url || !media.type) {
      return null
    }

    const heroMediaClassName = 'h-[17rem] w-full object-cover sm:h-[21rem] lg:h-[24rem]'

    if (media.type.startsWith('image/')) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={alt}
          className={heroMediaClassName}
          loading="lazy"
        />
      )
    }

    if (media.type.startsWith('video/')) {
      return (
        <video
          src={media.url}
          className={heroMediaClassName}
          autoPlay
          muted
          loop
          playsInline
        />
      )
    }

    return null
  }

  const renderSquareMedia = (
    mediaUrl: string | null,
    mediaType: string | null,
    alt: string
  ) => {
    if (!mediaUrl || !mediaType) {
      return null
    }

    if (mediaType.startsWith('image/')) {
      return (
        <button
          type="button"
          onClick={() => setLightboxMedia({ url: mediaUrl, alt })}
          aria-label={copy.expandImageAria}
          className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-white/15 bg-black/10 text-left shadow-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={alt}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </button>
      )
    }

    if (mediaType.startsWith('video/')) {
      return (
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/15 bg-black/10 shadow-lg">
          <video
            src={mediaUrl}
            controls
            preload="metadata"
            className="h-full w-full object-cover"
          />
        </div>
      )
    }

    if (mediaType.startsWith('audio/')) {
      return (
        <audio
          controls
          preload="metadata"
          className="w-full"
          src={mediaUrl}
        />
      )
    }

    return null
  }

  const handleCloseThankYouCard = () => {
    if (thankYouLaunchTimeoutRef.current) {
      window.clearTimeout(thankYouLaunchTimeoutRef.current)
      thankYouLaunchTimeoutRef.current = null
    }

    if (thankYouCloseTimeoutRef.current) {
      window.clearTimeout(thankYouCloseTimeoutRef.current)
      thankYouCloseTimeoutRef.current = null
    }

    if (thankYouTimeoutRef.current) {
      window.clearTimeout(thankYouTimeoutRef.current)
      thankYouTimeoutRef.current = null
    }

    setIsThankYouVisible(false)
    setIsThankYouClosing(false)
  }

  const scheduleThankYouCard = () => {
    if (thankYouLaunchTimeoutRef.current) {
      window.clearTimeout(thankYouLaunchTimeoutRef.current)
    }

    thankYouLaunchTimeoutRef.current = window.setTimeout(() => {
      showThankYouCard()
      thankYouLaunchTimeoutRef.current = null
    }, 90)
  }

  const showThankYouCard = () => {
    setSuccess(null)
    setError(null)
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

  const updateDemoReservationState = useCallback((
    updater: (current: DemoReservationState) => DemoReservationState
  ) => {
    setDemoReservations((current) => {
      const nextReservations = pruneDemoReservations(updater(pruneDemoReservations(current)))
      persistDemoReservations(nextReservations)
      return nextReservations
    })
  }, [persistDemoReservations])

  const handleSaveReservationDetails = async () => {
    if (!detailsItemId) {
      return
    }

    const normalizedName = detailsGuestName.trim()
    const normalizedMessage = detailsGuestMessage.trim()
    const reservingId = detailsItemId

    if (!normalizedName) {
      setDetailsError(copy.detailsNameRequired)
      return
    }

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
    setSuccess(null)
    setReservingItemId(reservingId)

    if (demoMode) {
      const selectedItem = visibleItems.find((entry) => entry.id === reservingId)
      if (!selectedItem || selectedItem.status !== 'available') {
        setDetailsError(copy.reservationUnavailable)
        setIsSavingDetails(false)
        setReservingItemId(null)
        return
      }

      const reservedAt = Date.now()
      updateDemoReservationState((current) => ({
        ...current,
        [reservingId]: {
          itemId: reservingId,
          reservedAt,
          expiresAt: reservedAt + DEMO_RESERVATION_DURATION_MS,
          reservedByName: normalizedName,
          reservedNamePublic: detailsReservedNamePublic,
          reservedMessage: normalizedMessage || null,
        },
      }))

      resetReservationDetails()
      scheduleThankYouCard()
      setIsSavingDetails(false)
      setReservingItemId(null)
      return
    }

    try {
      const response = await fetch(
        `/api/public-list/${encodeURIComponent(slug)}/reserve`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            itemId: reservingId,
            guestName: normalizedName,
            guestMessage: normalizedMessage,
            reservedNamePublic: detailsReservedNamePublic,
          }),
        }
      )

      const payload = await response
        .json()
        .catch(() => ({ error: 'reserve_failed' })) as { error?: string }

      if (!response.ok) {
        if (payload.error === 'missing_guest_name') {
          setDetailsError(copy.detailsNameRequired)
          return
        }

        if (payload.error === 'invalid_guest_name') {
          setDetailsError(copy.detailsNameTooLong)
          return
        }

        if (payload.error === 'invalid_guest_message') {
          setDetailsError(copy.detailsMessageTooLong)
          return
        }

        if (payload.error === 'list_expired') {
          resetReservationDetails()
          setError(copy.reservationExpired)
          return
        }

        if (payload.error === 'item_unavailable') {
          resetReservationDetails()
          setError(copy.reservationUnavailable)
          await loadContent()
          return
        }

        if (payload.error === 'password_required') {
          resetReservationDetails()
          setHasEntered(false)
          setIsPasswordPromptOpen(true)
          return
        }

        setDetailsError(copy.detailsSaveFailed)
        return
      }

      setItems((current) =>
        current.map((entry) =>
          entry.id === reservingId
            ? {
                ...entry,
                status: 'reserved',
                reservedByName: normalizedName,
                reservedNamePublic: detailsReservedNamePublic,
                reservedMessage: normalizedMessage || null,
                reservedAt: Date.now(),
              }
            : entry
        )
      )
      resetReservationDetails()
      scheduleThankYouCard()
    } catch {
      setDetailsError(copy.detailsSaveFailed)
    } finally {
      setIsSavingDetails(false)
      setReservingItemId(null)
    }
  }

  const handleCloseReservationDetails = () => {
    if (isSavingDetails) {
      return
    }

    resetReservationDetails()
    setSuccess(null)
  }

  const handleReserve = async (itemId: string) => {
    if (!list) {
      return
    }

    const selectedItem = visibleItems.find((entry) => entry.id === itemId)
    if (!selectedItem || selectedItem.status !== 'available') {
      setError(copy.reservationUnavailable)
      return
    }

    setError(null)
    setSuccess(null)
    setDetailsItemId(itemId)
    setDetailsGuestName('')
    setDetailsReservedNamePublic(false)
    setDetailsGuestMessage('')
    setDetailsError(null)
    setIsDetailsModalOpen(true)
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
    <div className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-2">
      <Globe2 size={14} className="text-white/70" />
      <label className="sr-only" htmlFor="public-language-switcher">{copy.languageLabel}</label>
      <select
        id="public-language-switcher"
        value={locale}
        onChange={(event) => setLocale(event.target.value as PublicLocale)}
        className="bg-transparent pr-6 text-sm font-medium text-white outline-none"
      >
        {locales.map((availableLocale) => (
          <option key={availableLocale} value={availableLocale} className="bg-slate-950 text-white">
            {localeNativeNames[availableLocale]}
          </option>
        ))}
      </select>
    </div>
  )

  const brandBar = (animated = false) => (
    <div className="mb-4 flex items-start justify-between gap-3 sm:items-center">
      <div className="event-surface-card rounded-full border px-3 py-2 sm:px-4">
        <BrandLogo
          href={homeHref}
          tone="event"
          size="sm"
          animated={animated}
          className="max-w-[15rem] sm:max-w-none"
        />
      </div>
      {languageSwitcher}
    </div>
  )

  const shouldShowInlinePasswordPrompt = !hasEntered && isPasswordPromptOpen && isPasswordProtected

  const passwordPromptModal = (
    !shouldShowInlinePasswordPrompt
    && isPasswordPromptOpen
    && modalRoot
    && isPasswordProtected
    && createPortal(
      <div
        className="event-canvas fixed inset-0"
        data-event-theme={eventThemeId}
        style={{ zIndex: 960 }}
      >
        <button
          type="button"
          aria-label={copy.closeImageAction}
          onClick={closePasswordPrompt}
          className="absolute inset-0 bg-black/28 backdrop-blur-sm"
        />

        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 2 }}>
          <EventPasswordPrompt
            title={copy.passwordLabel}
            description={copy.passwordProtectedPrompt}
            label={copy.passwordLabel}
            value={password}
            showPasswordAria={copy.showPasswordAria}
            hidePasswordAria={copy.hidePasswordAria}
            isPasswordVisible={isPasswordVisible}
            onPasswordChange={setPassword}
            onTogglePasswordVisibility={() => setIsPasswordVisible((current) => !current)}
            onSubmit={handleUnlock}
            submitLabel={copy.unlockAction}
            isSubmitDisabled={password.trim().length < 6}
            isBusy={isUnlocking}
            busyLabel={copy.checkingPassword}
            error={error}
            onClose={closePasswordPrompt}
            closeAriaLabel={copy.closeImageAction}
            autoFocus
          />
        </div>
      </div>,
      modalRoot
    )
  )

  const renderLoadingShell = (params: {
    themeId: string
    message: string
    title: string
    body?: string | null
    media?: PreviewMedia
  }) => {
    const normalizedBody = params.body?.trim() ?? ''

    return (
      <div
        className="event-canvas min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8"
        data-event-theme={params.themeId}
      >
        <main className="mx-auto w-full max-w-6xl py-4 sm:py-8">
          {brandBar(true)}

          <section className="event-surface-panel overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl">
            {params.media ? (
              renderStaticHeroMedia(params.media, params.title)
            ) : (
              <div className="relative h-[17rem] overflow-hidden sm:h-[21rem] lg:h-[24rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/10 to-transparent" />
                <div className="absolute inset-x-[8%] top-[18%] h-[62%] rounded-[2rem] border border-white/15 bg-black/10 animate-pulse" />
                <div className="absolute -right-10 top-6 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-4 left-8 h-20 w-20 rounded-full bg-black/10 blur-2xl" />
              </div>
            )}

            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr),18rem] lg:items-end">
              <div className="min-w-0">
                <span className="inline-flex rounded-full border border-white/15 bg-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                  {params.message}
                </span>

                <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                  {params.title}
                </h1>

                {normalizedBody ? (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">
                    {normalizedBody}
                  </p>
                ) : (
                  <div className="mt-4 grid max-w-3xl gap-3">
                    <div className="h-4 w-full rounded-full bg-black/10 animate-pulse" />
                    <div className="h-4 w-[92%] rounded-full bg-black/10 animate-pulse" />
                    <div className="h-4 w-[68%] rounded-full bg-black/10 animate-pulse" />
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="h-11 w-40 rounded-full bg-black/10 animate-pulse" />
                  <div className="h-11 w-36 rounded-full bg-black/10 animate-pulse" />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="event-surface-card rounded-[1.5rem] border border-white/10 bg-black/10 p-4">
                  <div className="h-3 w-24 rounded-full bg-black/10 animate-pulse" />
                  <div className="mt-3 h-8 w-32 rounded-full bg-black/10 animate-pulse" />
                </div>
                <div className="event-surface-card rounded-[1.5rem] border border-white/10 bg-black/10 p-4">
                  <div className="h-3 w-20 rounded-full bg-black/10 animate-pulse" />
                  <div className="mt-3 h-8 w-28 rounded-full bg-black/10 animate-pulse" />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="event-surface-card rounded-[1.8rem] border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="h-4 w-32 rounded-full bg-black/10 animate-pulse" />
              <div className="mt-5 aspect-[4/3] rounded-[1.6rem] border border-white/10 bg-black/10 animate-pulse" />
            </div>

            <div className="event-surface-card rounded-[1.8rem] border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="h-4 w-28 rounded-full bg-black/10 animate-pulse" />
              <div className="mt-5 grid gap-3">
                <div className="h-16 rounded-[1.2rem] bg-black/10 animate-pulse" />
                <div className="h-16 rounded-[1.2rem] bg-black/10 animate-pulse" />
                <div className="h-16 rounded-[1.2rem] bg-black/10 animate-pulse" />
              </div>
            </div>
          </section>
        </main>
        {passwordPromptModal}
      </div>
    )
  }

  const renderBrandLoadingScreen = (message: string) => {
    return (
      <div className="relative min-h-screen w-full overflow-hidden px-4 py-6 sm:px-6 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(52,211,153,0.16),transparent_34%),radial-gradient(circle_at_82%_2%,rgba(125,211,252,0.14),transparent_30%)]" />

        <main className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
          <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/40 px-6 py-10 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-8 sm:py-12">
            <div className="flex flex-col items-center gap-5 text-center">
              <BrandLogo
                tone="header"
                size="lg"
                animated
                className="flex-col justify-center gap-4 sm:flex-row sm:items-center sm:gap-5"
                wordmarkClassName="text-center sm:text-left"
              />

              <p className="text-sm font-medium text-white/65">
                {message}
              </p>
            </div>
          </section>
        </main>
      </div>
    )
  }

  if (metaLoading) {
    return renderBrandLoadingScreen(copy.loadingList)
  }

  if (notFound || !meta) {
    return (
      <div
        className="event-canvas min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8"
        data-event-theme="default-dark"
      >
        <main className="mx-auto w-full max-w-6xl py-4 sm:py-8">
          {brandBar()}
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{copy.listNotFoundTitle}</h1>
          <p className="mt-3 text-slate-300">{copy.listNotFoundBody}</p>
        </main>
        {passwordPromptModal}
      </div>
    )
  }

  if (!hasEntered) {
    return (
      <div
        className="event-canvas min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8"
        data-event-theme={eventThemeId}
      >
        <main className="mx-auto w-full max-w-4xl py-4 sm:py-8">
          {brandBar()}
          <section
            className="event-surface-panel relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
          {renderHeroMedia(previewMedia, meta.list.title)}

          <div className="p-5 sm:p-7">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {meta.list.introTitle || meta.list.title}
            </h1>

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

            {demoMode && (
              <div className="event-surface-card mt-4 rounded-xl border px-4 py-3">
                <p className="text-sm font-semibold text-white">{copy.demoReservationLabel}</p>
                <p className="mt-1 text-sm text-slate-300">{copy.demoReservationNotice}</p>
              </div>
            )}

            {error && !isPasswordPromptOpen && (
              <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            )}
          </div>

          {shouldShowInlinePasswordPrompt && (
            <div className="absolute inset-0 z-10 flex items-end justify-center p-4 sm:items-center sm:p-6">
              <button
                type="button"
                aria-label={copy.closeImageAction}
                onClick={closePasswordPrompt}
                className="absolute inset-0 bg-black/28 backdrop-blur-sm"
              />
              <div className="relative z-10 w-full">
                <EventPasswordPrompt
                  title={copy.passwordLabel}
                  description={copy.passwordProtectedPrompt}
                  label={copy.passwordLabel}
                  value={password}
                  showPasswordAria={copy.showPasswordAria}
                  hidePasswordAria={copy.hidePasswordAria}
                  isPasswordVisible={isPasswordVisible}
                  onPasswordChange={setPassword}
                  onTogglePasswordVisibility={() => setIsPasswordVisible((current) => !current)}
                  onSubmit={handleUnlock}
                  submitLabel={copy.unlockAction}
                  isSubmitDisabled={password.trim().length < 6}
                  isBusy={isUnlocking}
                  busyLabel={copy.checkingPassword}
                  error={error}
                  onClose={closePasswordPrompt}
                  closeAriaLabel={copy.closeImageAction}
                  autoFocus
                />
              </div>
            </div>
          )}
          </section>
        </main>
        {passwordPromptModal}
      </div>
    )
  }

  if (contentLoading || !list) {
    return renderLoadingShell({
      themeId: eventThemeId,
      message: copy.loadingContent,
      title: meta.list.introTitle || meta.list.title,
      body: meta.list.introBody || copy.continueFallbackText,
      media: previewMedia,
    })
  }

  return (
    <div
      className="event-canvas min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8"
      data-event-theme={eventThemeId}
    >
      <main className="mx-auto w-full max-w-6xl py-4 sm:py-8">
        {brandBar()}
        <header
          className="event-surface-panel overflow-hidden rounded-2xl border border-white/10 bg-white/5"
        >
          {renderHeroMedia(previewMedia, list.title)}

          <div className="p-5 sm:p-7">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {list.introTitle || list.title}
            </h1>

            {renderHeroEventMeta({
              eventDate: list.introEventDate,
              eventTime: list.introEventTime,
              eventLocation: list.introEventLocation,
              locale,
            })}

            {(list.introBody || '').trim() && (
              <p className="mt-5 text-sm text-slate-200">
                {list.introBody}
              </p>
            )}

            {!(list.introBody || '').trim() && (
              <p className="mt-5 text-sm text-slate-200">
                {copy.continueFallbackText}
              </p>
            )}

            {isListExpired && (
              <p className="mt-5 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {copy.listExpired}
              </p>
            )}

            {demoMode && (
              <div className="event-surface-card mt-5 rounded-xl border px-4 py-3">
                <p className="text-sm font-semibold text-white">{copy.demoReservationLabel}</p>
                <p className="mt-1 text-sm text-slate-300">{copy.demoReservationNotice}</p>
              </div>
            )}
          </div>
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
            {stories.map((story, index) => {
              const hasStoryMedia = hasVisualMedia(story.mediaUrl, story.mediaType)
              const isReversed = index % 2 === 1

              return (
              <article
                key={story.id}
                className="event-surface-card rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5"
              >
                <div
                  className={`grid gap-5 lg:items-start ${
                    hasStoryMedia ? 'lg:grid-cols-[minmax(0,1fr),minmax(240px,320px)]' : ''
                  }`}
                >
                  <div className={hasStoryMedia && isReversed ? 'lg:order-2' : ''}>
                    <h3 className="text-lg font-semibold text-white">{story.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{story.body}</p>
                  </div>

                  {hasStoryMedia && (
                    <div className={isReversed ? 'lg:order-1 lg:justify-self-start' : 'lg:order-2 lg:justify-self-end'}>
                      {renderSquareMedia(story.mediaUrl, story.mediaType, story.title)}
                    </div>
                  )}
                </div>
              </article>
              )
            })}
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
                      {selectedWheelEntry.answerText ? (
                        <p className="text-sm text-slate-200">{selectedWheelEntry.answerText}</p>
                      ) : (
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
        {visibleItems.length === 0 && (
          <p className="text-sm text-slate-300">{copy.noGiftItems}</p>
        )}

        {visibleItems.map((item, index) => {
          const isAvailable = item.status === 'available'
          const hasItemVisualMedia = hasVisualMedia(item.mediaUrl, item.mediaType)
          const hasAudioOnlyMedia = Boolean(item.mediaUrl && item.mediaType?.startsWith('audio/'))
          const isReversed = index % 2 === 1

          return (
            <article
              key={item.id}
              className="event-surface-card rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5"
            >
              <div
                className={`grid gap-5 lg:items-start ${
                  hasItemVisualMedia ? 'lg:grid-cols-[minmax(0,1fr),minmax(240px,320px)]' : ''
                }`}
              >
                <div className={hasItemVisualMedia && isReversed ? 'lg:order-2' : ''}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                      {statusLabel(item.status, locale)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-300">{item.description}</p>

                  {item.status !== 'available' && (
                    item.reservedMessage
                    || (item.reservedNamePublic && item.reservedByName)
                  ) && (
                    <div className="event-surface-card mt-4 rounded-2xl border p-4">
                      {item.reservedMessage && (
                        <p className="text-sm italic text-white">&ldquo;{item.reservedMessage}&rdquo;</p>
                      )}
                      {item.reservedNamePublic && item.reservedByName && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                          {item.reservedByName}
                        </p>
                      )}
                    </div>
                  )}

                  {hasAudioOnlyMedia && (
                    <div className="mt-4">
                      {renderSquareMedia(item.mediaUrl, item.mediaType, item.name)}
                    </div>
                  )}

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="event-accent-link mt-4 inline-block text-sm text-emerald-300 underline"
                    >
                      {copy.productLinkAction}
                    </a>
                  )}

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
                </div>

                {hasItemVisualMedia && (
                  <div className={isReversed ? 'lg:order-1 lg:justify-self-start' : 'lg:order-2 lg:justify-self-end'}>
                    {renderSquareMedia(item.mediaUrl, item.mediaType, item.name)}
                  </div>
                )}
              </div>
            </article>
          )
        })}
        </section>

        {lightboxMedia && (
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 980 }}>
          <button
            type="button"
            aria-label={copy.closeImageAction}
            onClick={() => setLightboxMedia(null)}
            className="absolute inset-0 bg-slate-950/82 backdrop-blur-sm"
          />

          <section
            className="event-canvas relative z-10 w-full max-w-6xl"
            data-event-theme={eventThemeId}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLightboxMedia(null)}
                className="event-surface-card inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg"
                style={{ color: 'var(--event-text-strong)' }}
              >
                <X size={16} />
                {copy.closeImageAction}
              </button>
            </div>

            <div className="event-surface-panel mt-3 overflow-hidden rounded-2xl border border-white/15 p-2 shadow-2xl sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.alt}
                className="mx-auto max-h-[82vh] max-w-full object-contain"
              />
            </div>
          </section>
        </div>
        )}

        {isDetailsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 970 }}>
          <button
            type="button"
            aria-label={copy.detailsCancelAction}
            onClick={handleCloseReservationDetails}
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
              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={detailsReservedNamePublic}
                  onChange={(event) => setDetailsReservedNamePublic(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/30 bg-slate-950/80 text-emerald-400"
                />
                <span>{copy.publicNameCheckboxLabel}</span>
              </label>
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
              <p className="text-xs text-slate-400">{copy.detailsMessageHelp}</p>
            </div>

            {detailsError && (
              <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                {detailsError}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseReservationDetails}
                disabled={isSavingDetails}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white"
              >
                {copy.detailsCancelAction}
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
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 990 }}>
          <button
            type="button"
            aria-label={copy.closeImageAction}
            onClick={handleCloseThankYouCard}
            className="absolute inset-0 bg-slate-950/82 backdrop-blur-sm"
          />

          <section
            className="event-canvas relative z-10 w-full max-w-md"
            data-event-theme={eventThemeId}
          >
            <div
              className={`event-surface-panel rounded-2xl border border-white/20 p-5 shadow-2xl ${
                isThankYouClosing ? 'toast-success--exit' : 'toast-success--enter'
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5" style={{ color: 'var(--event-accent)' }} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-white" style={{ color: 'var(--event-text-strong)' }}>
                    {copy.thankYouTitle}
                  </h2>
                  <p className="mt-1 text-sm text-slate-200" style={{ color: 'var(--event-text-base)' }}>
                    {copy.thankYouBody}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseThankYouCard}
                  aria-label={copy.closeImageAction}
                  className="event-surface-card rounded-full border border-white/20 p-2 text-white"
                  style={{ color: 'var(--event-text-strong)' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </section>
        </div>
        )}
      </main>
      {passwordPromptModal}
    </div>
  )
}
