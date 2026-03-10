import { ReferralDashboardSummary } from '@/lib/referrals'

export class ReferralClientError extends Error {
  code: string

  constructor(code: string) {
    super(code)
    this.code = code
  }
}

const parseJsonOrThrow = async <T>(response: Response) => {
  return await response.json() as T
}

export const fetchReferralDashboardSummary = async (idToken: string) => {
  const response = await fetch('/api/referrals', {
    method: 'GET',
    headers: {
      authorization: `Bearer ${idToken}`,
    },
    cache: 'no-store',
  })

  const payload = await parseJsonOrThrow<ReferralDashboardSummary & { error?: string }>(response)
  if (!response.ok) {
    throw new ReferralClientError(payload.error ?? 'referral_fetch_failed')
  }

  return payload as ReferralDashboardSummary
}

export const generateReferralCode = async (idToken: string) => {
  const response = await fetch('/api/referrals/generate', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
    },
  })

  const payload = await parseJsonOrThrow<{ code?: string; error?: string }>(response)
  if (!response.ok || !payload.code) {
    throw new ReferralClientError(payload.error ?? 'referral_generate_failed')
  }

  return payload.code
}

export const validateReferralCode = async (params: {
  idToken: string
  code: string
}) => {
  const response = await fetch('/api/referrals/validate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${params.idToken}`,
    },
    body: JSON.stringify({
      code: params.code,
    }),
  })

  const payload = await parseJsonOrThrow<{
    code?: string
    discountPercent?: number
    error?: string
  }>(response)

  if (!response.ok || !payload.code || typeof payload.discountPercent !== 'number') {
    throw new ReferralClientError(payload.error ?? 'referral_invalid')
  }

  return {
    code: payload.code,
    discountPercent: payload.discountPercent,
  }
}
