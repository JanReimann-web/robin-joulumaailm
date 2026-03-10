import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { generateReferralCodeForUser, ReferralError } from '@/lib/referrals.server'

export const runtime = 'nodejs'

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

  try {
    const code = await generateReferralCodeForUser(decodedToken.uid)
    return NextResponse.json({ code })
  } catch (error) {
    if (error instanceof ReferralError) {
      if (error.code === 'referral_locked' || error.code === 'referral_max_active_reached') {
        return NextResponse.json({ error: error.code }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'referral_generate_failed' }, { status: 500 })
  }
}
