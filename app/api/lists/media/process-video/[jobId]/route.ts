import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { getVideoProcessingJobResponseForOwner } from '@/lib/lists/video-processing-queue.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    jobId: string
  }
}

const parseBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

  const jobId = context.params.jobId?.trim() ?? ''
  if (!jobId) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const job = await getVideoProcessingJobResponseForOwner({
    jobId,
    ownerId: decodedToken.uid,
  })

  if (!job) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(job)
}
