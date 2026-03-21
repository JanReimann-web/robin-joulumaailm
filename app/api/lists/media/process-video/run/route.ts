import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import {
  getVideoProcessingJobResponseForOwner,
  processQueuedVideoJobs,
} from '@/lib/lists/video-processing-queue.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

type RunVideoJobBody = {
  jobId?: string
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

  let body: RunVideoJobBody
  try {
    body = (await request.json()) as RunVideoJobBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const jobId = body.jobId?.trim() ?? ''
  if (!jobId) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const result = await processQueuedVideoJobs({
    requestedJobId: jobId,
    ownerId: decodedToken.uid,
    limit: 1,
  })

  if (!result.ok && !result.busy) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const job = await getVideoProcessingJobResponseForOwner({
    jobId,
    ownerId: decodedToken.uid,
  })

  if (!job) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({
    ...job,
    workerBusy: result.busy,
  })
}
