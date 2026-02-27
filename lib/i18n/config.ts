export const locales = ['en', 'et'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  et: 'ET',
}

export const isLocale = (value: string): value is Locale => {
  return locales.includes(value as Locale)
}
