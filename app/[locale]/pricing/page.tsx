import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { formatBillingPlanPrice } from '@/lib/billing/pricing'
import { resolveBillingCurrencyFromHeaders } from '@/lib/billing/pricing.server'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'

type PricingPageProps = {
  params: {
    locale: string
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

export function generateMetadata({ params }: PricingPageProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = `${SITE_URL}/${locale}/pricing`

  return {
    title: dict.pricing.title,
    description: dict.pricing.retentionLine,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en/pricing`,
        et: `${SITE_URL}/et/pricing`,
      },
    },
    openGraph: {
      title: dict.pricing.title,
      description: dict.pricing.retentionLine,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.pricing.title,
      description: dict.pricing.retentionLine,
    },
  }
}

export default function PricingPage({ params }: PricingPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const dict = getDictionary(params.locale)
  const billingCurrency = resolveBillingCurrencyFromHeaders(headers())

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{dict.pricing.title}</h1>
      <p className="mt-3 text-sm text-slate-200">{dict.pricing.trialLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.draftOnlyLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.perListLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.extensionLine}</p>
      <p className="mt-1 text-sm text-slate-400">{dict.pricing.retentionLine}</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">{dict.pricing.baseName}</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-300">
            {formatBillingPlanPrice('base', billingCurrency, params.locale)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {dict.pricing.baseFeatures.map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 p-6">
          <h2 className="text-xl font-semibold text-white">{dict.pricing.premiumName}</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-200">
            {formatBillingPlanPrice('premium', billingCurrency, params.locale)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-100">
            {dict.pricing.premiumFeatures.map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-6">
          <h2 className="text-xl font-semibold text-white">{dict.pricing.platinumName}</h2>
          <p className="mt-2 text-2xl font-bold text-amber-100">
            {formatBillingPlanPrice('platinum', billingCurrency, params.locale)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-100">
            {dict.pricing.platinumFeatures.map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
