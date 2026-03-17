'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe2 } from 'lucide-react'
import { isLocale, localeNativeNames, locales, type Locale } from '@/lib/i18n/config'

interface LanguageSwitcherProps {
  currentLocale: Locale
  label: string
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
}: LanguageSwitcherProps) {
  const pathname = usePathname() || '/'
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div ref={rootRef} className="relative shrink-0" aria-label={label}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Globe2 size={16} className="text-emerald-300" />
        <span className="hidden md:inline">{localeNativeNames[currentLocale]}</span>
        <span className="md:hidden">{currentLocale.toUpperCase()}</span>
        <ChevronDown
          size={14}
          className={`transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-[1.5rem] border border-white/10 bg-slate-950/95 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {label}
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {locales.map((locale) => {
              const active = locale === currentLocale
              const href = replaceLocale(pathname, locale)

              return (
                <Link
                  key={locale}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition ${
                    active
                      ? 'bg-emerald-400 text-black'
                      : 'text-white/80 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span>{localeNativeNames[locale]}</span>
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${active ? 'text-black/70' : 'text-white/40'}`}>
                    {locale}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
