import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import WeddingIntentLanding from '@/components/marketing/WeddingIntentLanding'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { buildLocalizedUrl } from '@/lib/site/url'
import { getWeddingIntentContent } from '@/lib/site/wedding-intent'
import { getPublishedShowcaseEntryForEvent } from '@/lib/showcase.server'

type WeddingRegistryAlternativePageProps = {
  params: {
    locale: string
  }
}

const SLUG = 'wedding-registry-alternative'

export function generateMetadata({ params }: WeddingRegistryAlternativePageProps): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en'
  const content = getWeddingIntentContent(locale, SLUG)
  const canonical = buildLocalizedUrl(locale, `/${SLUG}`)

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: {
      canonical,
      languages: {
        en: buildLocalizedUrl('en', `/${SLUG}`),
        et: buildLocalizedUrl('et', `/${SLUG}`),
      },
    },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      url: canonical,
      type: 'website',
    },
  }
}

export default async function WeddingRegistryAlternativePage({
  params,
}: WeddingRegistryAlternativePageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const dict = getDictionary(locale)
  const content = getWeddingIntentContent(locale, SLUG)
  const showcaseEntry = await getPublishedShowcaseEntryForEvent('wedding')

  return (
    <WeddingIntentLanding
      locale={locale}
      slug={SLUG}
      content={content}
      dict={dict}
      showcaseEntry={showcaseEntry}
    />
  )
}
