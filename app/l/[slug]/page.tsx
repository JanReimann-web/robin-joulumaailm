import type { Metadata } from 'next'
import PublicGiftList from '@/components/public/PublicGiftList'
import { getPublicListMetaBySlug } from '@/lib/lists/public'
import { sanitizeSlug } from '@/lib/lists/slug'

type PublicListPageProps = {
  params: {
    slug: string
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gifts.com'

const eventDescriptionMap = {
  wedding: 'Wedding gift list',
  birthday: 'Birthday gift list',
  babyShower: 'Baby shower gift list',
  christmas: 'Christmas gift list',
} as const

export async function generateMetadata({
  params,
}: PublicListPageProps): Promise<Metadata> {
  const slug = sanitizeSlug(params.slug)
  const list = await getPublicListMetaBySlug(slug)

  if (!list) {
    return {
      title: 'Gift List',
      description: 'Gift list page',
      alternates: {
        canonical: `${SITE_URL}/${slug}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = `${eventDescriptionMap[list.eventType]} for ${list.title}. Reserve a gift without duplicate bookings.`
  const isIndexable = list.accessStatus !== 'expired'

  return {
    title: `${list.title} | Gift List`,
    description,
    alternates: {
      canonical: `${SITE_URL}/${list.slug}`,
    },
    openGraph: {
      title: `${list.title} | Gift List`,
      description,
      url: `${SITE_URL}/${list.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${list.title} | Gift List`,
      description,
    },
    robots: {
      index: isIndexable,
      follow: isIndexable,
    },
  }
}

export default function PublicListPage({ params }: PublicListPageProps) {
  return <PublicGiftList slug={params.slug} />
}
