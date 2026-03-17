import { localeIntlCodes, resolveLocale } from '@/lib/i18n/config'

export const formatHeroEventDate = (
  value: string | null,
  locale: string
) => {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const parsedDate = new Date(`${normalized}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return normalized
  }

  return new Intl.DateTimeFormat(localeIntlCodes[resolveLocale(locale)], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)
}

export const formatHeroEventTime = (value: string | null) => {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const timeMatch = normalized.match(/^(\d{2}):(\d{2})/)
  if (!timeMatch) {
    return normalized
  }

  const [, hours, minutes] = timeMatch
  return `${hours}:${minutes}`
}
