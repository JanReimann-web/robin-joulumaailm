'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Locale } from '@/lib/i18n/config'
import { Dictionary } from '@/lib/i18n/types'
import { resolveEventThemeId } from '@/lib/lists/event-theme'
import {
  EventType,
  getTemplateIdsForEvent,
  TemplateId,
} from '@/lib/lists/types'
import { ShowcaseGalleryEntry } from '@/lib/showcase'

type ShowcasePreviewCardProps = {
  locale: Locale
  labels: Dictionary['gallery']
  dashboardLabels: Dictionary['dashboard']
  eventLabel: string
  eventType: EventType
  entry: ShowcaseGalleryEntry
  className?: string
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

const renderPreviewMedia = (
  entry: ShowcaseGalleryEntry,
  fallbackTitle: string
) => {
  if (!entry.previewMedia?.url || !entry.previewMedia.type) {
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

export default function ShowcasePreviewCard({
  locale,
  labels,
  dashboardLabels,
  eventLabel,
  eventType,
  entry,
  className = '',
}: ShowcasePreviewCardProps) {
  const availableTemplateIds = getTemplateIdsForEvent(eventType)
  const templateLabels = templateLabelMap(dashboardLabels)
  const [previewTemplateId, setPreviewTemplateId] = useState<TemplateId>(entry.templateId)
  const themeId = resolveEventThemeId(eventType, previewTemplateId)
  const cardTitle = entry.introTitle || entry.title
  const cardBody = entry.introBody || labels.entryFallbackBody

  return (
    <article className={`rounded-[2rem] border border-white/10 bg-slate-950/40 p-3 sm:p-4 ${className}`.trim()}>
      <div className="event-canvas rounded-[1.7rem] border border-white/10 p-3 sm:p-4" data-event-theme={themeId}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
              {eventLabel}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
              {labels.entryBadge}
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
          {renderPreviewMedia(entry, labels.previewPlaceholderMedia)}

          <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/5 p-4 sm:p-5">
            <h3 className="text-2xl font-semibold text-white sm:text-[2rem]">
              {cardTitle}
            </h3>
            <p className="mt-3 line-clamp-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {cardBody}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/l/${entry.slug}?template=${previewTemplateId}&demo=gallery`}
                className="event-accent-button rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                {labels.openExampleAction}
              </Link>

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
