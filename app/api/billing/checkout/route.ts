import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { startListCheckout } from '@/lib/billing/server'

export const runtime = 'nodejs'

type CheckoutBody = {
  listId?: string
  locale?: string
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

  let body: CheckoutBody
  try {
    body = (await request.json()) as CheckoutBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const listId = body.listId?.trim()
  if (!listId) {
    return NextResponse.json({ error: 'missing_list_id' }, { status: 400 })
  }

  try {
    const result = await startListCheckout({
      listId,
      ownerId: decodedToken.uid,
      locale: body.locale,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'billing_failed'
    if (message === 'forbidden') {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    if (message === 'list_not_found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    if (message === 'billing_unavailable') {
      return NextResponse.json({ error: message }, { status: 503 })
    }

    return NextResponse.json({ error: 'billing_failed' }, { status: 500 })
  }
}
