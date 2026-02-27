import type { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n/config'
import { EVENT_ROUTE_SLUGS } from '@/lib/lists/event-route'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/pricing', '/login']
  const eventRoutes = EVENT_ROUTE_SLUGS.map((eventSlug) => `/events/${eventSlug}`)
  const allRoutes = [...staticRoutes, ...eventRoutes]

  return locales.flatMap((locale) =>
    allRoutes.map((route) => ({
      url: `${SITE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'weekly' : 'monthly',
      priority: route === '' ? 0.9 : route.startsWith('/events/') ? 0.8 : 0.7,
    }))
  )
}
