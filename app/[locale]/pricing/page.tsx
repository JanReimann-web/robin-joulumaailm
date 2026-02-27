import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'

type PricingPageProps = {
  params: {
    locale: string
  }
}

export default function PricingPage({ params }: PricingPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const dict = getDictionary(params.locale)

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{dict.pricing.title}</h1>
      <p className="mt-3 text-sm text-slate-200">{dict.pricing.trialLine}</p>
      <p className="mt-1 text-sm text-slate-300">{dict.pricing.retentionLine}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">{dict.pricing.starterName}</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{dict.pricing.starterPrice}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            {dict.pricing.starterFeatures.map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 p-6">
          <h2 className="text-xl font-semibold text-white">{dict.pricing.proName}</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-200">{dict.pricing.proPrice}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-100">
            {dict.pricing.proFeatures.map((feature) => (
              <li key={feature}>- {feature}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
