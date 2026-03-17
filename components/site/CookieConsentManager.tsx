'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { resolveLocale, type Locale } from '@/lib/i18n/config'
import {
  buildCookieConsentCookieValue,
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_SETTINGS_EVENT,
  getLegalCopy,
  getTrackedAnalyticsPage,
  readCookieConsentPreferences,
  serializeCookieConsentPreferences,
  type CookieConsentPreferences,
} from '@/lib/site/legal'

declare global {
  interface Window {
    dataLayer: unknown[] | undefined
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ''
const necessaryStatusLabels: Record<Locale, string> = {
  en: 'On',
  et: 'Sees',
  fi: 'Päällä',
  sv: 'På',
  no: 'På',
  da: 'Til',
  de: 'An',
  fr: 'Activé',
  es: 'Activo',
  pt: 'Ativo',
  it: 'Attivo',
  pl: 'Wł.',
  ru: 'Вкл.',
  lv: 'Ieslēgts',
  lt: 'Įjungta',
}

const BASE_GOOGLE_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
} as const

const detectLocale = (pathname: string | null): Locale => {
  const localeFromPath = pathname?.split('/')[1] ?? null
  if (localeFromPath) {
    return resolveLocale(localeFromPath)
  }

  return resolveLocale(typeof navigator === 'undefined' ? null : navigator.language)
}

const persistPreferences = (preferences: CookieConsentPreferences) => {
  const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? '; Secure'
    : ''

  document.cookie =
    `${COOKIE_CONSENT_COOKIE_NAME}=${buildCookieConsentCookieValue(preferences)}; ` +
    `Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureFlag}`
}

const ensureGtag = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.dataLayer = window.dataLayer ?? []
  window.gtag = window.gtag ?? ((...args: unknown[]) => {
    window.dataLayer?.push(args)
  })
}

