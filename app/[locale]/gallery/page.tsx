import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ShowcaseGallery from '@/components/showcase/ShowcaseGallery'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getPublishedShowcaseEntries } from '@/lib/showcase.server'

type GalleryPageProps = {
  params: {
    locale: string
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const dict = getDictionary(locale)
  const url = `${SITE_URL}/${locale}/gallery`

  return {
    title: dict.gallery.title,
    description: dict.gallery.subtitle,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en/gallery`,
        et: `${SITE_URL}/et/gallery`,
      },
    },
    openGraph: {
      title: dict.gallery.title,
      description: dict.gallery.subtitle,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.gallery.title,
      description: dict.gallery.subtitle,
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
    />
  )
}
