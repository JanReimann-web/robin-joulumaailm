import { notFound } from 'next/navigation'
import LegalPageShell from '@/components/site/LegalPageShell'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getLegalCopy } from '@/lib/site/legal'

const FAQ_PAGE_CONTENT: Record<Locale, {
  placeholderItems: string[]
}> = {
  en: {
    placeholderItems: [
      'How do I create my first gift list?',
      'How do package activation and 90-day access work?',
      'How does reservation status update for guests?',
      'Can I protect a public list with a password?',
      'What media limits apply to each package?',
    ],
  },
  et: {
    placeholderItems: [
      'Kuidas luua oma esimene kinginimekiri?',
      'Kuidas toimivad paketi aktiveerimine ja 90-päevane ligipääs?',
      'Kuidas broneeringu staatus külalistele uueneb?',
      'Kas avalikku nimekirja saab parooliga kaitsta?',
      'Millised meedialimiidid kehtivad eri pakettidele?',
    ],
  },
}

type FaqPageProps = {
  params: {
    locale: string
  }
}

export default function FaqPage({ params }: FaqPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const legalCopy = getLegalCopy(locale).pages
  const content = FAQ_PAGE_CONTENT[locale]

  return (
    <LegalPageShell
      locale={locale}
      title={legalCopy.faqTitle}
      intro={legalCopy.faqIntro}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{legalCopy.faqPlaceholderTitle}</h2>
        <p>{legalCopy.faqPlaceholderBody}</p>
        <ul className="list-disc space-y-2 pl-5">
          {content.placeholderItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </LegalPageShell>
  )
}
