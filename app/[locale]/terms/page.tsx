import { notFound } from 'next/navigation'
import LegalPageShell from '@/components/site/LegalPageShell'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { COMPANY_NAME, getLegalCopy } from '@/lib/site/legal'

const TERMS_PAGE_CONTENT: Record<Locale, {
  sections: Array<{
    title: string
    points: string[]
  }>
}> = {
  en: {
    sections: [
      {
        title: '1. Service scope',
        points: [
          `${COMPANY_NAME} provides Giftlist Studio as a hosted service for creating, sharing, and managing event-based gift lists.`,
          'The service includes dashboard tools, public list pages, reservations, media uploads, referrals, and package activation features as available at the time of use.',
        ],
      },
      {
        title: '2. Account responsibility',
        points: [
          'Users are responsible for keeping their sign-in credentials secure and for activity performed through their account.',
          'List owners are responsible for the content, links, media, and guest-facing text they publish through the service.',
        ],
      },
      {
        title: '3. Acceptable use',
        points: [
          'The service may not be used for unlawful, abusive, misleading, infringing, or harmful content.',
          'Users may not attempt to bypass package limits, reservation protection, password protection, or technical security controls.',
        ],
      },
      {
        title: '4. Packages, access windows, and deletion',
        points: [
          'Package features and duration follow the product rules shown in the dashboard and pricing pages at the time of purchase.',
          'Public list access and related hosted content may be removed after the applicable access period ends, according to the service lifecycle rules.',
        ],
      },
      {
        title: '5. Availability and changes',
        points: [
          'Giftlist Studio may change, improve, suspend, or remove features over time.',
          'Reasonable technical maintenance, abuse prevention, and security actions may affect access to the service.',
        ],
      },
      {
        title: '6. Payments',
        points: [
          'If paid packages are enabled, payment processing is handled through the configured payment provider.',
          'Prices, package content, and activation terms should always be reviewed on the live pricing and checkout screens before purchase.',
        ],
      },
    ],
  },
  et: {
    sections: [
      {
        title: '1. Teenuse ulatus',
        points: [
          `${COMPANY_NAME} pakub Giftlist Studiot hostitud teenusena sündmusepõhiste kinginimekirjade loomiseks, jagamiseks ja haldamiseks.`,
          'Teenuse hulka kuuluvad kasutamise hetkel saadaval olevad töölaua tööriistad, avalikud nimekirja lehed, broneeringud, meedia üleslaadimine, referral loogika ja pakettide aktiveerimine.',
        ],
      },
      {
        title: '2. Konto vastutus',
        points: [
          'Kasutaja vastutab oma sisselogimisandmete turvalisuse ning oma konto kaudu tehtud tegevuste eest.',
          'Nimekirja looja vastutab teenuse kaudu avaldatud sisu, linkide, meedia ja külalistele nähtava teksti eest.',
        ],
      },
      {
        title: '3. Lubatud kasutus',
        points: [
          'Teenust ei tohi kasutada ebaseadusliku, kuritarvitava, eksitava, õigusi rikkuva ega kahjuliku sisu jaoks.',
          'Kasutaja ei tohi proovida mööda minna paketipiirangutest, broneeringukaitsest, paroolikaitsest ega tehnilistest turvameetmetest.',
        ],
      },
      {
        title: '4. Paketid, ligipääsuperioodid ja kustutamine',
        points: [
          'Pakettide funktsioonid ja kestus järgivad ostuhetkel töölaual ja hinnastuse lehel näidatud toote reegleid.',
          'Avaliku nimekirja ligipääs ja sellega seotud hostitud sisu võidakse eemaldada pärast vastava ligipääsuperioodi lõppu vastavalt teenuse elutsükli reeglitele.',
        ],
      },
      {
        title: '5. Kättesaadavus ja muudatused',
        points: [
          'Giftlist Studio võib funktsioone ajas muuta, täiendada, peatada või eemaldada.',
          'Mõistlik tehniline hooldus, kuritarvituse tõkestamine ja turvameetmed võivad mõjutada ligipääsu teenusele.',
        ],
      },
      {
        title: '6. Maksed',
        points: [
          'Kui tasulised paketid on aktiveeritud, toimub maksete töötlemine seadistatud makseteenuse pakkuja kaudu.',
          'Enne ostu tuleb alati üle vaadata live hinnastuse ja checkouti ekraanil näidatud hind, paketi sisu ja aktiveerimise tingimused.',
        ],
      },
    ],
  },
}

type TermsPageProps = {
  params: {
    locale: string
  }
}

export default function TermsPage({ params }: TermsPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const legalCopy = getLegalCopy(locale).pages
  const content = TERMS_PAGE_CONTENT[locale]

  return (
    <LegalPageShell
      locale={locale}
      title={legalCopy.termsTitle}
      intro={legalCopy.termsIntro}
    >
      {content.sections.map((section) => (
        <section key={section.title} className="space-y-4">
          <h2 className="text-xl font-semibold text-white">{section.title}</h2>
          <ul className="list-disc space-y-2 pl-5">
            {section.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}
    </LegalPageShell>
  )
}
