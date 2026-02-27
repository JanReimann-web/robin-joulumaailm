'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isLocale, Locale } from '@/lib/i18n/config'

interface LanguageSwitcherProps {
  currentLocale: Locale
  label: string
  names: Record<Locale, string>
}

const replaceLocale = (pathname: string, nextLocale: Locale) => {
  const segments = pathname.split('/')

  if (segments.length > 1 && isLocale(segments[1])) {
    segments[1] = nextLocale
    return segments.join('/') || '/'
  }

  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `/${nextLocale}${normalized}`
}

export default function LanguageSwitcher({
  currentLocale,
  label,
  names,
}: LanguageSwitcherProps) {
  const pathname = usePathname() || '/'

  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <span className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</span>
      <div className="rounded-full border border-white/20 bg-white/5 p-1">
        {(['en', 'et'] as const).map((locale) => {
          const active = locale === currentLocale
          const href = replaceLocale(pathname, locale)

          return (
            <Link
              key={locale}
              href={href}
              className={`inline-flex min-w-12 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                active
                  ? 'bg-emerald-400 text-black'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {names[locale]}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
