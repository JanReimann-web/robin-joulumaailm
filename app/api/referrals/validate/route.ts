import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import {
  ReferralError,
  validateReferralCodeForBuyer,
} from '@/lib/referrals.server'

export const runtime = 'nodejs'

type ValidateReferralBody = {
  code?: string
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

  let body: ValidateReferralBody
  try {
    body = (await request.json()) as ValidateReferralBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const code = body.code?.trim() ?? ''
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  }

  try {
    const result = await validateReferralCodeForBuyer({
      buyerUserId: decodedToken.uid,
      code,
    })

    return NextResponse.json({
      code: result.code,
      discountPercent: result.discountPercent,
    })
  } catch (error) {
    if (error instanceof ReferralError) {
      return NextResponse.json({ error: error.code }, { status: 400 })
    }

    return NextResponse.json({ error: 'referral_invalid' }, { status: 400 })
  }
}
