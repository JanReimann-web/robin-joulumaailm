import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LanguageSwitcher from '@/components/site/LanguageSwitcher'
import { defaultLocale, isLocale, locales } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

type LocaleLayoutProps = {
  children: React.ReactNode
  params: {
    locale: string
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: LocaleLayoutProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale
  const dict = getDictionary(locale)

  return {
    title: dict.brand,
    description: dict.hero.subtitle,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        et: `${SITE_URL}/et`,
      },
    },
  }
}

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href={`/${locale}`} className="text-lg font-semibold tracking-tight text-white">
            {dict.brand}
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-white/80 md:flex">
            <Link href={`/${locale}`} className="hover:text-white">
              {dict.nav.home}
            </Link>
            <Link href={`/${locale}/pricing`} className="hover:text-white">
              {dict.nav.pricing}
            </Link>
            <Link href={`/${locale}/dashboard`} className="hover:text-white">
              {dict.nav.dashboard}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-full bg-emerald-400 px-4 py-2 font-medium text-black hover:bg-emerald-300"
            >
              {dict.nav.login}
            </Link>
          </nav>

          <LanguageSwitcher
            currentLocale={locale}
            label={dict.languageSwitcher.label}
            names={{
              en: dict.languageSwitcher.english,
              et: dict.languageSwitcher.estonian,
            }}
          />
        </div>

        <nav className="border-t border-white/10 px-4 py-2 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto pb-1">
            <Link
              href={`/${locale}`}
              className="whitespace-nowrap rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90"
            >
              {dict.nav.home}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="whitespace-nowrap rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90"
            >
              {dict.nav.pricing}
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              className="whitespace-nowrap rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/90"
            >
              {dict.nav.dashboard}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="whitespace-nowrap rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black"
            >
              {dict.nav.login}
            </Link>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 text-sm text-white/60">
          <p>{dict.footer.copyright}</p>
          <p>2026</p>
        </div>
      </footer>
    </div>
  )
}
