'use client'

import { COOKIE_SETTINGS_EVENT } from '@/lib/site/legal'

type CookieSettingsButtonProps = {
  label: string
  className?: string
}

export default function CookieSettingsButton({
  label,
  className = '',
}: CookieSettingsButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT))
      }}
    >
      {label}
    </button>
  )
}
