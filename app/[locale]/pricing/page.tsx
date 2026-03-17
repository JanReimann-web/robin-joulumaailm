import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import LeadCaptureForm from '@/components/marketing/LeadCaptureForm'
import TrackedLink from '@/components/site/TrackedLink'
import { resolveBillingMarketFromHeaders } from '@/lib/billing/markets.server'
import { formatBillingPlanPrice, formatBillingPriceCents } from '@/lib/billing/pricing'
import { resolveBillingCurrencyFromHeaders } from '@/lib/billing/pricing.server'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { buildLocalizedUrl } from '@/lib/site/url'

type PricingPageProps = {
  params: {
    locale: string
  }
}

const pricingMarketingCopy = {
  en: {
    eyebrow: 'Wedding-first launch pricing',
    intro:
      'Choose the 90-day event hosting pass that matches your wedding page today and gives you room for future lifecycle events later.',
    trustPoints: [
      'Secure Stripe checkout',
      'No subscription',
    ],
    planCta: 'Start free trial',
    lifecycleTitle: 'Lifecycle, upgrades, and cleanup rules',
    lifecycleBody:
      'The paid pass is built for a live event window. You can upgrade the same list later, extend it if needed, and follow the lifecycle rules below when the active period ends.',
    trustBlock: 'No subscription. 14-day free build period. Publish only when ready.',
    leadTitle: 'Want pricing and launch updates in your inbox?',
    leadBody:
      'Leave your email to get notified about launch updates, plan changes, and new event templates after the wedding-first release.',
    leadInputLabel: 'Email address',
    leadInputPlaceholder: 'you@example.com',
    leadSubmitLabel: 'Get updates',
    leadSuccessMessage: 'Thanks. We saved your email for pricing and launch updates.',
    leadErrorMessage: 'We could not save your email. Please try again.',
    leadNote: 'We only use your email for product and launch updates.',
    leadPrivacyLabel: 'Privacy policy',
  },
  et: {
    eyebrow: 'Wedding-first launch hinnastus',
    intro:
      'Vali 90-päevane sündmusepass, mis sobib täna sinu pulmalehele ja jätab hiljem ruumi järgmisteks elutsükli sündmusteks.',
    trustPoints: [
      'Turvaline Stripe checkout',
      'Tellimust ei ole',
    ],
    planCta: 'Alusta tasuta katseaega',
    lifecycleTitle: 'Elutsükkel, upgrade’id ja andmete korrastus',
    lifecycleBody:
      'Tasuline pass on ehitatud päris sündmuse akna jaoks. Sama nimekirja saad hiljem uuendada, vajadusel pikendada ning aktiivse perioodi lõpus kehtivad allpool toodud elutsükli reeglid.',
    trustBlock: 'Tellimust ei ole. 14-päevane tasuta ehitusperiood. Avalikusta alles siis, kui kõik on valmis.',
    leadTitle: 'Kas tahad hinnastuse ja launchi uuendusi postkasti?',
    leadBody:
      'Jäta oma e-post, et saada launch-uudiseid, paketimuudatusi ja infot järgmiste sündmuste mallide kohta pärast wedding-first väljalaset.',
    leadInputLabel: 'E-posti aadress',
    leadInputPlaceholder: 'sina@naide.ee',
    leadSubmitLabel: 'Saa uuendusi',
    leadSuccessMessage: 'Aitäh. Sinu e-post on salvestatud hinnastuse ja launch-uudiste jaoks.',
    leadErrorMessage: 'E-posti salvestamine ei õnnestunud. Proovi uuesti.',
    leadNote: 'Kasutame sinu e-posti ainult toote- ja launch-uudiste jaoks.',
    leadPrivacyLabel: 'Privaatsuspoliitika',
  },
} as const

export function generateMetadata({ params }: PricingPageProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = buildLocalizedUrl(locale, '/pricing')

  return {
    title: dict.pricing.seoTitle,
    description: dict.pricing.seoDescription,
    alternates: {
      canonical: url,
      languages: {
        en: buildLocalizedUrl('en', '/pricing'),
        et: buildLocalizedUrl('et', '/pricing'),
      },
    },
    openGraph: {
      title: dict.pricing.seoTitle,
      description: dict.pricing.seoDescription,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.pricing.seoTitle,
      description: dict.pricing.seoDescription,
    },
  }
}

