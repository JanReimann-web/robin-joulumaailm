import LeadCaptureForm from '@/components/marketing/LeadCaptureForm'
import ShowcasePreviewCard from '@/components/showcase/ShowcasePreviewCard'
import TrackedLink from '@/components/site/TrackedLink'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/types'
import type { ShowcaseGalleryEntry } from '@/lib/showcase'
import type { WeddingIntentSlug } from '@/lib/site/wedding-intent'

type WeddingIntentLandingProps = {
  locale: Locale
  slug: WeddingIntentSlug
  content: {
    eyebrow: string
    title: string
    body: string
    benefitTitle: string
    benefits: string[]
    faqTitle: string
    faqEntries: Array<{
      question: string
      answer: string
    }>
  }
  dict: Dictionary
  showcaseEntry: ShowcaseGalleryEntry | null
}

const leadCopy = {
  en: {
    title: 'Get wedding launch updates',
    body:
      'Leave your email to hear about new wedding examples, launch updates, and the next lifecycle event templates.',
    inputLabel: 'Email address',
    inputPlaceholder: 'you@example.com',
    submitLabel: 'Get updates',
    successMessage: 'Thanks. We saved your email for launch updates.',
    errorMessage: 'We could not save your email. Please try again.',
    note: 'We only use your email for product and launch updates.',
    privacyLabel: 'Privacy policy',
  },
  et: {
    title: 'Saa pulma-launchi uuendusi',
    body:
      'Jäta oma e-post, et kuulda uutest pulmanäidistest, launch-uudistest ja järgmistest elutsükli sündmuste mallidest.',
    inputLabel: 'E-posti aadress',
    inputPlaceholder: 'sina@naide.ee',
    submitLabel: 'Saa uuendusi',
    successMessage: 'Aitäh. Sinu e-post on salvestatud launch-uudiste jaoks.',
    errorMessage: 'E-posti salvestamine ei õnnestunud. Proovi uuesti.',
    note: 'Kasutame sinu e-posti ainult toote- ja launch-uudiste jaoks.',
    privacyLabel: 'Privaatsuspoliitika',
  },
} as const

export default function WeddingIntentLanding({
  locale,
  slug,
  content,
  dict,
  showcaseEntry,
}: WeddingIntentLandingProps) {
  const lead = leadCopy[locale]
  const primaryHref = showcaseEntry
    ? `/l/${showcaseEntry.slug}?template=${showcaseEntry.templateId}&demo=intent`
    : `/${locale}/gallery`

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 md:p-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr),30rem]">
          <div>
            <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              {content.eyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              {content.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              {content.body}
            </p>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <TrackedLink
                href={primaryHref}
                eventName="view_example"
                eventParams={{
                  locale,
                  placement: slug,
                  event_type: 'wedding',
                }}
                className="rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black hover:bg-emerald-300 sm:text-left"
              >
                {locale === 'et' ? 'Vaata päris pulmalehte' : 'See live wedding page'}
              </TrackedLink>
              <TrackedLink
                href={`/${locale}/login`}
                eventName="click_start_trial"
                eventParams={{
                  locale,
                  placement: slug,
                  event_type: 'wedding',
                }}
                className="rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 sm:text-left"
              >
                {locale === 'et' ? 'Alusta tasuta katseaega' : 'Start free trial'}
              </TrackedLink>
            </div>
          </div>

          {showcaseEntry && (
            <ShowcasePreviewCard
              locale={locale}
              labels={dict.gallery}
              dashboardLabels={dict.dashboard}
              eventLabel={dict.events.wedding}
              eventType="wedding"
              entry={showcaseEntry}
            />
          )}
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-semibold text-white">{content.benefitTitle}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {content.benefits.map((benefit) => (
            <article key={benefit} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-100">
              {benefit}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{content.faqTitle}</h2>
        </div>

        <div className="mt-6 space-y-3">
          {content.faqEntries.map((entry, index) => (
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

      <LeadCaptureForm
        locale={locale}
        source="wedding-intent"
        title={lead.title}
        body={lead.body}
        inputLabel={lead.inputLabel}
        inputPlaceholder={lead.inputPlaceholder}
        submitLabel={lead.submitLabel}
        successMessage={lead.successMessage}
        errorMessage={lead.errorMessage}
        note={lead.note}
        privacyLabel={lead.privacyLabel}
        className="mt-8"
      />
    </section>
  )
}
