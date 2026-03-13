import { NextResponse } from 'next/server'
import { getPublicListBySlug, getPublicListPreviewMedia } from '@/lib/lists/public-server'

export const runtime = 'nodejs'

type RouteContext = {
  params: {
    slug: string
  }
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const list = await getPublicListBySlug(context.params.slug)

  if (!list || list.accessStatus !== 'active') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const previewMedia = await getPublicListPreviewMedia(list.id)

  return NextResponse.json(
    {
      list: {
        id: list.id,
        title: list.title,
        slug: list.slug,
        eventType: list.eventType,
        templateId: list.templateId,
        visibility: list.visibility,
        accessStatus: list.accessStatus,
        introTitle: list.introTitle,
        introBody: list.introBody,
        introEventDate: list.introEventDate,
        introEventLocation: list.introEventLocation,
        introMediaUrl: list.introMediaUrl,
        introMediaType: list.introMediaType,
      },
      requiresPassword: list.visibility === 'public_password',
      previewMedia,
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    }
  )
}
