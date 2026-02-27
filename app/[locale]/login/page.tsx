import { notFound } from 'next/navigation'
import LoginPanel from '@/components/auth/LoginPanel'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'

type LoginPageProps = {
  params: {
    locale: string
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
