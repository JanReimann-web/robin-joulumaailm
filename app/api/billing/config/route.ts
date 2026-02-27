import { NextResponse } from 'next/server'
import { getBillingRuntimeConfig } from '@/lib/billing/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(getBillingRuntimeConfig())
}
