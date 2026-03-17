import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

type LeadBody = {
  email?: string
  locale?: string
  source?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const buildLeadDocId = (email: string) => {
  return Buffer.from(email).toString('base64url')
}

export async function POST(request: NextRequest) {
  let body: LeadBody

  try {
    body = (await request.json()) as LeadBody
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase() ?? ''
  const locale = body.locale === 'et' ? 'et' : 'en'
  const source = typeof body.source === 'string' ? body.source.trim() : ''

  if (!EMAIL_PATTERN.test(email) || !source) {
    return NextResponse.json({ error: 'invalid_lead' }, { status: 400 })
  }

  const leadRef = adminDb.collection('marketingLeads').doc(buildLeadDocId(email))
  const existingLead = await leadRef.get()

  await leadRef.set({
    email,
    locale,
    firstSource: existingLead.exists
      ? existingLead.get('firstSource') ?? source
      : source,
    lastSource: source,
    sources: FieldValue.arrayUnion(source),
    updatedAt: FieldValue.serverTimestamp(),
    ...(existingLead.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  }, { merge: true })

  return NextResponse.json({ ok: true })
}
