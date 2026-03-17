import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LeadCaptureForm from '@/components/marketing/LeadCaptureForm'
import TrackedLink from '@/components/site/TrackedLink'
import ShowcasePreviewCard from '@/components/showcase/ShowcasePreviewCard'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { eventTypeToSlug } from '@/lib/lists/event-route'
import { buildLocalizedUrl } from '@/lib/site/url'
import { getPublishedShowcaseEntryForEvent } from '@/lib/showcase.server'

type LocalePageProps = {
  params: {
    locale: string
  }
}

const eventKeyOrder = [
  'wedding',
  'birthday',
  'kidsBirthday',
  'babyShower',
  'graduation',
  'housewarming',
  'christmas',
] as const

const homeMarketingCopy = {
  en: {
    showcaseTitle: 'See the wedding experience before you commit',
    showcaseBody:
      'This is more than a gift list. It brings together your story, photos, video, gift reservations, and playful guest moments on one elegant wedding page.',
    testimonialsTitle: 'What early couples care about',
    testimonials: [
      {
        quote: 'We wanted one elegant link instead of a messy message thread and duplicated gifts.',
        author: 'Early wedding tester',
      },
      {
        quote: 'The page felt like part wedding story, part gift guide, and part guest experience.',
        author: 'Couple in private beta',
      },
      {
        quote: 'Wedding was the first use case, but you can already see birthdays and baby showers as the next purchases.',
        author: 'US launch interview',
      },
    ],
    lifecycleTitle: 'How couples use Giftlist Studio after the wedding',
    lifecycleBody:
      'Wedding is the entry point because it is the highest-intent event. Once the product earns trust there, the same household can come back for baby showers, birthdays, Christmas, graduations, and other milestone events.',
    lifecycleSteps: [
      {
        title: 'Win the first purchase with a wedding page',
        body: 'Couples get a beautiful registry alternative that prevents duplicate gifts and is easy to share with guests.',
      },
      {
        title: 'Keep the account for the next household event',
        body: 'The same customer already understands the product when a baby shower, first birthday, or housewarming comes next.',
      },
      {
        title: 'Turn one event into repeat revenue',
        body: 'Lifecycle events become simpler follow-up purchases because the customer has already seen the guest flow work once.',
      },
    ],
    leadTitle: 'Get launch updates for wedding-first Giftlist Studio',
    leadBody:
      'Leave your email to get launch news, new example pages, and updates when more lifecycle event templates go live.',
    leadInputLabel: 'Email address',
    leadInputPlaceholder: 'you@example.com',
    leadSubmitLabel: 'Get updates',
    leadSuccessMessage: 'Thanks. We saved your email for launch updates.',
    leadErrorMessage: 'We could not save your email. Please try again.',
    leadNote: 'We only use your email for product and launch updates.',
    leadPrivacyLabel: 'Privacy policy',
  },
  et: {
    showcaseTitle: 'Vaata pulmakogemust enne, kui otsustad',
    showcaseBody:
      'See on rohkem kui kinginimekiri. Ühele elegantsele pulmalehele tulevad kokku teie lugu, fotod, video, kingituste broneeringud ja mängulised külaliste hetked.',
    testimonialsTitle: 'Mis on varastele paaridele oluline',
    testimonials: [
      {
        quote: 'Tahtsime ühte elegantset linki, mitte segast sõnumivahetust ja topeltkingitusi.',
        author: 'Varajane pulmatestija',
      },
      {
        quote: 'See tundus korraga pulma looleht, kingiabi ja külaliste kogemus, mitte lihtsalt nimekiri.',
        author: 'Privaatse beetaga paar',
      },
      {
        quote: 'Pulm oli esimene kasutus, aga juba praegu on näha, et järgmised ostud tulevad baby shower’i ja sünnipäevade pealt.',
        author: 'USA launch intervjuu',
      },
    ],
    lifecycleTitle: 'Kuidas paarid kasutavad Giftlist Studiot pärast pulmi',
    lifecycleBody:
      'Pulm on sisenemispunkt, sest seal on ostuintent kõige kõrgem. Kui toode teenib usalduse siin, saab sama majapidamine tulla tagasi baby shower’ite, sünnipäevade, jõulude, lõpetamiste ja muude tähtsate sündmuste jaoks.',
    lifecycleSteps: [
      {
        title: 'Võida esimene ost pulmalehega',
        body: 'Paar saab ilusa registri alternatiivi, mis hoiab topeltkingid ära ja mida on lihtne külalistega jagada.',
      },
      {
        title: 'Hoia konto alles järgmise pere sündmuse jaoks',
        body: 'Sama klient saab tootest juba aru, kui järgmisena tuleb baby shower, esimene sünnipäev või soolaleib.',
      },
      {
        title: 'Muuda üks sündmus korduvaks käibeks',
        body: 'Elutsükli järgmised sündmused muutuvad lihtsamaks jätkuostuks, sest kliendil on üks kord töötav külaliste voog juba nähtud.',
      },
    ],
    leadTitle: 'Saa wedding-first Giftlist Studio launch-uudiseid',
    leadBody:
      'Jäta oma e-post, et saada launch-uudiseid, uusi näidislehti ja infot, kui järgmised elutsükli sündmuste mallid avalikuks lähevad.',
    leadInputLabel: 'E-posti aadress',
    leadInputPlaceholder: 'sina@naide.ee',
    leadSubmitLabel: 'Saa uuendusi',
    leadSuccessMessage: 'Aitäh. Sinu e-post on salvestatud launch-uudiste jaoks.',
    leadErrorMessage: 'E-posti salvestamine ei õnnestunud. Proovi uuesti.',
    leadNote: 'Kasutame sinu e-posti ainult toote- ja launch-uudiste jaoks.',
    leadPrivacyLabel: 'Privaatsuspoliitika',
  },
} as const

