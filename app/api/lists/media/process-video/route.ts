import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import {
  processStoredVideoUpload,
  VideoProcessingError,
} from '@/lib/lists/video-processing.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

type ProcessVideoBody = {
  listId?: string
  sectionPath?: string
  incomingPath?: string
}

const sanitizeErrorDetails = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)

  return normalized.length > 0 ? normalized : null
}

const parseBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

export async function POST(request: NextRequest) {
  const token = parseBearerToken(request)
  if (!token) {
    return NextResponse.json({ error: 'missing_auth' }, { status: 401 })
  }

  let decodedToken
  try {
    decodedToken = await adminAuth.verifyIdToken(token)
  } catch {
    return NextResponse.json({ error: 'invalid_auth' }, { status: 401 })
  }

  let body: ProcessVideoBody
  try {
    body = (await request.json()) as ProcessVideoBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const listId = body.listId?.trim() ?? ''
  const sectionPath = body.sectionPath?.trim() ?? ''
  const incomingPath = body.incomingPath?.trim() ?? ''

  if (!listId || !sectionPath || !incomingPath) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const listSnap = await adminDb.collection('lists').doc(listId).get()
  if (!listSnap.exists) {
    return NextResponse.json({ error: 'list_not_found' }, { status: 404 })
  }

  const listData = listSnap.data() as Record<string, unknown>
  if (listData.ownerId !== decodedToken.uid) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const processedVideo = await processStoredVideoUpload({
      userId: decodedToken.uid,
      listId,
      sectionPath,
      incomingPath,
    })

    return NextResponse.json(processedVideo)
  } catch (error) {
    console.error('Video processing failed', {
      listId,
      sectionPath,
      code: error instanceof VideoProcessingError ? error.code : 'unknown_error',
      cause: error instanceof Error ? error.cause : undefined,
    })

    if (error instanceof VideoProcessingError) {
      const details = sanitizeErrorDetails(error.cause)

      if (error.code === 'video_too_long') {
        return NextResponse.json({ error: error.code, details }, { status: 400 })
      }

      if (error.code === 'invalid_section' || error.code === 'invalid_source') {
        return NextResponse.json({ error: error.code, details }, { status: 400 })
      }

      if (error.code === 'video_processing_unavailable') {
        return NextResponse.json({ error: error.code, details }, { status: 503 })
      }

      return NextResponse.json({ error: error.code, details }, { status: 500 })
    }

    return NextResponse.json({ error: 'video_processing_failed' }, { status: 500 })
  }
}
