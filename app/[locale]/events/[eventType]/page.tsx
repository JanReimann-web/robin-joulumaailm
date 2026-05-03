import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { weddingPageCopy as localizedWeddingPageCopy } from '@/lib/i18n/generated'
import ShowcasePreviewCard from '@/components/showcase/ShowcasePreviewCard'
import TrackedLink from '@/components/site/TrackedLink'
import { isLocale, locales } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { eventSlugToType, eventTypeToSlug, EVENT_ROUTE_SLUGS } from '@/lib/lists/event-route'
import { maintenanceModeEnabled } from '@/lib/site/maintenance'
import { buildLocalizedAlternates, buildLocalizedUrl } from '@/lib/site/url'
import { getWeddingIntentContent } from '@/lib/site/wedding-intent'
import { getPublishedShowcaseEntryForEvent } from '@/lib/showcase.server'

type EventPageProps = {
  params: {
    locale: string
    eventType: string
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const weddingPageCopy = {
  en: {
    proofTitle: 'Why the wedding page works as a registry alternative',
    proofBody:
      'Giftlist Studio is strongest when the couple wants one elegant page with private sharing, duplicate-proof reservations, and a guest flow that feels simple.',
    proofPoints: [
      'Beautiful public page instead of a generic registry screen',
      'Password protection when you want invited guests only',
      'Reservations prevent duplicate gifts before guests buy',
    ],
  },
  et: {
    proofTitle: 'Miks pulmaleht töötab registri alternatiivina',
    proofBody:
      'Giftlist Studio on kõige tugevam siis, kui paar tahab ühte elegantset lehte koos privaatse jagamise, topeltkingitusi vältiva broneerimise ja külaliste jaoks lihtsa vooga.',
    proofPoints: [
      'Ilus avalik leht tavalise registrivaate asemel',
      'Paroolikaitse siis, kui soovid ainult kutsutud külalisi',
      'Broneeringud hoiavad topeltkingid ära enne ostu',
    ],
  },
} as const

export function generateStaticParams() {
  if (maintenanceModeEnabled) {
    return []
  }

  return locales.flatMap((locale) =>
    EVENT_ROUTE_SLUGS.map((eventSlug) => ({
      locale,
      eventType: eventSlug,
    }))
  )
}

export function generateMetadata({ params }: EventPageProps): Metadata {
  if (!isLocale(params.locale)) {
    return {}
  }

  const mappedEventType = eventSlugToType(params.eventType)
  if (!mappedEventType) {
    return {}
  }

  const dict = getDictionary(params.locale)
  const content = dict.eventPages[mappedEventType]
  const canonical = buildLocalizedUrl(params.locale, `/events/${params.eventType}`)

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: {
      canonical,
      languages: buildLocalizedAlternates(`/events/${eventTypeToSlug(mappedEventType)}`),
    },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.seoTitle,
      description: content.seoDescription,
    },
  }
}

export default async function EventTypePage({ params }: EventPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const mappedEventType = eventSlugToType(params.eventType)
  if (!mappedEventType) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)
  const eventName = dict.events[mappedEventType]
  const content = dict.eventPages[mappedEventType]
  const showcaseEntry = await getPublishedShowcaseEntryForEvent(mappedEventType)
  const isWeddingPage = mappedEventType === 'wedding'
  const weddingCopy = localizedWeddingPageCopy[locale]
  const weddingIntentLinks = [
    {
      href: `/${locale}/wedding-gift-list`,
      label: getWeddingIntentContent(locale, 'wedding-gift-list').eyebrow,
    },
    {
      href: `/${locale}/private-wedding-registry`,
      label: getWeddingIntentContent(locale, 'private-wedding-registry').eyebrow,
    },
    {
      href: `/${locale}/wedding-registry-alternative`,
      label: getWeddingIntentContent(locale, 'wedding-registry-alternative').eyebrow,
    },
    {
      href: `/${locale}/wedding-gift-page-for-guests`,
      label: getWeddingIntentContent(locale, 'wedding-gift-page-for-guests').eyebrow,
    },
  ]
  const primaryActionHref = isWeddingPage && showcaseEntry
    ? `/l/${showcaseEntry.slug}?template=${showcaseEntry.templateId}&demo=event-page`
    : `/${locale}/login`
  const primaryActionLabel = isWeddingPage && showcaseEntry
    ? dict.hero.primaryCta
    : dict.eventPages.ctaPrimary
  const secondaryActionHref = isWeddingPage
    ? `/${locale}/login`
    : `/${locale}/pricing`
  const secondaryActionLabel = isWeddingPage
    ? dict.hero.secondaryCta
    : dict.eventPages.ctaSecondary

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <Link
        href={`/${locale}`}
        className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10"
      >
        {dict.eventPages.backHomeAction}
      </Link>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
          {eventName}
        </p>

        <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
          {content.headline}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-slate-200">{content.intro}</p>

        <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
          <TrackedLink
            href={primaryActionHref}
            eventName={isWeddingPage && showcaseEntry ? 'view_example' : 'click_start_trial'}
            eventParams={{
              locale,
              placement: `${mappedEventType}_hero`,
              event_type: mappedEventType,
            }}
            className="rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black hover:bg-emerald-300 sm:text-left"
          >
            {primaryActionLabel}
          </TrackedLink>
          <TrackedLink
            href={secondaryActionHref}
            eventName={isWeddingPage ? 'click_start_trial' : 'view_pricing'}
            eventParams={{
              locale,
              placement: `${mappedEventType}_hero`,
              event_type: mappedEventType,
            }}
            className="rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 sm:text-left"
          >
            {secondaryActionLabel}
          </TrackedLink>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">{dict.eventPages.processTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {dict.eventPages.processSteps.map((step) => (
              <li key={step}>- {step}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">{dict.eventPages.sampleTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {content.samples.map((sample) => (
              <li key={sample}>- {sample}</li>
            ))}
          </ul>
        </article>
      </div>

      {isWeddingPage && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-white">{weddingCopy.proofTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            {weddingCopy.proofBody}
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {weddingCopy.proofPoints.map((point) => (
              <li
                key={point}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-100"
              >
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {weddingIntentLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 transition hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {showcaseEntry && (
        <section className="mt-8 space-y-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-white">
              {dict.eventPages.liveExampleTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              {dict.eventPages.liveExampleBody}
            </p>
          </div>

          <ShowcasePreviewCard
            locale={locale}
            labels={dict.gallery}
            dashboardLabels={dict.dashboard}
            eventLabel={eventName}
            eventType={mappedEventType}
            entry={showcaseEntry}
          />
        </section>
      )}
    </section>
  )
}
