import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ShowcaseGallery from '@/components/showcase/ShowcaseGallery'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { SUPPORT_EMAIL } from '@/lib/site/contact'
import { buildLocalizedUrl } from '@/lib/site/url'
import { getPublishedShowcaseEntries } from '@/lib/showcase.server'

type GalleryPageProps = {
  params: {
    locale: string
  }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = buildLocalizedUrl(locale, '/gallery')

  return {
    title: dict.gallery.seoTitle,
    description: dict.gallery.seoDescription,
    alternates: {
      canonical: url,
      languages: {
        en: buildLocalizedUrl('en', '/gallery'),
        et: buildLocalizedUrl('et', '/gallery'),
      },
    },
    openGraph: {
      title: dict.gallery.seoTitle,
      description: dict.gallery.seoDescription,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.gallery.seoTitle,
      description: dict.gallery.seoDescription,
    },
  }
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)
  const entries = await getPublishedShowcaseEntries()

  return (
    <ShowcaseGallery
      locale={locale}
      labels={dict.gallery}
      eventLabels={dict.events}
      dashboardLabels={dict.dashboard}
      entries={entries}
      supportEmail={SUPPORT_EMAIL}
    />
  )
}
