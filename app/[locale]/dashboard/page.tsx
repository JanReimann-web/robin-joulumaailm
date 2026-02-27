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

const getSingleSearchParam = (value: string | string[] | undefined) => {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? value[0] ?? null : value
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
