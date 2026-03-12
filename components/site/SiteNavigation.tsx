'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { Locale } from '@/lib/i18n/config'
import { Dictionary } from '@/lib/i18n/types'

type SiteNavigationProps = {
  locale: Locale
  labels: Dictionary['nav']
  mode?: 'desktop' | 'mobile' | 'both'
}

export default function SiteNavigation({
  locale,
  labels,
  mode = 'both',
}: SiteNavigationProps) {
  const { user, loading } = useAuth()
  const showDashboard = !loading && Boolean(user)
  const showLogin = !loading && !user
  const shouldRenderDesktop = mode === 'desktop' || mode === 'both'
  const shouldRenderMobile = mode === 'mobile' || mode === 'both'

  return (
    <>
      {shouldRenderDesktop && (
        <nav className="hidden items-center gap-5 text-sm text-white/80 md:flex">
          <Link href={`/${locale}`} className="hover:text-white">
            {labels.home}
          </Link>
          <Link href={`/${locale}/gallery`} className="hover:text-white">
            {labels.gallery}
          </Link>
          <Link href={`/${locale}/pricing`} className="hover:text-white">
            {labels.pricing}
          </Link>
          {showDashboard && (
            <Link href={`/${locale}/dashboard`} className="hover:text-white">
              {labels.dashboard}
            </Link>
          )}
          {showLogin && (
            <Link
              href={`/${locale}/login`}
              className="rounded-full bg-emerald-400 px-4 py-2 font-medium text-black hover:bg-emerald-300"
            >
              {labels.login}
            </Link>
          )}
        </nav>
      )}

      {shouldRenderMobile && (
        <nav className="border-t border-white/10 px-4 py-2 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto pb-1">
            <Link
              href={`/${locale}`}
              className="whitespace-nowrap rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90"
            >
              {labels.home}
            </Link>
            <Link
              href={`/${locale}/gallery`}
              className="whitespace-nowrap rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90"
            >
              {labels.gallery}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="whitespace-nowrap rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90"
            >
              {labels.pricing}
            </Link>
            {showDashboard && (
              <Link
                href={`/${locale}/dashboard`}
                className="whitespace-nowrap rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90"
              >
                {labels.dashboard}
              </Link>
            )}
            {showLogin && (
              <Link
                href={`/${locale}/login`}
                className="whitespace-nowrap rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black"
              >
                {labels.login}
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  )
}
