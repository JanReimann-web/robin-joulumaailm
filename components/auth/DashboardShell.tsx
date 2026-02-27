'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ListWorkspace from '@/components/dashboard/ListWorkspace'
import { Locale } from '@/lib/i18n/config'
import { Dictionary } from '@/lib/i18n/types'
import { signOutUser } from '@/lib/auth/client'
import { useAuth } from '@/components/auth/AuthProvider'

type DashboardShellProps = {
  locale: Locale
  labels: Dictionary['dashboard']
  eventLabels: Dictionary['events']
  billingStatus: 'success' | 'cancel' | null
  billingListId: string | null
}

export default function DashboardShell({
  locale,
  labels,
  eventLabels,
  billingStatus,
  billingListId,
}: DashboardShellProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${locale}/login`)
    }
  }, [loading, locale, router, user])

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await signOutUser()
      router.replace(`/${locale}/login`)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <p className="text-slate-200">{labels.loadingAuth}</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <p className="text-slate-300">{labels.redirecting}</p>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12 lg:py-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">{labels.title}</h1>
      <p className="mt-3 text-slate-200">{labels.subtitle}</p>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
        <span>
          {labels.signedInAs}: <strong>{user.displayName ?? user.email ?? user.uid}</strong>
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="rounded-full border border-white/30 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? labels.signingOut : labels.signOutAction}
        </button>
      </div>

      <ListWorkspace
        locale={locale}
        ownerId={user.uid}
        labels={labels}
        eventLabels={eventLabels}
        billingStatus={billingStatus}
        billingListId={billingListId}
      />
    </section>
  )
}
