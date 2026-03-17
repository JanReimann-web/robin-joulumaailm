export const locales = [
  'en',
  'et',
  'fi',
  'sv',
  'no',
  'da',
  'de',
  'fr',
  'es',
  'pt',
  'it',
  'pl',
  'ru',
  'lv',
  'lt',
] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  et: 'ET',
  fi: 'FI',
  sv: 'SV',
  no: 'NO',
  da: 'DA',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  pt: 'PT',
  it: 'IT',
  pl: 'PL',
  ru: 'RU',
  lv: 'LV',
  lt: 'LT',
}

export const localeNativeNames: Record<Locale, string> = {
  en: 'English',
  et: 'Eesti',
  fi: 'Suomi',
  sv: 'Svenska',
  no: 'Norsk',
  da: 'Dansk',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  pl: 'Polski',
  ru: 'Русский',
  lv: 'Latviešu',
  lt: 'Lietuvių',
}

export const localeIntlCodes: Record<Locale, string> = {
  en: 'en-US',
  et: 'et-EE',
  fi: 'fi-FI',
  sv: 'sv-SE',
  no: 'nb-NO',
  da: 'da-DK',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-PT',
  it: 'it-IT',
  pl: 'pl-PL',
  ru: 'ru-RU',
  lv: 'lv-LV',
  lt: 'lt-LT',
}

export const isLocale = (value: string): value is Locale => {
  return locales.includes(value as Locale)
}

export const resolveLocale = (value: string | null | undefined): Locale => {
  const normalized = value?.trim().toLowerCase() ?? ''

  if (!normalized) {
    return defaultLocale
  }

  const directMatch = locales.find((locale) => normalized === locale)
  if (directMatch) {
    return directMatch
  }

  const prefixMatch = locales.find((locale) => normalized.startsWith(`${locale}-`))
  if (prefixMatch) {
    return prefixMatch
  }

  return defaultLocale
}