export default function CookieConsentManager() {
  const pathname = usePathname()
  const locale = useMemo(() => detectLocale(pathname), [pathname])
  const copy = getLegalCopy(locale).consent
  const necessaryStatusLabel = necessaryStatusLabels[locale]
  const policyHref = `/${locale}/cookies`
  const trackedPage = pathname ? getTrackedAnalyticsPage(pathname) : null

  const [preferences, setPreferences] = useState<CookieConsentPreferences | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isBannerVisible, setIsBannerVisible] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [analyticsDraft, setAnalyticsDraft] = useState(false)
  const [shouldRenderGaScript, setShouldRenderGaScript] = useState(false)
  const [isGaLoaded, setIsGaLoaded] = useState(false)

  const gaConfiguredRef = useRef(false)
  const lastTrackedPathRef = useRef<string | null>(null)
  const shouldEnableAnalyticsOnPage = Boolean(preferences?.analytics && trackedPage)

  useEffect(() => {
    const storedPreferences = readCookieConsentPreferences(document.cookie)
    setPreferences(storedPreferences)
    setAnalyticsDraft(storedPreferences?.analytics ?? false)
    setIsBannerVisible(!storedPreferences)
    setIsReady(true)
  }, [])

  useEffect(() => {
    const handleOpenSettings = () => {
      setAnalyticsDraft(preferences?.analytics ?? false)
      setIsSettingsOpen(true)
    }

    window.addEventListener(COOKIE_SETTINGS_EVENT, handleOpenSettings)
    return () => {
      window.removeEventListener(COOKIE_SETTINGS_EVENT, handleOpenSettings)
    }
  }, [preferences?.analytics])

  useEffect(() => {
    if (GA_MEASUREMENT_ID && preferences?.analytics && trackedPage) {
      setShouldRenderGaScript(true)
    }
  }, [preferences?.analytics, trackedPage])

  useEffect(() => {
    if (!shouldRenderGaScript) {
      return
    }

    ensureGtag()
  }, [shouldRenderGaScript])

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !shouldRenderGaScript || !isGaLoaded) {
      return
    }

    ensureGtag()
    if (!window.gtag) {
      return
    }

    window.gtag('consent', 'default', BASE_GOOGLE_CONSENT)
    window.gtag('consent', 'update', {
      ...BASE_GOOGLE_CONSENT,
      analytics_storage: shouldEnableAnalyticsOnPage ? 'granted' : 'denied',
    })

    if (!gaConfiguredRef.current) {
      window.gtag('js', new Date())
      window.gtag('config', GA_MEASUREMENT_ID, {
        allow_ad_personalization_signals: false,
        allow_google_signals: false,
        anonymize_ip: true,
        send_page_view: false,
      })
      gaConfiguredRef.current = true
    }
  }, [isGaLoaded, shouldEnableAnalyticsOnPage, shouldRenderGaScript])

  useEffect(() => {
    if (
      !GA_MEASUREMENT_ID
      || !shouldRenderGaScript
      || !isGaLoaded
      || !preferences?.analytics
      || !trackedPage
    ) {
      return
    }

    ensureGtag()
    if (!window.gtag) {
      return
    }

    if (lastTrackedPathRef.current === trackedPage.path) {
      return
    }

    lastTrackedPathRef.current = trackedPage.path
    window.gtag('event', 'page_view', {
      language: trackedPage.locale,
      page_location: `${window.location.origin}${trackedPage.path}`,
      page_path: trackedPage.path,
      page_title: trackedPage.title,
    })

    if (trackedPage.eventName) {
      window.gtag('event', trackedPage.eventName, {
        language: trackedPage.locale,
        page_path: trackedPage.path,
      })
    }
  }, [isGaLoaded, preferences?.analytics, shouldRenderGaScript, trackedPage])

  useEffect(() => {
    if (!trackedPage) {
      lastTrackedPathRef.current = null
    }
  }, [trackedPage])

  useEffect(() => {
    if (!preferences?.analytics) {
      lastTrackedPathRef.current = null
    }
  }, [preferences?.analytics])

  const savePreferences = (analytics: boolean) => {
    const nextPreferences = serializeCookieConsentPreferences(analytics)
    persistPreferences(nextPreferences)
    setPreferences(nextPreferences)
    setAnalyticsDraft(analytics)
    setIsBannerVisible(false)
    setIsSettingsOpen(false)
  }

  if (!isReady) {
    return null
  }

  return (
    <>
      {GA_MEASUREMENT_ID && shouldRenderGaScript && (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
            onLoad={() => {
              setIsGaLoaded(true)
            }}
          />
          <Script id="ga4-bootstrap" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};`}
          </Script>
        </>
      )}

      {isBannerVisible && (
        <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4">
          <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.22)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl space-y-2">
                <h2 className="text-xl font-semibold text-slate-950">{copy.title}</h2>
                <p className="text-sm leading-6 text-slate-700">{copy.body}</p>
                <Link
                  href={policyHref}
                  className="inline-flex text-sm font-medium text-slate-700 underline underline-offset-4"
                >
                  {copy.policyAction}
                </Link>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  onClick={() => {
                    setAnalyticsDraft(preferences?.analytics ?? false)
                    setIsSettingsOpen(true)
                  }}
                >
                  {copy.settingsAction}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  onClick={() => savePreferences(false)}
                >
                  {copy.acceptNecessaryAction}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  onClick={() => savePreferences(true)}
                >
                  {copy.acceptAllAction}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_30px_120px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-slate-950">{copy.modalTitle}</h2>
                <p className="text-sm leading-6 text-slate-700">{copy.modalBody}</p>
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:text-slate-900"
                onClick={() => setIsSettingsOpen(false)}
                aria-label={copy.cancelAction}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-950">{copy.necessaryTitle}</h3>
                    <p className="text-sm leading-6 text-slate-700">{copy.necessaryBody}</p>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    {necessaryStatusLabel}
                  </span>
                </div>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-3xl border border-slate-200 p-4 transition hover:border-slate-300">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-950">{copy.analyticsTitle}</h3>
                  <p className="text-sm leading-6 text-slate-700">{copy.analyticsBody}</p>
                  <p className="text-xs leading-5 text-slate-500">{copy.analyticsHint}</p>
                </div>

                <span className="relative mt-1 inline-flex h-7 w-12 flex-none">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={analyticsDraft}
                    onChange={(event) => setAnalyticsDraft(event.target.checked)}
                  />
                  <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
                  <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                onClick={() => setIsSettingsOpen(false)}
              >
                {copy.cancelAction}
              </button>
              <button
                type="button"
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => savePreferences(analyticsDraft)}
              >
                {copy.saveAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
