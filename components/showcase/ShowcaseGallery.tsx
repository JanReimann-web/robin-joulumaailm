'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Locale } from '@/lib/i18n/config'
import { Dictionary } from '@/lib/i18n/types'
import { resolveEventThemeId } from '@/lib/lists/event-theme'
import {
  EVENT_TYPES,
  EventType,
  getTemplateIdsForEvent,
  TemplateId,
} from '@/lib/lists/types'
import { ShowcaseGalleryEntry } from '@/lib/showcase'

type ShowcaseGalleryProps = {
  locale: Locale
  labels: Dictionary['gallery']
  eventLabels: Dictionary['events']
  dashboardLabels: Dictionary['dashboard']
  entries: ShowcaseGalleryEntry[]
}

type ShowcaseDisplayCard =
  | {
      id: string
      kind: 'entry'
      eventType: EventType
      entry: ShowcaseGalleryEntry
    }
  | {
      id: string
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

const templateLabelMap = (
  labels: Dictionary['dashboard']
): Record<TemplateId, string> => ({
  classic: labels.templateClassic,
  modern: labels.templateModern,
  minimal: labels.templateMinimal,
  playful: labels.templatePlayful,
  kidsBoyTinyPilot: labels.templateKidsBoyTinyPilot,
  kidsBoyDinoRanger: labels.templateKidsBoyDinoRanger,
  kidsBoyGalaxyRacer: labels.templateKidsBoyGalaxyRacer,
  kidsGirlTinyBloom: labels.templateKidsGirlTinyBloom,
  kidsGirlFairyGarden: labels.templateKidsGirlFairyGarden,
  kidsGirlStarlightPop: labels.templateKidsGirlStarlightPop,
})

const getShowcaseCardsByEvent = (
  entries: ShowcaseGalleryEntry[]
): Record<EventType, ShowcaseDisplayCard> => {
  return EVENT_TYPES.reduce<Record<EventType, ShowcaseDisplayCard>>((result, eventType) => {
    const matchingEntry = entries.find((entry) => entry.eventType === eventType)

    result[eventType] = matchingEntry
      ? {
          id: matchingEntry.listId,
          kind: 'entry',
          eventType,
          entry: matchingEntry,
        }
      : {
          id: `${eventType}-placeholder`,
          kind: 'placeholder',
          eventType,
        }

    return result
  }, {} as Record<EventType, ShowcaseDisplayCard>)
}

const renderPreviewMedia = (
  entry: ShowcaseGalleryEntry | null,
  fallbackTitle: string
) => {
  if (!entry?.previewMedia?.url || !entry.previewMedia.type) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 px-4 text-center text-sm text-slate-300">
        <Sparkles size={22} className="text-slate-300" />
        <span>{fallbackTitle}</span>
      </div>
    )
  }

  if (entry.previewMedia.type.startsWith('video/')) {
    return (
      <video
        src={entry.previewMedia.url}
        className="h-48 w-full rounded-[1.6rem] border border-white/10 object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={entry.previewMedia.url}
      alt={fallbackTitle}
      className="h-48 w-full rounded-[1.6rem] border border-white/10 object-cover"
      loading="lazy"
    />
  )
}

export default function ShowcaseGallery({
  locale,
  labels,
  eventLabels,
  dashboardLabels,
  entries,
}: ShowcaseGalleryProps) {
  const groupedCards = getShowcaseCardsByEvent(entries)
  const templateLabels = templateLabelMap(dashboardLabels)

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
                <GalleryCard
                  key={card.id}
                  locale={locale}
                  card={card}
                  labels={labels}
                  templateLabels={templateLabels}
                  eventLabel={eventLabels[eventType]}
                  availableTemplateIds={getTemplateIdsForEvent(card.eventType)}
                  defaultTemplateId={card.kind === 'entry'
                    ? card.entry.templateId
                    : getTemplateIdsForEvent(card.eventType)[0]}
                />
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

type GalleryCardProps = {
  locale: Locale
  card: ShowcaseDisplayCard
  labels: Dictionary['gallery']
  templateLabels: Record<TemplateId, string>
  eventLabel: string
  availableTemplateIds: readonly TemplateId[]
  defaultTemplateId: TemplateId
}

function GalleryCard({
  locale,
  card,
  labels,
  templateLabels,
  eventLabel,
  availableTemplateIds,
  defaultTemplateId,
}: GalleryCardProps) {
  const [previewTemplateId, setPreviewTemplateId] = useState<TemplateId>(defaultTemplateId)
  const themeId = resolveEventThemeId(card.eventType, previewTemplateId)
  const cardTitle = card.kind === 'entry'
    ? (card.entry.introTitle || card.entry.title)
    : interpolateLabel(labels.placeholderTitle, { event: eventLabel })
  const cardBody = card.kind === 'entry'
    ? (card.entry.introBody || labels.entryFallbackBody)
    : interpolateLabel(labels.placeholderBody, { event: eventLabel })

  return (
    <article className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-3 sm:p-4">
      <div className="event-canvas rounded-[1.7rem] border border-white/10 p-3 sm:p-4" data-event-theme={themeId}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
              {eventLabel}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
              {card.kind === 'entry' ? labels.entryBadge : labels.placeholderBadge}
            </span>
          </div>

          <label className="grid gap-1 text-xs text-slate-300 sm:min-w-[12rem]">
            <span>{labels.themeLabel}</span>
            <select
              value={previewTemplateId}
              onChange={(event) => setPreviewTemplateId(event.target.value as TemplateId)}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white"
            >
              {availableTemplateIds.map((templateId) => (
                <option key={templateId} value={templateId}>
                  {templateLabels[templateId]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="event-surface-panel mt-4 overflow-hidden rounded-[1.7rem] border p-4 sm:p-5">
          {renderPreviewMedia(card.kind === 'entry' ? card.entry : null, labels.previewPlaceholderMedia)}

          <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/5 p-4 sm:p-5">
            <h3 className="text-2xl font-semibold text-white sm:text-[2rem]">
              {cardTitle}
            </h3>
            <p className="mt-3 line-clamp-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {cardBody}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {card.kind === 'entry' ? (
                <Link
                  href={`/l/${card.entry.slug}`}
                  className="event-accent-button rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                  {labels.openExampleAction}
                </Link>
              ) : (
                <span className="rounded-full border border-dashed border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-300">
                  {labels.placeholderAction}
                </span>
              )}

              <Link
                href={`/${locale}/login`}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {labels.cardCtaAction}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
