'use client'

import { FormEvent, useEffect, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { useRouter } from 'next/navigation'
import { Locale } from '@/lib/i18n/config'
import { Dictionary } from '@/lib/i18n/types'
import {
  createAccountWithEmail,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/auth/client'
import { useAuth } from '@/components/auth/AuthProvider'

type LoginPanelProps = {
  locale: Locale
  labels: Dictionary['login']
}

type PendingAction = 'google' | 'signIn' | 'create' | 'resetPassword' | null

const mapFirebaseAuthError = (
  error: unknown,
  labels: Dictionary['login']
): string => {
  if (!(error instanceof FirebaseError)) {
    return labels.errorGeneric
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return labels.errorInvalidCredentials
    case 'auth/email-already-in-use':
      return labels.errorEmailInUse
    case 'auth/weak-password':
      return labels.errorWeakPassword
    default:
      return labels.errorGeneric
  }
}

export default function LoginPanel({ locale, labels }: LoginPanelProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const redirectPath = `/${locale}/dashboard`

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectPath)
    }
  }, [loading, redirectPath, router, user])

  const withPendingState = async (
    action: Exclude<PendingAction, null>,
    callback: () => Promise<void>,
    options?: {
      redirectOnSuccess?: boolean
    }
  ) => {
    setPendingAction(action)
    setError(null)
    setSuccessMessage(null)

    try {
      await callback()
      if (options?.redirectOnSuccess ?? true) {
        router.replace(redirectPath)
      }
    } catch (nextError) {
      setError(mapFirebaseAuthError(nextError, labels))
    } finally {
      setPendingAction(null)
    }
  }

  const handleGoogleSignIn = async () => {
    await withPendingState('google', async () => {
      await signInWithGoogle()
    })
  }

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await withPendingState('signIn', async () => {
      await signInWithEmail(email.trim(), password)
    })
  }

  const handleCreateAccount = async () => {
    await withPendingState('create', async () => {
      await createAccountWithEmail(email.trim(), password)
    })
  }

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError(labels.errorGeneric)
      return
    }

    await withPendingState('resetPassword', async () => {
      await resetPassword(email.trim())
      setSuccessMessage(labels.resetPasswordSent)
    }, {
      redirectOnSuccess: false,
    })
  }

  const isBusy = pendingAction !== null

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-10 sm:gap-6 sm:py-16">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">{labels.title}</h1>
      <p className="text-slate-200">{labels.subtitle}</p>

      <button
        className="rounded-xl bg-white px-5 py-3 text-left text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isBusy}
      >
        {pendingAction === 'google' ? labels.signingIn : labels.googleButton}
      </button>

      <form onSubmit={handleEmailSignIn} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm font-medium text-white/80">{labels.emailButton}</p>

        <label className="grid gap-1 text-sm text-slate-200">
          <span>{labels.emailLabel}</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-200">
          <span>{labels.passwordLabel}</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="rounded-lg border border-white/20 bg-slate-950/80 px-3 py-2 text-white"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <div className="mt-2 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === 'signIn' ? labels.signingIn : labels.signInAction}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={handleCreateAccount}
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === 'create' ? labels.creatingAccount : labels.createAccountAction}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={handlePasswordReset}
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === 'resetPassword'
              ? labels.resettingPassword
              : labels.resetPasswordAction}
          </button>
        </div>
      </form>

      {successMessage && (
        <p className="rounded-xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      {!loading && user && <p className="text-sm text-slate-400">{labels.signedInRedirect}</p>}
    </section>
  )
}
