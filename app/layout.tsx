import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'
const SITE_TITLE = 'Giftlist Studio'
const SITE_DESCRIPTION =
  'Create beautiful gift lists for weddings, adult birthdays, kids birthdays, baby showers, graduations, housewarming parties, and holidays.'
const SHARE_IMAGE = '/images/Joulud.jpg'
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_TITLE,
  url: SITE_URL,
  logo: `${SITE_URL}${SHARE_IMAGE}`,
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
      </body>
    </html>
  )
}
