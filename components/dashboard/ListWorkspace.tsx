'use client'

import { DragEvent, FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { Copy, Eye, EyeOff, Gift, GripVertical, PencilLine, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import {
  AccountEntitlement,
  hasActiveComplimentaryEntitlement,
} from '@/lib/account-entitlements'
import { subscribeToAccountEntitlement } from '@/lib/account-entitlements.client'
import QRCode from 'qrcode'
import { Locale } from '@/lib/i18n/config'
import { Dictionary } from '@/lib/i18n/types'
import {
  BillingCheckoutError,
  BillingRuntimeMode,
  fetchBillingRuntimeConfig,
  startBillingCheckout,
} from '@/lib/billing/client'
import { auth } from '@/lib/firebase'
import {
  fetchReferralDashboardSummary,
  generateReferralCode,
  ReferralClientError,
  validateReferralCode,
} from '@/lib/referrals.client'
import {
  fetchShowcaseListIds,
  setShowcaseListState,
  ShowcaseClientError,
} from '@/lib/showcase.client'
import {
  InvalidSlugError,
  ReservedSlugError,
  SlugTakenError,
  VisibilityPasswordRequiredError,
  createGiftItem,
  createGiftList,
  createListStory,
  createWheelEntry,
  deleteGiftList,
  deleteGiftItem,
  deleteListStory,
  deleteWheelEntry,
  reorderGiftItems,
  reorderListStories,
  reorderWheelEntries,
  setGiftItemStatus,
  subscribeToListItems,
  subscribeToListStories,
  subscribeToUserLists,
  subscribeToWheelEntries,
  updateGiftItem,
  updateGiftListIntro,
  updateGiftListSettings,
  updateListStory,
  updateWheelEntry,
} from '@/lib/lists/client'
import {
  deleteMediaByPath,
  deleteItemMediaByPath,
  MediaProcessingError,
  MediaValidationError,
  uploadItemMedia,
  uploadListIntroMedia,
  uploadStoryMedia,
} from '@/lib/lists/media'
import { buildPublicSlug, generatePublicUrlCode } from '@/lib/lists/public-link'
import {
  BillingPlanId,
  UploadMediaMetadata,
  calculateListMediaUsageSummary,
  createPersistedMediaMetadata,
  formatMediaUsageMegabytes,
  getMediaUsageIssue,
  isBillingPlanEligible,
  resolveRequiredBillingPlanId,
} from '@/lib/lists/plans'
import { isValidSlug, sanitizeSlug } from '@/lib/lists/slug'
import {
  EVENT_TYPES,
  EventType,
  GiftList,
  GiftListItem,
  getTemplateIdsForEvent,
  isTemplateAllowedForEvent,
  ListStoryEntry,
  ListVisibility,
  TemplateId,
  VISIBILITY_OPTIONS,
  WheelEntry,
} from '@/lib/lists/types'
import { resolveEventThemeId } from '@/lib/lists/event-theme'
import {
  ReferralCodeStatus,
  ReferralDashboardSummary,
} from '@/lib/referrals'

type ListWorkspaceProps = {
  locale: Locale
  ownerId: string
  labels: Dictionary['dashboard']
  eventLabels: Dictionary['events']
  billingStatus: 'success' | 'cancel' | null
  billingListId: string | null
}

const templateLabelMap = (
  labels: Dictionary['dashboard']
): Record<TemplateId, string> => ({
  classic: labels.templateClassic,
  modern: labels.templateModern,
  minimal: labels.templateMinimal,
  playful: labels.templatePlayful,
  kidsBoyTinyPilot: labels.templateKidsBoyTinyPilot,
  kidsBoyDinoRanger: labels.templateKidsBoyDinoRanger,
  kidsBoyGalaxyRacer: labels.templateKidsBoyGalaxyRacer,
  kidsGirlTinyBloom: labels.templateKidsGirlTinyBloom,
  kidsGirlFairyGarden: labels.templateKidsGirlFairyGarden,
  kidsGirlStarlightPop: labels.templateKidsGirlStarlightPop,
})

const eventLabelMap = (
  labels: Dictionary['events']
): Record<EventType, string> => ({
  wedding: labels.wedding,
  birthday: labels.birthday,
  kidsBirthday: labels.kidsBirthday,
  babyShower: labels.babyShower,
  graduation: labels.graduation,
  housewarming: labels.housewarming,
  christmas: labels.christmas,
})

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

const visibilityLabelMap = (
  labels: Dictionary['dashboard']
): Record<ListVisibility, string> => ({
  public: labels.visibilityPublic,
  public_password: labels.visibilityPublicPassword,
  private: labels.visibilityPrivate,
})

const itemStatusLabelMap = (
  labels: Dictionary['dashboard']
): Record<GiftListItem['status'], string> => ({
  available: labels.statusAvailable,
  reserved: labels.statusReserved,
  gifted: labels.statusGifted,
})

type ErrorWithCode = {
  code: string
}

const isErrorWithCode = (error: unknown): error is ErrorWithCode => {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof (error as { code?: unknown }).code === 'string'
  )
}

const withErrorCode = (fallbackMessage: string, error: unknown) => {
  if (!isErrorWithCode(error)) {
    return fallbackMessage
  }

  return `${fallbackMessage} (${error.code})`
}

const interpolateLabel = (
  template: string,
  replacements: Record<string, string | number>
) => {
  return Object.entries(replacements).reduce((nextTemplate, [key, value]) => {
    return nextTemplate.replace(`{${key}}`, String(value))
  }, template)
}


type SortableDashboardSection = 'items' | 'stories' | 'wheel'

type SortableDashboardEntry = {
  id: string
}

const MAX_WHEEL_ENTRIES = 12

type DashboardActionButtonProps = {
  children: ReactNode
  icon?: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  variant?: 'secondary' | 'accent' | 'danger'
  className?: string
}

type BillingFeedbackState = {
  type: 'success' | 'error'
  message: string
  listId: string | null
}

const dashboardActionButtonClassName = (variant: DashboardActionButtonProps['variant'] = 'secondary') => {
  const baseClassName = 'inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'

  if (variant === 'accent') {
    return `${baseClassName} border-emerald-300/40 bg-emerald-300/10 text-emerald-100 hover:border-emerald-300/60 hover:bg-emerald-300/16`
  }

  if (variant === 'danger') {
    return `${baseClassName} border-red-300/40 bg-red-400/10 text-red-100 hover:border-red-300/60 hover:bg-red-400/16`
  }

  return `${baseClassName} border-white/20 bg-white/5 text-white hover:border-white/35 hover:bg-white/10`
}

const DashboardActionButton = ({
  children,
  icon,
  onClick,
  disabled,
  type = 'button',
  variant = 'secondary',
  className = '',
}: DashboardActionButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${dashboardActionButtonClassName(variant)} ${className}`.trim()}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  )
}

const moveArrayEntry = <T extends SortableDashboardEntry>(
  entries: T[],
  fromIndex: number,
  toIndex: number
) => {
  const nextEntries = [...entries]
  const [movedEntry] = nextEntries.splice(fromIndex, 1)
  nextEntries.splice(toIndex, 0, movedEntry)
  return nextEntries
}

const reorderArrayEntryById = <T extends SortableDashboardEntry>(
  entries: T[],
  sourceId: string,
  targetId: string
) => {
  const sourceIndex = entries.findIndex((entry) => entry.id === sourceId)
  const targetIndex = entries.findIndex((entry) => entry.id === targetId)

  if (
    sourceIndex === -1
    || targetIndex === -1
    || sourceIndex === targetIndex
  ) {
    return entries
  }

  return moveArrayEntry(entries, sourceIndex, targetIndex)
}

const sortEntriesByIds = <T extends SortableDashboardEntry>(
  entries: T[],
  orderedIds: string[]
) => {
  const entryMap = new Map(entries.map((entry) => [entry.id, entry]))
  const orderedIdSet = new Set(orderedIds)
  const orderedEntries = orderedIds
    .map((entryId) => entryMap.get(entryId))
    .filter((entry): entry is T => Boolean(entry))

  return [
    ...orderedEntries,
    ...entries.filter((entry) => !orderedIdSet.has(entry.id)),
  ]
}

const toPersistedMediaEntry = (params: {
  mediaType: string | null
  mediaSizeBytes: number | null
  mediaDurationSeconds: number | null
}) => {
  return createPersistedMediaMetadata({
    mediaType: params.mediaType,
    mediaSizeBytes: params.mediaSizeBytes,
    mediaDurationSeconds: params.mediaDurationSeconds,
  })
}

const resolveListMediaUsage = (params: {
  list: GiftList | null
  items: GiftListItem[]
  stories: ListStoryEntry[]
}) => {
  return calculateListMediaUsageSummary([
    toPersistedMediaEntry({
      mediaType: params.list?.introMediaType ?? null,
      mediaSizeBytes: params.list?.introMediaSizeBytes ?? null,
      mediaDurationSeconds: params.list?.introMediaDurationSeconds ?? null,
    }),
    ...params.items.map((item) => toPersistedMediaEntry({
      mediaType: item.mediaType,
      mediaSizeBytes: item.mediaSizeBytes,
      mediaDurationSeconds: item.mediaDurationSeconds,
    })),
    ...params.stories.map((story) => toPersistedMediaEntry({
      mediaType: story.mediaType,
      mediaSizeBytes: story.mediaSizeBytes,
      mediaDurationSeconds: story.mediaDurationSeconds,
    })),
  ])
}

export default function ListWorkspace({
  locale,
  ownerId,
  labels,
  eventLabels,
  billingStatus,
  billingListId,
}: ListWorkspaceProps) {
  const [lists, setLists] = useState<GiftList[]>([])
  const [items, setItems] = useState<GiftListItem[]>([])
  const [stories, setStories] = useState<ListStoryEntry[]>([])
  const [wheelEntries, setWheelEntries] = useState<WheelEntry[]>([])
  const [selectedListId, setSelectedListId] = useState('')
  const [accountEntitlement, setAccountEntitlement] = useState<AccountEntitlement | null>(null)

  const [isListsLoading, setIsListsLoading] = useState(true)
  const [isAccountEntitlementLoading, setIsAccountEntitlementLoading] = useState(true)
  const [isItemsLoading, setIsItemsLoading] = useState(false)
  const [isStoriesLoading, setIsStoriesLoading] = useState(false)
  const [isWheelLoading, setIsWheelLoading] = useState(false)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isAddingStory, setIsAddingStory] = useState(false)
  const [isAddingWheelEntry, setIsAddingWheelEntry] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null)
  const [deletingWheelEntryId, setDeletingWheelEntryId] = useState<string | null>(null)
  const [statusUpdatingItemId, setStatusUpdatingItemId] = useState<string | null>(null)
  const [activatingPlanTarget, setActivatingPlanTarget] = useState<string | null>(null)
  const [referralSummary, setReferralSummary] = useState<ReferralDashboardSummary | null>(null)
  const [isReferralLoading, setIsReferralLoading] = useState(true)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null)
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [appliedReferralCode, setAppliedReferralCode] = useState<{
    code: string
    discountPercent: number
  } | null>(null)
  const [isGeneratingReferralCode, setIsGeneratingReferralCode] = useState(false)
  const [isApplyingReferralCode, setIsApplyingReferralCode] = useState(false)
  const [copiedReferralCodeId, setCopiedReferralCodeId] = useState<string | null>(null)
  const [showcaseListIds, setShowcaseListIds] = useState<string[]>([])
  const [isShowcaseLoading, setIsShowcaseLoading] = useState(false)
  const [showcaseUpdatingListId, setShowcaseUpdatingListId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugTouched, setIsSlugTouched] = useState(false)
  const [publicUrlCode, setPublicUrlCode] = useState(() => generatePublicUrlCode())
  const [eventType, setEventType] = useState<EventType>('birthday')
  const [templateId, setTemplateId] = useState<TemplateId>('classic')
  const [visibility, setVisibility] = useState<ListVisibility>('public')
  const [visibilityPassword, setVisibilityPassword] = useState('')
  const [isVisibilityPasswordVisible, setIsVisibilityPasswordVisible] = useState(false)
  const [isSavingListSettings, setIsSavingListSettings] = useState(false)
  const [isDeleteListConfirmOpen, setIsDeleteListConfirmOpen] = useState(false)
  const [isDeletingList, setIsDeletingList] = useState(false)
  const [introTitle, setIntroTitle] = useState('')
  const [introBody, setIntroBody] = useState('')
  const [introMediaFile, setIntroMediaFile] = useState<File | null>(null)
  const introMediaInputRef = useRef<HTMLInputElement | null>(null)
  const [isSavingIntro, setIsSavingIntro] = useState(false)
  const [isUploadingIntroMedia, setIsUploadingIntroMedia] = useState(false)
  const [isRemovingIntroMedia, setIsRemovingIntroMedia] = useState(false)
  const [introError, setIntroError] = useState<string | null>(null)
  const [introSuccess, setIntroSuccess] = useState<string | null>(null)

  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemLink, setItemLink] = useState('')
  const [itemMediaFile, setItemMediaFile] = useState<File | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const itemMediaInputRef = useRef<HTMLInputElement | null>(null)
  const itemFormRef = useRef<HTMLFormElement | null>(null)
  const [storyTitle, setStoryTitle] = useState('')
  const [storyBody, setStoryBody] = useState('')
  const [storyMediaFile, setStoryMediaFile] = useState<File | null>(null)
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const [draggingStoryId, setDraggingStoryId] = useState<string | null>(null)
  const storyMediaInputRef = useRef<HTMLInputElement | null>(null)
  const storyFormRef = useRef<HTMLFormElement | null>(null)
  const [wheelQuestion, setWheelQuestion] = useState('')
  const [wheelAnswerText, setWheelAnswerText] = useState('')
  const [editingWheelEntryId, setEditingWheelEntryId] = useState<string | null>(null)
  const [draggingWheelEntryId, setDraggingWheelEntryId] = useState<string | null>(null)
  const wheelFormRef = useRef<HTMLFormElement | null>(null)

  const [listError, setListError] = useState<string | null>(null)
  const [listSuccess, setListSuccess] = useState<string | null>(null)
  const [itemError, setItemError] = useState<string | null>(null)
  const [itemSuccess, setItemSuccess] = useState<string | null>(null)
  const [storyError, setStoryError] = useState<string | null>(null)
  const [storySuccess, setStorySuccess] = useState<string | null>(null)
  const [wheelError, setWheelError] = useState<string | null>(null)
  const [wheelSuccess, setWheelSuccess] = useState<string | null>(null)
  const [billingFeedback, setBillingFeedback] = useState<BillingFeedbackState | null>(null)
  const [hasHandledBillingReturn, setHasHandledBillingReturn] = useState(false)
  const [billingRuntimeMode, setBillingRuntimeMode] = useState<BillingRuntimeMode>('manual')
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [isUploadingStoryMedia, setIsUploadingStoryMedia] = useState(false)
  const [dragOverEntryId, setDragOverEntryId] = useState<string | null>(null)
  const [reorderingSection, setReorderingSection] = useState<SortableDashboardSection | null>(null)
  const [copiedListId, setCopiedListId] = useState<string | null>(null)
  const [qrTargetListId, setQrTargetListId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [isQrLoading, setIsQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [previewListId, setPreviewListId] = useState<string | null>(null)
  const [isDesktopPreviewEntered, setIsDesktopPreviewEntered] = useState(false)
  const [isDesktopPreviewPasswordPromptOpen, setIsDesktopPreviewPasswordPromptOpen] = useState(false)
  const [desktopPreviewPassword, setDesktopPreviewPassword] = useState('')
  const [isDesktopPreviewPasswordVisible, setIsDesktopPreviewPasswordVisible] = useState(false)
  const [isMobilePreviewEntered, setIsMobilePreviewEntered] = useState(false)
  const [isMobilePreviewPasswordPromptOpen, setIsMobilePreviewPasswordPromptOpen] = useState(false)
  const [mobilePreviewPassword, setMobilePreviewPassword] = useState('')
  const [isMobilePreviewPasswordVisible, setIsMobilePreviewPasswordVisible] = useState(false)
  const [previewWheelRotation, setPreviewWheelRotation] = useState(0)
  const [isPreviewWheelSpinning, setIsPreviewWheelSpinning] = useState(false)
  const [selectedPreviewWheelEntryId, setSelectedPreviewWheelEntryId] = useState<string | null>(null)
  const [isPreviewWheelAnswerVisible, setIsPreviewWheelAnswerVisible] = useState(false)
  const desktopPreviewSectionRef = useRef<HTMLElement | null>(null)
  const desktopPreviewScrollRef = useRef<HTMLDivElement | null>(null)
  const mobilePreviewScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Clear transient UI messages when language changes to avoid mixed-locale state.
    setListError(null)
    setListSuccess(null)
    setReferralError(null)
    setReferralSuccess(null)
    setItemError(null)
    setItemSuccess(null)
    setIntroError(null)
    setIntroSuccess(null)
    setStoryError(null)
    setStorySuccess(null)
    setWheelError(null)
    setWheelSuccess(null)
    setQrError(null)
  }, [locale])

  useEffect(() => {
    if (visibility !== 'public_password') {
      setVisibilityPassword('')
      setIsVisibilityPasswordVisible(false)
    }
  }, [visibility])

  useEffect(() => {
    if (isTemplateAllowedForEvent(eventType, templateId)) {
      return
    }

    setTemplateId(getTemplateIdsForEvent(eventType)[0])
  }, [eventType, templateId])

  useEffect(() => {
    const unsubscribe = subscribeToUserLists(
      ownerId,
      (nextLists) => {
        setLists(nextLists)
        setIsListsLoading(false)
      },
      () => {
        setListError(labels.errorCreateFailed)
        setIsListsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [labels.errorCreateFailed, ownerId])

  useEffect(() => {
    const unsubscribe = subscribeToAccountEntitlement(
      ownerId,
      (nextEntitlement) => {
        setAccountEntitlement(nextEntitlement)
        setIsAccountEntitlementLoading(false)
      },
      () => {
        setAccountEntitlement(null)
        setIsAccountEntitlementLoading(false)
      }
    )

    return () => unsubscribe()
  }, [ownerId])

  useEffect(() => {
    if (lists.length === 0) {
      setSelectedListId('')
      return
    }

    const selectedListExists = lists.some((list) => list.id === selectedListId)
    if (!selectedListExists) {
      setSelectedListId(lists[0].id)
    }
  }, [lists, selectedListId])

  useEffect(() => {
    if (!billingListId || lists.length === 0) {
      return
    }

    const targetExists = lists.some((list) => list.id === billingListId)
    if (targetExists) {
      setSelectedListId(billingListId)
    }
  }, [billingListId, lists])

  useEffect(() => {
    if (!billingStatus || hasHandledBillingReturn) {
      return
    }

    if (billingStatus === 'success') {
      setListError(null)
      setListSuccess(null)
      setBillingFeedback({
        type: 'success',
        message: labels.billingSuccessReturn,
        listId: billingListId,
      })
    } else {
      setListSuccess(null)
      setListError(null)
      setBillingFeedback({
        type: 'error',
        message: labels.billingCancelReturn,
        listId: billingListId,
      })
    }

    setHasHandledBillingReturn(true)
  }, [
    billingListId,
    billingStatus,
    hasHandledBillingReturn,
    labels.billingCancelReturn,
    labels.billingSuccessReturn,
  ])

  useEffect(() => {
    if (!selectedListId) {
      setItems([])
      setIsItemsLoading(false)
      return
    }

    setIsItemsLoading(true)

    const unsubscribe = subscribeToListItems(
      selectedListId,
      (nextItems) => {
        setItems(nextItems)
        setIsItemsLoading(false)
      },
      () => {
        setItemError(labels.errorAddItem)
        setIsItemsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [labels.errorAddItem, selectedListId])

  useEffect(() => {
    if (!selectedListId) {
      setStories([])
      setIsStoriesLoading(false)
      return
    }

    setIsStoriesLoading(true)

    const unsubscribe = subscribeToListStories(
      selectedListId,
      (nextStories) => {
        setStories(nextStories)
        setIsStoriesLoading(false)
      },
      () => {
        setStoryError(labels.errorAddStory)
        setIsStoriesLoading(false)
      }
    )

    return () => unsubscribe()
  }, [labels.errorAddStory, selectedListId])

  useEffect(() => {
    if (!selectedListId) {
      setWheelEntries([])
      setIsWheelLoading(false)
      return
    }

    setIsWheelLoading(true)

    const unsubscribe = subscribeToWheelEntries(
      selectedListId,
      (nextEntries) => {
        setWheelEntries(nextEntries)
        setIsWheelLoading(false)
      },
      () => {
        setWheelError(labels.errorAddWheelEntry)
        setIsWheelLoading(false)
      }
    )

    return () => unsubscribe()
  }, [labels.errorAddWheelEntry, selectedListId])

  useEffect(() => {
    let cancelled = false

    fetchBillingRuntimeConfig()
      .then((config) => {
        if (cancelled) {
          return
        }

        setBillingRuntimeMode(config.mode)
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setBillingRuntimeMode('manual')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const getCurrentUserIdToken = useCallback(async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken()
    }

    return await new Promise<string>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          unsubscribe()

          if (!user) {
            reject(new Error('missing_auth'))
            return
          }

          try {
            resolve(await user.getIdToken())
          } catch {
            reject(new Error('invalid_auth'))
          }
        },
        () => {
          unsubscribe()
          reject(new Error('invalid_auth'))
        }
      )
    })
  }, [])

  const getReferralErrorMessage = useCallback((code: string) => {
    if (code === 'missing_auth' || code === 'invalid_auth') {
      return labels.errorSessionExpired
    }

    if (code === 'referral_invalid') {
      return labels.errorReferralInvalid
    }

    if (code === 'self_referral_not_allowed') {
      return labels.errorReferralSelf
    }

    if (code === 'referral_already_used') {
      return labels.errorReferralAlreadyUsed
    }

    if (code === 'referral_locked') {
      return labels.errorReferralLocked
    }

    if (code === 'referral_max_active_reached') {
      return labels.errorReferralMaxActiveReached
    }

    if (code === 'referral_not_allowed') {
      return labels.errorReferralNotAllowed
    }

    if (code === 'referral_reservation_failed') {
      return labels.errorReferralUnavailable
    }

    return labels.errorReferralUnavailable
  }, [
    labels.errorReferralAlreadyUsed,
    labels.errorReferralInvalid,
    labels.errorReferralLocked,
    labels.errorReferralMaxActiveReached,
    labels.errorReferralNotAllowed,
    labels.errorReferralSelf,
    labels.errorReferralUnavailable,
    labels.errorSessionExpired,
  ])

  const loadReferralSummary = useCallback(async () => {
    setIsReferralLoading(true)
    setReferralError(null)

    try {
      const idToken = await getCurrentUserIdToken()
      const summary = await fetchReferralDashboardSummary(idToken)
      setReferralSummary(summary)
    } catch (rawError) {
      if (isErrorWithCode(rawError)) {
        setReferralError(getReferralErrorMessage(rawError.code))
      } else if (rawError instanceof Error) {
        setReferralError(getReferralErrorMessage(rawError.message))
      } else {
        setReferralError(labels.referralLoadFailed)
      }

      setReferralSummary(null)
    } finally {
      setIsReferralLoading(false)
    }
  }, [
    getCurrentUserIdToken,
    getReferralErrorMessage,
    labels.referralLoadFailed,
  ])

  const getShowcaseErrorMessage = useCallback((code: string) => {
    if (code === 'missing_auth' || code === 'invalid_auth') {
      return labels.errorSessionExpired
    }

    if (code === 'showcase_not_allowed') {
      return labels.errorShowcaseNotAllowed
    }

    if (code === 'showcase_requires_public') {
      return labels.errorShowcaseRequiresPublic
    }

    if (code === 'list_not_found') {
      return labels.errorSelectList
    }

    return labels.errorShowcaseUpdateFailed
  }, [
    labels.errorSelectList,
    labels.errorSessionExpired,
    labels.errorShowcaseNotAllowed,
    labels.errorShowcaseRequiresPublic,
    labels.errorShowcaseUpdateFailed,
  ])

  const loadShowcaseState = useCallback(async () => {
    setIsShowcaseLoading(true)

    try {
      const idToken = await getCurrentUserIdToken()
      const nextListIds = await fetchShowcaseListIds(idToken)
      setShowcaseListIds(nextListIds)
    } catch (rawError) {
      setShowcaseListIds([])

      if (rawError instanceof ShowcaseClientError) {
        setListError(getShowcaseErrorMessage(rawError.code))
      } else if (rawError instanceof Error) {
        setListError(getShowcaseErrorMessage(rawError.message))
      } else {
        setListError(labels.errorShowcaseLoadFailed)
      }
    } finally {
      setIsShowcaseLoading(false)
    }
  }, [
    getCurrentUserIdToken,
    getShowcaseErrorMessage,
    labels.errorShowcaseLoadFailed,
  ])

  useEffect(() => {
    void loadReferralSummary()
  }, [loadReferralSummary])

  useEffect(() => {
    if (billingStatus === 'success') {
      void loadReferralSummary()
    }
  }, [billingStatus, loadReferralSummary])

  useEffect(() => {
    if (!hasActiveComplimentaryEntitlement(accountEntitlement)) {
      setShowcaseListIds([])
      setIsShowcaseLoading(false)
      return
    }

    void loadShowcaseState()
  }, [accountEntitlement, loadShowcaseState])

  const resetDesktopPreviewFlow = useCallback(() => {
    setIsDesktopPreviewEntered(false)
    setIsDesktopPreviewPasswordPromptOpen(false)
    setDesktopPreviewPassword('')
    setIsDesktopPreviewPasswordVisible(false)
    setPreviewWheelRotation(0)
    setIsPreviewWheelSpinning(false)
    setSelectedPreviewWheelEntryId(null)
    setIsPreviewWheelAnswerVisible(false)
  }, [])

  const resetMobilePreviewFlow = useCallback(() => {
    setIsMobilePreviewEntered(false)
    setIsMobilePreviewPasswordPromptOpen(false)
    setMobilePreviewPassword('')
    setIsMobilePreviewPasswordVisible(false)
    setPreviewWheelRotation(0)
    setIsPreviewWheelSpinning(false)
    setSelectedPreviewWheelEntryId(null)
    setIsPreviewWheelAnswerVisible(false)
  }, [])

  useEffect(() => {
    resetDesktopPreviewFlow()
  }, [resetDesktopPreviewFlow, selectedListId])

  useEffect(() => {
    resetMobilePreviewFlow()
  }, [previewListId, resetMobilePreviewFlow])

  useEffect(() => {
    if (!previewListId) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewListId(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [previewListId])

  const templateLabels = useMemo(() => templateLabelMap(labels), [labels])
  const availableTemplateIds = useMemo(
    () => getTemplateIdsForEvent(eventType),
    [eventType]
  )
  const eventTypeLabels = useMemo(() => eventLabelMap(eventLabels), [eventLabels])
  const visibilityLabels = useMemo(() => visibilityLabelMap(labels), [labels])
  const itemStatusLabels = useMemo(() => itemStatusLabelMap(labels), [labels])
  const referralStatusLabels = useMemo(
    () => ({
      active: labels.referralStatusActive,
      reserved: labels.referralStatusReserved,
      redeemed: labels.referralStatusRedeemed,
      revoked: labels.referralStatusRedeemed,
    } satisfies Record<ReferralCodeStatus, string>),
    [
      labels.referralStatusActive,
      labels.referralStatusRedeemed,
      labels.referralStatusReserved,
    ]
  )
  const billingPlans = useMemo(() => ([
    {
      id: 'base' as BillingPlanId,
      name: labels.planBaseName,
      price: labels.planBasePrice,
      features: labels.planBaseFeatures,
    },
    {
      id: 'premium' as BillingPlanId,
      name: labels.planPremiumName,
      price: labels.planPremiumPrice,
      features: labels.planPremiumFeatures,
    },
    {
      id: 'platinum' as BillingPlanId,
      name: labels.planPlatinumName,
      price: labels.planPlatinumPrice,
      features: labels.planPlatinumFeatures,
    },
  ]), [
    labels.planBaseFeatures,
    labels.planBaseName,
    labels.planBasePrice,
    labels.planPlatinumFeatures,
    labels.planPlatinumName,
    labels.planPlatinumPrice,
    labels.planPremiumFeatures,
    labels.planPremiumName,
    labels.planPremiumPrice,
  ])

  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId) ?? null,
    [lists, selectedListId]
  )
  const hasComplimentaryAccess = useMemo(
    () => hasActiveComplimentaryEntitlement(accountEntitlement),
    [accountEntitlement]
  )
  const showcasedListIdSet = useMemo(
    () => new Set(showcaseListIds),
    [showcaseListIds]
  )
  const editingItem = useMemo(
    () => items.find((item) => item.id === editingItemId) ?? null,
    [editingItemId, items]
  )
  const editingStory = useMemo(
    () => stories.find((story) => story.id === editingStoryId) ?? null,
    [editingStoryId, stories]
  )
  const editingWheelEntry = useMemo(
    () => wheelEntries.find((entry) => entry.id === editingWheelEntryId) ?? null,
    [editingWheelEntryId, wheelEntries]
  )
  const resetItemForm = useCallback(() => {
    setEditingItemId(null)
    setItemName('')
    setItemDescription('')
    setItemLink('')
    setItemMediaFile(null)
    if (itemMediaInputRef.current) {
      itemMediaInputRef.current.value = ''
    }
  }, [])
  const resetStoryForm = useCallback(() => {
    setEditingStoryId(null)
    setStoryTitle('')
    setStoryBody('')
    setStoryMediaFile(null)
    if (storyMediaInputRef.current) {
      storyMediaInputRef.current.value = ''
    }
  }, [])
  const resetWheelForm = useCallback(() => {
    setEditingWheelEntryId(null)
    setWheelQuestion('')
    setWheelAnswerText('')
  }, [])
  const isItemFormBusy = isAddingItem || isUploadingMedia
  const isStoryFormBusy = isAddingStory || isUploadingStoryMedia
  const isWheelFormBusy = isAddingWheelEntry
  const isItemsReordering = reorderingSection === 'items'
  const isStoriesReordering = reorderingSection === 'stories'
  const hasReachedWheelEntryLimit = !editingWheelEntryId && wheelEntries.length >= MAX_WHEEL_ENTRIES

  useEffect(() => {
    if (!selectedList) {
      setEventType('birthday')
      setTemplateId('classic')
      setVisibility('public')
      setVisibilityPassword('')
      setIsVisibilityPasswordVisible(false)
      return
    }

    setEventType(selectedList.eventType)
    setTemplateId(selectedList.templateId)
    setVisibility(selectedList.visibility)
    setVisibilityPassword('')
    setIsVisibilityPasswordVisible(false)
  }, [selectedList])

  useEffect(() => {
    resetItemForm()
    resetStoryForm()
    resetWheelForm()
    setDragOverEntryId(null)
    setDraggingItemId(null)
    setDraggingStoryId(null)
    setDraggingWheelEntryId(null)
    setReorderingSection(null)
  }, [resetItemForm, resetStoryForm, resetWheelForm, selectedListId])

  useEffect(() => {
    if (editingItemId && !editingItem) {
      resetItemForm()
    }
  }, [editingItem, editingItemId, resetItemForm])

  useEffect(() => {
    if (editingStoryId && !editingStory) {
      resetStoryForm()
    }
  }, [editingStory, editingStoryId, resetStoryForm])

  useEffect(() => {
    if (editingWheelEntryId && !editingWheelEntry) {
      resetWheelForm()
    }
  }, [editingWheelEntry, editingWheelEntryId, resetWheelForm])

  const isSelectedListExpired = (
    selectedList?.accessStatus === 'expired'
    && !hasComplimentaryAccess
  )
  const isItemActionsDisabled = !selectedListId || Boolean(isSelectedListExpired)
  const isSwitchingToPasswordProtected = Boolean(
    selectedList
    && selectedList.visibility !== 'public_password'
    && visibility === 'public_password'
  )
  const isVisibilityPasswordMissing = isSwitchingToPasswordProtected
    && visibilityPassword.trim().length < 6
  const selectedListMediaUsage = useMemo(
    () => resolveListMediaUsage({
      list: selectedList,
      items,
      stories,
    }),
    [items, selectedList, stories]
  )
  const selectedListRequiredPlanId = useMemo(
    () => resolveRequiredBillingPlanId(selectedListMediaUsage),
    [selectedListMediaUsage]
  )
  const selectedListMediaUsageIssue = useMemo(
    () => getMediaUsageIssue(selectedListMediaUsage),
    [selectedListMediaUsage]
  )
  const selectedListUsageDisplay = useMemo(
    () => formatMediaUsageMegabytes(selectedListMediaUsage.totalBytes),
    [selectedListMediaUsage.totalBytes]
  )
  const visibleBillingFeedback = useMemo(() => {
    if (!billingFeedback || !selectedList) {
      return null
    }

    if (billingFeedback.listId && billingFeedback.listId !== selectedList.id) {
      return null
    }

    return billingFeedback
  }, [billingFeedback, selectedList])
  const referralActiveCountLabel = useMemo(() => {
    return referralSummary
      ? interpolateLabel(labels.referralActiveCountLabel, {
          count: referralSummary.activeCodeCount,
          max: referralSummary.maxActiveCodes,
        })
      : interpolateLabel(labels.referralActiveCountLabel, {
          count: 0,
          max: 3,
        })
  }, [labels.referralActiveCountLabel, referralSummary])
  const referralRewardCreditsLabel = useMemo(() => {
    return interpolateLabel(labels.referralRewardCreditsLabel, {
      count: referralSummary?.pendingRewardCredits ?? 0,
    })
  }, [labels.referralRewardCreditsLabel, referralSummary?.pendingRewardCredits])
  const referralNextRewardLabel = useMemo(() => {
    return interpolateLabel(labels.referralNextRewardLabel, {
      discount: referralSummary?.nextRewardDiscountPercent ?? 0,
    })
  }, [labels.referralNextRewardLabel, referralSummary?.nextRewardDiscountPercent])
  const appliedReferralLabel = useMemo(() => {
    if (!appliedReferralCode) {
      return null
    }

    return interpolateLabel(labels.referralApplied, {
      code: appliedReferralCode.code,
      discount: appliedReferralCode.discountPercent,
    })
  }, [appliedReferralCode, labels.referralApplied])
  const mobilePreviewList = useMemo(
    () => lists.find((list) => list.id === previewListId) ?? null,
    [lists, previewListId]
  )
  const isMobilePreviewLoading = Boolean(previewListId) && (
    previewListId !== selectedListId || isItemsLoading || isStoriesLoading || isWheelLoading
  )
  const mobilePreviewItems = previewListId === selectedListId ? items : []
  const mobilePreviewStories = previewListId === selectedListId ? stories : []
  const mobilePreviewWheelEntries = previewListId === selectedListId ? wheelEntries : []
  const desktopPreviewList = selectedList
  const isDesktopPreviewLoading = Boolean(desktopPreviewList) && (
    isItemsLoading || isStoriesLoading || isWheelLoading
  )
  const resolvePreviewTheme = (previewList: GiftList | null) => {
    if (!previewList) {
      return 'default-dark'
    }

    const usesEditingState = previewList.id === selectedListId
    return resolveEventThemeId(
      usesEditingState ? eventType : previewList.eventType,
      usesEditingState ? templateId : previewList.templateId
    )
  }
  const mobilePreviewThemeId = resolvePreviewTheme(mobilePreviewList)
  const desktopPreviewThemeId = desktopPreviewList
    ? resolvePreviewTheme(desktopPreviewList)
    : 'default-dark'

  useEffect(() => {
    setIntroError(null)
    setIntroSuccess(null)
    setIntroMediaFile(null)
    if (introMediaInputRef.current) {
      introMediaInputRef.current.value = ''
    }

    if (!selectedList) {
      setIntroTitle('')
      setIntroBody('')
      return
    }

    setIntroTitle(selectedList.introTitle ?? '')
    setIntroBody(selectedList.introBody ?? '')
  }, [selectedList])

  const getPublicListUrl = (slug: string) => {
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL
      || (typeof window !== 'undefined' ? window.location.origin : '')
    ).replace(/\/$/, '')

    return `${siteUrl}/${slug}`
  }

  const buildProjectedMediaUsage = useCallback((params: {
    target: 'intro' | 'item' | 'story'
    uploadedMedia: UploadMediaMetadata
    replacingId?: string | null
  }) => {
    const projectedList = params.target === 'intro' && selectedList
      ? {
          ...selectedList,
          introMediaType: params.uploadedMedia.type,
          introMediaSizeBytes: params.uploadedMedia.sizeBytes,
          introMediaDurationSeconds: params.uploadedMedia.durationSeconds,
        }
      : selectedList

    const projectedItems = params.target === 'item'
      ? (
        params.replacingId
          ? items.map((item) => (
            item.id === params.replacingId
              ? {
                  ...item,
                  mediaType: params.uploadedMedia.type,
                  mediaSizeBytes: params.uploadedMedia.sizeBytes,
                  mediaDurationSeconds: params.uploadedMedia.durationSeconds,
                }
              : item
          ))
          : [
              ...items,
              {
                id: '__preview__',
                listId: selectedListId,
                order: items.length,
                name: '',
                description: '',
                link: null,
                mediaUrl: params.uploadedMedia.url,
                mediaPath: params.uploadedMedia.path,
                mediaType: params.uploadedMedia.type,
                mediaSizeBytes: params.uploadedMedia.sizeBytes,
                mediaDurationSeconds: params.uploadedMedia.durationSeconds,
                status: 'available' as const,
                reservedByName: null,
                reservedMessage: null,
                reservedAt: null,
                createdAt: null,
                updatedAt: null,
              },
            ]
      )
      : items

    const projectedStories = params.target === 'story'
      ? (
        params.replacingId
          ? stories.map((story) => (
            story.id === params.replacingId
              ? {
                  ...story,
                  mediaType: params.uploadedMedia.type,
                  mediaSizeBytes: params.uploadedMedia.sizeBytes,
                  mediaDurationSeconds: params.uploadedMedia.durationSeconds,
                }
              : story
          ))
          : [
              ...stories,
              {
                id: '__preview__',
                listId: selectedListId,
                order: stories.length,
                title: '',
                body: '',
                mediaUrl: params.uploadedMedia.url,
                mediaPath: params.uploadedMedia.path,
                mediaType: params.uploadedMedia.type,
                mediaSizeBytes: params.uploadedMedia.sizeBytes,
                mediaDurationSeconds: params.uploadedMedia.durationSeconds,
                createdAt: null,
                updatedAt: null,
              },
            ]
      )
      : stories

    return resolveListMediaUsage({
      list: projectedList,
      items: projectedItems,
      stories: projectedStories,
    })
  }, [items, selectedList, selectedListId, stories])

  const resolveMediaValidationMessage = useCallback((error: MediaValidationError) => {
    if (error.code === 'unsupported_type') {
      return labels.errorMediaUnsupportedType
    }

    if (error.code === 'video_too_long') {
      return labels.errorMediaVideoTooLong
    }

    return labels.errorMediaTooLarge
  }, [labels.errorMediaTooLarge, labels.errorMediaUnsupportedType, labels.errorMediaVideoTooLong])

  const resolveMediaProcessingMessage = useCallback((error: MediaProcessingError) => {
    if (error.code === 'missing_auth') {
      return labels.errorSessionExpired
    }

    return labels.errorMediaProcessingFailed
  }, [labels.errorMediaProcessingFailed, labels.errorSessionExpired])

  const composedCreateSlug = useMemo(() => {
    return buildPublicSlug(publicUrlCode, slug)
  }, [publicUrlCode, slug])

  const composedCreateUrl = useMemo(() => {
    return getPublicListUrl(composedCreateSlug)
  }, [composedCreateSlug])
  const isListSettingsSuccessVisible = listSuccess === labels.listSettingsSaved
  const globalListSuccess = isListSettingsSuccessVisible ? null : listSuccess

  const handleTitleChange = (value: string) => {
    setTitle(value)

    if (!isSlugTouched) {
      setSlug(sanitizeSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setIsSlugTouched(true)
    setSlug(sanitizeSlug(value))
  }

  const renderItemMediaPreview = (item: GiftListItem) => {
    if (!item.mediaUrl || !item.mediaType) {
      return null
    }

    if (item.mediaType.startsWith('image/')) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.mediaUrl}
          alt={item.name}
          className="mt-2 h-24 w-24 rounded-lg border border-white/20 object-cover"
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
          className="mt-2 h-24 w-40 rounded-lg border border-white/20 object-cover"
        />
      )
    }

    if (item.mediaType.startsWith('audio/')) {
      return (
        <audio
          controls
          preload="metadata"
          className="mt-2 w-full max-w-xs"
          src={item.mediaUrl}
        />
      )
    }

    return null
  }

  const renderStoryMediaPreview = (
    story: Pick<ListStoryEntry, 'title' | 'mediaUrl' | 'mediaType'>
  ) => {
    if (!story.mediaUrl || !story.mediaType) {
      return null
    }

    if (story.mediaType.startsWith('image/')) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.mediaUrl}
          alt={story.title}
          className="mt-2 h-24 w-24 rounded-lg border border-white/20 object-cover"
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
          className="mt-2 h-24 w-40 rounded-lg border border-white/20 object-cover"
        />
      )
    }

    return null
  }

  const renderPreviewHeroMedia = (
    previewMedia: { url: string; type: string } | null,
    title: string
  ) => {
    if (!previewMedia?.url || !previewMedia.type) {
      return null
    }

    const heroMediaClassName = 'h-[17rem] w-full object-cover sm:h-[21rem] lg:h-[24rem]'

    if (previewMedia.type.startsWith('image/')) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewMedia.url}
          alt={title}
          className={heroMediaClassName}
          loading="lazy"
        />
      )
    }

    if (previewMedia.type.startsWith('video/')) {
      return (
        <video
          src={previewMedia.url}
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

  const handleSpinPreviewWheel = (entries: WheelEntry[]) => {
    if (isPreviewWheelSpinning || entries.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * entries.length)
    const selectedEntry = entries[randomIndex]
    const baseTurns = 360 * 5
    const randomOffset = Math.random() * 360

    setIsPreviewWheelSpinning(true)
    setIsPreviewWheelAnswerVisible(false)
    setSelectedPreviewWheelEntryId(null)
    setPreviewWheelRotation((previous) => previous + baseTurns + randomOffset)

    window.setTimeout(() => {
      setSelectedPreviewWheelEntryId(selectedEntry.id)
      setIsPreviewWheelSpinning(false)
    }, 3400)
  }

  const handleCreateList = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setListError(null)
    setListSuccess(null)

    const normalizedUrlName = sanitizeSlug(slug)
    if (!isValidSlug(normalizedUrlName)) {
      setListError(labels.errorInvalidSlug)
      return
    }

    const user = auth.currentUser
    if (!user) {
      setListError(labels.errorSessionExpired)
      return
    }

    setIsCreatingList(true)

    try {
      const idToken = await user.getIdToken()
      const result = await createGiftList({
        ownerId,
        title,
        slug: composedCreateSlug,
        eventType: 'birthday',
        templateId: 'classic',
        visibility: 'public',
        idToken,
      })

      setListSuccess(`${labels.listCreated} ${getPublicListUrl(result.slug)}`)
      setTitle('')
      setSlug('')
      setIsSlugTouched(false)
      setPublicUrlCode(generatePublicUrlCode())
      setSelectedListId(result.listId)
    } catch (rawError) {
      if (rawError instanceof InvalidSlugError) {
        setListError(labels.errorInvalidSlug)
      } else if (rawError instanceof ReservedSlugError) {
        setListError(labels.errorSlugReserved)
      } else if (rawError instanceof SlugTakenError) {
        setListError(labels.errorSlugTaken)
      } else if (rawError instanceof VisibilityPasswordRequiredError) {
        setListError(labels.errorVisibilityPasswordRequired)
      } else {
        setListError(labels.errorCreateFailed)
      }
    } finally {
      setIsCreatingList(false)
    }
  }

  const handleSaveListSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setListError(null)
    setListSuccess(null)

    if (!selectedList) {
      setListError(labels.errorSelectList)
      return
    }

    const normalizedPassword = visibilityPassword.trim()
    if (isSwitchingToPasswordProtected && normalizedPassword.length < 6) {
      setListError(labels.errorVisibilityPasswordRequired)
      return
    }

    if (
      visibility === 'public_password'
      && !isSwitchingToPasswordProtected
      && normalizedPassword.length > 0
      && normalizedPassword.length < 6
    ) {
      setListError(labels.errorVisibilityPasswordRequired)
      return
    }

    setIsSavingListSettings(true)

    try {
      const user = auth.currentUser
      if (!user) {
        setListError(labels.errorSessionExpired)
        return
      }

      const idToken = await user.getIdToken()
      await updateGiftListSettings({
        listId: selectedList.id,
        eventType,
        templateId,
        visibility,
        visibilityPassword: normalizedPassword || undefined,
        idToken,
      })

      setLists((current) =>
        current.map((entry) =>
          entry.id === selectedList.id
            ? {
                ...entry,
                eventType,
                templateId,
                visibility,
              }
            : entry
        )
      )
      setVisibilityPassword('')
      setIsVisibilityPasswordVisible(false)
      setListSuccess(labels.listSettingsSaved)
    } catch (rawError) {
      if (rawError instanceof VisibilityPasswordRequiredError) {
        setVisibility(selectedList.visibility)
        setListError(labels.errorVisibilityPasswordRequired)
      } else {
        setListError(withErrorCode(labels.errorListSettingsUpdate, rawError))
      }
    } finally {
      setIsSavingListSettings(false)
    }
  }

  const handleDeleteList = async () => {
    if (!selectedList) {
      setListError(labels.errorSelectList)
      return
    }

    setListError(null)
    setListSuccess(null)
    setIsDeletingList(true)

    try {
      const user = auth.currentUser
      if (!user) {
        setListError(labels.errorSessionExpired)
        return
      }

      const idToken = await user.getIdToken()
      await deleteGiftList({
        listId: selectedList.id,
        idToken,
      })

      if (previewListId === selectedList.id) {
        setPreviewListId(null)
      }
      setQrTargetListId((current) => (current === selectedList.id ? null : current))
      setQrDataUrl(null)
      setCopiedListId((current) => (current === selectedList.id ? null : current))
      setIsDeleteListConfirmOpen(false)
      setListSuccess(labels.listDeleted)
    } catch (rawError) {
      setListError(withErrorCode(labels.errorDeleteList, rawError))
    } finally {
      setIsDeletingList(false)
    }
  }

  const handleCopyPublicLink = async (list: GiftList) => {
    const url = getPublicListUrl(list.slug)

    try {
      await navigator.clipboard.writeText(url)
      setCopiedListId(list.id)
      window.setTimeout(() => {
        setCopiedListId((current) => (current === list.id ? null : current))
      }, 1500)
    } catch {
      setListError(labels.errorCreateFailed)
    }
  }

  const handleToggleShowcase = async (list: GiftList) => {
    setListError(null)

    if (!hasComplimentaryAccess) {
      setListError(labels.errorShowcaseNotAllowed)
      return
    }

    const isCurrentlyShowcased = showcasedListIdSet.has(list.id)
    if (!isCurrentlyShowcased && list.visibility !== 'public') {
      setListError(labels.errorShowcaseRequiresPublic)
      return
    }

    setShowcaseUpdatingListId(list.id)

    try {
      const idToken = await getCurrentUserIdToken()
      const result = await setShowcaseListState({
        idToken,
        listId: list.id,
        publish: !isCurrentlyShowcased,
      })

      setShowcaseListIds((current) => {
        if (result.showcased) {
          return current.includes(result.listId)
            ? current
            : [...current, result.listId]
        }

        return current.filter((entryId) => entryId !== result.listId)
      })
    } catch (rawError) {
      if (rawError instanceof ShowcaseClientError) {
        setListError(getShowcaseErrorMessage(rawError.code))
      } else if (rawError instanceof Error) {
        setListError(getShowcaseErrorMessage(rawError.message))
      } else {
        setListError(labels.errorShowcaseUpdateFailed)
      }
    } finally {
      setShowcaseUpdatingListId(null)
    }
  }

  const handleCopyReferralCode = async (codeId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedReferralCodeId(codeId)
      window.setTimeout(() => {
        setCopiedReferralCodeId((current) => (current === codeId ? null : current))
      }, 1500)
    } catch {
      setReferralError(labels.errorReferralUnavailable)
    }
  }

  const handleGenerateReferralCode = async () => {
    setReferralError(null)
    setReferralSuccess(null)
    setIsGeneratingReferralCode(true)

    try {
      const idToken = await getCurrentUserIdToken()
      await generateReferralCode(idToken)
      setReferralSuccess(labels.referralGenerateSuccess)
      await loadReferralSummary()
    } catch (rawError) {
      if (rawError instanceof ReferralClientError) {
        setReferralError(getReferralErrorMessage(rawError.code))
      } else if (rawError instanceof Error) {
        setReferralError(getReferralErrorMessage(rawError.message))
      } else {
        setReferralError(labels.referralLoadFailed)
      }
    } finally {
      setIsGeneratingReferralCode(false)
    }
  }

  const handleApplyReferralCode = async () => {
    setReferralError(null)
    setReferralSuccess(null)

    const normalizedInput = referralCodeInput.trim()
    if (!normalizedInput) {
      setReferralError(labels.errorReferralInvalid)
      return
    }

    setIsApplyingReferralCode(true)

    try {
      const idToken = await getCurrentUserIdToken()
      const result = await validateReferralCode({
        idToken,
        code: normalizedInput,
      })

      setAppliedReferralCode(result)
      setReferralCodeInput(result.code)
    } catch (rawError) {
      setAppliedReferralCode(null)

      if (rawError instanceof ReferralClientError) {
        setReferralError(getReferralErrorMessage(rawError.code))
      } else if (rawError instanceof Error) {
        setReferralError(getReferralErrorMessage(rawError.message))
      } else {
        setReferralError(labels.errorReferralInvalid)
      }
    } finally {
      setIsApplyingReferralCode(false)
    }
  }

  const handleClearReferralCode = () => {
    setAppliedReferralCode(null)
    setReferralCodeInput('')
    setReferralError(null)
    setReferralSuccess(null)
  }

  const handleToggleQr = async (list: GiftList) => {
    if (qrTargetListId === list.id) {
      setQrTargetListId(null)
      setQrDataUrl(null)
      setQrError(null)
      return
    }

    setQrTargetListId(list.id)
    setQrDataUrl(null)
    setQrError(null)
    setIsQrLoading(true)

    try {
      const qrUrl = await QRCode.toDataURL(getPublicListUrl(list.slug), {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 220,
      })
      setQrDataUrl(qrUrl)
    } catch {
      setQrError(labels.qrError)
    } finally {
      setIsQrLoading(false)
    }
  }

  const handleOpenPreview = (list: GiftList) => {
    setSelectedListId(list.id)

    if (
      typeof window !== 'undefined'
      && window.matchMedia('(min-width: 1024px)').matches
    ) {
      resetDesktopPreviewFlow()
      setPreviewListId(null)
      window.requestAnimationFrame(() => {
        desktopPreviewSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
        desktopPreviewScrollRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      })
      return
    }

    resetMobilePreviewFlow()
    setPreviewListId(list.id)
  }

  const handleClosePreview = () => {
    resetMobilePreviewFlow()
    setPreviewListId(null)
  }

  const handleScrollDesktopPreviewToHero = () => {
    resetDesktopPreviewFlow()
    desktopPreviewSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    desktopPreviewScrollRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleScrollMobilePreviewToHero = () => {
    resetMobilePreviewFlow()
    mobilePreviewScrollRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleContinueDesktopPreview = () => {
    if (!desktopPreviewList) {
      return
    }

    if (desktopPreviewList.visibility === 'public_password') {
      setIsDesktopPreviewPasswordPromptOpen(true)
      return
    }

    setIsDesktopPreviewPasswordPromptOpen(false)
    setIsDesktopPreviewEntered(true)
  }

  const handleUnlockDesktopPreview = () => {
    if (desktopPreviewPassword.trim().length < 6) {
      return
    }

    setIsDesktopPreviewEntered(true)
    setIsDesktopPreviewPasswordPromptOpen(false)
    setDesktopPreviewPassword('')
    setIsDesktopPreviewPasswordVisible(false)
  }

  const handleContinueMobilePreview = () => {
    if (!mobilePreviewList) {
      return
    }

    if (mobilePreviewList.visibility === 'public_password') {
      setIsMobilePreviewPasswordPromptOpen(true)
      return
    }

    setIsMobilePreviewPasswordPromptOpen(false)
    setIsMobilePreviewEntered(true)
  }

  const handleUnlockMobilePreview = () => {
    if (mobilePreviewPassword.trim().length < 6) {
      return
    }

    setIsMobilePreviewEntered(true)
    setIsMobilePreviewPasswordPromptOpen(false)
    setMobilePreviewPassword('')
    setIsMobilePreviewPasswordVisible(false)
  }

  const handleActivatePass = async (listId: string, planId: BillingPlanId) => {
    setListError(null)
    setListSuccess(null)
    setBillingFeedback(null)
    setReferralError(null)
    setActivatingPlanTarget(`${listId}:${planId}`)

    try {
      if (hasComplimentaryAccess) {
        setBillingFeedback({
          type: 'success',
          message: labels.complimentaryAccessNotice,
          listId,
        })
        return
      }

      const user = auth.currentUser
      if (!user) {
        setBillingFeedback({
          type: 'error',
          message: labels.errorSessionExpired,
          listId,
        })
        return
      }

      const idToken = await user.getIdToken()
      const result = await startBillingCheckout({
        listId,
        planId,
        locale,
        idToken,
        referralCode: appliedReferralCode?.code ?? null,
      })

      if (result.mode === 'stripe') {
        setBillingFeedback({
          type: 'success',
          message: labels.redirectingToCheckout,
          listId,
        })
        window.location.assign(result.checkoutUrl)
        return
      }

      setBillingFeedback({
        type: 'success',
        message: labels.passActivated,
        listId,
      })
      setAppliedReferralCode(null)
      setReferralCodeInput('')
      await loadReferralSummary()
    } catch (rawError) {
      if (rawError instanceof BillingCheckoutError) {
        if (rawError.code === 'missing_auth' || rawError.code === 'invalid_auth') {
          setBillingFeedback({
            type: 'error',
            message: labels.errorSessionExpired,
            listId,
          })
          return
        }

        if (rawError.code === 'plan_too_small') {
          setBillingFeedback({
            type: 'error',
            message: labels.errorPlanTooSmall,
            listId,
          })
          return
        }

        if (rawError.code === 'video_duration_exceeded') {
          setBillingFeedback({
            type: 'error',
            message: labels.errorMediaVideoTooLong,
            listId,
          })
          return
        }

        if (rawError.code === 'media_limit_exceeded') {
          setBillingFeedback({
            type: 'error',
            message: labels.errorMediaUsageLimitExceeded,
            listId,
          })
          return
        }

        if (
          rawError.code === 'referral_invalid'
          || rawError.code === 'self_referral_not_allowed'
          || rawError.code === 'referral_already_used'
          || rawError.code === 'referral_not_allowed'
          || rawError.code === 'referral_reservation_failed'
        ) {
          setBillingFeedback({
            type: 'error',
            message: getReferralErrorMessage(rawError.code),
            listId,
          })
          return
        }
      }

      setBillingFeedback({
        type: 'error',
        message: labels.errorActivatePass,
        listId,
      })
    } finally {
      setActivatingPlanTarget(null)
    }
  }

  const handleSaveIntro = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIntroError(null)
    setIntroSuccess(null)

    if (!selectedList) {
      setIntroError(labels.errorSelectList)
      return
    }

    if (isSelectedListExpired) {
      setIntroError(labels.accessExpiredNotice)
      return
    }

    setIsSavingIntro(true)

    let uploadedMedia: UploadMediaMetadata | null = null

    try {
      if (introMediaFile) {
        setIsUploadingIntroMedia(true)
        uploadedMedia = await uploadListIntroMedia({
          listId: selectedList.id,
          ownerId,
          file: introMediaFile,
        })

        const projectedMediaUsage = buildProjectedMediaUsage({
          target: 'intro',
          uploadedMedia,
        })
        if (!hasComplimentaryAccess) {
          const projectedMediaUsageIssue = getMediaUsageIssue(projectedMediaUsage)
          if (projectedMediaUsageIssue) {
            throw new Error(projectedMediaUsageIssue)
          }
        }
      }

      await updateGiftListIntro({
        listId: selectedList.id,
        introTitle,
        introBody,
        introMedia: uploadedMedia ?? undefined,
      })

      if (
        uploadedMedia
        && selectedList.introMediaPath
        && selectedList.introMediaPath !== uploadedMedia.path
      ) {
        await deleteMediaByPath(selectedList.introMediaPath)
      }

      if (uploadedMedia) {
        setIntroMediaFile(null)
        if (introMediaInputRef.current) {
          introMediaInputRef.current.value = ''
        }
      }

      setIntroSuccess(labels.heroSaved)
    } catch (rawError) {
      if (uploadedMedia) {
        await deleteMediaByPath(uploadedMedia.path).catch(() => undefined)
      }

      if (rawError instanceof MediaValidationError) {
        setIntroError(resolveMediaValidationMessage(rawError))
      } else if (rawError instanceof MediaProcessingError) {
        setIntroError(resolveMediaProcessingMessage(rawError))
      } else if (rawError instanceof Error && rawError.message === 'media_limit_exceeded') {
        setIntroError(labels.errorMediaUsageLimitExceeded)
      } else if (rawError instanceof Error && rawError.message === 'video_duration_exceeded') {
        setIntroError(labels.errorMediaVideoTooLong)
      } else {
        setIntroError(withErrorCode(labels.errorSaveHero, rawError))
      }
    } finally {
      setIsSavingIntro(false)
      setIsUploadingIntroMedia(false)
    }
  }

  const handleRemoveIntroMedia = async () => {
    if (!selectedList?.introMediaPath) {
      return
    }

    if (isSelectedListExpired) {
      setIntroError(labels.accessExpiredNotice)
      return
    }

    setIntroError(null)
    setIntroSuccess(null)
    setIsRemovingIntroMedia(true)

    try {
      const previousMediaPath = selectedList.introMediaPath

      await updateGiftListIntro({
        listId: selectedList.id,
        introTitle,
        introBody,
        introMedia: null,
      })
      await deleteMediaByPath(previousMediaPath)

      setIntroMediaFile(null)
      if (introMediaInputRef.current) {
        introMediaInputRef.current.value = ''
      }

      setIntroSuccess(labels.heroSaved)
    } catch {
      setIntroError(labels.errorRemoveHeroMedia)
    } finally {
      setIsRemovingIntroMedia(false)
    }
  }

  const getNextOrder = async (
    section: SortableDashboardSection
  ) => {
    if (!selectedListId) {
      return 0
    }

    const currentEntries = section === 'items'
      ? items
      : (section === 'stories' ? stories : wheelEntries)
    const hasMissingOrder = currentEntries.some((entry) => entry.order === null)

    if (hasMissingOrder && currentEntries.length > 0) {
      const orderedIds = currentEntries.map((entry) => entry.id)

      if (section === 'items') {
        await reorderGiftItems(selectedListId, orderedIds)
      } else if (section === 'stories') {
        await reorderListStories(selectedListId, orderedIds)
      } else {
        await reorderWheelEntries(selectedListId, orderedIds)
      }

      return currentEntries.length
    }

    const nextOrder = currentEntries.reduce((highestOrder, entry, index) => {
      const currentOrder = entry.order ?? index
      return Math.max(highestOrder, currentOrder)
    }, -1)

    return nextOrder + 1
  }

  const persistSectionReorder = async (
    section: SortableDashboardSection,
    orderedIds: string[]
  ) => {
    if (!selectedListId) {
      return
    }

    const previousItems = items
    const previousStories = stories
    const previousWheelEntries = wheelEntries

    if (section === 'items') {
      setItems(sortEntriesByIds(items, orderedIds))
    } else if (section === 'stories') {
      setStories(sortEntriesByIds(stories, orderedIds))
    } else {
      setWheelEntries(sortEntriesByIds(wheelEntries, orderedIds))
    }

    setReorderingSection(section)

    try {
      if (section === 'items') {
        await reorderGiftItems(selectedListId, orderedIds)
      } else if (section === 'stories') {
        await reorderListStories(selectedListId, orderedIds)
      } else {
        await reorderWheelEntries(selectedListId, orderedIds)
      }
    } catch {
      if (section === 'items') {
        setItems(previousItems)
        setItemError(labels.errorUpdateItem)
      } else if (section === 'stories') {
        setStories(previousStories)
        setStoryError(labels.errorUpdateStory)
      } else {
        setWheelEntries(previousWheelEntries)
        setWheelError(labels.errorUpdateWheelEntry)
      }
    } finally {
      setReorderingSection(null)
      setDragOverEntryId(null)
      setDraggingItemId(null)
      setDraggingStoryId(null)
      setDraggingWheelEntryId(null)
    }
  }

  const handleEntryDragStart = (
    event: DragEvent<HTMLElement>,
    section: SortableDashboardSection,
    entryId: string
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', entryId)
    setDragOverEntryId(entryId)

    if (section === 'items') {
      setDraggingItemId(entryId)
    } else if (section === 'stories') {
      setDraggingStoryId(entryId)
    } else {
      setDraggingWheelEntryId(entryId)
    }
  }

  const handleEntryDragOver = (
    event: DragEvent<HTMLElement>,
    section: SortableDashboardSection,
    entryId: string
  ) => {
    const activeDraggingEntryId = section === 'items'
      ? draggingItemId
      : (section === 'stories' ? draggingStoryId : draggingWheelEntryId)
    const draggingEntryId = activeDraggingEntryId || event.dataTransfer.getData('text/plain')

    if (!draggingEntryId || draggingEntryId === entryId) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverEntryId(entryId)
  }

  const handleEntryDragEnd = () => {
    setDragOverEntryId(null)
    setDraggingItemId(null)
    setDraggingStoryId(null)
    setDraggingWheelEntryId(null)
  }

  const handleEntryDrop = async (
    event: DragEvent<HTMLElement>,
    section: SortableDashboardSection,
    targetId: string
  ) => {
    event.preventDefault()

    const activeDraggingEntryId = section === 'items'
      ? draggingItemId
      : (section === 'stories' ? draggingStoryId : draggingWheelEntryId)
    const draggingEntryId = activeDraggingEntryId || event.dataTransfer.getData('text/plain')

    if (!draggingEntryId || draggingEntryId === targetId) {
      handleEntryDragEnd()
      return
    }

    if (section === 'items') {
      const reorderedEntries = reorderArrayEntryById(items, draggingEntryId, targetId)
      if (reorderedEntries === items) {
        handleEntryDragEnd()
        return
      }

      await persistSectionReorder(section, reorderedEntries.map((entry) => entry.id))
      return
    }

    if (section === 'stories') {
      const reorderedEntries = reorderArrayEntryById(stories, draggingEntryId, targetId)
      if (reorderedEntries === stories) {
        handleEntryDragEnd()
        return
      }

      await persistSectionReorder(section, reorderedEntries.map((entry) => entry.id))
      return
    }

    const reorderedEntries = reorderArrayEntryById(wheelEntries, draggingEntryId, targetId)
    if (reorderedEntries === wheelEntries) {
      handleEntryDragEnd()
      return
    }

    await persistSectionReorder(section, reorderedEntries.map((entry) => entry.id))
  }

  const handleEditItem = (item: GiftListItem) => {
    setItemError(null)
    setItemSuccess(null)
    setEditingItemId(item.id)
    setItemName(item.name)
    setItemDescription(item.description)
    setItemLink(item.link ?? '')
    setItemMediaFile(null)
    if (itemMediaInputRef.current) {
      itemMediaInputRef.current.value = ''
    }
    itemFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleEditStory = (story: ListStoryEntry) => {
    setStoryError(null)
    setStorySuccess(null)
    setEditingStoryId(story.id)
    setStoryTitle(story.title)
    setStoryBody(story.body)
    setStoryMediaFile(null)
    if (storyMediaInputRef.current) {
      storyMediaInputRef.current.value = ''
    }
    storyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleEditWheelEntry = (entry: WheelEntry) => {
    setWheelError(null)
    setWheelSuccess(null)
    setEditingWheelEntryId(entry.id)
    setWheelQuestion(entry.question)
    setWheelAnswerText(entry.answerText ?? '')
    wheelFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleAddItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setItemError(null)
    setItemSuccess(null)

    if (!selectedListId) {
      setItemError(labels.errorSelectList)
      return
    }

    if (isSelectedListExpired) {
      setItemError(labels.accessExpiredNotice)
      return
    }

    setIsAddingItem(true)

    let mediaPayload: UploadMediaMetadata | null = null

    try {
      if (itemMediaFile) {
        setIsUploadingMedia(true)
        mediaPayload = await uploadItemMedia({
          listId: selectedListId,
          ownerId,
          file: itemMediaFile,
        })

        const projectedMediaUsage = buildProjectedMediaUsage({
          target: 'item',
          uploadedMedia: mediaPayload,
          replacingId: editingItemId,
        })
        if (!hasComplimentaryAccess) {
          const projectedMediaUsageIssue = getMediaUsageIssue(projectedMediaUsage)
          if (projectedMediaUsageIssue) {
            throw new Error(projectedMediaUsageIssue)
          }
        }
      }

      if (editingItemId) {
        if (!editingItem) {
          throw new Error('item_not_found')
        }

        await updateGiftItem({
          listId: selectedListId,
          itemId: editingItemId,
          name: itemName,
          description: itemDescription,
          link: itemLink,
          media: mediaPayload ?? undefined,
        })

        if (
          mediaPayload
          && editingItem.mediaPath
          && editingItem.mediaPath !== mediaPayload.path
        ) {
          await deleteItemMediaByPath(editingItem.mediaPath)
        }

        resetItemForm()
        setItemSuccess(labels.itemUpdated)
      } else {
        await createGiftItem({
          listId: selectedListId,
          order: await getNextOrder('items'),
          name: itemName,
          description: itemDescription,
          link: itemLink,
          media: mediaPayload,
        })

        resetItemForm()
        setItemSuccess(labels.itemAdded)
      }
    } catch (rawError) {
      if (mediaPayload) {
        await deleteItemMediaByPath(mediaPayload.path).catch(() => undefined)
      }

      if (rawError instanceof MediaValidationError) {
        setItemError(resolveMediaValidationMessage(rawError))
      } else if (rawError instanceof MediaProcessingError) {
        setItemError(resolveMediaProcessingMessage(rawError))
      } else if (rawError instanceof Error && rawError.message === 'media_limit_exceeded') {
        setItemError(labels.errorMediaUsageLimitExceeded)
      } else if (rawError instanceof Error && rawError.message === 'video_duration_exceeded') {
        setItemError(labels.errorMediaVideoTooLong)
      } else {
        setItemError(withErrorCode(
          editingItemId ? labels.errorUpdateItem : labels.errorAddItem,
          rawError
        ))
      }
    } finally {
      setIsUploadingMedia(false)
      setIsAddingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedListId) {
      setItemError(labels.errorSelectList)
      return
    }

    if (isSelectedListExpired) {
      setItemError(labels.accessExpiredNotice)
      return
    }

    setItemError(null)
    setItemSuccess(null)
    setDeletingItemId(itemId)

    try {
      const removal = await deleteGiftItem(selectedListId, itemId)
      await removal.removeItem()
      await deleteItemMediaByPath(removal.mediaPath)
      if (editingItemId === itemId) {
        resetItemForm()
      }
      setItemSuccess(labels.itemDeleted)
    } catch {
      setItemError(labels.errorDeleteItem)
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleUpdateItemStatus = async (
    itemId: string,
    nextStatus: GiftListItem['status']
  ) => {
    if (!selectedListId) {
      setItemError(labels.errorSelectList)
      return
    }

    if (isSelectedListExpired) {
      setItemError(labels.accessExpiredNotice)
      return
    }

    setItemError(null)
    setItemSuccess(null)
    setStatusUpdatingItemId(itemId)

    try {
      await setGiftItemStatus(selectedListId, itemId, nextStatus)
      setItemSuccess(labels.statusUpdated)
    } catch {
      setItemError(labels.errorUpdateStatus)
    } finally {
      setStatusUpdatingItemId(null)
    }
  }

  const handleAddStory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStoryError(null)
    setStorySuccess(null)

    if (!selectedListId) {
      setStoryError(labels.errorSelectList)
      return
    }

    if (isSelectedListExpired) {
      setStoryError(labels.accessExpiredNotice)
      return
    }

    setIsAddingStory(true)

    let mediaPayload: UploadMediaMetadata | null = null

    try {
      if (storyMediaFile) {
        setIsUploadingStoryMedia(true)
        mediaPayload = await uploadStoryMedia({
          listId: selectedListId,
          ownerId,
          file: storyMediaFile,
        })

        const projectedMediaUsage = buildProjectedMediaUsage({
          target: 'story',
          uploadedMedia: mediaPayload,
          replacingId: editingStoryId,
        })
        if (!hasComplimentaryAccess) {
          const projectedMediaUsageIssue = getMediaUsageIssue(projectedMediaUsage)
          if (projectedMediaUsageIssue) {
            throw new Error(projectedMediaUsageIssue)
          }
        }
      }

      if (editingStoryId) {
        if (!editingStory) {
          throw new Error('story_not_found')
        }

        await updateListStory({
          listId: selectedListId,
          storyId: editingStoryId,
          title: storyTitle,
          body: storyBody,
          media: mediaPayload ?? undefined,
        })

        if (
          mediaPayload
          && editingStory.mediaPath
          && editingStory.mediaPath !== mediaPayload.path
        ) {
          await deleteMediaByPath(editingStory.mediaPath)
        }

        resetStoryForm()
        setStorySuccess(labels.storyUpdated)
      } else {
        await createListStory({
          listId: selectedListId,
          order: await getNextOrder('stories'),
          title: storyTitle,
          body: storyBody,
          media: mediaPayload,
        })

        resetStoryForm()
        setStorySuccess(labels.storyAdded)
      }
    } catch (rawError) {
      if (mediaPayload) {
        await deleteMediaByPath(mediaPayload.path).catch(() => undefined)
      }

      if (rawError instanceof MediaValidationError) {
        setStoryError(resolveMediaValidationMessage(rawError))
      } else if (rawError instanceof MediaProcessingError) {
        setStoryError(resolveMediaProcessingMessage(rawError))
      } else if (rawError instanceof Error && rawError.message === 'media_limit_exceeded') {
        setStoryError(labels.errorMediaUsageLimitExceeded)
      } else if (rawError instanceof Error && rawError.message === 'video_duration_exceeded') {
        setStoryError(labels.errorMediaVideoTooLong)
      } else {
        setStoryError(withErrorCode(
          editingStoryId ? labels.errorUpdateStory : labels.errorAddStory,
          rawError
        ))
      }
    } finally {
      setIsUploadingStoryMedia(false)
      setIsAddingStory(false)
    }
  }

  const handleDeleteStory = async (storyId: string) => {
    if (!selectedListId) {
      setStoryError(labels.errorSelectList)
      return
    }

    if (isSelectedListExpired) {
      setStoryError(labels.accessExpiredNotice)
      return
    }

    setStoryError(null)
    setStorySuccess(null)
    setDeletingStoryId(storyId)

    try {
      const removal = await deleteListStory(selectedListId, storyId)
      await removal.removeStory()
      await deleteMediaByPath(removal.mediaPath)
      if (editingStoryId === storyId) {
        resetStoryForm()
      }
      setStorySuccess(labels.storyDeleted)
    } catch {
      setStoryError(labels.errorDeleteStory)
    } finally {
      setDeletingStoryId(null)
    }
  }

  const handleAddWheelEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWheelError(null)
    setWheelSuccess(null)

    if (!selectedListId) {
      setWheelError(labels.errorSelectList)
      return
    }

    if (isSelectedListExpired) {
      setWheelError(labels.accessExpiredNotice)
      return
    }

    if (wheelAnswerText.trim().length === 0) {
      setWheelError(labels.errorWheelAnswerRequired)
      return
    }

    if (!editingWheelEntryId && wheelEntries.length >= MAX_WHEEL_ENTRIES) {
      setWheelError(labels.errorWheelLimitReached)
      return
    }

    setIsAddingWheelEntry(true)

    try {
      if (editingWheelEntryId) {
        if (!editingWheelEntry) {
          throw new Error('wheel_entry_not_found')
        }

        await updateWheelEntry({
          listId: selectedListId,
          entryId: editingWheelEntryId,
          question: wheelQuestion,
          answerText: wheelAnswerText,
        })

        resetWheelForm()
        setWheelSuccess(labels.wheelEntryUpdated)
      } else {
        await createWheelEntry({
          listId: selectedListId,
          order: await getNextOrder('wheel'),
          question: wheelQuestion,
          answerText: wheelAnswerText,
        })

        resetWheelForm()
        setWheelSuccess(labels.wheelEntryAdded)
      }
    } catch (rawError) {
      setWheelError(withErrorCode(
        editingWheelEntryId ? labels.errorUpdateWheelEntry : labels.errorAddWheelEntry,
        rawError
      ))
    } finally {
      setIsAddingWheelEntry(false)
    }
  }

  const handleDeleteWheelEntry = async (entryId: string) => {
    if (!selectedListId) {
      setWheelError(labels.errorSelectList)
      return
    }

    if (isSelectedListExpired) {
      setWheelError(labels.accessExpiredNotice)
      return
    }

    setWheelError(null)
    setWheelSuccess(null)
    setDeletingWheelEntryId(entryId)

    try {
      const removal = await deleteWheelEntry(selectedListId, entryId)
      await removal.removeWheelEntry()
      await deleteMediaByPath(removal.answerAudioPath)
      if (editingWheelEntryId === entryId) {
        resetWheelForm()
      }
      setWheelSuccess(labels.wheelEntryDeleted)
    } catch {
      setWheelError(labels.errorDeleteWheelEntry)
    } finally {
      setDeletingWheelEntryId(null)
    }
  }

  const renderPreviewContent = (params: {
    list: GiftList
    isLoading: boolean
    hasEntered: boolean
    isPasswordPromptOpen: boolean
    password: string
    isPasswordVisible: boolean
    itemsToRender: GiftListItem[]
    storiesToRender: ListStoryEntry[]
    wheelEntriesToRender: WheelEntry[]
    scrollRef: { current: HTMLDivElement | null }
    contentClassName: string
    onContinue: () => void
    onUnlock: () => void
    onPasswordChange: (value: string) => void
    onTogglePasswordVisibility: () => void
  }) => {
    const {
      list,
      isLoading,
      hasEntered,
      isPasswordPromptOpen,
      password,
      isPasswordVisible,
      itemsToRender,
      storiesToRender,
      wheelEntriesToRender,
      scrollRef,
      contentClassName,
      onContinue,
      onUnlock,
      onPasswordChange,
      onTogglePasswordVisibility,
    } = params
    const selectedPreviewWheelEntry = wheelEntriesToRender.find(
      (entry) => entry.id === selectedPreviewWheelEntryId
    ) ?? null
    const previewWheelGradient = wheelEntriesToRender.length === 0
      ? 'conic-gradient(#0f172a 0% 100%)'
      : `conic-gradient(${wheelEntriesToRender
          .map((entry, index) => {
            const start = (index / wheelEntriesToRender.length) * 100
            const end = ((index + 1) / wheelEntriesToRender.length) * 100
            const palette = [
              'var(--event-wheel-1)',
              'var(--event-wheel-2)',
              'var(--event-wheel-3)',
              'var(--event-wheel-4)',
              'var(--event-wheel-5)',
              'var(--event-wheel-6)',
            ]

            return `${palette[index % palette.length]} ${start}% ${end}%`
          })
          .join(', ')})`
    const previewHeroMedia = (() => {
      if (
        typeof list.introMediaUrl === 'string'
        && typeof list.introMediaType === 'string'
        && (
          list.introMediaType.startsWith('image/')
          || list.introMediaType.startsWith('video/')
        )
      ) {
        return {
          url: list.introMediaUrl,
          type: list.introMediaType,
        }
      }

      const storyMedia = storiesToRender.find((story) => (
        typeof story.mediaUrl === 'string'
        && typeof story.mediaType === 'string'
        && (
          story.mediaType.startsWith('image/')
          || story.mediaType.startsWith('video/')
        )
      ))

      if (storyMedia?.mediaUrl && storyMedia.mediaType) {
        return {
          url: storyMedia.mediaUrl,
          type: storyMedia.mediaType,
        }
      }

      const itemMedia = itemsToRender.find((item) => (
        typeof item.mediaUrl === 'string'
        && typeof item.mediaType === 'string'
        && (
          item.mediaType.startsWith('image/')
          || item.mediaType.startsWith('video/')
        )
      ))

      if (itemMedia?.mediaUrl && itemMedia.mediaType) {
        return {
          url: itemMedia.mediaUrl,
          type: itemMedia.mediaType,
        }
      }

      return null
    })()

    return (
      <div
        ref={scrollRef}
        className={contentClassName}
      >
        {isLoading ? (
          <p className="text-sm text-slate-300">{labels.previewLoading}</p>
        ) : !hasEntered ? (
          <>
            <p className="text-xs text-slate-300">
              {list.visibility === 'private'
                ? labels.previewPrivateHint
                : labels.previewPublicHint}
            </p>

            <section
              className="event-surface-panel mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              {renderPreviewHeroMedia(previewHeroMedia, list.title)}

              <div className="p-4 sm:p-5">
                <h4 className="text-xl font-semibold text-white">
                  {list.introTitle || list.title}
                </h4>

                {(list.introBody || '').trim() && (
                  <p className="mt-4 text-sm text-slate-200">{list.introBody}</p>
                )}

                {!(list.introBody || '').trim() && (
                  <p className="mt-4 text-sm text-slate-200">{labels.previewContinueHint}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onContinue}
                    className="event-accent-button rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black"
                  >
                    {labels.previewContinueAction}
                  </button>
                </div>

                {list.visibility === 'public_password' && isPasswordPromptOpen && (
                  <div className="mt-5 rounded-xl border border-white/20 bg-slate-950/70 p-4">
                    <p className="text-sm text-slate-200">{labels.previewPasswordPrompt}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr),auto] sm:items-end">
                      <label className="grid gap-1 text-sm text-slate-200">
                        <span>{labels.visibilityPasswordLabel}</span>
                        <div className="relative">
                          <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => onPasswordChange(event.target.value)}
                            className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 pr-11 text-white"
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={onTogglePasswordVisibility}
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
                        onClick={onUnlock}
                        disabled={password.trim().length < 6}
                        className="rounded-full border border-emerald-300/50 px-5 py-2 text-sm font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {labels.previewUnlockAction}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <header
              className="event-surface-panel overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              {renderPreviewHeroMedia(previewHeroMedia, list.title)}

              <div className="p-4 sm:p-5">
                <h4 className="text-2xl font-bold text-white">
                  {list.introTitle || list.title}
                </h4>

                {(list.introBody || '').trim() && (
                  <p className="mt-4 text-sm text-slate-200">{list.introBody}</p>
                )}

                {!(list.introBody || '').trim() && (
                  <p className="mt-4 text-sm text-slate-200">{labels.previewContinueHint}</p>
                )}
              </div>
            </header>

            {storiesToRender.length > 0 && (
              <div className="mt-8 border-t border-white/10 pt-5">
                <h5 className="text-lg font-semibold text-white">{labels.storiesTitle}</h5>
                <div className="mt-3 grid gap-3">
                  {storiesToRender.map((story) => (
                    <article
                      key={`preview-story-${story.id}`}
                      className="event-surface-card rounded-xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <h6 className="text-base font-semibold text-white">{story.title}</h6>
                      <p className="mt-2 text-sm text-slate-300">{story.body}</p>
                      {renderStoryMediaPreview(story)}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {wheelEntriesToRender.length > 0 && (
              <div className="mt-8 border-t border-white/10 pt-5">
                <h5 className="text-lg font-semibold text-white">{labels.wheelTitle}</h5>
                <div className="mt-5 grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)] lg:items-start">
                  <div className="mx-auto w-full max-w-[280px]">
                    <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72">
                      <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
                        <div className="h-0 w-0 border-x-[12px] border-b-[18px] border-x-transparent border-b-emerald-300" />
                      </div>

                      <div
                        className="absolute inset-0 rounded-full border-4 border-white/30 shadow-xl transition-transform duration-[3400ms] ease-out"
                        style={{
                          backgroundImage: previewWheelGradient,
                          transform: `rotate(${previewWheelRotation}deg)`,
                        }}
                      >
                        <div className="absolute inset-4 rounded-full border border-white/20" />
                      </div>

                      <div className="absolute left-1/2 top-1/2 z-30 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-slate-950" />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpinPreviewWheel(wheelEntriesToRender)}
                      disabled={isPreviewWheelSpinning}
                      className="event-accent-button mt-5 w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPreviewWheelSpinning
                        ? labels.previewWheelSpinning
                        : labels.previewWheelSpinAction}
                    </button>
                  </div>

                  <div className="event-surface-card rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5">
                    {!selectedPreviewWheelEntry && (
                      <p className="text-sm text-slate-300">{labels.previewWheelIntro}</p>
                    )}

                    {selectedPreviewWheelEntry && (
                      <>
                        <h6 className="text-base font-semibold text-white">
                          {selectedPreviewWheelEntry.question}
                        </h6>

                        {!isPreviewWheelAnswerVisible && (
                          <button
                            type="button"
                            onClick={() => setIsPreviewWheelAnswerVisible(true)}
                            className="mt-4 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white"
                          >
                            {labels.previewWheelRevealAction}
                          </button>
                        )}

                        {isPreviewWheelAnswerVisible && (
                          <div className="mt-4 space-y-3">
                            {selectedPreviewWheelEntry.answerText && (
                              <p className="text-sm text-slate-300">{selectedPreviewWheelEntry.answerText}</p>
                            )}
                            {selectedPreviewWheelEntry.answerAudioUrl && (
                              <audio
                                controls
                                preload="metadata"
                                className="w-full"
                                src={selectedPreviewWheelEntry.answerAudioUrl}
                              />
                            )}
                            {!selectedPreviewWheelEntry.answerText && !selectedPreviewWheelEntry.answerAudioUrl && (
                              <p className="text-sm text-slate-300">{labels.previewWheelNoAnswer}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-3">
              {itemsToRender.length === 0 && (
                <p className="text-sm text-slate-300">{labels.itemsEmpty}</p>
              )}

              {itemsToRender.map((item) => (
                <article
                  key={`preview-${item.id}`}
                  className="event-surface-card rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h5 className="text-base font-semibold text-white">{item.name}</h5>
                      <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                      {renderItemMediaPreview(item)}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="event-accent-link mt-2 inline-block text-sm text-emerald-300 underline"
                        >
                          {labels.previewOpenLinkAction}
                        </a>
                      )}
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                      {itemStatusLabels[item.status]}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="mt-6 grid min-w-0 gap-4 overflow-x-hidden lg:grid-cols-[1.2fr,1fr] lg:gap-6">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{labels.builderTitle}</h2>
        <p className="mt-2 text-sm text-slate-300">{labels.builderSubtitle}</p>
        <p className="mt-2 text-xs text-emerald-200">{labels.trialNotice}</p>

        <form onSubmit={handleCreateList} className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm text-slate-200">
            <span>{labels.listNameLabel}</span>
            <input
              required
              value={title}
              onChange={(entry) => handleTitleChange(entry.target.value)}
              placeholder={labels.listNamePlaceholder}
              className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-200">
            <span>{labels.slugLabel}</span>
            <div className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-sm text-emerald-200">
              {composedCreateUrl}
            </div>
            <span>{labels.urlNameLabel}</span>
            <input
              required
              value={slug}
              onChange={(entry) => handleSlugChange(entry.target.value)}
              placeholder={labels.urlNamePlaceholder}
              className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            />
            <span className="text-xs text-slate-400">{labels.slugHint}</span>
          </label>

          <button
            type="submit"
            disabled={isCreatingList}
            className="mt-2 w-full rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isCreatingList ? labels.creatingList : labels.createListAction}
          </button>
        </form>

        {globalListSuccess && (
          <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
            {globalListSuccess}
          </p>
        )}

        {listError && (
          <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
            {listError}
          </p>
        )}

        <section
          ref={desktopPreviewSectionRef}
          className="mt-8 hidden border-t border-white/10 pt-6 lg:block"
        >
          <header className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">{labels.previewPanelTitle}</h3>
              {desktopPreviewList && (
                <p className="mt-1 text-xs text-slate-300">/{desktopPreviewList.slug}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleScrollDesktopPreviewToHero}
              disabled={!desktopPreviewList}
              className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {labels.previewHeroAction}
            </button>
          </header>

          {!desktopPreviewList ? (
            <p className="mt-4 text-sm text-slate-300">{labels.emptyLists}</p>
          ) : (
            <div
              className="event-canvas mt-4 rounded-2xl border border-white/15 bg-slate-900 shadow-xl"
              data-event-theme={desktopPreviewThemeId}
            >
              {renderPreviewContent({
                list: desktopPreviewList,
                isLoading: isDesktopPreviewLoading,
                hasEntered: isDesktopPreviewEntered,
                isPasswordPromptOpen: isDesktopPreviewPasswordPromptOpen,
                password: desktopPreviewPassword,
                isPasswordVisible: isDesktopPreviewPasswordVisible,
                itemsToRender: items,
                storiesToRender: stories,
                wheelEntriesToRender: wheelEntries,
                scrollRef: desktopPreviewScrollRef,
                contentClassName: 'px-4 py-4 sm:px-6 sm:py-5',
                onContinue: handleContinueDesktopPreview,
                onUnlock: handleUnlockDesktopPreview,
                onPasswordChange: setDesktopPreviewPassword,
                onTogglePasswordVisibility: () => {
                  setIsDesktopPreviewPasswordVisible((current) => !current)
                },
              })}
            </div>
          )}
        </section>
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{labels.myListsTitle}</h2>
        <p
          className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
            billingRuntimeMode === 'stripe'
              ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
              : 'border-amber-300/40 bg-amber-300/10 text-amber-100'
          }`}
        >
          <strong>
            {billingRuntimeMode === 'stripe'
              ? labels.billingModeStripeTitle
              : labels.billingModeManualTitle}
          </strong>{' '}
          {billingRuntimeMode === 'stripe'
            ? labels.billingModeStripeBody
            : labels.billingModeManualBody}
        </p>

        <div className="mt-4 grid gap-3">
          {isListsLoading && (
            <p className="text-sm text-slate-300">{labels.loadingAuth}</p>
          )}

          {!isListsLoading && lists.length === 0 && (
            <p className="text-sm text-slate-300">{labels.emptyLists}</p>
          )}

          {lists.map((list) => {
            const isShowcased = showcasedListIdSet.has(list.id)
            const isShowcaseActionLoading = isShowcaseLoading || showcaseUpdatingListId === list.id

            return (
              <article
                key={list.id}
                className={`min-w-0 rounded-xl border p-4 text-sm ${
                  selectedListId === list.id
                    ? 'border-emerald-300/40 bg-emerald-300/10 text-slate-100'
                    : 'border-white/10 bg-slate-950/50 text-slate-200'
                }`}
              >
                <h3 className="text-base font-semibold text-white">{list.title}</h3>
                <p className="mt-1 break-all text-xs text-slate-400">{getPublicListUrl(list.slug)} ({locale})</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/20 px-2 py-1">
                    {labels.eventTag}: {eventTypeLabels[getDisplayEventType(list.eventType, list.templateId)]}
                  </span>
                  <span className="rounded-full border border-white/20 px-2 py-1">
                    {labels.visibilityTag}: {visibilityLabels[list.visibility]}
                  </span>
                  {hasComplimentaryAccess && (
                    <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-amber-100">
                      {labels.complimentaryAccessBadge}
                    </span>
                  )}
                  {isShowcased && (
                    <span className="rounded-full border border-fuchsia-300/40 bg-fuchsia-300/10 px-2 py-1 text-fuchsia-100">
                      {labels.showcaseBadge}
                    </span>
                  )}
                  {list.billingPlanId && (
                    <span className="rounded-full border border-white/20 px-2 py-1">
                      {labels.currentPlanTag}: {
                        list.billingPlanId === 'base'
                          ? labels.planBaseName
                          : (
                            list.billingPlanId === 'premium'
                              ? labels.planPremiumName
                              : labels.planPlatinumName
                          )
                      }
                    </span>
                  )}
                </div>

                <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                  <DashboardActionButton
                    onClick={() => handleOpenPreview(list)}
                    icon={<Eye size={14} />}
                    className="w-full sm:w-auto"
                  >
                    {labels.previewAction}
                  </DashboardActionButton>

                  {list.visibility !== 'private' && (
                    <>
                      <DashboardActionButton
                        onClick={() => handleCopyPublicLink(list)}
                        icon={<Copy size={14} />}
                        className="w-full sm:w-auto"
                      >
                        {copiedListId === list.id ? labels.linkCopied : labels.copyLinkAction}
                      </DashboardActionButton>
                      <DashboardActionButton
                        onClick={() => handleToggleQr(list)}
                        className="w-full sm:w-auto"
                      >
                        {qrTargetListId === list.id ? labels.hideQrAction : labels.showQrAction}
                      </DashboardActionButton>
                    </>
                  )}

                  {hasComplimentaryAccess && (
                    <DashboardActionButton
                      onClick={() => handleToggleShowcase(list)}
                      icon={<Sparkles size={14} />}
                      disabled={isShowcaseActionLoading}
                      variant={isShowcased ? 'accent' : 'secondary'}
                      className="w-full sm:w-auto"
                    >
                      {isShowcased
                        ? labels.showcaseRemoveAction
                        : labels.showcaseAddAction}
                    </DashboardActionButton>
                  )}
                </div>

                {qrTargetListId === list.id && (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    {isQrLoading && (
                      <p className="text-xs text-slate-300">{labels.qrLoading}</p>
                    )}
                    {qrError && (
                      <p className="text-xs text-red-200">{qrError}</p>
                    )}
                    {qrDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt={`QR ${list.slug}`}
                        className="h-40 w-40 rounded-lg bg-white p-2"
                      />
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <label className="mt-3 grid gap-1 text-sm text-slate-200">
            <span>{labels.listSelectorLabel}</span>
            <select
              value={selectedListId}
              onChange={(entry) => setSelectedListId(entry.target.value)}
              className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            >
              {lists.length === 0 && <option value="">-</option>}
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <h3 className="text-lg font-semibold text-white">{labels.listSettingsTitle}</h3>
            <p className="mt-2 text-sm text-slate-300">{labels.listSettingsSubtitle}</p>

            <form onSubmit={handleSaveListSettings} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm text-slate-200">
                  <span>{labels.eventTypeLabel}</span>
                  <select
                    value={eventType}
                    disabled={!selectedList || isSavingListSettings || isSelectedListExpired}
                    onChange={(entry) => setEventType(entry.target.value as EventType)}
                    className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {EVENT_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {eventTypeLabels[item]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm text-slate-200">
                  <span>{labels.templateLabel}</span>
                  <select
                    value={templateId}
                    disabled={!selectedList || isSavingListSettings || isSelectedListExpired}
                    onChange={(entry) => setTemplateId(entry.target.value as TemplateId)}
                    className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {availableTemplateIds.map((item) => (
                      <option key={item} value={item}>
                        {templateLabels[item]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-1 text-sm text-slate-200">
                <span>{labels.visibilityLabel}</span>
                <select
                  value={visibility}
                  disabled={!selectedList || isSavingListSettings || isSelectedListExpired}
                  onChange={(entry) => setVisibility(entry.target.value as ListVisibility)}
                  className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {VISIBILITY_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {visibilityLabels[item]}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">
                  {visibility === 'public'
                    ? labels.visibilityHelpPublic
                    : (
                      visibility === 'public_password'
                        ? labels.visibilityHelpPublicPassword
                        : labels.visibilityHelpPrivate
                    )}
                </span>
              </label>

              {visibility === 'public_password' && (
                <label className="grid gap-1 text-sm text-slate-200">
                  <span>{labels.visibilityPasswordLabel}</span>
                  <div className="relative">
                    <input
                      required={isSwitchingToPasswordProtected}
                      minLength={6}
                      type={isVisibilityPasswordVisible ? 'text' : 'password'}
                      value={visibilityPassword}
                      disabled={!selectedList || isSavingListSettings || isSelectedListExpired}
                      onChange={(entry) => setVisibilityPassword(entry.target.value)}
                      placeholder={labels.visibilityPasswordPlaceholder}
                      className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 pr-11 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setIsVisibilityPasswordVisible((current) => !current)}
                      aria-label={isVisibilityPasswordVisible ? 'Hide password' : 'Show password'}
                      disabled={!selectedList || isSavingListSettings || isSelectedListExpired}
                      className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isVisibilityPasswordVisible
                        ? <EyeOff size={16} />
                        : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">{labels.visibilityPasswordHint}</span>
                  {isVisibilityPasswordMissing && (
                    <span className="text-xs text-red-200">{labels.errorVisibilityPasswordRequired}</span>
                  )}
                </label>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={!selectedList || isSavingListSettings || isSelectedListExpired || isVisibilityPasswordMissing}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingListSettings
                    ? labels.listSettingsSaving
                    : labels.listSettingsSaveAction}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteListConfirmOpen(true)}
                  disabled={!selectedList || isDeletingList}
                  className="rounded-full border border-red-300/40 px-5 py-2 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingList ? labels.listDeleting : labels.deleteListAction}
                </button>
              </div>

              {isListSettingsSuccessVisible && (
                <p className="rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
                  {listSuccess}
                </p>
              )}
            </form>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <h3 className="text-lg font-semibold text-white">{labels.billingPlanTitle}</h3>
            <p className="mt-2 text-sm text-slate-300">{labels.billingPlanSubtitle}</p>

            {isAccountEntitlementLoading ? (
              <p className="mt-4 text-sm text-slate-300">{labels.loadingAuth}</p>
            ) : !selectedList ? (
              <p className="mt-4 text-sm text-slate-300">{labels.emptyLists}</p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/20 px-3 py-1 text-slate-200">
                    {labels.billingUsageTag}: {selectedListUsageDisplay}
                  </span>
                  {hasComplimentaryAccess ? (
                    <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-amber-100">
                      {labels.complimentaryAccessBadge}
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/20 px-3 py-1 text-slate-200">
                      {labels.billingRecommendedPlanTag}: {
                        selectedListRequiredPlanId === 'base'
                          ? labels.planBaseName
                          : (
                            selectedListRequiredPlanId === 'premium'
                              ? labels.planPremiumName
                              : (
                                selectedListRequiredPlanId === 'platinum'
                                  ? labels.planPlatinumName
                                  : labels.billingCustomPlanRequired
                              )
                          )
                      }
                    </span>
                  )}
                  {!hasComplimentaryAccess && selectedList.billingPlanId && (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-emerald-100">
                      {labels.currentPlanTag}: {
                        selectedList.billingPlanId === 'base'
                          ? labels.planBaseName
                          : (
                            selectedList.billingPlanId === 'premium'
                              ? labels.planPremiumName
                              : labels.planPlatinumName
                          )
                      }
                    </span>
                  )}
                </div>

                {selectedListMediaUsage.containsVideo && (
                  <p className="mt-3 text-xs text-amber-100">{labels.billingVideoNotice}</p>
                )}

                {!hasComplimentaryAccess && selectedListMediaUsageIssue === 'media_limit_exceeded' && (
                  <p className="mt-3 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                    {labels.errorMediaUsageLimitExceeded}
                  </p>
                )}

                {!hasComplimentaryAccess && selectedListMediaUsageIssue === 'video_duration_exceeded' && (
                  <p className="mt-3 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                    {labels.errorMediaVideoTooLong}
                  </p>
                )}

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-white">{labels.referralTitle}</h4>
                        {!hasComplimentaryAccess && (
                          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
                            {referralActiveCountLabel}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{labels.referralSubtitle}</p>
                    </div>

                    {!hasComplimentaryAccess && (
                      <DashboardActionButton
                        onClick={handleGenerateReferralCode}
                        disabled={
                          isReferralLoading
                          || isGeneratingReferralCode
                          || !referralSummary?.canGenerate
                        }
                        icon={<Sparkles size={14} />}
                      >
                        {isGeneratingReferralCode
                          ? labels.referralGenerating
                          : labels.referralGenerateAction}
                      </DashboardActionButton>
                    )}
                  </div>

                  {!hasComplimentaryAccess && (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-white/20 px-3 py-1 text-slate-200">
                        {referralRewardCreditsLabel}
                      </span>
                      <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-emerald-100">
                        {referralNextRewardLabel}
                      </span>
                    </div>
                  )}

                  {referralSuccess && (
                    <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
                      {referralSuccess}
                    </p>
                  )}

                  {referralError && (
                    <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                      {referralError}
                    </p>
                  )}

                  {hasComplimentaryAccess ? (
                    <p className="mt-4 text-sm text-slate-300">{labels.referralComplimentaryHint}</p>
                  ) : (
                    <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr),minmax(0,1.15fr)]">
                      <section className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                        <div className="flex h-full flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr),minmax(0,20rem)] lg:gap-6">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-emerald-200" />
                              <h5 className="text-sm font-semibold text-white">{labels.referralCodeInputLabel}</h5>
                            </div>

                            {appliedReferralLabel && (
                              <p className="mt-3 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-200">
                                {appliedReferralLabel}
                              </p>
                            )}

                            {!appliedReferralCode && (referralSummary?.nextRewardDiscountPercent ?? 0) > 0 && (
                              <p className="mt-3 text-xs text-slate-300">
                                {referralNextRewardLabel}
                              </p>
                            )}

                            {appliedReferralCode && (referralSummary?.pendingRewardCredits ?? 0) > 0 && (
                              <p className="mt-3 text-xs text-slate-300">
                                {labels.referralRewardSavedHint}
                              </p>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-col justify-end gap-2 lg:items-end">
                            <input
                              value={referralCodeInput}
                              onChange={(event) => {
                                const nextValue = event.target.value
                                setReferralCodeInput(nextValue)

                                if (
                                  appliedReferralCode
                                  && nextValue.trim().toUpperCase() !== appliedReferralCode.code
                                ) {
                                  setAppliedReferralCode(null)
                                }
                              }}
                              placeholder={labels.referralCodeInputPlaceholder}
                              disabled={isApplyingReferralCode || isGeneratingReferralCode}
                              className="min-w-0 w-full rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-sm text-white lg:max-w-[20rem]"
                            />
                            <div className="flex w-full flex-wrap gap-2 lg:justify-end">
                              <DashboardActionButton
                                onClick={handleApplyReferralCode}
                                disabled={isApplyingReferralCode || referralCodeInput.trim().length === 0}
                                icon={<Sparkles size={14} />}
                                className="w-full sm:w-auto"
                              >
                                {isApplyingReferralCode
                                  ? labels.referralApplying
                                  : labels.referralApplyAction}
                              </DashboardActionButton>
                              {appliedReferralCode && (
                                <DashboardActionButton
                                  onClick={handleClearReferralCode}
                                  disabled={isApplyingReferralCode}
                                  icon={<RotateCcw size={14} />}
                                  className="w-full sm:w-auto"
                                >
                                  {labels.referralClearAction}
                                </DashboardActionButton>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                        <h5 className="text-sm font-semibold text-white">{labels.referralTitle}</h5>

                        {isReferralLoading ? (
                          <p className="mt-3 text-sm text-slate-300">{labels.loadingAuth}</p>
                        ) : referralSummary ? (
                          <>
                            {!referralSummary.isEligible && (
                              <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                                {labels.referralLockedHint}
                              </p>
                            )}

                            <p className="mt-3 text-xs text-slate-400">{labels.referralRewardCreditsHint}</p>

                            {referralSummary.codes.length === 0 ? (
                              <p className="mt-4 text-sm text-slate-300">{labels.referralEmpty}</p>
                            ) : (
                              <div className="mt-4 grid gap-3">
                                {referralSummary.codes.map((codeEntry) => (
                                  <article
                                    key={codeEntry.id}
                                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                                  >
                                    <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr),auto] sm:gap-4">
                                      <div className="min-w-0">
                                        <p className="font-mono text-sm font-semibold tracking-[0.18em] text-white">
                                          {codeEntry.code}
                                        </p>
                                        <p className="mt-2 text-xs text-slate-300">
                                          {referralStatusLabels[codeEntry.status]}
                                        </p>
                                      </div>

                                      <DashboardActionButton
                                        onClick={() => handleCopyReferralCode(codeEntry.id, codeEntry.code)}
                                        disabled={false}
                                        icon={<Copy size={14} />}
                                        className="w-full sm:w-auto sm:self-end"
                                      >
                                        {copiedReferralCodeId === codeEntry.id
                                          ? labels.referralCopied
                                          : labels.referralCopyAction}
                                      </DashboardActionButton>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="mt-3 text-sm text-slate-300">{labels.referralLoadFailed}</p>
                        )}
                      </section>
                    </div>
                  )}
                </div>

                {hasComplimentaryAccess ? (
                  <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-white">{labels.complimentaryAccessTitle}</h4>
                      <span className="rounded-full border border-amber-300/40 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                        {labels.complimentaryAccessBadge}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-100">{labels.complimentaryAccessSubtitle}</p>
                    <p className="mt-3 text-xs text-slate-200">{labels.complimentaryAccessNotice}</p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {billingPlans.map((plan) => {
                      const isCurrentPlan = selectedList.billingPlanId === plan.id && selectedList.accessStatus === 'active'
                      const isRecommendedPlan = selectedListRequiredPlanId === plan.id
                      const isEligiblePlan = isBillingPlanEligible(plan.id, selectedListMediaUsage)
                      const isPlanActionLoading = activatingPlanTarget === `${selectedList.id}:${plan.id}`

                      return (
                        <article
                          key={plan.id}
                          className={`rounded-2xl border p-4 ${
                            isRecommendedPlan
                              ? 'border-emerald-300/40 bg-emerald-300/10'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="flex h-full flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr),minmax(11rem,auto)] lg:gap-6">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-semibold text-white">{plan.name}</h4>
                                {isRecommendedPlan && (
                                  <span className="rounded-full border border-emerald-300/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                                    {labels.billingRecommendedBadge}
                                  </span>
                                )}
                                {isCurrentPlan && (
                                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
                                    {labels.billingCurrentPlanBadge}
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-lg font-bold text-white">{plan.price}</p>

                              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                                {plan.features.map((feature) => (
                                  <li key={`${plan.id}-${feature}`}>- {feature}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex min-w-0 flex-col justify-end gap-3 lg:items-end">
                              <button
                                type="button"
                                onClick={() => handleActivatePass(selectedList.id, plan.id)}
                                disabled={
                                  isSelectedListExpired
                                  || isPlanActionLoading
                                  || Boolean(selectedListMediaUsageIssue)
                                  || !isEligiblePlan
                                }
                                className="w-full rounded-full border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto lg:min-w-[11rem]"
                              >
                                {isPlanActionLoading
                                  ? labels.activatingPass
                                  : (
                                    isCurrentPlan
                                      ? labels.extendPlanAction
                                      : labels.activatePlanAction
                                  )}
                              </button>

                              {!isEligiblePlan && (
                                <p className="text-xs text-amber-100 lg:max-w-[14rem] lg:text-right">
                                  {labels.billingPlanTooSmallHint}
                                </p>
                              )}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}

                {visibleBillingFeedback && (
                  <p
                    className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                      visibleBillingFeedback.type === 'success'
                        ? 'border border-emerald-300/40 bg-emerald-300/10 text-emerald-200'
                        : 'border border-red-300/40 bg-red-300/10 text-red-100'
                    }`}
                  >
                    {visibleBillingFeedback.message}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <h3 className="text-lg font-semibold text-white">{labels.heroEditorTitle}</h3>
            <p className="mt-2 text-sm text-slate-300">{labels.heroEditorSubtitle}</p>

            <form onSubmit={handleSaveIntro} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm text-slate-200">
                <span>{labels.heroTitleLabel}</span>
                <input
                  value={introTitle}
                  disabled={!selectedList || isSelectedListExpired || isSavingIntro || isRemovingIntroMedia}
                  onChange={(entry) => setIntroTitle(entry.target.value)}
                  className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
                />
              </label>

              <label className="grid gap-1 text-sm text-slate-200">
                <span>{labels.heroBodyLabel}</span>
                <textarea
                  value={introBody}
                  disabled={!selectedList || isSelectedListExpired || isSavingIntro || isRemovingIntroMedia}
                  onChange={(entry) => setIntroBody(entry.target.value)}
                  placeholder={labels.heroBodyPlaceholder}
                  rows={3}
                  className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
                />
              </label>

              <label className="grid gap-1 text-sm text-slate-200">
                <span>{labels.heroMediaLabel}</span>
                <input
                  ref={introMediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  disabled={!selectedList || isSelectedListExpired || isSavingIntro || isRemovingIntroMedia || isUploadingIntroMedia}
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null
                    setIntroMediaFile(nextFile)
                  }}
                  className="sr-only"
                />
                <div className="flex min-h-[42px] items-center gap-3 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => introMediaInputRef.current?.click()}
                    disabled={!selectedList || isSelectedListExpired || isSavingIntro || isRemovingIntroMedia || isUploadingIntroMedia}
                    className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {labels.fileChooseAction}
                  </button>
                  <span className="truncate text-sm text-slate-200">
                    {introMediaFile?.name ?? labels.noFileSelected}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{labels.heroMediaHint}</span>
                {introMediaFile && (
                  <span className="text-xs text-emerald-200">
                    {labels.mediaSelected}: {introMediaFile.name}
                  </span>
                )}
              </label>

              {selectedList?.introMediaUrl && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-slate-300">{labels.heroCurrentMediaLabel}</p>
                  {selectedList.introMediaType?.startsWith('video/') ? (
                    <video
                      src={selectedList.introMediaUrl}
                      controls
                      preload="metadata"
                      className="mt-2 h-28 w-full max-w-xs rounded-lg border border-white/20 object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedList.introMediaUrl}
                      alt={selectedList.title}
                      className="mt-2 h-28 w-full max-w-xs rounded-lg border border-white/20 object-cover"
                      loading="lazy"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveIntroMedia}
                    disabled={isSelectedListExpired || isSavingIntro || isRemovingIntroMedia}
                    className="mt-3 rounded-full border border-red-300/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRemovingIntroMedia
                      ? labels.heroRemovingMedia
                      : labels.heroRemoveMediaAction}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedList || isSelectedListExpired || isSavingIntro || isRemovingIntroMedia}
                className="w-full rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSavingIntro || isUploadingIntroMedia
                  ? labels.heroSaving
                  : labels.heroSaveAction}
              </button>
            </form>

            {introSuccess && (
              <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
                {introSuccess}
              </p>
            )}

            {introError && (
              <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                {introError}
              </p>
            )}
          </div>

          <h3 className="mt-8 text-lg font-semibold text-white">{labels.itemsTitle}</h3>

          <form ref={itemFormRef} onSubmit={handleAddItem} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.itemNameLabel}</span>
              <input
                required
                disabled={isItemActionsDisabled}
                value={itemName}
                onChange={(entry) => setItemName(entry.target.value)}
                className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.itemDescriptionLabel}</span>
              <textarea
                required
                disabled={isItemActionsDisabled}
                value={itemDescription}
                onChange={(entry) => setItemDescription(entry.target.value)}
                rows={3}
                className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.itemLinkLabel}</span>
              <input
                type="url"
                disabled={isItemActionsDisabled}
                value={itemLink}
                onChange={(entry) => setItemLink(entry.target.value)}
                placeholder={labels.itemLinkPlaceholder}
                className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.itemMediaLabel}</span>
                <input
                  ref={itemMediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  disabled={isItemActionsDisabled || isUploadingMedia}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null
                  setItemMediaFile(nextFile)
                }}
                className="sr-only"
              />
              <div className="flex min-h-[42px] items-center gap-3 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2">
                <button
                  type="button"
                  onClick={() => itemMediaInputRef.current?.click()}
                  disabled={isItemActionsDisabled || isUploadingMedia}
                  className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {labels.fileChooseAction}
                </button>
                <span className="truncate text-sm text-slate-200">
                  {itemMediaFile?.name ?? labels.noFileSelected}
                </span>
              </div>
              <span className="text-xs text-slate-400">{labels.itemMediaHint}</span>
              {itemMediaFile && (
                <span className="text-xs text-emerald-200">
                  {labels.mediaSelected}: {itemMediaFile.name}
                </span>
              )}
            </label>

            {editingItem?.mediaUrl && !itemMediaFile && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-300">{labels.currentMediaLabel}</p>
                {renderItemMediaPreview(editingItem)}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isItemFormBusy || isItemActionsDisabled}
                className="w-full rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isUploadingMedia
                  ? labels.uploadingMedia
                  : (isItemFormBusy
                      ? labels.addingItem
                      : (editingItem ? labels.saveItemChangesAction : labels.addItemAction))}
              </button>

              {editingItem && (
                <button
                  type="button"
                  onClick={resetItemForm}
                  disabled={isItemFormBusy}
                  className="w-full rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {labels.cancelItemEditAction}
                </button>
              )}
            </div>
          </form>

          {isSelectedListExpired && (
            <p className="mt-3 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              {labels.accessExpiredNotice}
            </p>
          )}

          {itemSuccess && (
            <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
              {itemSuccess}
            </p>
          )}

          {itemError && (
            <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
              {itemError}
            </p>
          )}

          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <GripVertical size={14} className="shrink-0" />
            <span>{labels.dragToReorderHint}</span>
          </p>

          <div className="mt-4 grid gap-3">
            {isItemsLoading && (
              <p className="text-sm text-slate-300">{labels.loadingAuth}</p>
            )}

            {!isItemsLoading && items.length === 0 && (
              <p className="text-sm text-slate-300">{labels.itemsEmpty}</p>
            )}

            {items.map((item) => (
              <article
                key={item.id}
                draggable={!isItemActionsDisabled && !isItemsReordering}
                onDragStart={(event) => handleEntryDragStart(event, 'items', item.id)}
                onDragOver={(event) => handleEntryDragOver(event, 'items', item.id)}
                onDragEnd={handleEntryDragEnd}
                onDrop={(event) => handleEntryDrop(event, 'items', item.id)}
                className={`rounded-xl border bg-slate-950/60 p-4 text-sm text-slate-200 transition ${
                  dragOverEntryId === item.id
                    ? 'border-emerald-300/60 ring-1 ring-emerald-300/40'
                    : 'border-white/10'
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto] lg:items-start">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                    {renderItemMediaPreview(item)}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-emerald-300 underline"
                      >
                        {labels.previewOpenLinkAction}
                      </a>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {itemStatusLabels[item.status]}
                      {item.reservedByName ? ` · ${item.reservedByName}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-[17rem] lg:justify-end">
                    <DashboardActionButton
                      onClick={() => handleEditItem(item)}
                      disabled={isItemActionsDisabled || isItemsReordering}
                      icon={<PencilLine size={14} />}
                    >
                      {labels.editItemAction}
                    </DashboardActionButton>
                    {item.status === 'reserved' && (
                      <DashboardActionButton
                        onClick={() => handleUpdateItemStatus(item.id, 'available')}
                        disabled={statusUpdatingItemId === item.id || isItemActionsDisabled}
                        icon={<RotateCcw size={14} />}
                      >
                        {statusUpdatingItemId === item.id
                          ? labels.updatingStatus
                          : labels.releaseReservationAction}
                      </DashboardActionButton>
                    )}

                    {item.status !== 'gifted' && (
                      <DashboardActionButton
                        onClick={() => handleUpdateItemStatus(item.id, 'gifted')}
                        disabled={statusUpdatingItemId === item.id || isItemActionsDisabled}
                        variant="accent"
                        icon={<Gift size={14} />}
                      >
                        {statusUpdatingItemId === item.id
                          ? labels.updatingStatus
                          : labels.markGiftedAction}
                      </DashboardActionButton>
                    )}

                    {item.status === 'gifted' && (
                      <DashboardActionButton
                        onClick={() => handleUpdateItemStatus(item.id, 'available')}
                        disabled={statusUpdatingItemId === item.id || isItemActionsDisabled}
                        icon={<RotateCcw size={14} />}
                      >
                        {statusUpdatingItemId === item.id
                          ? labels.updatingStatus
                          : labels.markAvailableAction}
                      </DashboardActionButton>
                    )}

                    <DashboardActionButton
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={
                        deletingItemId === item.id ||
                        statusUpdatingItemId === item.id ||
                        isItemActionsDisabled
                      }
                      variant="danger"
                      icon={<Trash2 size={14} />}
                    >
                      {deletingItemId === item.id
                        ? labels.deletingItem
                        : labels.deleteItemAction}
                    </DashboardActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white">{labels.storiesTitle}</h3>
          <p className="mt-2 text-sm text-slate-300">{labels.storiesSubtitle}</p>

          <form ref={storyFormRef} onSubmit={handleAddStory} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.storyTitleLabel}</span>
              <input
                required
                disabled={isItemActionsDisabled}
                value={storyTitle}
                onChange={(entry) => setStoryTitle(entry.target.value)}
                className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.storyBodyLabel}</span>
              <textarea
                required
                disabled={isItemActionsDisabled}
                value={storyBody}
                onChange={(entry) => setStoryBody(entry.target.value)}
                rows={4}
                className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.storyMediaLabel}</span>
              <input
                ref={storyMediaInputRef}
                type="file"
                accept="image/*,video/*"
                disabled={isItemActionsDisabled || isUploadingStoryMedia}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null
                  setStoryMediaFile(nextFile)
                }}
                className="sr-only"
              />
              <div className="flex min-h-[42px] items-center gap-3 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2">
                <button
                  type="button"
                  onClick={() => storyMediaInputRef.current?.click()}
                  disabled={isItemActionsDisabled || isUploadingStoryMedia}
                  className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {labels.fileChooseAction}
                </button>
                <span className="truncate text-sm text-slate-200">
                  {storyMediaFile?.name ?? labels.noFileSelected}
                </span>
              </div>
              <span className="text-xs text-slate-400">{labels.storyMediaHint}</span>
              {storyMediaFile && (
                <span className="text-xs text-emerald-200">
                  {labels.mediaSelected}: {storyMediaFile.name}
                </span>
              )}
            </label>

            {editingStory?.mediaUrl && !storyMediaFile && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-300">{labels.currentMediaLabel}</p>
                {renderStoryMediaPreview(editingStory)}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isStoryFormBusy || isItemActionsDisabled}
                className="w-full rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isUploadingStoryMedia
                  ? labels.uploadingMedia
                  : (isStoryFormBusy
                      ? labels.addingStory
                      : (editingStory ? labels.saveStoryChangesAction : labels.addStoryAction))}
              </button>

              {editingStory && (
                <button
                  type="button"
                  onClick={resetStoryForm}
                  disabled={isStoryFormBusy}
                  className="w-full rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {labels.cancelStoryEditAction}
                </button>
              )}
            </div>
          </form>

          {storySuccess && (
            <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
              {storySuccess}
            </p>
          )}

          {storyError && (
            <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
              {storyError}
            </p>
          )}

          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <GripVertical size={14} className="shrink-0" />
            <span>{labels.dragToReorderHint}</span>
          </p>

          <div className="mt-4 grid gap-3">
            {isStoriesLoading && (
              <p className="text-sm text-slate-300">{labels.loadingAuth}</p>
            )}

            {!isStoriesLoading && stories.length === 0 && (
              <p className="text-sm text-slate-300">{labels.storiesEmpty}</p>
            )}

            {stories.map((story) => (
              <article
                key={story.id}
                draggable={!isItemActionsDisabled && !isStoriesReordering}
                onDragStart={(event) => handleEntryDragStart(event, 'stories', story.id)}
                onDragOver={(event) => handleEntryDragOver(event, 'stories', story.id)}
                onDragEnd={handleEntryDragEnd}
                onDrop={(event) => handleEntryDrop(event, 'stories', story.id)}
                className={`rounded-xl border bg-slate-950/60 p-4 text-sm text-slate-200 transition ${
                  dragOverEntryId === story.id
                    ? 'border-emerald-300/60 ring-1 ring-emerald-300/40'
                    : 'border-white/10'
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto] lg:items-start">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white">{story.title}</h4>
                    <p className="mt-1 text-xs text-slate-300">{story.body}</p>
                    {renderStoryMediaPreview(story)}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-[17rem] lg:justify-end">
                    <DashboardActionButton
                      onClick={() => handleEditStory(story)}
                      disabled={isItemActionsDisabled || isStoriesReordering}
                      icon={<PencilLine size={14} />}
                    >
                      {labels.editStoryAction}
                    </DashboardActionButton>
                    <DashboardActionButton
                      onClick={() => handleDeleteStory(story.id)}
                      disabled={deletingStoryId === story.id || isItemActionsDisabled}
                      variant="danger"
                      icon={<Trash2 size={14} />}
                    >
                      {deletingStoryId === story.id
                        ? labels.deletingStory
                        : labels.deleteStoryAction}
                    </DashboardActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white">{labels.wheelTitle}</h3>
          <p className="mt-2 text-sm text-slate-300">{labels.wheelSubtitle}</p>
          <p className="mt-3 text-xs text-slate-400">
            {labels.wheelLimitHint.replace('{count}', String(wheelEntries.length)).replace('{max}', String(MAX_WHEEL_ENTRIES))}
          </p>

          <form ref={wheelFormRef} onSubmit={handleAddWheelEntry} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.wheelQuestionLabel}</span>
              <input
                required
                disabled={isItemActionsDisabled || hasReachedWheelEntryLimit}
                value={wheelQuestion}
                onChange={(entry) => setWheelQuestion(entry.target.value)}
                className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.wheelAnswerTextLabel}</span>
              <textarea
                required
                disabled={isItemActionsDisabled || hasReachedWheelEntryLimit}
                value={wheelAnswerText}
                onChange={(entry) => setWheelAnswerText(entry.target.value)}
                rows={3}
                className="w-full min-w-0 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isWheelFormBusy || isItemActionsDisabled || hasReachedWheelEntryLimit}
                className="w-full rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isWheelFormBusy
                  ? labels.addingWheelEntry
                  : (editingWheelEntry ? labels.saveWheelChangesAction : labels.addWheelEntryAction)}
              </button>

              {editingWheelEntry && (
                <button
                  type="button"
                  onClick={resetWheelForm}
                  disabled={isWheelFormBusy}
                  className="w-full rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {labels.cancelWheelEditAction}
                </button>
              )}
            </div>
          </form>

          {wheelSuccess && (
            <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
              {wheelSuccess}
            </p>
          )}

          {wheelError && (
            <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
              {wheelError}
            </p>
          )}

          <div className="mt-4 grid gap-3">
            {isWheelLoading && (
              <p className="text-sm text-slate-300">{labels.loadingAuth}</p>
            )}

            {!isWheelLoading && wheelEntries.length === 0 && (
              <p className="text-sm text-slate-300">{labels.wheelEmpty}</p>
            )}

            {wheelEntries.map((entry) => (
              <article
                key={entry.id}
                className={`rounded-xl border bg-slate-950/60 p-4 text-sm text-slate-200 transition ${
                  dragOverEntryId === entry.id
                    ? 'border-emerald-300/60 ring-1 ring-emerald-300/40'
                    : 'border-white/10'
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto] lg:items-start">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white">{entry.question}</h4>
                    <p className="mt-1 text-xs text-slate-300">{entry.answerText}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-[17rem] lg:justify-end">
                    <DashboardActionButton
                      onClick={() => handleEditWheelEntry(entry)}
                      disabled={isItemActionsDisabled}
                      icon={<PencilLine size={14} />}
                    >
                      {labels.editWheelEntryAction}
                    </DashboardActionButton>
                    <DashboardActionButton
                      onClick={() => handleDeleteWheelEntry(entry.id)}
                      disabled={deletingWheelEntryId === entry.id || isItemActionsDisabled}
                      variant="danger"
                      icon={<Trash2 size={14} />}
                    >
                      {deletingWheelEntryId === entry.id
                        ? labels.deletingWheelEntry
                        : labels.deleteWheelEntryAction}
                    </DashboardActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {isDeleteListConfirmOpen && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={labels.deleteListCancelAction}
            onClick={() => {
              if (isDeletingList) {
                return
              }
              setIsDeleteListConfirmOpen(false)
            }}
            className="absolute inset-0 bg-slate-950/85"
          />

          <section className="relative z-10 w-full max-w-md rounded-2xl border border-red-300/30 bg-slate-950 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{labels.deleteListModalTitle}</h3>
            <p className="mt-3 text-sm text-slate-300">{labels.deleteListModalBody}</p>
            <p className="mt-2 text-xs text-red-200">{selectedList.title}</p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteListConfirmOpen(false)}
                disabled={isDeletingList}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {labels.deleteListCancelAction}
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                disabled={isDeletingList}
                className="rounded-full border border-red-300/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingList ? labels.listDeleting : labels.deleteListConfirmAction}
              </button>
            </div>
          </section>
        </div>
      )}

      {mobilePreviewList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:hidden">
          <button
            type="button"
            aria-label={labels.closePreviewAction}
            onClick={handleClosePreview}
            className="absolute inset-0 bg-slate-950/85"
          />

          <section
            className="event-canvas relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl"
            data-event-theme={mobilePreviewThemeId}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <h3 className="text-base font-semibold text-white">{labels.previewPanelTitle}</h3>
                <p className="mt-1 text-xs text-slate-300">/{mobilePreviewList.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScrollMobilePreviewToHero}
                  className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {labels.previewHeroAction}
                </button>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {labels.closePreviewAction}
                </button>
              </div>
            </header>

            {renderPreviewContent({
              list: mobilePreviewList,
              isLoading: isMobilePreviewLoading,
              hasEntered: isMobilePreviewEntered,
              isPasswordPromptOpen: isMobilePreviewPasswordPromptOpen,
              password: mobilePreviewPassword,
              isPasswordVisible: isMobilePreviewPasswordVisible,
              itemsToRender: mobilePreviewItems,
              storiesToRender: mobilePreviewStories,
              wheelEntriesToRender: mobilePreviewWheelEntries,
              scrollRef: mobilePreviewScrollRef,
              contentClassName: 'flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5',
              onContinue: handleContinueMobilePreview,
              onUnlock: handleUnlockMobilePreview,
              onPasswordChange: setMobilePreviewPassword,
              onTogglePasswordVisibility: () => {
                setIsMobilePreviewPasswordVisible((current) => !current)
              },
            })}
          </section>
        </div>
      )}
    </div>
  )
}
