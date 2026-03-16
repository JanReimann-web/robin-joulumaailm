import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BrandLogo from '@/components/site/BrandLogo'
import LanguageSwitcher from '@/components/site/LanguageSwitcher'
import CookieSettingsButton from '@/components/site/CookieSettingsButton'
import SiteNavigation from '@/components/site/SiteNavigation'
import { defaultLocale, isLocale, locales } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { COMPANY_ADDRESS, COMPANY_NAME, getLegalCopy } from '@/lib/site/legal'

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
  const legalCopy = getLegalCopy(locale)

  return (
    <div className="min-h-screen overflow-x-hidden" lang={locale}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl min-w-0 items-start justify-between gap-3 px-4 py-3 sm:items-center">
          <BrandLogo
            href={`/${locale}`}
            tone="header"
            size="sm"
            className="max-w-[15rem] truncate sm:max-w-none"
            wordmarkClassName="max-w-[11rem] sm:max-w-none"
          />

          <SiteNavigation locale={locale} labels={dict.nav} mode="desktop" />

          <LanguageSwitcher
            currentLocale={locale}
            label={dict.languageSwitcher.label}
            names={{
              en: dict.languageSwitcher.english,
              et: dict.languageSwitcher.estonian,
            }}
          />
        </div>

        <SiteNavigation locale={locale} labels={dict.nav} mode="mobile" />
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 text-sm text-white/60">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p>{dict.footer.copyright}</p>
              <p>
                <span className="font-medium text-white/75">{legalCopy.footer.companyLabel}:</span>{' '}
                {COMPANY_NAME}
              </p>
              <p>
                <span className="font-medium text-white/75">{legalCopy.footer.addressLabel}:</span>{' '}
                {COMPANY_ADDRESS}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/70">
              <CookieSettingsButton
                label={legalCopy.footer.cookieSettings}
                className="transition hover:text-white"
              />
              <Link href={`/${locale}/cookies`} className="transition hover:text-white">
                {legalCopy.footer.cookiePolicy}
              </Link>
              <Link href={`/${locale}/privacy`} className="transition hover:text-white">
                {legalCopy.footer.privacyPolicy}
              </Link>
              <Link href={`/${locale}/terms`} className="transition hover:text-white">
                {legalCopy.footer.terms}
              </Link>
              <Link href={`/${locale}/faq`} className="transition hover:text-white">
                {legalCopy.footer.faq}
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/45">
            <p>{SITE_URL}</p>
            <p>2026</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
