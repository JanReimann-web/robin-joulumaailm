import { NextRequest, NextResponse } from 'next/server'
import { processQueuedVideoJobs } from '@/lib/lists/video-processing-queue.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const DEFAULT_BATCH_SIZE = 2
const MAX_BATCH_SIZE = 4

const parseNumber = (value: string | null) => {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const parseBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

const isAuthorized = (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return false
  }

  const bearerToken = parseBearerToken(request)
  const headerSecret = request.headers.get('x-cron-secret')

  return bearerToken === cronSecret || headerSecret === cronSecret
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const requestedLimit = parseNumber(request.nextUrl.searchParams.get('limit'))
  const limit = Math.min(
    MAX_BATCH_SIZE,
    Math.max(1, requestedLimit ?? DEFAULT_BATCH_SIZE)
  )

  const result = await processQueuedVideoJobs({
    limit,
  })

  return NextResponse.json({
    ok: result.ok,
    busy: result.busy,
    claimedJobId: result.claimedJobId,
    processedJobs: result.processedJobs,
    limit,
  })
}
