'use client'

import { galleryCopy as localizedGalleryCopy } from '@/lib/i18n/generated'
import LeadCaptureForm from '@/components/marketing/LeadCaptureForm'
import TrackedLink from '@/components/site/TrackedLink'
import { Locale } from '@/lib/i18n/config'
import { Dictionary } from '@/lib/i18n/types'
import {
  EVENT_TYPES,
  EventType,
} from '@/lib/lists/types'
import { ShowcaseGalleryEntry } from '@/lib/showcase'
import ShowcasePreviewCard from '@/components/showcase/ShowcasePreviewCard'

type ShowcaseGalleryProps = {
  locale: Locale
  labels: Dictionary['gallery']
  eventLabels: Dictionary['events']
  dashboardLabels: Dictionary['dashboard']
  entries: ShowcaseGalleryEntry[]
  supportEmail: string
}

const interpolateLabel = (
  template: string,
  replacements: Record<string, string | number>
) => {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replace(`{${key}}`, String(value))
  }, template)
}

export const galleryCopy = {
  en: {
    featuredEyebrow: 'Featured wedding example',
    featuredTitle: 'Start with the wedding example that makes the product feel real',
    featuredBody:
      'Wedding is the first purchase. Once couples trust the product here, birthdays, baby showers, graduations, Christmas, and other events become natural repeat purchases.',
    collectionTitle: 'Live examples by event',
    collectionBody:
      'Each card below links to a finished public page so visitors can see how Giftlist Studio works before signing up.',
    sectionBody: 'Live example for {event}.',
    emptyTitle: 'The gallery is being curated',
    emptyBody:
      'There are no public examples available right now. Start your free trial or contact us if you want your event page featured early.',
    emptyAction: 'Start free trial',
    supportTitle: 'Want your event page featured?',
    supportBody:
      'Send a polished public example for review and we can consider it for the gallery. For support, partnerships, or early access requests, contact {email}.',
    supportAction: 'Email support',
    leadTitle: 'Get launch updates and featured example drops',
    leadBody:
      'Leave your email to get notified when new wedding-first examples, launch updates, and lifecycle event templates go live.',
    leadInputLabel: 'Email address',
    leadInputPlaceholder: 'you@example.com',
    leadSubmitLabel: 'Join the list',
    leadSuccessMessage: 'Thanks. We saved your email for gallery and launch updates.',
    leadErrorMessage: 'We could not save your email. Please try again.',
    leadNote: 'We only use your email for launch and product updates.',
    leadPrivacyLabel: 'Privacy policy',
  },
  et: {
    featuredEyebrow: 'Esiletõstetud pulmanäidis',
    featuredTitle: 'Alusta pulmanäidisest, mis teeb toote kohe arusaadavaks',
    featuredBody:
      'Pulm on esimene ost. Kui paar usaldab toodet siin, muutuvad sünnipäevad, baby shower’id, lõpetamised, jõulud ja teised sündmused loomulikeks kordusostudeks.',
    collectionTitle: 'Päris näidised sündmuse järgi',
    collectionBody:
      'Iga kaart allpool viib valmis avalikule lehele, et külastaja näeks enne konto loomist, kuidas Giftlist Studio päriselt töötab.',
    sectionBody: 'Päris näidis sündmusele {event}.',
    emptyTitle: 'Galerii on kureerimisel',
    emptyBody:
      'Praegu ei ole avalikke näidiseid saadaval. Alusta tasuta katseajaga või võta ühendust, kui soovid oma sündmuse lehte varakult esile tõsta.',
    emptyAction: 'Alusta tasuta katseaega',
    supportTitle: 'Kas tahad oma sündmuse lehte esile tõsta?',
    supportBody:
      'Saada meile viimistletud avalik näidis ülevaatuseks ja võime selle lisada galeriisse. Toe, koostöö või varajase ligipääsu jaoks kirjuta aadressile {email}.',
    supportAction: 'Kirjuta toele',
    leadTitle: 'Saa launch-uudiseid ja uusi näidiseid',
    leadBody:
      'Jäta oma e-post, et saada teada uutest pulmade näidistest, launch-uudistest ja elutsükli järgmiste sündmuste mallidest.',
    leadInputLabel: 'E-posti aadress',
    leadInputPlaceholder: 'sina@naide.ee',
    leadSubmitLabel: 'Liitu nimekirjaga',
    leadSuccessMessage: 'Aitäh. Sinu e-post on salvestatud galerii ja launch-uudiste jaoks.',
    leadErrorMessage: 'E-posti salvestamine ei õnnestunud. Proovi uuesti.',
    leadNote: 'Kasutame sinu e-posti ainult launchi ja tootearenduse uuenduste jaoks.',
    leadPrivacyLabel: 'Privaatsuspoliitika',
  },
} as const

