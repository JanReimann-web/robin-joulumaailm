'use client'

import Link from 'next/link'
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
}

type ShowcaseDisplayCard =
  | {
      kind: 'entry'
      eventType: EventType
      entry: ShowcaseGalleryEntry
    }
  | {
      kind: 'placeholder'
      eventType: EventType
    }

const interpolateLabel = (
  template: string,
  replacements: Record<string, string | number>
) => {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replace(`{${key}}`, String(value))
  }, template)
}

const getShowcaseCardsByEvent = (
  entries: ShowcaseGalleryEntry[]
): Record<EventType, ShowcaseDisplayCard> => {
  return EVENT_TYPES.reduce<Record<EventType, ShowcaseDisplayCard>>((result, eventType) => {
    const matchingEntry = entries.find((entry) => entry.eventType === eventType)

    result[eventType] = matchingEntry
      ? {
          kind: 'entry',
          eventType,
          entry: matchingEntry,
        }
      : {
          kind: 'placeholder',
          eventType,
        }

    return result
  }, {} as Record<EventType, ShowcaseDisplayCard>)
}

export default function ShowcaseGallery({
  locale,
  labels,
  eventLabels,
  dashboardLabels,
  entries,
}: ShowcaseGalleryProps) {
  const groupedCards = getShowcaseCardsByEvent(entries)

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

      <div className="mt-10 space-y-8">
        {EVENT_TYPES.map((eventType) => {
          const card = groupedCards[eventType]

          return (
            <section key={eventType} className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">
                    {eventLabels[eventType]}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {interpolateLabel(labels.sectionSubtitle, {
                      event: eventLabels[eventType],
                    })}
                  </p>
                </div>
              </div>

              <div className="grid gap-5">
                {card.kind === 'entry' ? (
                  <ShowcasePreviewCard
                    locale={locale}
                    labels={labels}
                    dashboardLabels={dashboardLabels}
                    eventLabel={eventLabels[eventType]}
                    eventType={eventType}
                    entry={card.entry}
                  />
                ) : (
                  <article className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-3 sm:p-4">
                    <div className="event-canvas rounded-[1.7rem] border border-white/10 p-6 sm:p-8" data-event-theme="classic-wedding">
                      <div className="rounded-[1.4rem] border border-dashed border-white/15 bg-white/5 p-6 text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                            {eventLabels[eventType]}
                          </span>
                          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
                            {labels.placeholderBadge}
                          </span>
                        </div>
                        <h3 className="mt-5 text-2xl font-semibold text-white">
                          {interpolateLabel(labels.placeholderTitle, { event: eventLabels[eventType] })}
                        </h3>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                          {interpolateLabel(labels.placeholderBody, { event: eventLabels[eventType] })}
                        </p>
                        <div className="mt-5">
                          <Link
                            href={`/${locale}/login`}
                            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                          >
                            {labels.cardCtaAction}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            </section>
          )
        })}
      </div>

      <section className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">{labels.ctaTitle}</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">
          {labels.ctaBody}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/login`}
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            {labels.ctaAction}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {labels.secondaryCtaAction}
          </Link>
        </div>
      </section>
    </div>
  )
}
