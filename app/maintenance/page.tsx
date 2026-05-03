import type { Metadata } from 'next'
import { maintenanceNotice } from '@/lib/site/maintenance'

export const metadata: Metadata = {
  title: maintenanceNotice.title,
  robots: {
    index: false,
    follow: false,
  },
}

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-neutral-950">
      <h1 className="text-2xl font-medium tracking-normal sm:text-3xl">
        {maintenanceNotice.title}
      </h1>
    </main>
  )
}
