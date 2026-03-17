import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { resolveBillingMarketFromHeaders } from '@/lib/billing/markets.server'
import { resolveBillingCurrencyFromHeaders } from '@/lib/billing/pricing.server'
import DashboardShell from '@/components/auth/DashboardShell'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { buildLocalizedAlternates, buildLocalizedUrl } from '@/lib/site/url'

type DashboardPageProps = {
  params: {
    locale: string
  }
  searchParams?: {
    billing?: string | string[]
    list?: string | string[]
  }
}

const getSingleSearchParam = (value: string | string[] | undefined) => {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? value[0] ?? null : value
}

export function generateMetadata({ params }: DashboardPageProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = buildLocalizedUrl(locale, '/dashboard')

  return {
    title: dict.dashboard.title,
    description: dict.dashboard.subtitle,
    alternates: {
      canonical: url,
      languages: buildLocalizedAlternates('/dashboard'),
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function DashboardPage({ params, searchParams }: DashboardPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)
  const requestHeaders = headers()
  const billingCurrency = resolveBillingCurrencyFromHeaders(requestHeaders)
  const billingMarket = resolveBillingMarketFromHeaders(requestHeaders)
  const billingRaw = getSingleSearchParam(searchParams?.billing)
  const listIdRaw = getSingleSearchParam(searchParams?.list)
  const billingStatus = billingRaw === 'success' || billingRaw === 'cancel'
    ? billingRaw
    : null

  return (
    <DashboardShell
      locale={locale}
      labels={dict.dashboard}
      eventLabels={dict.events}
      billingCurrency={billingCurrency}
      billingMarketAvailability={billingMarket.availability}
      billingStatus={billingStatus}
      billingListId={listIdRaw}
    />
  )
}
