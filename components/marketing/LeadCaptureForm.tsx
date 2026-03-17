'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { trackAnalyticsEvent } from '@/lib/site/analytics'

type LeadCaptureFormProps = {
  locale: Locale
  source: 'home' | 'pricing' | 'gallery' | 'wedding-intent'
  title: string
  body: string
  inputLabel: string
  inputPlaceholder: string
  submitLabel: string
  successMessage: string
  errorMessage: string
  note: string
  privacyLabel: string
  className?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LeadCaptureForm({
  locale,
  source,
  title,
  body,
  inputLabel,
  inputPlaceholder,
  submitLabel,
  successMessage,
  errorMessage,
  note,
  privacyLabel,
  className = '',
}: LeadCaptureFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus('error')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          locale,
          source,
        }),
      })

      if (!response.ok) {
        throw new Error('lead_capture_failed')
      }

      setEmail('')
      setStatus('success')
      trackAnalyticsEvent('generate_lead', {
        locale,
        source,
      })
    } catch {
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={`rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8 ${className}`.trim()}>
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">{body}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr),auto]">
        <label className="grid gap-2 text-sm text-slate-200">
          <span>{inputLabel}</span>
          <input
            type="email"
            value={email}
            onChange={(nextEvent) => {
              setEmail(nextEvent.target.value)
              if (status !== 'idle') {
                setStatus('idle')
              }
            }}
            placeholder={inputPlaceholder}
            autoComplete="email"
            className="rounded-full border border-white/20 bg-slate-950/80 px-4 py-3 text-white placeholder:text-slate-400"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-end rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? `${submitLabel}...` : submitLabel}
        </button>
      </form>

      {status === 'success' && (
        <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          {successMessage}
        </p>
      )}

      {status === 'error' && (
        <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </p>
      )}

      <p className="mt-4 text-xs leading-6 text-slate-400">
        {note}{' '}
        <Link href={`/${locale}/privacy`} className="underline underline-offset-4">
          {privacyLabel}
        </Link>
      </p>
    </section>
  )
}

