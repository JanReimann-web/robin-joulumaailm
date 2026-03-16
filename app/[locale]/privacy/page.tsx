import { notFound } from 'next/navigation'
import LegalPageShell from '@/components/site/LegalPageShell'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { COMPANY_ADDRESS, COMPANY_NAME, getLegalCopy } from '@/lib/site/legal'

const PRIVACY_PAGE_CONTENT: Record<Locale, {
  controllerTitle: string
  controllerBody: string[]
  dataTitle: string
  dataItems: string[]
  useTitle: string
  useItems: string[]
  processorsTitle: string
  processorsItems: string[]
  retentionTitle: string
  retentionItems: string[]
  rightsTitle: string
  rightsItems: string[]
}> = {
  en: {
    controllerTitle: 'Controller',
    controllerBody: [
      `${COMPANY_NAME}`,
      COMPANY_ADDRESS,
      'This policy covers the Giftlist Studio website and related public gift list pages.',
    ],
    dataTitle: 'Personal data we may process',
    dataItems: [
      'Account data such as email address, display name, and sign-in provider details when a user creates or accesses an account.',
      'Gift list content entered by the host, including list titles, event settings, gift items, stories, wheel entries, uploaded media metadata, and reservation details.',
      'Public access data related to password-protected lists, such as hashed password secrets and access cookies after successful unlock.',
      'Billing and referral data needed to activate packages, apply discounts, and manage access windows.',
      'Limited analytics data on selected marketing pages only, if the visitor has granted analytics consent.',
    ],
    useTitle: 'Why the data is used',
    useItems: [
      'To create and manage user accounts.',
      'To publish, display, and secure gift lists for hosts and invited guests.',
      'To process reservations and show reservation status correctly.',
      'To activate paid access, complimentary access, and referrals.',
      'To protect the service against abuse, duplication conflicts, and unauthorized access.',
      'To understand how the homepage, pricing, gallery, and dashboard pages perform if analytics consent is granted.',
    ],
    processorsTitle: 'Main service providers',
    processorsItems: [
      'Firebase (authentication, database, and file storage).',
      'Vercel (application hosting and delivery).',
      'Stripe (payments, when package checkout is used).',
      'Google Analytics 4 (analytics only after consent, on selected pages only).',
    ],
    retentionTitle: 'How long data is kept',
    retentionItems: [
      'Account and operational data is kept while the account and service relationship remain active, unless deletion is requested or retention is required for legitimate business reasons.',
      'Gift list content follows the product lifecycle. Public list data is removed after the configured access period ends, according to the service rules.',
      'Password access cookies expire automatically after their technical validity period.',
      'Analytics data retention follows the settings configured in Google Analytics, but analytics tracking is not run on public gift list pages.',
    ],
    rightsTitle: 'Your choices and rights',
    rightsItems: [
      'Visitors can accept only necessary storage and keep analytics disabled.',
      'Users can change cookie preferences later from Cookie settings in the footer.',
      'Account owners can delete lists from the dashboard and can request account-related privacy follow-up from the company using the controller details above.',
    ],
  },
  et: {
    controllerTitle: 'Andmetöötleja',
    controllerBody: [
      `${COMPANY_NAME}`,
      COMPANY_ADDRESS,
      'See poliitika katab Giftlist Studio veebilehe ja sellega seotud avalikud kinginimekirja lehed.',
    ],
    dataTitle: 'Milliseid isikuandmeid võime töödelda',
    dataItems: [
      'Kontoandmed nagu e-posti aadress, kuvatav nimi ja sisselogimise pakkuja info, kui kasutaja loob konto või kasutab seda.',
      'Nimekirja looja sisestatud sisu, sealhulgas nimekirja pealkirjad, sündmuse seaded, kingitused, lood, ratta küsimused, üles laaditud meedia metaandmed ja broneeringu detailid.',
      'Parooliga kaitstud nimekirjade ligipääsuandmed, näiteks parooli räsi ja edukal avamisel loodud ligipääsu-küpsis.',
      'Arvelduse ja referral andmed, mida on vaja pakettide aktiveerimiseks, soodustuste rakendamiseks ja ligipääsu haldamiseks.',
      'Piiratud analüütikaandmed valitud turunduslehtedel ainult siis, kui külastaja on andnud analüütika nõusoleku.',
    ],
    useTitle: 'Milleks andmeid kasutatakse',
    useItems: [
      'Kasutajakontode loomiseks ja haldamiseks.',
      'Kinginimekirjade avaldamiseks, kuvamiseks ja kaitsmiseks nimekirja loojale ning kutsutud külalistele.',
      'Broneeringute töötlemiseks ja korrektse staatuse näitamiseks.',
      'Tasulise ligipääsu, tasuta piiramatu ligipääsu ja referral loogika haldamiseks.',
      'Teenuse kaitsmiseks kuritarvituse, topeltbroneeringute ja loata ligipääsu eest.',
      'Avalehe, hinnastuse, galerii ja töölaua lehe toimivuse mõistmiseks siis, kui analüütika nõusolek on antud.',
    ],
    processorsTitle: 'Peamised teenusepakkujad',
    processorsItems: [
      'Firebase (autentimine, andmebaas ja failide salvestus).',
      'Vercel (rakenduse hostimine ja edastus).',
      'Stripe (maksed, kui paketi checkout on kasutusel).',
      'Google Analytics 4 (analüütika ainult nõusoleku alusel ja ainult valitud lehtedel).',
    ],
    retentionTitle: 'Kui kaua andmeid säilitatakse',
    retentionItems: [
      'Konto- ja teenuse toimimiseks vajalikud andmed säilivad nii kaua, kuni konto ja teenuse kasutussuhe on aktiivne, välja arvatud juhul kui kustutamist taotletakse või säilitamine on vajalik põhjendatud ärihuvi tõttu.',
      'Kinginimekirja sisu järgib toote elutsüklit. Avaliku nimekirja andmed eemaldatakse pärast seadistatud ligipääsuperioodi lõppu vastavalt teenuse reeglitele.',
      'Parooliga ligipääsu küpsised aeguvad automaatselt pärast nende tehnilise kehtivusaja lõppu.',
      'Analüütika andmete säilitamine järgib Google Analyticsis seadistatud retention reegleid, kuid avalikke kinginimekirja lehti analüütikaga ei mõõdeta.',
    ],
    rightsTitle: 'Sinu valikud ja õigused',
    rightsItems: [
      'Külastaja saab lubada ainult hädavajaliku salvestuse ja hoida analüütika välja lülitatuna.',
      'Kasutaja saab hiljem footerist Küpsiste seaded kaudu oma valikut muuta.',
      'Konto omanik saab töölaual nimekirju kustutada ning konto privaatsusega seotud jätkupäringu esitada ülaltoodud andmetöötleja andmete alusel.',
    ],
  },
}

type PrivacyPageProps = {
  params: {
    locale: string
  }
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  if (!isLocale(params.locale)) {
    notFound()
  }

  const locale = params.locale
  const legalCopy = getLegalCopy(locale).pages
  const content = PRIVACY_PAGE_CONTENT[locale]

  return (
    <LegalPageShell
      locale={locale}
      title={legalCopy.privacyTitle}
      intro={legalCopy.privacyIntro}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.controllerTitle}</h2>
        {content.controllerBody.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.dataTitle}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {content.dataItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.useTitle}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {content.useItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.processorsTitle}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {content.processorsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.retentionTitle}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {content.retentionItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">{content.rightsTitle}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {content.rightsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </LegalPageShell>
  )
}
