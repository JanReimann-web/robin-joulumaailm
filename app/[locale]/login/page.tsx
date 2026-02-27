import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LoginPanel from '@/components/auth/LoginPanel'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'

type LoginPageProps = {
  params: {
    locale: string
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

export function generateMetadata({ params }: LoginPageProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = `${SITE_URL}/${locale}/login`

  return {
    title: dict.login.title,
    description: dict.login.subtitle,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en/login`,
        et: `${SITE_URL}/et/login`,
      },
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function LoginPage({ params }: LoginPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)

  return <LoginPanel locale={locale} labels={dict.login} />
}