export default function PricingPage({ params }: PricingPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)
  const copy = pricingMarketingCopy[locale]
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
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 md:p-10">
        <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
          {copy.eyebrow}
        </p>
        <h1 className="mt-5 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
          {dict.pricing.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
          {copy.intro}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {copy.trustPoints.map((point) => (
            <span
              key={point}
              className="rounded-full border border-white/15 bg-slate-950/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-100"
            >
              {point}
            </span>
          ))}
        </div>
        <div className="mt-6 space-y-1 text-sm text-slate-300">
          <p>{dict.pricing.trialLine}</p>
          <p>{dict.pricing.draftOnlyLine}</p>
          <p>{dict.pricing.perListLine}</p>
          <p>{dict.pricing.extensionLine}</p>
        </div>
      </div>

      {marketNotice && (
        <p className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {marketNotice}
        </p>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">{dict.pricing.baseName}</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-300">
            {formatBillingPlanPrice('base', billingCurrency, locale)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {dict.pricing.baseFeatures.map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
          <TrackedLink
            href={`/${locale}/login`}
            eventName="click_start_trial"
            eventParams={{
              locale,
              placement: 'pricing_base',
              plan_id: 'base',
            }}
            className="mt-6 inline-flex rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            {copy.planCta}
          </TrackedLink>
        </article>

        <article className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 p-6">
          <h2 className="text-xl font-semibold text-white">{dict.pricing.premiumName}</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-200">
            {formatBillingPlanPrice('premium', billingCurrency, locale)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-100">
            {dict.pricing.premiumFeatures.map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
          <TrackedLink
            href={`/${locale}/login`}
            eventName="click_start_trial"
            eventParams={{
              locale,
              placement: 'pricing_premium',
              plan_id: 'premium',
            }}
            className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {copy.planCta}
          </TrackedLink>
        </article>

        <article className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-6">
          <h2 className="text-xl font-semibold text-white">{dict.pricing.platinumName}</h2>
          <p className="mt-2 text-2xl font-bold text-amber-100">
            {formatBillingPlanPrice('platinum', billingCurrency, locale)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-100">
            {dict.pricing.platinumFeatures.map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
          <TrackedLink
            href={`/${locale}/login`}
            eventName="click_start_trial"
            eventParams={{
              locale,
              placement: 'pricing_platinum',
              plan_id: 'platinum',
            }}
            className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {copy.planCta}
          </TrackedLink>
        </article>
      </div>

      <article className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">{copy.lifecycleTitle}</h2>
        <p className="mt-2 text-sm text-slate-300">{copy.lifecycleBody}</p>
        <p className="mt-3 text-sm text-slate-400">{dict.pricing.retentionLine}</p>
        <p className="mt-1 text-sm text-slate-300">{dict.pricing.upgradeLine}</p>
        <h3 className="mt-5 text-base font-semibold text-white">{dict.pricing.upgradeTitle}</h3>
        <p className="mt-2 text-sm text-slate-300">{dict.pricing.upgradeResetLine}</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          <li>- {dict.pricing.upgradeBaseToPremium}: {formatBillingPriceCents(1295, billingCurrency, locale)}</li>
          <li>- {dict.pricing.upgradeBaseToPlatinum}: {formatBillingPriceCents(2495, billingCurrency, locale)}</li>
          <li>- {dict.pricing.upgradePremiumToPlatinum}: {formatBillingPriceCents(1295, billingCurrency, locale)}</li>
        </ul>
      </article>

      <article className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
        <p className="text-base font-semibold text-white sm:text-lg">{copy.trustBlock}</p>
      </article>

      <div className="mt-6">
        <LeadCaptureForm
          locale={locale}
          source="pricing"
          title={copy.leadTitle}
          body={copy.leadBody}
          inputLabel={copy.leadInputLabel}
          inputPlaceholder={copy.leadInputPlaceholder}
          submitLabel={copy.leadSubmitLabel}
          successMessage={copy.leadSuccessMessage}
          errorMessage={copy.leadErrorMessage}
          note={copy.leadNote}
          privacyLabel={copy.leadPrivacyLabel}
        />
      </div>
    </section>
  )
}
