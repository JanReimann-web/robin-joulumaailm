import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { resolveBillingMarketFromHeaders } from '@/lib/billing/markets.server'
import { formatBillingPlanPrice, formatBillingPriceCents } from '@/lib/billing/pricing'
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
  const requestHeaders = headers()
  const billingCurrency = resolveBillingCurrencyFromHeaders(requestHeaders)
  const billingMarket = resolveBillingMarketFromHeaders(requestHeaders)
  const marketNotice = billingMarket.availability === 'blocked_sanctioned'
    ? dict.pricing.marketSanctionedNotice
    : billingMarket.availability === 'blocked_unsupported'
      ? dict.pricing.marketUnsupportedNotice
      : billingMarket.availability === 'unknown'
        ? dict.pricing.marketUnknownNotice
        : null

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{dict.pricing.title}</h1>
      <p className="mt-3 text-sm text-slate-200">{dict.pricing.trialLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.draftOnlyLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.perListLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.extensionLine}</p>
      <p className="mt-1 text-sm text-slate-400">{dict.pricing.retentionLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.upgradeLine}</p>
      <p className="mt-3 text-sm text-emerald-200">{dict.pricing.launchRegionsLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.taxCollectionLine}</p>

      {marketNotice && (
        <p className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {marketNotice}
        </p>
      )}

      <article className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">{dict.pricing.upgradeTitle}</h2>
        <p className="mt-2 text-sm text-slate-300">{dict.pricing.upgradeResetLine}</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          <li>- {dict.pricing.upgradeBaseToPremium}: {formatBillingPriceCents(1295, billingCurrency, params.locale)}</li>
          <li>- {dict.pricing.upgradeBaseToPlatinum}: {formatBillingPriceCents(2495, billingCurrency, params.locale)}</li>
          <li>- {dict.pricing.upgradePremiumToPlatinum}: {formatBillingPriceCents(1295, billingCurrency, params.locale)}</li>
        </ul>
      </article>

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
