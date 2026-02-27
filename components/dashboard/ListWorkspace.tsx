'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
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
import { getRemainingDays, ListAccessStatus } from '@/lib/lists/access'
import {
  InvalidSlugError,
  ReservedSlugError,
  SlugTakenError,
  createGiftItem,
  createGiftList,
  deleteGiftItem,
  setGiftItemStatus,
  subscribeToListItems,
  subscribeToUserLists,
} from '@/lib/lists/client'
import {
  deleteItemMediaByPath,
  MediaValidationError,
  uploadItemMedia,
} from '@/lib/lists/media'
import { sanitizeSlug } from '@/lib/lists/slug'
import {
  EVENT_TYPES,
  EventType,
  GiftList,
  GiftListItem,
  ListVisibility,
  TEMPLATE_IDS,
  TemplateId,
  VISIBILITY_OPTIONS,
} from '@/lib/lists/types'

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
  editorial: labels.templateEditorial,
})

const eventLabelMap = (
  labels: Dictionary['events']
): Record<EventType, string> => ({
  wedding: labels.wedding,
  birthday: labels.birthday,
  babyShower: labels.babyShower,
  christmas: labels.christmas,
})

const visibilityLabelMap = (
  labels: Dictionary['dashboard']
): Record<ListVisibility, string> => ({
  public: labels.visibilityPublic,
  private: labels.visibilityPrivate,
})

const itemStatusLabelMap = (
  labels: Dictionary['dashboard']
): Record<GiftListItem['status'], string> => ({
  available: labels.statusAvailable,
  reserved: labels.statusReserved,
  gifted: labels.statusGifted,
})

