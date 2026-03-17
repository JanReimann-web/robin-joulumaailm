import type { Locale } from '@/lib/i18n/config'
import type { AnalyticsEventName } from '@/lib/site/analytics'

export const COMPANY_NAME = 'Robinio Invest OÜ'
export const COMPANY_ADDRESS = 'Vesivärava 22-4, Tallinn, Estonia'
export const COOKIE_SETTINGS_EVENT = 'giftlist:open-cookie-settings'
export const COOKIE_CONSENT_COOKIE_NAME = 'giftlist_consent'
export const COOKIE_CONSENT_VERSION = 1
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

type TrackedAnalyticsPageDefinition = {
  locale: Locale
  title: string
  eventName?: AnalyticsEventName
}

const TRACKED_ANALYTICS_PAGE_MAP: Record<string, TrackedAnalyticsPageDefinition> = {
  '/en': { locale: 'en', title: 'Home' },
  '/et': { locale: 'et', title: 'Avaleht' },
  '/en/login': { locale: 'en', title: 'Login' },
  '/et/login': { locale: 'et', title: 'Login' },
  '/en/pricing': { locale: 'en', title: 'Pricing', eventName: 'view_pricing' },
  '/et/pricing': { locale: 'et', title: 'Hinnad', eventName: 'view_pricing' },
  '/en/gallery': { locale: 'en', title: 'Gallery' },
  '/et/gallery': { locale: 'et', title: 'Galerii' },
  '/en/events/wedding': { locale: 'en', title: 'Wedding Event Page' },
  '/et/events/wedding': { locale: 'et', title: 'Pulmade sündmuse leht' },
  '/en/wedding-gift-list': { locale: 'en', title: 'Wedding Gift List' },
  '/et/wedding-gift-list': { locale: 'et', title: 'Pulmade kinginimekiri' },
  '/en/private-wedding-registry': { locale: 'en', title: 'Private Wedding Registry' },
  '/et/private-wedding-registry': { locale: 'et', title: 'Privaatne pulmaregister' },
  '/en/wedding-registry-alternative': { locale: 'en', title: 'Wedding Registry Alternative' },
  '/et/wedding-registry-alternative': { locale: 'et', title: 'Pulmaregistri alternatiiv' },
  '/en/wedding-gift-page-for-guests': { locale: 'en', title: 'Wedding Gift Page for Guests' },
  '/et/wedding-gift-page-for-guests': { locale: 'et', title: 'Pulmade kingileht külalistele' },
  '/en/dashboard': { locale: 'en', title: 'Dashboard' },
  '/et/dashboard': { locale: 'et', title: 'Töölaud' },
}

const MOJIBAKE_PATTERN = /Ã|Â|â|Å|Æ|Õ/

export type CookieConsentPreferences = {
  version: typeof COOKIE_CONSENT_VERSION
  analytics: boolean
  updatedAt: string
}

type FooterCopy = {
  companyLabel: string
  addressLabel: string
  cookieSettings: string
  cookiePolicy: string
  privacyPolicy: string
  terms: string
  faq: string
}

type ConsentCopy = {
  title: string
  body: string
  settingsAction: string
  acceptNecessaryAction: string
  acceptAllAction: string
  modalTitle: string
  modalBody: string
  necessaryTitle: string
  necessaryBody: string
  analyticsTitle: string
  analyticsBody: string
  analyticsHint: string
  cancelAction: string
  saveAction: string
  policyAction: string
}

type LegalPagesCopy = {
  backHomeAction: string
  faqTitle: string
  faqIntro: string
  termsTitle: string
  termsIntro: string
  privacyTitle: string
  privacyIntro: string
  cookiesTitle: string
  cookiesIntro: string
}

const repairMojibake = (value: string) => {
  if (!MOJIBAKE_PATTERN.test(value)) {
    return value
  }

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff))
    const repaired = new TextDecoder('utf-8').decode(bytes)
    return repaired.includes('\uFFFD') ? value : repaired
  } catch {
    return value
  }
}

export const repairLegalContent = <T>(value: T): T => {
  if (typeof value === 'string') {
    return repairMojibake(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairLegalContent(item)) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, repairLegalContent(entryValue)])
    ) as T
  }

  return value
}

