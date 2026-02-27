import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DashboardShell from '@/components/auth/DashboardShell'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'

type DashboardPageProps = {
  params: {
    locale: string
  }
  searchParams?: {
    billing?: string | string[]
    list?: string | string[]
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

const getSingleSearchParam = (value: string | string[] | undefined) => {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? value[0] ?? null : value
}

export function generateMetadata({ params }: DashboardPageProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = `${SITE_URL}/${locale}/dashboard`

  return {
    title: dict.dashboard.title,
    description: dict.dashboard.subtitle,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en/dashboard`,
        et: `${SITE_URL}/et/dashboard`,
      },
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
      billingStatus={billingStatus}
      billingListId={listIdRaw}
    />
  )
}
