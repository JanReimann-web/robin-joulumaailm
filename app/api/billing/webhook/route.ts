import { NextRequest, NextResponse } from 'next/server'
import {
  isStripeWebhookConfigured,
  processStripeWebhook,
} from '@/lib/billing/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json({ error: 'webhook_unavailable' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  try {
    const result = await processStripeWebhook(rawBody, signature)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'webhook_failed',
        detail: error instanceof Error ? error.message : 'unknown',
      },
      { status: 400 }
    )
  }
}