const listAccessLabelMap = (
  labels: Dictionary['dashboard']
): Record<ListAccessStatus, string> => ({
  trial: labels.accessTrial,
  active: labels.accessActive,
  expired: labels.accessExpired,
})

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
  const [selectedListId, setSelectedListId] = useState('')

  const [isListsLoading, setIsListsLoading] = useState(true)
  const [isItemsLoading, setIsItemsLoading] = useState(false)
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [statusUpdatingItemId, setStatusUpdatingItemId] = useState<string | null>(null)
  const [activatingPassListId, setActivatingPassListId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugTouched, setIsSlugTouched] = useState(false)
  const [eventType, setEventType] = useState<EventType>('birthday')
  const [templateId, setTemplateId] = useState<TemplateId>('classic')
  const [visibility, setVisibility] = useState<ListVisibility>('public')

  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemLink, setItemLink] = useState('')
  const [itemMediaFile, setItemMediaFile] = useState<File | null>(null)
  const itemMediaInputRef = useRef<HTMLInputElement | null>(null)

  const [listError, setListError] = useState<string | null>(null)
  const [listSuccess, setListSuccess] = useState<string | null>(null)
  const [itemError, setItemError] = useState<string | null>(null)
  const [itemSuccess, setItemSuccess] = useState<string | null>(null)
  const [hasHandledBillingReturn, setHasHandledBillingReturn] = useState(false)
  const [billingRuntimeMode, setBillingRuntimeMode] = useState<BillingRuntimeMode>('manual')
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [copiedListId, setCopiedListId] = useState<string | null>(null)
  const [qrTargetListId, setQrTargetListId] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [isQrLoading, setIsQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [previewListId, setPreviewListId] = useState<string | null>(null)

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
      setListSuccess(labels.billingSuccessReturn)
    } else {
      setListSuccess(null)
      setListError(labels.billingCancelReturn)
    }

    setHasHandledBillingReturn(true)
  }, [
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
  const eventTypeLabels = useMemo(() => eventLabelMap(eventLabels), [eventLabels])
  const visibilityLabels = useMemo(() => visibilityLabelMap(labels), [labels])
  const itemStatusLabels = useMemo(() => itemStatusLabelMap(labels), [labels])
  const accessStatusLabels = useMemo(() => listAccessLabelMap(labels), [labels])

  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId) ?? null,
    [lists, selectedListId]
  )

  const isSelectedListExpired = selectedList?.accessStatus === 'expired'
  const isItemActionsDisabled = !selectedListId || Boolean(isSelectedListExpired)
  const previewList = useMemo(
    () => lists.find((list) => list.id === previewListId) ?? null,
    [lists, previewListId]
  )
  const isPreviewLoading = Boolean(previewListId) && (
    previewListId !== selectedListId || isItemsLoading
  )
  const previewItems = previewListId === selectedListId ? items : []

  const getPublicListUrl = (slug: string) => {
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL
      || (typeof window !== 'undefined' ? window.location.origin : '')
    ).replace(/\/$/, '')

    return `${siteUrl}/${slug}`
  }

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

  const getListDaysLeft = (list: GiftList) => {
    if (list.accessStatus === 'active') {
      return getRemainingDays(list.paidAccessEndsAt)
    }

    if (list.accessStatus === 'trial') {
      return getRemainingDays(list.trialEndsAt)
    }

    return 0
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

  const handleCreateList = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setListError(null)
    setListSuccess(null)
    setIsCreatingList(true)

    try {
      const result = await createGiftList({
        ownerId,
        title,
        slug,
        eventType,
        templateId,
        visibility,
      })

      setListSuccess(`${labels.listCreated} /${result.slug}`)
      setTitle('')
      setSlug('')
      setIsSlugTouched(false)
      setEventType('birthday')
      setTemplateId('classic')
      setVisibility('public')
      setSelectedListId(result.listId)
    } catch (rawError) {
      if (rawError instanceof InvalidSlugError) {
        setListError(labels.errorInvalidSlug)
      } else if (rawError instanceof ReservedSlugError) {
        setListError(labels.errorSlugReserved)
      } else if (rawError instanceof SlugTakenError) {
        setListError(labels.errorSlugTaken)
      } else {
        setListError(labels.errorCreateFailed)
      }
    } finally {
      setIsCreatingList(false)
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
    setPreviewListId(list.id)
  }

  const handleClosePreview = () => {
    setPreviewListId(null)
  }

  const handleActivatePass = async (listId: string) => {
    setListError(null)
    setListSuccess(null)
    setActivatingPassListId(listId)

    try {
      const user = auth.currentUser
      if (!user) {
        setListError(labels.errorSessionExpired)
        return
      }

      const idToken = await user.getIdToken()
      const result = await startBillingCheckout({
        listId,
        locale,
        idToken,
      })

      if (result.mode === 'stripe') {
        setListSuccess(labels.redirectingToCheckout)
        window.location.assign(result.checkoutUrl)
        return
      }

      setListSuccess(labels.passActivated)
    } catch (rawError) {
      if (rawError instanceof BillingCheckoutError) {
        if (rawError.code === 'missing_auth' || rawError.code === 'invalid_auth') {
          setListError(labels.errorSessionExpired)
          return
        }
      }

      setListError(labels.errorActivatePass)
    } finally {
      setActivatingPassListId(null)
    }
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

    try {
      let mediaPayload: { url: string; path: string; type: string } | null = null

      if (itemMediaFile) {
        setIsUploadingMedia(true)
        mediaPayload = await uploadItemMedia({
          listId: selectedListId,
          file: itemMediaFile,
        })
      }

      await createGiftItem({
        listId: selectedListId,
        name: itemName,
        description: itemDescription,
        link: itemLink,
        media: mediaPayload,
      })

      setItemName('')
      setItemDescription('')
      setItemLink('')
      setItemMediaFile(null)
      if (itemMediaInputRef.current) {
        itemMediaInputRef.current.value = ''
      }
      setItemSuccess(labels.itemAdded)
    } catch (rawError) {
      if (rawError instanceof MediaValidationError) {
        if (rawError.code === 'unsupported_type') {
          setItemError(labels.errorMediaUnsupportedType)
        } else {
          setItemError(labels.errorMediaTooLarge)
        }
      } else {
        setItemError(labels.errorAddItem)
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

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,1fr] lg:gap-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
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
              className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-200">
            <span>{labels.slugLabel}</span>
            <input
              required
              value={slug}
              onChange={(entry) => handleSlugChange(entry.target.value)}
              className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            />
            <span className="text-xs text-slate-400">{labels.slugHint}</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.eventTypeLabel}</span>
              <select
                value={eventType}
                onChange={(entry) => setEventType(entry.target.value as EventType)}
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
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
                onChange={(entry) => setTemplateId(entry.target.value as TemplateId)}
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              >
                {TEMPLATE_IDS.map((item) => (
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
              onChange={(entry) =>
                setVisibility(entry.target.value as ListVisibility)
              }
              className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            >
              {VISIBILITY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {visibilityLabels[item]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={isCreatingList}
            className="mt-2 w-full rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isCreatingList ? labels.creatingList : labels.createListAction}
          </button>
        </form>

        {listSuccess && (
          <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
            {listSuccess}
          </p>
        )}

        {listError && (
          <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
            {listError}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
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

          {lists.map((list) => (
            <article
              key={list.id}
              className={`rounded-xl border p-4 text-sm ${
                selectedListId === list.id
                  ? 'border-emerald-300/40 bg-emerald-300/10 text-slate-100'
                  : 'border-white/10 bg-slate-950/50 text-slate-200'
              }`}
            >
              <h3 className="text-base font-semibold text-white">{list.title}</h3>
              <p className="mt-1 text-xs text-slate-400">/{list.slug} ({locale})</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/20 px-2 py-1">
                  {labels.eventTag}: {eventTypeLabels[list.eventType]}
                </span>
                <span className="rounded-full border border-white/20 px-2 py-1">
                  {labels.visibilityTag}: {visibilityLabels[list.visibility]}
                </span>
                <span className="rounded-full border border-white/20 px-2 py-1">
                  {labels.slugTag}: {list.slug}
                </span>
                <span className="rounded-full border border-white/20 px-2 py-1">
                  {labels.listLinkTag}: /{list.slug}
                </span>
                <span className="rounded-full border border-white/20 px-2 py-1">
                  {labels.accessStatusTag}: {accessStatusLabels[list.accessStatus]}
                </span>
                {list.accessStatus !== 'expired' && (
                  <span className="rounded-full border border-white/20 px-2 py-1">
                    {labels.daysLeftTag}: {getListDaysLeft(list)}
                  </span>
                )}
              </div>

              {list.accessStatus !== 'active' && (
                <button
                  type="button"
                  onClick={() => handleActivatePass(list.id)}
                  disabled={activatingPassListId === list.id}
                  className="mt-3 w-full rounded-full border border-emerald-300/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {activatingPassListId === list.id
                    ? labels.activatingPass
                    : labels.activatePassAction}
                </button>
              )}

              <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenPreview(list)}
                  className="w-full rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white sm:w-auto"
                >
                  {labels.previewAction}
                </button>

                {list.visibility === 'public' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCopyPublicLink(list)}
                      className="w-full rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white sm:w-auto"
                    >
                      {copiedListId === list.id ? labels.linkCopied : labels.copyLinkAction}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleQr(list)}
                      className="w-full rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white sm:w-auto"
                    >
                      {qrTargetListId === list.id ? labels.hideQrAction : labels.showQrAction}
                    </button>
                  </>
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
          ))}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white">{labels.itemsTitle}</h3>

          <label className="mt-3 grid gap-1 text-sm text-slate-200">
            <span>{labels.listSelectorLabel}</span>
            <select
              value={selectedListId}
              onChange={(entry) => setSelectedListId(entry.target.value)}
              className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            >
              {lists.length === 0 && <option value="">-</option>}
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          </label>

          <form onSubmit={handleAddItem} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.itemNameLabel}</span>
              <input
                required
                disabled={isItemActionsDisabled}
                value={itemName}
                onChange={(entry) => setItemName(entry.target.value)}
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
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
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
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
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
              />
            </label>

            <label className="grid gap-1 text-sm text-slate-200">
              <span>{labels.itemMediaLabel}</span>
              <input
                ref={itemMediaInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                disabled={isItemActionsDisabled || isUploadingMedia}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null
                  setItemMediaFile(nextFile)
                }}
                className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white file:mr-3 file:rounded-full file:border-0 file:bg-emerald-400 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black"
              />
              <span className="text-xs text-slate-400">{labels.itemMediaHint}</span>
              {itemMediaFile && (
                <span className="text-xs text-emerald-200">
                  {labels.mediaSelected}: {itemMediaFile.name}
                </span>
              )}
            </label>

            <button
              type="submit"
              disabled={isAddingItem || isUploadingMedia || isItemActionsDisabled}
              className="w-full rounded-full bg-white px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isUploadingMedia
                ? labels.uploadingMedia
                : (isAddingItem ? labels.addingItem : labels.addItemAction)}
            </button>
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
                className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <p className="mt-1 text-xs text-slate-300">{item.description}</p>
                    {renderItemMediaPreview(item)}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-emerald-300 underline"
                      >
                        {item.link}
                      </a>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      {itemStatusLabels[item.status]}
                      {item.reservedByName ? ` · ${item.reservedByName}` : ''}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                    {item.status === 'reserved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateItemStatus(item.id, 'available')}
                        disabled={statusUpdatingItemId === item.id || isItemActionsDisabled}
                        className="w-full rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {statusUpdatingItemId === item.id
                          ? labels.updatingStatus
                          : labels.releaseReservationAction}
                      </button>
                    )}

                    {item.status !== 'gifted' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateItemStatus(item.id, 'gifted')}
                        disabled={statusUpdatingItemId === item.id || isItemActionsDisabled}
                        className="w-full rounded-full border border-emerald-300/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {statusUpdatingItemId === item.id
                          ? labels.updatingStatus
                          : labels.markGiftedAction}
                      </button>
                    )}

                    {item.status === 'gifted' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateItemStatus(item.id, 'available')}
                        disabled={statusUpdatingItemId === item.id || isItemActionsDisabled}
                        className="w-full rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {statusUpdatingItemId === item.id
                          ? labels.updatingStatus
                          : labels.markAvailableAction}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={
                        deletingItemId === item.id ||
                        statusUpdatingItemId === item.id ||
                        isItemActionsDisabled
                      }
                      className="w-full rounded-full border border-red-300/40 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {deletingItemId === item.id
                        ? labels.deletingItem
                        : labels.deleteItemAction}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {previewList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={labels.closePreviewAction}
            onClick={handleClosePreview}
            className="absolute inset-0 bg-slate-950/85"
          />

          <section className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <h3 className="text-base font-semibold text-white">{labels.previewPanelTitle}</h3>
                <p className="mt-1 text-xs text-slate-300">/{previewList.slug}</p>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {labels.closePreviewAction}
              </button>
            </header>

            <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {isPreviewLoading ? (
                <p className="text-sm text-slate-300">{labels.previewLoading}</p>
              ) : (
                <>
                  <p className="text-xs text-slate-300">
                    {previewList.visibility === 'public'
                      ? labels.previewPublicHint
                      : labels.previewPrivateHint}
                  </p>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                    <h4 className="text-xl font-semibold text-white">{previewList.title}</h4>
                    <p className="mt-2 text-sm text-slate-300">
                      {labels.eventTag}: {eventTypeLabels[previewList.eventType]} - {
                        previewItems.filter((item) => item.status === 'available').length
                      } {labels.itemsTitle.toLowerCase()}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">/{previewList.slug}</p>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {previewItems.length === 0 && (
                      <p className="text-sm text-slate-300">{labels.itemsEmpty}</p>
                    )}

                    {previewItems.map((item) => (
                      <article
                        key={`preview-${item.id}`}
                        className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
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
                                className="mt-2 inline-block text-sm text-emerald-300 underline"
                              >
                                {item.link}
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
          </section>
        </div>
      )}
    </div>
  )
}
