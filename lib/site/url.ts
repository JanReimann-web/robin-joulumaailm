import { locales } from '@/lib/i18n/config'
import { sanitizeSlug } from '@/lib/lists/slug'

const DEFAULT_SITE_URL = 'https://giftliststudio.com'

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '')

const normalizePath = (value: string) => {
  if (!value) {
    return ''
  }

  return value.startsWith('/') ? value : `/${value}`
}

export const getSiteUrl = () => {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL
  return trimTrailingSlashes(rawSiteUrl)
}

export const buildAbsoluteUrl = (path = '') => {
  return `${getSiteUrl()}${normalizePath(path)}`
}

export const buildLocalizedUrl = (locale: string, path = '') => {
  return buildAbsoluteUrl(`/${locale}${normalizePath(path)}`)
}

export const buildLocalizedAlternates = (path = '') => {
  return Object.fromEntries(
    locales.map((locale) => [locale, buildLocalizedUrl(locale, path)])
  )
}

export const buildPublicListPath = (slug: string) => {
  return `/l/${sanitizeSlug(slug)}`
}

export const buildPublicListUrl = (slug: string) => {
  return buildAbsoluteUrl(buildPublicListPath(slug))
}
