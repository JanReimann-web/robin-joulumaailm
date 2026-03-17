import type { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n/config'
import { EVENT_ROUTE_SLUGS } from '@/lib/lists/event-route'
import { buildLocalizedUrl } from '@/lib/site/url'
import { WEDDING_INTENT_SLUGS } from '@/lib/site/wedding-intent'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/gallery',
    '/pricing',
    '/login',
    '/cookies',
    '/privacy',
    '/terms',
    '/faq',
    ...WEDDING_INTENT_SLUGS.map((slug) => `/${slug}`),
  ]
  const eventRoutes = EVENT_ROUTE_SLUGS.map((eventSlug) => `/events/${eventSlug}`)
  const allRoutes = [...staticRoutes, ...eventRoutes]

  return locales.flatMap((locale) =>
    allRoutes.map((route) => ({
      url: buildLocalizedUrl(locale, route),
      lastModified: new Date(),
      changeFrequency: route === '' ? 'weekly' : 'monthly',
      priority: route === '' ? 0.9 : route.startsWith('/events/') ? 0.8 : 0.7,
    }))
  )
}