export const LEGAL_COPY: Record<Locale, {
  footer: FooterCopy
  consent: ConsentCopy
  pages: LegalPagesCopy
}> = repairLegalContent({
  en: {
    footer: {
      companyLabel: 'Company',
      addressLabel: 'Address',
      cookieSettings: 'Cookie settings',
      cookiePolicy: 'Cookie policy',
      privacyPolicy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      faq: 'FAQ',
    },
    consent: {
      title: 'We use cookies and browser storage',
      body: 'Necessary cookies and browser storage keep sign-in, password-protected list access, consent choices, and gallery sample reservations working. Analytics stays off unless you allow it.',
      settingsAction: 'Cookie settings',
      acceptNecessaryAction: 'Use necessary only',
      acceptAllAction: 'Allow analytics',
      modalTitle: 'Cookie settings',
      modalBody: 'Choose which categories can be used on this site. Necessary storage is always on because the service cannot work correctly without it.',
      necessaryTitle: 'Necessary',
      necessaryBody: 'Required for sign-in persistence, password-protected public lists, consent storage, and sample reservation resets.',
      analyticsTitle: 'Analytics',
      analyticsBody: 'Google Analytics 4 can be used only after your consent and only on the homepage, pricing, gallery, and dashboard pages.',
      analyticsHint: 'Public gift list pages are excluded from analytics page tracking to avoid collecting personal page details.',
      cancelAction: 'Cancel',
      saveAction: 'Save settings',
      policyAction: 'Read cookie policy',
    },
    pages: {
      backHomeAction: 'Back to home',
      faqTitle: 'FAQ',
      faqIntro: 'Helpful answers for hosts and guests using Giftlist Studio.',
      termsTitle: 'Terms & Conditions',
      termsIntro: 'These terms explain how Giftlist Studio can be used, how access periods work, and what responsibilities apply to account owners and guests.',
      privacyTitle: 'Privacy Policy',
      privacyIntro: 'This policy explains what personal data Giftlist Studio processes, why it is processed, how long it is kept, and what choices users have.',
      cookiesTitle: 'Cookie Policy',
      cookiesIntro: 'This page explains which cookies and browser storage technologies Giftlist Studio uses and how consent works.',
    },
  },
  et: {
    footer: {
      companyLabel: 'Ettevõte',
      addressLabel: 'Aadress',
      cookieSettings: 'Küpsiste seaded',
      cookiePolicy: 'Küpsiste tingimused',
      privacyPolicy: 'Privaatsuspoliitika',
      terms: 'Kasutustingimused',
      faq: 'KKK',
    },
    consent: {
      title: 'Kasutame küpsiseid ja brauserisalvestust',
      body: 'Hädavajalikud küpsised ja brauserisalvestus hoiavad töös sisselogimise, parooliga kaitstud nimekirjad, küpsiste valiku ja galerii näidisbroneeringud. Analüütika jääb välja, kuni sa selle lubad.',
      settingsAction: 'Küpsiste seaded',
      acceptNecessaryAction: 'Kasuta ainult hädavajalikke',
      acceptAllAction: 'Luba analüütika',
      modalTitle: 'Küpsiste seaded',
      modalBody: 'Vali, milliseid kategooriaid võib sellel lehel kasutada. Hädavajalik salvestus on alati sees, sest ilma selleta ei tööta teenus korrektselt.',
      necessaryTitle: 'Hädavajalik',
      necessaryBody: 'Vajalik sisselogimise püsimiseks, parooliga avalike nimekirjade jaoks, küpsiste valiku salvestamiseks ja näidisbroneeringute automaatseks lähtestamiseks.',
      analyticsTitle: 'Analüütika',
      analyticsBody: 'Google Analytics 4 võib töötada ainult sinu nõusoleku järel ja ainult avalehel, hinnastuse, galerii ja töölaua lehtedel.',
      analyticsHint: 'Avalikke kinginimekirja lehti analüütikaga ei mõõdeta, et vältida isikustatud leheandmete kogumist.',
      cancelAction: 'Tühista',
      saveAction: 'Salvesta seaded',
      policyAction: 'Vaata küpsiste tingimusi',
    },
    pages: {
      backHomeAction: 'Tagasi avalehele',
      faqTitle: 'KKK',
      faqIntro: 'Praktilised vastused Giftlist Studio kasutajatele ja külalistele.',
      termsTitle: 'Kasutustingimused',
      termsIntro: 'Need tingimused selgitavad, kuidas Giftlist Studiot võib kasutada, kuidas ligipääsuperioodid toimivad ja millised vastutused kehtivad konto omanikule ning külalistele.',
      privacyTitle: 'Privaatsuspoliitika',
      privacyIntro: 'See poliitika selgitab, milliseid isikuandmeid Giftlist Studio töötleb, miks neid töödeldakse, kui kaua neid säilitatakse ja millised valikud kasutajal on.',
      cookiesTitle: 'Küpsiste tingimused',
      cookiesIntro: 'See leht selgitab, milliseid küpsiseid ja brauserisalvestuse tehnoloogiaid Giftlist Studio kasutab ning kuidas nõusolek toimib.',
    },
  },
})

export const getLegalCopy = (locale: Locale) => {
  return LEGAL_COPY[locale]
}

const CONSENT_MATCH = new RegExp(`(?:^|; )${COOKIE_CONSENT_COOKIE_NAME}=([^;]+)`)

export const readCookieConsentPreferences = (
  cookieSource: string
): CookieConsentPreferences | null => {
  const match = cookieSource.match(CONSENT_MATCH)
  if (!match || !match[1]) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Partial<CookieConsentPreferences>

    if (parsed.version !== COOKIE_CONSENT_VERSION || typeof parsed.analytics !== 'boolean') {
      return null
    }

    return {
      version: COOKIE_CONSENT_VERSION,
      analytics: parsed.analytics,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

export const serializeCookieConsentPreferences = (
  analytics: boolean
): CookieConsentPreferences => ({
  version: COOKIE_CONSENT_VERSION,
  analytics,
  updatedAt: new Date().toISOString(),
})

export const buildCookieConsentCookieValue = (
  preferences: CookieConsentPreferences
) => {
  return encodeURIComponent(JSON.stringify(preferences))
}

const normalizeTrackedPathname = (pathname: string) => {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export const getTrackedAnalyticsPage = (
  pathname: string
): {
  locale: Locale
  path: string
  title: string
  eventName?: AnalyticsEventName
} | null => {
  const normalizedPathname = normalizeTrackedPathname(pathname)
  const tracked = TRACKED_ANALYTICS_PAGE_MAP[normalizedPathname]
  if (!tracked) {
    return null
  }

  return {
    locale: tracked.locale,
    path: normalizedPathname,
    title: tracked.title,
    eventName: tracked.eventName,
  }
}
