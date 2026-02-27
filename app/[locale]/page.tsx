import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'

type LocalePageProps = {
  params: {
    locale: string
  }
}

const eventKeyOrder = ['wedding', 'birthday', 'babyShower', 'christmas'] as const

export default function HomePage({ params }: LocalePageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)

  return (
    <div>
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:pb-12 sm:pt-14">
        <p className="mb-4 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
          {dict.hero.badge}
        </p>

        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-6xl">
          {dict.hero.title}
        </h1>

        <p className="mt-5 max-w-2xl text-base text-slate-200 sm:text-lg">{dict.hero.subtitle}</p>

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
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-12 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">{dict.highlights.templateTitle}</h2>
          <p className="mt-3 text-sm text-slate-200">{dict.highlights.templateBody}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">{dict.highlights.reserveTitle}</h2>
          <p className="mt-3 text-sm text-slate-200">{dict.highlights.reserveBody}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">{dict.highlights.trialTitle}</h2>
          <p className="mt-3 text-sm text-slate-200">{dict.highlights.trialBody}</p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <h3 className="mb-4 text-xl font-semibold text-white">{dict.events.title}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {eventKeyOrder.map((eventKey) => (
            <div
              key={eventKey}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200"
            >
              {dict.events[eventKey]}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
