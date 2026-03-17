import type { Metadata, Viewport } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import CookieConsentManager from '@/components/site/CookieConsentManager'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://giftliststudio.com'
const SITE_TITLE = 'Giftlist Studio'
const SITE_DESCRIPTION =
  'Create shareable online gift lists for weddings, birthdays, kids parties, baby showers, graduations, housewarmings, and Christmas with guest reservations and event-ready designs.'
const SHARE_IMAGE = '/images/Joulud.jpg'
const BRAND_MARK = '/brand/giftlist-studio-mark.svg'
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_TITLE,
  url: SITE_URL,
  logo: `${SITE_URL}${BRAND_MARK}`,
}
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_TITLE,
  url: SITE_URL,
  inLanguage: ['en', 'et'],
}

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
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
      <body className={`${spaceGrotesk.variable} antialiased`}>
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
