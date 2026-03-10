import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { getReferralDashboardSummary } from '@/lib/referrals.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const parseBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

export async function GET(request: NextRequest) {
  const token = parseBearerToken(request)
  if (!token) {
    return NextResponse.json({ error: 'missing_auth' }, { status: 401 })
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    const summary = await getReferralDashboardSummary(decodedToken.uid)
    return NextResponse.json(summary)
  } catch {
    return NextResponse.json({ error: 'invalid_auth' }, { status: 401 })
  }
}
