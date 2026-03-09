import { NextRequest, NextResponse } from 'next/server'
import {
  getPublicAccessCookieName,
  verifyPublicAccessToken,
} from '@/lib/lists/password.server'
import { getPublicListBySlug, getPublicListContent } from '@/lib/lists/public-server'

export const runtime = 'nodejs'

type RouteContext = {
  params: {
    slug: string
  }
}

const selectPreviewMedia = (params: {
  introMediaUrl: string | null
  introMediaType: string | null
  stories: Array<{ mediaUrl: string | null; mediaType: string | null }>
  items: Array<{ mediaUrl: string | null; mediaType: string | null }>
}) => {
  if (
    typeof params.introMediaUrl === 'string'
    && typeof params.introMediaType === 'string'
    && (
      params.introMediaType.startsWith('image/')
      || params.introMediaType.startsWith('video/')
    )
  ) {
    return {
      url: params.introMediaUrl,
      type: params.introMediaType,
    }
  }

  const storiesMedia = params.stories.find((story) => {
    return (
      typeof story.mediaUrl === 'string'
      && typeof story.mediaType === 'string'
      && (story.mediaType.startsWith('image/') || story.mediaType.startsWith('video/'))
    )
  })

  if (storiesMedia?.mediaUrl && storiesMedia.mediaType) {
    return {
      url: storiesMedia.mediaUrl,
      type: storiesMedia.mediaType,
    }
  }

  const itemsMedia = params.items.find((item) => {
    return (
      typeof item.mediaUrl === 'string'
      && typeof item.mediaType === 'string'
      && (item.mediaType.startsWith('image/') || item.mediaType.startsWith('video/'))
    )
  })

  if (itemsMedia?.mediaUrl && itemsMedia.mediaType) {
    return {
      url: itemsMedia.mediaUrl,
      type: itemsMedia.mediaType,
    }
  }

  return null
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const list = await getPublicListBySlug(context.params.slug)
  if (!list || list.accessStatus !== 'active') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (list.visibility === 'public_password') {
    const cookieName = getPublicAccessCookieName(list.slug)
    const token = request.cookies.get(cookieName)?.value

    if (
      !token
      || !verifyPublicAccessToken({
        token,
        listId: list.id,
        slug: list.slug,
      })
    ) {
      return NextResponse.json({ error: 'password_required' }, { status: 401 })
    }
  }

  const content = await getPublicListContent(list.id)
  const previewMedia = selectPreviewMedia({
    introMediaUrl: list.introMediaUrl,
    introMediaType: list.introMediaType,
    stories: content.stories,
    items: content.items,
  })

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
        introMediaUrl: list.introMediaUrl,
        introMediaType: list.introMediaType,
      },
      items: content.items,
      stories: content.stories,
      wheelEntries: content.wheelEntries,
      previewMedia,
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    }
  )
}
