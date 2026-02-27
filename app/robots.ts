import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/en/dashboard', '/et/dashboard'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
