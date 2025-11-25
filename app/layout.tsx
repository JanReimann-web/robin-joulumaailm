import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Robini Jõulumaailm',
  description: 'Tere tulemast Robini jõulumaailma!',
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

