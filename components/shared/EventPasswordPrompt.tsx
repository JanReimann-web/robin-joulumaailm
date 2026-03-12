import { FormEvent } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'

type EventPasswordPromptProps = {
  title: string
  description: string
  label: string
  value: string
  showPasswordAria?: string
  hidePasswordAria?: string
  isPasswordVisible: boolean
  onPasswordChange: (value: string) => void
  onTogglePasswordVisibility: () => void
  onSubmit: () => void
  submitLabel: string
  isSubmitDisabled?: boolean
  isBusy?: boolean
  busyLabel?: string
  error?: string | null
  onClose?: () => void
  closeAriaLabel?: string
  autoFocus?: boolean
}

export default function EventPasswordPrompt({
  title,
  description,
  label,
  value,
  showPasswordAria = 'Show password',
  hidePasswordAria = 'Hide password',
  isPasswordVisible,
  onPasswordChange,
  onTogglePasswordVisibility,
  onSubmit,
  submitLabel,
  isSubmitDisabled = false,
  isBusy = false,
  busyLabel,
  error = null,
  onClose,
  closeAriaLabel = 'Close password prompt',
  autoFocus = false,
}: EventPasswordPromptProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitDisabled || isBusy) {
      return
    }

    onSubmit()
  }

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="event-surface-panel w-full max-w-lg rounded-2xl border border-white/15 p-5 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-200">{description}</p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeAriaLabel}
            className="event-surface-card rounded-full border border-white/20 p-2 text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <form
        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr),auto] sm:items-end"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-1 text-sm text-slate-200">
          <span>{label}</span>
          <div className="relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              value={value}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="w-full rounded-lg border border-white/20 px-3 py-2 pr-11 text-white"
              minLength={6}
              autoComplete="current-password"
              autoFocus={autoFocus}
            />
            <button
              type="button"
              onClick={onTogglePasswordVisibility}
              aria-label={isPasswordVisible ? hidePasswordAria : showPasswordAria}
              className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-300 transition hover:text-white"
            >
              {isPasswordVisible
                ? <EyeOff size={16} />
                : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={isSubmitDisabled || isBusy}
          className="event-accent-button rounded-full px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (busyLabel ?? submitLabel) : submitLabel}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}
    </section>
  )
}
