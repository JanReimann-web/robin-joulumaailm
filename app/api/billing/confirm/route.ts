import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { confirmStripeCheckoutSession } from '@/lib/billing/server'

export const runtime = 'nodejs'

type ConfirmBody = {
  sessionId?: string
  listId?: string
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

  let body: ConfirmBody
  try {
    body = (await request.json()) as ConfirmBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const sessionId = body.sessionId?.trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'missing_session_id' }, { status: 400 })
  }

  try {
    const result = await confirmStripeCheckoutSession({
      sessionId,
      ownerId: decodedToken.uid,
      listId: body.listId?.trim() || null,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'billing_failed'
    if (message === 'forbidden') {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    if (message === 'billing_unavailable') {
      return NextResponse.json({ error: message }, { status: 503 })
    }

    if (message === 'missing_metadata') {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: 'billing_failed' }, { status: 500 })
  }
}
