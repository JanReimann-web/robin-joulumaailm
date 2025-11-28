import type { Metadata } from 'next'
import './globals.css'

const SITE_TITLE = 'Robini Jõulumaailm'
const SITE_DESCRIPTION = 'Tere tulemast Robini jõulumaailma!'
const SHARE_IMAGE = '/images/Joulud.jpg'

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_TITLE,
    url: '/',
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
    <html lang="et">
      <body className="antialiased">{children}</body>
    </html>
  )
}

