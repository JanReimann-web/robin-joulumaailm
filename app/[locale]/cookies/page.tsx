import { notFound } from 'next/navigation'
import LegalPageShell from '@/components/site/LegalPageShell'
import { isLocale, type Locale } from '@/lib/i18n/config'
import {
  COMPANY_ADDRESS,
  COMPANY_NAME,
  COOKIE_CONSENT_COOKIE_NAME,
  getLegalCopy,
} from '@/lib/site/legal'

const COOKIE_PAGE_CONTENT: Record<Locale, {
  introPoints: string[]
  necessaryTitle: string
  necessaryItems: Array<{ name: string; purpose: string; duration: string }>
  analyticsTitle: string
  analyticsBody: string[]
  manageTitle: string
  manageBody: string[]
}> = {
  en: {
    introPoints: [
      'Giftlist Studio uses a combination of cookies and browser storage to keep the service secure and usable.',
      'Necessary storage is always active. Analytics is optional and only starts after the visitor has given consent.',
    ],
    necessaryTitle: 'Necessary storage currently used on the site',
    necessaryItems: [
      {
        name: COOKIE_CONSENT_COOKIE_NAME,
        purpose: 'Stores the visitor’s cookie preferences so the banner does not reopen on every page load.',
        duration: '180 days',
      },
      {
        name: 'giftlist_access_<slug>',
        purpose: 'Keeps access open for a password-protected public gift list after the correct password has been entered.',
        duration: '30 days',
      },
      {
        name: 'Firebase Auth browser storage',
        purpose: 'Keeps a signed-in dashboard session active across reloads and browser restarts.',
        duration: 'Until sign-out or browser cleanup',
      },
      {
        name: 'Demo reservation session storage',
        purpose: 'Used on gallery sample pages so visitors can test the reservation flow without affecting the curator’s live list.',
        duration: 'Current tab/session only',
      },
    ],
    analyticsTitle: 'Optional analytics',
    analyticsBody: [
      'If analytics consent is granted, Google Analytics 4 may be used on the homepage, pricing page, gallery page, and dashboard page.',
      'Public gift list pages under /l/[slug] are excluded from analytics page tracking.',
      'Giftlist Studio is configured not to intentionally send list slugs, list titles, guest names, gift messages, emails, or other user-entered personal data to Google Analytics.',
    ],
    manageTitle: 'How to manage your choice',
    manageBody: [
      'You can reopen Cookie settings at any time from the footer and change your analytics preference.',
      `The data controller for this site is ${COMPANY_NAME}, ${COMPANY_ADDRESS}.`,
    ],
  },
  et: {
    introPoints: [
      'Giftlist Studio kasutab teenuse turvaliseks ja toimivaks hoidmiseks nii küpsiseid kui ka brauserisalvestust.',
      'Hädavajalik salvestus on alati aktiivne. Analüütika on valikuline ja käivitub alles pärast kasutaja nõusolekut.',
    ],
    necessaryTitle: 'Praegu kasutatav hädavajalik salvestus',
    necessaryItems: [
      {
        name: COOKIE_CONSENT_COOKIE_NAME,
        purpose: 'Salvestab küpsiste eelistuse, et bänner ei avaneks igal lehelaadimisel uuesti.',
        duration: '180 päeva',
      },
      {
        name: 'giftlist_access_<slug>',
        purpose: 'Hoiab parooliga kaitstud avaliku kinginimekirja ligipääsu avatuna pärast korrektse parooli sisestamist.',
        duration: '30 päeva',
      },
      {
        name: 'Firebase Auth brauserisalvestus',
        purpose: 'Hoiab töölaua sisselogimise aktiivsena ka pärast lehe värskendamist või brauseri taaskäivitamist.',
        duration: 'Kuni väljalogimiseni või brauseri puhastamiseni',
      },
      {
        name: 'Näidisbroneeringute sessionStorage',
        purpose: 'Kasutatakse galerii näidislehtedel, et külastaja saaks broneerimisvoogu testida ilma kuratori päris nimekirja muutmata.',
        duration: 'Ainult praeguse vahelehe sessioon',
      },
    ],
    analyticsTitle: 'Valikuline analüütika',
    analyticsBody: [
      'Kui analüütika nõusolek on antud, võib Google Analytics 4 töötada avalehel, hinnastuse, galerii ja töölaua lehel.',
      'Avalikud kinginimekirja lehed aadressi all /l/[slug] on analüütika lehevaadete mõõtmisest välja jäetud.',
      'Giftlist Studio on seadistatud nii, et Google Analyticsisse ei saadeta teadlikult nimekirja slug’e, nimekirja pealkirju, külaliste nimesid, kingituste sõnumeid, e-posti aadresse ega muud kasutaja sisestatud isikuinfot.',
    ],
    manageTitle: 'Kuidas oma valikut hallata',
    manageBody: [
      'Võid igal ajal footerist avada Küpsiste seaded ja muuta oma analüütika eelistust.',
      `Selle veebilehe andmetöötleja on ${COMPANY_NAME}, ${COMPANY_ADDRESS}.`,
    ],
  },
}

type CookiesPageProps = {
  params: {
    locale: string
  }
}

export default function CookiesPage({ params }: CookiesPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const legalCopy = getLegalCopy(locale).pages
  const content = COOKIE_PAGE_CONTENT[locale]

  return (
    <LegalPageShell
      locale={locale}
      title={legalCopy.cookiesTitle}
      intro={legalCopy.cookiesIntro}
    >
      <section className="space-y-4">
        {content.introPoints.map((point) => (
          <p key={point}>{point}</p>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.necessaryTitle}</h2>
        <div className="grid gap-4">
          {content.necessaryItems.map((item) => (
            <article
              key={item.name}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-white">{item.name}</h3>
                  <p>{item.purpose}</p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                  {item.duration}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.analyticsTitle}</h2>
        {content.analyticsBody.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.manageTitle}</h2>
        {content.manageBody.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </LegalPageShell>
  )
}
