'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import {
  AnalyticsEventName,
  AnalyticsEventParams,
  trackAnalyticsEvent,
} from '@/lib/site/analytics'

type TrackedLinkProps = {
  href: string
  className?: string
  children: ReactNode
  eventName?: AnalyticsEventName
  eventParams?: AnalyticsEventParams
}

export default function TrackedLink({
  href,
  className,
  children,
  eventName,
  eventParams,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (!eventName) {
          return
        }

        trackAnalyticsEvent(eventName, eventParams)
      }}
    >
      {children}
    </Link>
  )
}

