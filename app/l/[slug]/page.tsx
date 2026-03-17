import type { Metadata } from 'next'
import PublicGiftList from '@/components/public/PublicGiftList'
import { getPublicListBySlug } from '@/lib/lists/public-server'
import { sanitizeSlug } from '@/lib/lists/slug'
import { buildPublicListUrl } from '@/lib/site/url'

type PublicListPageProps = {
  params: {
    slug: string
  }
  searchParams?: {
    template?: string | string[]
    demo?: string | string[]
  }
}

const eventDescriptionMap = {
  wedding: 'Wedding gift list',
  birthday: 'Birthday gift list',
  kidsBirthday: 'Kids birthday gift list',
  babyShower: 'Baby shower gift list',
  graduation: 'Graduation gift list',
  housewarming: 'Housewarming gift list',
  christmas: 'Christmas gift list',
} as const

export async function generateMetadata({
  params,
}: PublicListPageProps): Promise<Metadata> {
  const slug = sanitizeSlug(params.slug)
  const list = await getPublicListBySlug(slug)

  if (!list || list.accessStatus !== 'active') {
    return {
      title: 'Gift List',
      description: 'Gift list page',
      alternates: {
        canonical: buildPublicListUrl(slug),
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = `${eventDescriptionMap[list.eventType]} for ${list.title}. Reserve a gift without duplicate bookings.`
  const isIndexable = list.visibility === 'public'

  return {
    title: `${list.title} | Gift List`,
    description,
    alternates: {
      canonical: buildPublicListUrl(list.slug),
    },
    openGraph: {
      title: `${list.title} | Gift List`,
      description,
      url: buildPublicListUrl(list.slug),
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

const getSingleSearchParam = (value: string | string[] | undefined) => {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? value[0] ?? null : value
}

const isDemoModeEnabled = (value: string | string[] | undefined) => {
  const normalizedValue = getSingleSearchParam(value)?.toLowerCase()

  return normalizedValue === '1'
    || normalizedValue === 'true'
    || normalizedValue === 'gallery'
}

export default function PublicListPage({ params, searchParams }: PublicListPageProps) {
  return (
    <PublicGiftList
      slug={params.slug}
      previewTemplateId={getSingleSearchParam(searchParams?.template)}
      demoMode={isDemoModeEnabled(searchParams?.demo)}
    />
  )
}
