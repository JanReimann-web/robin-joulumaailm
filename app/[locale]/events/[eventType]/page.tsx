import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, locales } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { eventSlugToType, eventTypeToSlug, EVENT_ROUTE_SLUGS } from '@/lib/lists/event-route'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

type EventPageProps = {
  params: {
    locale: string
    eventType: string
  }
}

export function generateStaticParams() {
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
  const canonical = `${SITE_URL}/${params.locale}/events/${params.eventType}`

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en/events/${eventTypeToSlug(mappedEventType)}`,
        et: `${SITE_URL}/et/events/${eventTypeToSlug(mappedEventType)}`,
      },
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

export default function EventTypePage({ params }: EventPageProps) {
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
          <Link
            href={`/${locale}/login`}
            className="rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black hover:bg-emerald-300 sm:text-left"
          >
            {dict.eventPages.ctaPrimary}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 sm:text-left"
          >
            {dict.eventPages.ctaSecondary}
          </Link>
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
    </section>
  )
}
