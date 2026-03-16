import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import { getLegalCopy } from '@/lib/site/legal'

type LegalPageShellProps = {
  locale: Locale
  title: string
  intro: string
  children: React.ReactNode
}

export default function LegalPageShell({
  locale,
  title,
  intro,
  children,
}: LegalPageShellProps) {
  const copy = getLegalCopy(locale).pages

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href={`/${locale}`}
        className="inline-flex items-center text-sm font-medium text-white/70 transition hover:text-white"
      >
        {copy.backHomeAction}
      </Link>

      <div className="mt-6 rounded-[32px] border border-white/10 bg-slate-950/55 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur sm:p-8">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="text-base leading-7 text-white/75">{intro}</p>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-7 text-white/80 sm:text-base">
          {children}
        </div>
      </div>
    </section>
  )
}
