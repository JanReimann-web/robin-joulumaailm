import { notFound } from 'next/navigation'
import LegalPageShell from '@/components/site/LegalPageShell'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { COMPANY_NAME, getLegalCopy } from '@/lib/site/legal'

type TermsSection = {
  title: string
  paragraphs?: string[]
  points?: string[]
}

const TERMS_PAGE_CONTENT: Record<Locale, {
  updatedLabel: string
  updatedValue: string
  summaryTitle: string
  summaryBody: string
  sections: TermsSection[]
}> = {
  en: {
    updatedLabel: 'Last updated',
    updatedValue: 'March 16, 2026',
    summaryTitle: 'What these terms cover',
    summaryBody: 'These terms apply to the hosted Giftlist Studio service, including user accounts, dashboard tools, public list pages, media uploads, referrals, gallery examples, and package checkout or activation flows.',
    sections: [
      {
        title: '1. About the service',
        paragraphs: [
          `${COMPANY_NAME} provides Giftlist Studio as a hosted software service for creating, managing, and sharing event-based gift lists.`,
        ],
        points: [
          'The service may include dashboard features, public list pages, guest reservations, password-protected access, media uploads, event intro sections, gallery examples, referral discounts, and one-time 90-day package activation.',
          'The exact feature set available to you depends on the live product version, your list settings, your access state, and the package you have activated for that list.',
        ],
      },
      {
        title: '2. Account access and eligibility',
        points: [
          'You are responsible for activity performed through your account and for keeping your sign-in method secure.',
          'Giftlist Studio currently supports sign-in through Google and email/password account credentials.',
          'If you use the service on behalf of another person, family, team, or organisation, you are responsible for having the authority to do so.',
        ],
      },
      {
        title: '3. What the service is and is not',
        points: [
          'Giftlist Studio helps hosts present gift wishes, stories, event details, and reservation status in one shareable place.',
          'Giftlist Studio does not sell, deliver, or fulfil third-party gift items linked from a list. If a gift item links to another website or merchant, any purchase takes place with that third party, not with Giftlist Studio.',
          'Hosts are responsible for reviewing the accuracy and safety of the links, descriptions, and content they publish.',
        ],
      },
      {
        title: '4. Host content and permissions',
        points: [
          'You keep ownership of the text, media, and other content you upload or publish, but you grant Giftlist Studio the right to host, process, copy, resize, encode, display, and deliver that content as needed to operate the service.',
          'You confirm that you have the necessary rights and permissions for any text, photos, videos, names, event details, or third-party links you publish through the service.',
          'You must not upload unlawful, infringing, deceptive, abusive, harmful, or malware-related content.',
        ],
      },
      {
        title: '5. Visibility, passwords, and public sharing',
        points: [
          'Lists may be configured as private, public, or password-protected public depending on the current product rules and package eligibility.',
          'Private mode is intended for host-side work and previewing. Public hosting requires an active published-access state for the list.',
          'Password-protected public access currently requires a package level that supports password protection. Password-protected pages use a guest-side access cookie after a correct password has been entered.',
          'You are responsible for choosing a suitable password and for deciding with whom a public or password-protected link is shared.',
        ],
      },
      {
        title: '6. Reservations and guest interactions',
        points: [
          'Guests may reserve gifts through the public list flow where that feature is available.',
          'Gift reservation status is designed to prevent duplicate active reservations on the same item.',
          'The host sees reservation details in the dashboard, including the guest name and any optional message connected with the reserved item.',
          'Guests may choose whether their name is displayed publicly on the reserved gift card. Messages may also appear on the public card depending on the reservation flow.',
          'Gallery example pages may run in sample mode. Sample reservations are not real list reservations and are designed to reset automatically.',
        ],
      },
      {
        title: '7. Packages, trials, and access periods',
        points: [
          'New lists currently start with a 14-day trial period for building and previewing.',
          'Paid access is currently activated per list for a 90-day period, unless complimentary access or a different live offer applies.',
          'Package features and eligibility follow the live dashboard and pricing rules at the time of use or purchase.',
          'Public access, hosted public pages, and some editing features may become restricted or unavailable after the relevant access window ends.',
          'Hosted list content may be removed after the applicable access period ends, in line with the service lifecycle and deletion rules.',
        ],
      },
      {
        title: '8. Media limits and processing',
        points: [
          'Package limits currently depend on media count and video support rather than only raw storage size.',
          'At the time of these terms, Base supports up to 25 photos, Premium supports up to 50 photos and password protection, and Platinum supports up to 200 media files including up to 20 videos.',
          'Videos are currently limited to a maximum duration of 60 seconds and may be processed server-side to a web-friendly MP4 output for supported plans.',
          'Media uploads may be optimized, resized, re-encoded, or rejected if they exceed technical or package-specific limits.',
        ],
      },
      {
        title: '9. Pricing, currency, and payment',
        points: [
          'When paid checkout is enabled, package activation is processed through the configured payment provider, currently Stripe.',
          'Displayed currency may vary by the visitor’s detected region. At checkout, the live checkout page and final payment confirmation control the amount and currency actually charged.',
          'Supported package upgrades may be offered at a lower upgrade price instead of the full target package price. At the time of these terms, Base to Premium is 12.95, Base to Platinum is 24.95, and Premium to Platinum is 12.95 in the checkout currency, and each upgrade starts a fresh 90-day access period.',
          'Referral discounts, reward credits, complimentary access, and other promotions are subject to the live product rules and may be limited, changed, or removed over time.',
          'If a payment is completed successfully, the corresponding list access period is activated according to the applicable package rules.',
        ],
      },
      {
        title: '10. Referrals',
        points: [
          'Referral features are available only where the current account and package logic allow them.',
          'Referral codes may not be self-used and may be limited to one discounted purchase as a buyer plus capped reward credits for future purchases.',
          'Giftlist Studio may reserve, release, redeem, revoke, or invalidate referral codes where required by the product rules, checkout state, fraud prevention, or technical consistency.',
        ],
      },
      {
        title: '11. Prohibited use',
        points: [
          'You may not attempt to bypass access checks, package limits, reservation logic, slug ownership, password protection, payment rules, or other technical safeguards.',
          'You may not use the service for scraping, automated abuse, denial-of-service behavior, credential attacks, impersonation, unlawful marketing, or spam.',
          'You may not use Giftlist Studio to publish content that violates the rights, privacy, or safety of other people.',
        ],
      },
      {
        title: '12. Availability, maintenance, and changes',
        points: [
          'Giftlist Studio may change, improve, suspend, or remove features over time.',
          'The service may occasionally be affected by hosting issues, provider outages, maintenance windows, media processing failures, or security actions.',
          'We do not promise uninterrupted availability of every feature at all times.',
        ],
      },
      {
        title: '13. Suspension, deletion, and termination',
        points: [
          'Hosts can delete their own lists from the dashboard.',
          'Giftlist Studio may suspend or remove access to the service or to specific content where necessary for security, abuse prevention, legal compliance, or violation of these terms.',
          'Deletion of a list is designed to remove the list’s hosted content and related operational records from the active service environment, subject to billing, audit, and legal retention requirements.',
        ],
      },
      {
        title: '14. Liability and consumer protections',
        points: [
          'Giftlist Studio is provided as a hosted digital service. To the maximum extent permitted by law, we are not responsible for indirect, incidental, or third-party losses arising from merchant links, guest behaviour, or user-published content.',
          'Nothing in these terms excludes rights that cannot legally be excluded under applicable consumer or mandatory law.',
          'If you buy a package, any statutory rights regarding payments, complaints, or refunds are governed by the applicable law and the payment provider’s framework.',
        ],
      },
      {
        title: '15. Governing law and contact',
        points: [
          `Unless mandatory law requires otherwise, these terms are governed by the laws of Estonia.`,
          `${COMPANY_NAME} operates Giftlist Studio. Company details are shown in the footer of the site and on the legal pages.`,
        ],
      },
    ],
  },
  et: {
    updatedLabel: 'Viimati uuendatud',
    updatedValue: '16. märts 2026',
    summaryTitle: 'Mida need tingimused katavad',
    summaryBody: 'Need tingimused kehtivad Giftlist Studio hostitud teenusele, sealhulgas kasutajakontodele, töölaua tööriistadele, avalikele nimekirjadele, meedia üleslaadimisele, referral loogikale, galerii näidetele ning pakettide checkouti ja aktiveerimise voogudele.',
    sections: [
      {
        title: '1. Teenusest üldiselt',
        paragraphs: [
          `${COMPANY_NAME} pakub Giftlist Studiot hostitud tarkvarateenusena sündmusepõhiste kinginimekirjade loomiseks, haldamiseks ja jagamiseks.`,
        ],
        points: [
          'Teenuse hulka võivad kuuluda töölaua funktsioonid, avalikud nimekirja lehed, külaliste broneeringud, parooliga ligipääs, meedia üleslaadimine, sündmuse intro plokid, galerii näidised, referral soodustused ja ühekordne 90-päevane paketi aktiveerimine.',
          'Sulle kättesaadav täpne funktsionaalsus sõltub teenuse live-versioonist, sinu nimekirja seadistustest, ligipääsu staatusest ja vastava nimekirja jaoks aktiveeritud paketist.',
        ],
      },
      {
        title: '2. Konto ja ligipääs',
        points: [
          'Vastutad oma konto kaudu tehtud tegevuste eest ning pead hoidma oma sisselogimisviisi turvalisena.',
          'Giftlist Studio toetab praegu sisselogimist Google’i või e-posti ja parooliga loodud kontoga.',
          'Kui kasutad teenust teise isiku, pere, tiimi või organisatsiooni nimel, vastutad selle eest, et sul on selleks vajalik õigus.',
        ],
      },
      {
        title: '3. Mida teenus teeb ja mida mitte',
        points: [
          'Giftlist Studio aitab nimekirja loojal koondada kingisoovid, lood, sündmuse info ja broneeringute staatuse ühte jagatavasse kohta.',
          'Giftlist Studio ei müü, tarni ega vahenda kolmandate osapoolte kingitusi, millele nimekirjas viidatakse. Kui kingitus viib teise veebilehe või kaupmeheni, toimub võimalik ost selle kolmanda osapoolega, mitte Giftlist Studioga.',
          'Nimekirja looja vastutab avaldatud linkide, kirjelduste ja sisu õigsuse ning sobivuse eest.',
        ],
      },
      {
        title: '4. Sisu ja õigused',
        points: [
          'Säilitad oma üles laaditud tekstide, piltide, videote ja muu sisu omandiõiguse, kuid annad Giftlist Studiole õiguse seda sisu hostida, töödelda, kopeerida, tihendada, kodeerida, kuvada ja edastada ulatuses, mis on vajalik teenuse toimimiseks.',
          'Kinnitades sisu teenusesse, kinnitad ühtlasi, et sul on vajalikud õigused ja load tekstide, fotode, videote, nimede, sündmuse detailide ja kolmandate osapoolte linkide kasutamiseks.',
          'Teenusesse ei tohi laadida ebaseaduslikku, õigusi rikkuvat, eksitavat, kahjulikku ega kuritarvitavat sisu.',
        ],
      },
      {
        title: '5. Nähtavus, paroolid ja avalik jagamine',
        points: [
          'Nimekirju saab seadistada privaatseks, avalikuks või parooliga avalikuks vastavalt teenuse hetkereeglitele ja paketi sobivusele.',
          'Private režiim on mõeldud nimekirja koostamiseks ja eelvaateks nimekirja loojale. Avalik hostimine eeldab nimekirjale kehtivat avaldamisligipääsu.',
          'Parooliga avalik nähtavus nõuab praegu paketti, mis toetab paroolikaitset. Parooliga lehed kasutavad pärast õiget sisestust külalise ligipääsu-küpsist.',
          'Nimekirja looja vastutab sobiva parooli valimise ja selle eest, kellega avalikku või parooliga linki jagatakse.',
        ],
      },
      {
        title: '6. Broneeringud ja külaliste tegevused',
        points: [
          'Kui funktsioon on nimekirjas saadaval, saavad külalised avaliku voo kaudu kingitusi broneerida.',
          'Kingituse broneeringu loogika on mõeldud vältima sama kingituse korraga mitut aktiivset broneeringut.',
          'Nimekirja looja näeb töölaual broneeringu detaile, sealhulgas külalise nime ja vabatahtlikku sõnumit.',
          'Külaline saab valida, kas tema nimi kuvatakse kingituse kaardil avalikult. Sõnumid võivad samuti vastavalt broneerimisvoole avalikul kaardil kuvada.',
          'Galerii näidislehed võivad töötada demo režiimis. Demo broneeringud ei ole päris nimekirja broneeringud ja need on mõeldud automaatselt lähtestuma.',
        ],
      },
      {
        title: '7. Paketid, trial ja ligipääsuperioodid',
        points: [
          'Uued nimekirjad alustavad praegu 14-päevase trial perioodiga, mille jooksul saab nimekirja koostada ja eelvaadata.',
          'Tasuline ligipääs aktiveeritakse praegu nimekirja põhiselt 90 päevaks, kui ei kohaldu tasuta piiramatu ligipääs või mõni muu live pakkumine.',
          'Pakettide funktsioonid ja sobivus lähtuvad teenuse live hinnastusest ja töölaua reeglitest kasutamise või ostu hetkel.',
          'Avalik ligipääs, hostitud avalikud lehed ja osa redigeerimisfunktsioonidest võivad pärast vastava ligipääsuperioodi lõppu muutuda piiratud või kättesaamatuks.',
          'Hostitud nimekirja sisu võidakse eemaldada pärast kohaldatava ligipääsuperioodi lõppu vastavalt teenuse elutsükli ja kustutamise reeglitele.',
        ],
      },
      {
        title: '8. Meedialimiidid ja töötlemine',
        points: [
          'Pakettide piirangud lähtuvad praegu meediafailide arvust ja video toe olemasolust, mitte ainult toormahust.',
          'Nende tingimuste hetkel toetab Base kuni 25 fotot, Premium kuni 50 fotot ja paroolikaitset ning Platinum kuni 200 meediafaili, millest kuni 20 võivad olla videod.',
          'Videote maksimaalne kestus on praegu 60 sekundit ja toetatud pakettides võidakse need töödelda serveris veebi jaoks sobivasse MP4 väljundisse.',
          'Meedia üleslaadimisi võidakse optimeerida, ümber kodeerida või tagasi lükata, kui need ületavad tehnilisi või paketipõhiseid piiranguid.',
        ],
      },
      {
        title: '9. Hinnad, valuuta ja maksed',
        points: [
          'Kui tasuline checkout on aktiveeritud, töödeldakse paketi aktiveerimine seadistatud makseteenuse pakkuja kaudu, praegu Stripe’is.',
          'Kuvatav valuuta võib sõltuda külastaja tuvastatud piirkonnast. Ostu puhul määrab tegelikult rakenduva summa ja valuuta live checkouti leht ning lõplik maksekinnitus.',
          'Toetatud paketi upgrade võib kasutada väiksemat upgrade hinda sihtpaketi täishinna asemel. Nende tingimuste hetkel on Base → Premium 12.95, Base → Platinum 24.95 ja Premium → Platinum 12.95 checkoutis kasutatavas valuutas ning iga upgrade käivitab uue 90-päevase ligipääsuperioodi.',
          'Referral soodustused, reward credit’id, tasuta ligipääs ja muud kampaaniad alluvad teenuse live reeglitele ning neid võidakse ajas muuta, piirata või eemaldada.',
          'Kui makse õnnestub, aktiveeritakse vastava nimekirja ligipääsuperiood kohaldatava paketi reeglite järgi.',
        ],
      },
      {
        title: '10. Referral loogika',
        points: [
          'Referral funktsioonid on kasutatavad ainult siis, kui konto ja paketi reeglid neid lubavad.',
          'Referral koodi ei tohi kasutada iseenda ostuks ning ostja allahindlus ja tulevased reward credit’id võivad olla piiratud teenuse reeglitega.',
          'Giftlist Studio võib vajadusel reserveerida, vabastada, lunastada, tühistada või kehtetuks muuta referral koode, kui see on vajalik checkouti staatuse, pettuse ennetuse või tehnilise kooskõla tõttu.',
        ],
      },
      {
        title: '11. Keelatud kasutus',
        points: [
          'Keelatud on proovida mööda minna ligipääsukontrollidest, paketipiirangutest, broneeringuloogikast, slugi omandist, paroolikaitsest, maksetingimustest või muudest tehnilistest turvameetmetest.',
          'Teenust ei tohi kasutada scrapinguks, automaatseks kuritarvituseks, teenusetõkestuseks, paroolirünnakuteks, kehastamiseks, ebaseaduslikuks turunduseks ega spämmiks.',
          'Giftlist Studiot ei tohi kasutada teiste inimeste õigusi, privaatsust ega turvalisust rikkuva sisu avaldamiseks.',
        ],
      },
      {
        title: '12. Kättesaadavus, hooldus ja muudatused',
        points: [
          'Giftlist Studio võib funktsioone ajas muuta, täiendada, peatada või eemaldada.',
          'Teenuse toimimist võivad aeg-ajalt mõjutada hostingu probleemid, teenusepakkujate katkestused, hooldusaknad, meedia töötlemise tõrked või turvameetmed.',
          'Me ei taga, et kõik funktsioonid oleksid pidevalt katkestusteta saadaval.',
        ],
      },
      {
        title: '13. Peatamine, kustutamine ja lõpetamine',
        points: [
          'Nimekirja looja saab oma nimekirja töölaualt kustutada.',
          'Giftlist Studio võib peatada või eemaldada ligipääsu teenusele või konkreetsele sisule, kui see on vajalik turvalisuse, väärkasutuse tõkestamise, õigusnõuete või nende tingimuste rikkumise tõttu.',
          'Nimekirja kustutamine on mõeldud eemaldama nimekirja hostitud sisu ja seotud tööandmed aktiivsest teenusekeskkonnast, arvestades siiski arvelduse, auditi ja õiguslike säilitamisnõuetega.',
        ],
      },
      {
        title: '14. Vastutus ja tarbijakaitse',
        points: [
          'Giftlist Studio on hostitud digitaalne teenus. Seadusega lubatud maksimaalses ulatuses ei vastuta me kaudsete, juhuslike ega kolmandate osapoolte kahjude eest, mis tulenevad kaupmeeste linkidest, külaliste käitumisest või kasutajate avaldatud sisust.',
          'Miski neis tingimustes ei välista õigusi, mida ei saa kohaldatava tarbijakaitse või muu kohustusliku õiguse järgi välistada.',
          'Kui ostad paketi, reguleerivad maksetega seotud seaduslikke õigusi, kaebusi ja võimalikke tagasimakseid kohaldatav õigus ning makseteenuse pakkuja raamistik.',
        ],
      },
      {
        title: '15. Kohaldatav õigus ja kontakt',
        points: [
          'Kui kohustuslik õigus ei nõua teisiti, kohaldatakse nendele tingimustele Eesti õigust.',
          `${COMPANY_NAME} haldab Giftlist Studiot. Ettevõtte andmed on toodud veebilehe footeris ja juriidilistel lehtedel.`,
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
      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr),minmax(0,2fr)]">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            {content.updatedLabel}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{content.updatedValue}</p>
        </article>

        <article className="rounded-3xl border border-sky-400/15 bg-sky-400/5 p-5">
          <h2 className="text-xl font-semibold text-white">{content.summaryTitle}</h2>
          <p className="mt-3">{content.summaryBody}</p>
        </article>
      </section>

      {content.sections.map((section) => (
        <section key={section.title} className="space-y-4">
          <h2 className="text-xl font-semibold text-white">{section.title}</h2>

          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {section.points && (
            <ul className="list-disc space-y-2 pl-5">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </LegalPageShell>
  )
}
