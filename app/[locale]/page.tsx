import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BrandLogo from '@/components/site/BrandLogo'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { eventTypeToSlug } from '@/lib/lists/event-route'

type LocalePageProps = {
  params: {
    locale: string
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://giftliststudio.com'
const eventKeyOrder = [
  'wedding',
  'birthday',
  'kidsBirthday',
  'babyShower',
  'graduation',
  'housewarming',
  'christmas',
] as const

export function generateMetadata({ params }: LocalePageProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = `${SITE_URL}/${locale}`

  return {
    title: dict.hero.seoTitle,
    description: dict.hero.seoDescription,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en`,
        et: `${SITE_URL}/et`,
      },
    },
    openGraph: {
      title: dict.hero.seoTitle,
      description: dict.hero.seoDescription,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.hero.seoTitle,
      description: dict.hero.seoDescription,
    },
  }
}

export default function HomePage({ params }: LocalePageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Giftlist Studio',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}/${locale}`,
    description: dict.hero.seoDescription,
    inLanguage: locale,
    featureList: [
      dict.highlights.templateTitle,
      dict.highlights.reserveTitle,
      dict.highlights.trialTitle,
      'QR sharing',
      'Password-protected public list',
    ],
  }
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dict.home.faqEntries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:pb-12 sm:pt-14">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 md:p-10">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <BrandLogo
              href={`/${locale}`}
              tone="header"
              size="lg"
              showTagline
              className="max-w-full"
            />

            <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              {dict.hero.badge}
            </p>
          </div>

          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-6xl">
            {dict.hero.title}
          </h1>

          <p className="mt-5 max-w-3xl text-base text-slate-200 sm:text-lg">
            {dict.hero.subtitle}
          </p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href={`/${locale}/login`}
              className="rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black hover:bg-emerald-300 sm:text-left"
            >
              {dict.hero.primaryCta}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 sm:text-left"
            >
              {dict.hero.secondaryCta}
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {dict.hero.proofPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-slate-100"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {dict.highlights.title}
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            {dict.highlights.subtitle}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">{dict.highlights.templateTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{dict.highlights.templateBody}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">{dict.highlights.reserveTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{dict.highlights.reserveBody}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">{dict.highlights.trialTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{dict.highlights.trialBody}</p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {dict.home.processTitle}
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            {dict.home.processSubtitle}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {dict.home.processSteps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                0{index + 1}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-200">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{dict.events.title}</h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">{dict.events.subtitle}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {eventKeyOrder.map((eventKey) => (
            <Link
              key={eventKey}
              href={`/${locale}/events/${eventTypeToSlug(eventKey)}`}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-emerald-300/30 hover:bg-slate-900/80"
            >
              <p className="text-lg font-semibold text-white">{dict.events[eventKey]}</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {dict.eventPages[eventKey].intro}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                {dict.eventPages.readMoreAction}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{dict.home.faqTitle}</h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">{dict.home.faqSubtitle}</p>
        </div>

        <div className="mt-6 space-y-3">
          {dict.home.faqEntries.map((entry, index) => (
            <details
              key={entry.question}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 open:border-white/20 open:bg-white/[0.07]"
              open={index === 0}
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-white marker:hidden">
                <span className="flex items-start justify-between gap-4">
                  <span>{entry.question}</span>
                  <span className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45 transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-200 sm:text-base">
                {entry.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{dict.home.ctaTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 sm:text-base">
            {dict.home.ctaBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/login`}
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              {dict.home.ctaPrimary}
            </Link>
            <Link
              href={`/${locale}/gallery`}
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {dict.home.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