export function generateMetadata({ params }: LocalePageProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = buildLocalizedUrl(locale)

  return {
    title: dict.hero.seoTitle,
    description: dict.hero.seoDescription,
    alternates: {
      canonical: url,
      languages: {
        en: buildLocalizedUrl('en'),
        et: buildLocalizedUrl('et'),
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

export default async function HomePage({ params }: LocalePageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)
  const copy = homeMarketingCopy[locale]
  const weddingShowcaseEntry = await getPublishedShowcaseEntryForEvent('wedding')
  const primaryHeroHref = weddingShowcaseEntry
    ? `/l/${weddingShowcaseEntry.slug}?template=${weddingShowcaseEntry.templateId}&demo=home`
    : `/${locale}/gallery`
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Giftlist Studio',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    url: buildLocalizedUrl(locale),
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
          <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr),30rem]">
            <div>
              <div className="mb-5">
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
                <TrackedLink
                  href={primaryHeroHref}
                  eventName="view_example"
                  eventParams={{
                    locale,
                    placement: 'home_hero',
                    event_type: 'wedding',
                    slug: weddingShowcaseEntry?.slug ?? 'gallery',
                  }}
                  className="rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-black hover:bg-emerald-300 sm:text-left"
                >
                  {dict.hero.primaryCta}
                </TrackedLink>
                <TrackedLink
                  href={`/${locale}/login`}
                  eventName="click_start_trial"
                  eventParams={{
                    locale,
                    placement: 'home_hero',
                  }}
                  className="rounded-full border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 sm:text-left"
                >
                  {dict.hero.secondaryCta}
                </TrackedLink>
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

            {weddingShowcaseEntry && (
              <div className="space-y-4 self-start">
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5">
                  <h2 className="text-xl font-semibold text-white">{copy.showcaseTitle}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{copy.showcaseBody}</p>
                </div>

                <ShowcasePreviewCard
                  locale={locale}
                  labels={dict.gallery}
                  dashboardLabels={dict.dashboard}
                  eventLabel={dict.events.wedding}
                  eventType="wedding"
                  entry={weddingShowcaseEntry}
                />
              </div>
            )}
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
            {copy.testimonialsTitle}
          </h2>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {copy.testimonials.map((testimonial) => (
            <article key={testimonial.quote} className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <p className="text-sm leading-7 text-slate-100">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                {testimonial.author}
              </p>
            </article>
          ))}
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
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {copy.lifecycleTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            {copy.lifecycleBody}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {copy.lifecycleSteps.map((step, index) => (
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
            <TrackedLink
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
            </TrackedLink>
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

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <LeadCaptureForm
          locale={locale}
          source="home"
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
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{dict.home.ctaTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 sm:text-base">
            {dict.home.ctaBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedLink
              href={`/${locale}/login`}
              eventName="click_start_trial"
              eventParams={{
                locale,
                placement: 'home_footer_cta',
              }}
              className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              {dict.home.ctaPrimary}
            </TrackedLink>
            <TrackedLink
              href={`/${locale}/gallery`}
              eventName="view_example"
              eventParams={{
                locale,
                placement: 'home_footer_cta',
                event_type: 'gallery',
              }}
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {dict.home.ctaSecondary}
            </TrackedLink>
          </div>
        </div>
      </section>
    </div>
  )
}
