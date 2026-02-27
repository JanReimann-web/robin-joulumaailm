import 'server-only'
import Stripe from 'stripe'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { addDays, PAID_ACCESS_DAYS, resolveListAccessStatus, TRIAL_DAYS } from '@/lib/lists/access'
import { adminDb } from '@/lib/firebase/admin'
import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore'
import { BillingCheckoutResult } from '@/lib/billing/types'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ''
const STRIPE_PRICE_ID_90D = process.env.STRIPE_PRICE_ID_90D ?? ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''
const MANUAL_FALLBACK_ENABLED = (process.env.BILLING_MANUAL_FALLBACK ?? 'true') === 'true'

const stripeClient = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null

const toMillis = (value: unknown): number | null => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }

  return null
}

const resolveLocale = (locale: string | undefined) => {
  if (!locale) {
    return defaultLocale
  }

  return isLocale(locale) ? locale : defaultLocale
}

const validateListOwnership = async (listId: string, ownerId: string) => {
  const listRef = adminDb.collection('lists').doc(listId)
  const listSnapshot = await listRef.get()

  if (!listSnapshot.exists) {
    throw new Error('list_not_found')
  }

  const payload = listSnapshot.data() as Record<string, unknown>
  if (payload.ownerId !== ownerId) {
    throw new Error('forbidden')
  }

  const createdAt = toMillis(payload.createdAt)
  const trialEndsAtRaw = toMillis(payload.trialEndsAt)
  const trialEndsAt = trialEndsAtRaw ?? (
    createdAt ? addDays(new Date(createdAt), TRIAL_DAYS).getTime() : null
  )

  const accessStatus = resolveListAccessStatus({
    trialEndsAt,
    paidAccessEndsAt: toMillis(payload.paidAccessEndsAt),
  })

  return {
    listRef,
    accessStatus,
  }
}

const grantListPass = async (params: {
  listId: string
  ownerId: string
  provider: 'manual' | 'stripe'
  paymentRef: string
}) => {
  const listRef = adminDb.collection('lists').doc(params.listId)
  const subscriptionRef = adminDb.collection('subscriptions').doc(params.ownerId)
  const paymentRef = adminDb.collection('billingPayments').doc()
  const paidAccessEndsAt = Timestamp.fromDate(addDays(new Date(), PAID_ACCESS_DAYS))

  await adminDb.runTransaction(async (transaction) => {
    const listSnapshot = await transaction.get(listRef)
    if (!listSnapshot.exists) {
      throw new Error('list_not_found')
    }

    const payload = listSnapshot.data() as Record<string, unknown>
    if (payload.ownerId !== params.ownerId) {
      throw new Error('forbidden')
    }

    transaction.update(listRef, {
      paidAccessEndsAt,
      purgeAt: paidAccessEndsAt,
      updatedAt: FieldValue.serverTimestamp(),
      billingProvider: params.provider,
      lastPaymentRef: params.paymentRef,
      lastPaymentAt: FieldValue.serverTimestamp(),
    })

    transaction.set(subscriptionRef, {
      userId: params.ownerId,
      billingModel: 'one_time_90d',
      status: 'active',
      activeListIds: FieldValue.arrayUnion(params.listId),
      currentPeriodEndsAt: paidAccessEndsAt,
      lastPaymentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    transaction.set(paymentRef, {
      listId: params.listId,
      ownerId: params.ownerId,
      provider: params.provider,
      paymentRef: params.paymentRef,
      billingModel: 'one_time_90d',
      paidAccessEndsAt,
      createdAt: FieldValue.serverTimestamp(),
    })
  })
}

export const isStripeCheckoutConfigured = () => {
  return Boolean(stripeClient && STRIPE_PRICE_ID_90D)
}

export const isStripeWebhookConfigured = () => {
  return Boolean(stripeClient && STRIPE_WEBHOOK_SECRET)
}

export const getBillingRuntimeConfig = () => {
  const stripeCheckoutConfigured = isStripeCheckoutConfigured()
  const stripeWebhookConfigured = isStripeWebhookConfigured()
  const mode = stripeCheckoutConfigured ? 'stripe' : 'manual'

  return {
    mode,
    manualFallbackEnabled: MANUAL_FALLBACK_ENABLED,
    stripeCheckoutConfigured,
    stripeWebhookConfigured,
  }
}

export const startListCheckout = async (params: {
  listId: string
  ownerId: string
  locale?: string
}): Promise<BillingCheckoutResult> => {
  const { accessStatus } = await validateListOwnership(params.listId, params.ownerId)
  if (accessStatus === 'active') {
    return {
      mode: 'manual',
      activated: true,
    }
  }

  if (!isStripeCheckoutConfigured()) {
    if (!MANUAL_FALLBACK_ENABLED) {
      throw new Error('billing_unavailable')
    }

    const paymentRef = `manual_${Date.now()}`
    await grantListPass({
      listId: params.listId,
      ownerId: params.ownerId,
      provider: 'manual',
      paymentRef,
    })

    return {
      mode: 'manual',
      activated: true,
    }
  }

  const locale = resolveLocale(params.locale)
  const successUrl = `${SITE_URL}/${locale}/dashboard?billing=success&list=${params.listId}&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${SITE_URL}/${locale}/dashboard?billing=cancel&list=${params.listId}`

  const session = await stripeClient!.checkout.sessions.create({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        price: STRIPE_PRICE_ID_90D,
        quantity: 1,
      },
    ],
    metadata: {
      listId: params.listId,
      ownerId: params.ownerId,
      plan: 'one_time_90d',
    },
    client_reference_id: `${params.ownerId}:${params.listId}`,
    allow_promotion_codes: true,
  })

  if (!session.url) {
    throw new Error('checkout_url_missing')
  }

  await adminDb.collection('billingCheckoutSessions').doc(session.id).set({
    sessionId: session.id,
    listId: params.listId,
    ownerId: params.ownerId,
    provider: 'stripe',
    status: 'created',
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  return {
    mode: 'stripe',
    checkoutUrl: session.url,
    sessionId: session.id,
  }
}

const markCheckoutSession = async (sessionId: string, payload: Record<string, unknown>) => {
  await adminDb.collection('billingCheckoutSessions').doc(sessionId).set({
    ...payload,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })
}

export const processStripeWebhook = async (rawBody: string, signature: string) => {
  if (!isStripeWebhookConfigured()) {
    throw new Error('webhook_unavailable')
  }

  const event = stripeClient!.webhooks.constructEvent(
    rawBody,
    signature,
    STRIPE_WEBHOOK_SECRET
  )

  const webhookEventRef = adminDb.collection('billingWebhookEvents').doc(event.id)

  try {
    await webhookEventRef.create({
      eventId: event.id,
      type: event.type,
      status: 'processing',
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch {
    return {
      handled: true,
      duplicate: true,
      eventId: event.id,
    }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const listId = session.metadata?.listId
      const ownerId = session.metadata?.ownerId

      if (!listId || !ownerId) {
        throw new Error('missing_metadata')
      }

      await grantListPass({
        listId,
        ownerId,
        provider: 'stripe',
        paymentRef: session.id,
      })

      await markCheckoutSession(session.id, {
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
        webhookEventId: event.id,
      })
    }

    await webhookEventRef.set({
      status: 'processed',
      processedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    return {
      handled: true,
      duplicate: false,
      eventId: event.id,
      eventType: event.type,
    }
  } catch (error) {
    await webhookEventRef.set({
      status: 'failed',
      failedAt: FieldValue.serverTimestamp(),
      error: error instanceof Error ? error.message : 'unknown',
    }, { merge: true })

    throw error
  }
}
