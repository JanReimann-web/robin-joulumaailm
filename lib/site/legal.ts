import type { Locale } from '@/lib/i18n/config'

export const COMPANY_NAME = 'Robinio Invest OÜ'
export const COMPANY_ADDRESS = 'Vesivärava 22-4, Tallinn, Estonia'
export const COOKIE_SETTINGS_EVENT = 'giftlist:open-cookie-settings'
export const COOKIE_CONSENT_COOKIE_NAME = 'giftlist_consent'
export const COOKIE_CONSENT_VERSION = 1
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

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

export const LEGAL_COPY: Record<Locale, {
  footer: FooterCopy
  consent: ConsentCopy
  pages: LegalPagesCopy
}> = {
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
}

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

export const getTrackedAnalyticsPage = (
  pathname: string
): {
  locale: Locale
  path: string
  title: string
} | null => {
  const map: Record<string, { locale: Locale; title: string }> = {
    '/en': { locale: 'en', title: 'Home' },
    '/et': { locale: 'et', title: 'Avaleht' },
    '/en/pricing': { locale: 'en', title: 'Pricing' },
    '/et/pricing': { locale: 'et', title: 'Hinnad' },
    '/en/gallery': { locale: 'en', title: 'Gallery' },
    '/et/gallery': { locale: 'et', title: 'Galerii' },
    '/en/dashboard': { locale: 'en', title: 'Dashboard' },
    '/et/dashboard': { locale: 'et', title: 'Töölaud' },
  }

  const tracked = map[pathname]
  if (!tracked) {
    return null
  }

  return {
    locale: tracked.locale,
    path: pathname,
    title: tracked.title,
  }
}