const sortEntriesByPriority = (
  entries: ShowcaseGalleryEntry[]
) => {
  const eventPriority = new Map<EventType, number>(
    EVENT_TYPES.map((eventType, index) => [eventType, index])
  )

  return [...entries].sort((left, right) => {
    const leftPriority = eventPriority.get(left.eventType) ?? EVENT_TYPES.length
    const rightPriority = eventPriority.get(right.eventType) ?? EVENT_TYPES.length

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return (right.updatedAt ?? 0) - (left.updatedAt ?? 0)
  })
}

export default function ShowcaseGallery({
  locale,
  labels,
  eventLabels,
  dashboardLabels,
  entries,
  supportEmail,
}: ShowcaseGalleryProps) {
  const copy = localizedGalleryCopy[locale]
  const featuredWeddingEntry = entries.find((entry) => entry.eventType === 'wedding') ?? null
  const remainingEntries = sortEntriesByPriority(
    entries.filter((entry) => entry.listId !== featuredWeddingEntry?.listId)
  )
  const hasEntries = Boolean(featuredWeddingEntry || remainingEntries.length > 0)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
      <section className="max-w-3xl">
        <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
          {labels.eyebrow}
        </p>
        <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          {labels.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
          {labels.subtitle}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          {labels.themeHint}
        </p>
      </section>

      {featuredWeddingEntry && (
        <section className="mt-10 space-y-4">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
              {copy.featuredEyebrow}
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              {copy.featuredTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">
              {copy.featuredBody}
            </p>
          </div>

          <ShowcasePreviewCard
            locale={locale}
            labels={labels}
            dashboardLabels={dashboardLabels}
            eventLabel={eventLabels.wedding}
            eventType="wedding"
            entry={featuredWeddingEntry}
          />
        </section>
      )}

      {remainingEntries.length > 0 && (
        <section className="mt-12 space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              {copy.collectionTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              {copy.collectionBody}
            </p>
          </div>

          <div className="space-y-8">
            {remainingEntries.map((entry) => (
              <section key={entry.listId} className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white sm:text-2xl">
                    {eventLabels[entry.eventType]}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {interpolateLabel(copy.sectionBody, {
                      event: eventLabels[entry.eventType],
                    })}
                  </p>
                </div>

                <ShowcasePreviewCard
                  locale={locale}
                  labels={labels}
                  dashboardLabels={dashboardLabels}
                  eventLabel={eventLabels[entry.eventType]}
                  eventType={entry.eventType}
                  entry={entry}
                />
              </section>
            ))}
          </div>
        </section>
      )}

      {!hasEntries && (
        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white">{copy.emptyTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            {copy.emptyBody}
          </p>
          <div className="mt-5">
            <TrackedLink
              href={`/${locale}/login`}
              eventName="click_start_trial"
              eventParams={{
                locale,
                placement: 'gallery_empty_state',
              }}
              className="inline-flex rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
            >
              {copy.emptyAction}
            </TrackedLink>
          </div>
        </section>
      )}

      <section className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">{labels.ctaTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
          {labels.ctaBody}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <TrackedLink
            href={`/${locale}/login`}
            eventName="click_start_trial"
            eventParams={{
              locale,
              placement: 'gallery_cta',
            }}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            {labels.ctaAction}
          </TrackedLink>
          <TrackedLink
            href={`/${locale}/pricing`}
            eventName="view_pricing"
            eventParams={{
              locale,
              placement: 'gallery_cta',
            }}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {labels.secondaryCtaAction}
          </TrackedLink>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">{copy.supportTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
          {interpolateLabel(copy.supportBody, { email: supportEmail })}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`mailto:${supportEmail}`}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {copy.supportAction}
          </a>
          <TrackedLink
            href={`/${locale}/login`}
            eventName="click_start_trial"
            eventParams={{
              locale,
              placement: 'gallery_support',
            }}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            {labels.ctaAction}
          </TrackedLink>
        </div>
      </section>

      <LeadCaptureForm
        locale={locale}
        source="gallery"
        title={copy.leadTitle}
        body={copy.leadBody}
        inputLabel={copy.leadInputLabel}
        inputPlaceholder={copy.leadInputPlaceholder}
        submitLabel={copy.leadSubmitLabel}
        successMessage={copy.leadSuccessMessage}
        errorMessage={copy.leadErrorMessage}
        note={copy.leadNote}
        privacyLabel={copy.leadPrivacyLabel}
        className="mt-8"
      />
    </div>
  )
}
