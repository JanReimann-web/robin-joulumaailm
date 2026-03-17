import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import CookieConsentManager from '@/components/site/CookieConsentManager'
import { localeIntlCodes } from '@/lib/i18n/config'
import { buildAbsoluteUrl, getSiteUrl } from '@/lib/site/url'
import './globals.css'

const SITE_URL = getSiteUrl()
const SITE_TITLE = 'Giftlist Studio'
const SITE_DESCRIPTION =
  'Create a beautiful wedding gift list or event gift page with duplicate-proof reservations, private sharing, and event-ready designs.'
const SHARE_IMAGE = buildAbsoluteUrl('/images/Joulud.jpg')
const BRAND_MARK = '/brand/giftlist-studio-mark.svg'
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_TITLE,
  url: SITE_URL,
  logo: buildAbsoluteUrl(BRAND_MARK),
}
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_TITLE,
  url: SITE_URL,
  inLanguage: Object.values(localeIntlCodes),
}

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | Giftlist Studio',
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: BRAND_MARK,
    shortcut: BRAND_MARK,
    apple: BRAND_MARK,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_TITLE,
    url: SITE_URL,
    type: 'website',
    images: [
      {
        url: SHARE_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
}

export const viewport: Viewport = {
  colorScheme: 'only light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <AuthProvider>{children}</AuthProvider>
        <CookieConsentManager />
      </body>
    </html>
  )
}
