import { notFound } from 'next/navigation'
import LegalPageShell from '@/components/site/LegalPageShell'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { COMPANY_ADDRESS, COMPANY_NAME, getLegalCopy } from '@/lib/site/legal'

type PrivacySection = {
  title: string
  paragraphs?: string[]
  points?: string[]
}

const PRIVACY_PAGE_CONTENT: Record<Locale, {
  updatedLabel: string
  updatedValue: string
  summaryTitle: string
  summaryBody: string
  sections: PrivacySection[]
}> = {
  en: {
    updatedLabel: 'Last updated',
    updatedValue: 'March 16, 2026',
    summaryTitle: 'Quick summary',
    summaryBody: 'Giftlist Studio processes account data, gift list content, reservation details, media metadata, billing metadata, and consent settings to operate the service. Public gift list pages are intentionally excluded from analytics page tracking.',
    sections: [
      {
        title: '1. Data controller and scope',
        paragraphs: [
          `${COMPANY_NAME} is the data controller for the Giftlist Studio website, dashboard, gallery, pricing page, login flows, and hosted public gift list pages.`,
          `Registered address: ${COMPANY_ADDRESS}.`,
          'This policy applies to data processed when you create an account, build or share a list, upload media, collect reservations, browse the marketing site, or interact with a public list as a guest.',
        ],
      },
      {
        title: '2. Personal data we process',
        points: [
          'Account and profile data such as email address, display name, profile photo URL, provider identifiers, account creation time, and trial/access status.',
          'Gift list data created by the host, including list title, slug, event type, design choice, visibility settings, password-protection status, intro text, event date and location, gift items, story entries, wheel entries, and related ordering metadata.',
          'Hosted media metadata such as storage path, file type, file size, and video duration. Images may be optimized and videos may be processed to MP4 for supported plans.',
          'Reservation data entered by guests, including the guest name, optional message, whether the guest allowed public name display, reservation timestamp, and the reserved item.',
          'Billing and referral data such as selected package, currency, amount, checkout session identifiers, payment references, referral codes, referral reward balances, and access period timestamps.',
          'Technical and security data such as sign-in persistence, password-protected list access cookies, consent preferences, server logs, and abuse-prevention or troubleshooting metadata.',
          'Limited analytics data on selected pages only if the visitor has granted analytics consent.',
        ],
      },
      {
        title: '3. What may become public',
        points: [
          'If a host sets a list to public or password-protected public, the list title, intro content, event presentation, gift items, stories, and other host-published content may become visible to anyone with the link or password.',
          'When a guest reserves a gift, the host always receives the guest name and any optional message in the dashboard for that reserved item.',
          'A guest can separately choose whether their name may be displayed publicly on the gift card. If the guest does not allow public name display, the host still sees the name privately in the dashboard.',
          'Gift reservation messages may be shown on the public gift card after reservation. Hosts should therefore publish only the type of guest interaction they are comfortable showing on a shared list page.',
        ],
      },
      {
        title: '4. Why we process the data',
        points: [
          'To create and maintain user accounts and let users sign in with Google or email/password.',
          'To let hosts create, edit, preview, publish, password-protect, and delete gift lists.',
          'To host media and render public list pages, gallery examples, and dashboard previews.',
          'To process gift reservations, prevent duplicate reservations, and show reservation status to guests and hosts.',
          'To activate paid or complimentary access periods, calculate package eligibility, and manage package lifecycle events such as trial end and purge scheduling.',
          'To process referral discounts and reward credits.',
          'To keep the service secure, detect misuse, enforce technical limits, and troubleshoot failures.',
          'To measure the homepage, pricing, gallery, and dashboard pages if analytics consent has been granted.',
        ],
      },
      {
        title: '5. Legal bases',
        points: [
          'Contract or pre-contractual steps: when you create an account, build a list, share a list, or purchase a package.',
          'Legitimate interests: maintaining security, preventing abuse, avoiding duplicate or unauthorized reservations, preserving service integrity, and improving operational reliability.',
          'Consent: optional analytics and any other optional storage or measurement that requires consent.',
          'Legal obligations: where billing, accounting, fraud prevention, or other mandatory retention rules apply.',
        ],
      },
      {
        title: '6. Cookies, browser storage, and password-protected access',
        points: [
          'Necessary storage is used for sign-in persistence, cookie preferences, password-protected public list access, and demo reservation state on gallery sample pages.',
          'Password-protected public lists create an access cookie after the correct password is entered. The cookie is designed to expire automatically after its technical validity period.',
          'Passwords for protected public lists are not stored in plain text. The service stores password verification secrets as hashed and salted values.',
          'Analytics is optional and stays off until the visitor gives consent. Public gift list pages are excluded from analytics page tracking.',
        ],
      },
      {
        title: '7. Service providers and international transfers',
        points: [
          'Firebase is used for authentication, database storage, and hosted file storage.',
          'Vercel is used to host and deliver the application.',
          'Stripe is used for package checkout and payment processing when billing is enabled.',
          'Google Analytics 4 may be used after consent on selected pages only.',
          'Some of these providers may process data outside Estonia or outside the EEA. Where that happens, the processing follows the provider’s legal and contractual transfer mechanisms.',
        ],
      },
      {
        title: '8. Retention and deletion',
        points: [
          'Account profile data is kept while the account remains active or as long as needed to operate the service relationship.',
          'Gift list content is retained while the list is active, during the applicable trial or paid access period, and until the host deletes the list or the service lifecycle removes hosted list content after the configured access period ends.',
          'Deleting a list from the dashboard is designed to remove the list document, hosted list media, stories, wheel entries, reservation records, password secret, and public slug claim associated with that list.',
          'Billing, fraud-prevention, and accounting metadata may be retained longer where necessary for legitimate business or legal reasons.',
          'Cookie preferences are stored for 180 days unless cleared earlier. Demo reservation session storage is temporary and tied to the visitor’s current browser session.',
        ],
      },
      {
        title: '9. Security and access control',
        points: [
          'Access to dashboard data depends on account authentication and ownership checks.',
          'Public list content is only served while the relevant access state is valid, and password-protected lists require a valid access token after successful password verification.',
          'Reservation writes use server-side validation and transaction logic to prevent conflicting gift reservations.',
          'Media processing and hosted content access are subject to storage rules, application checks, and package-specific limits.',
        ],
      },
      {
        title: '10. Your choices and rights',
        points: [
          'You can accept only necessary storage and keep analytics disabled.',
          'You can reopen Cookie settings from the footer at any time and update your analytics preference.',
          'Hosts can edit or delete their lists from the dashboard.',
          'Subject to applicable law, you may have rights to access, correct, erase, restrict, or object to the processing of your personal data and to lodge a complaint with the competent supervisory authority.',
          `For privacy-related follow-up, contact ${COMPANY_NAME} using the company details shown on this page.`,
        ],
      },
      {
        title: '11. Changes to this policy',
        paragraphs: [
          'We may update this policy when the service, legal requirements, providers, or data flows change. The version published on this page is the current one.',
        ],
      },
    ],
  },
  et: {
    updatedLabel: 'Viimati uuendatud',
    updatedValue: '16. märts 2026',
    summaryTitle: 'Lühikokkuvõte',
    summaryBody: 'Giftlist Studio töötleb kontoandmeid, kinginimekirja sisu, broneeringu detaile, meedia metaandmeid, arvelduse metaandmeid ja küpsiste valikuid selleks, et teenus töötaks. Avalikke kinginimekirja lehti analüütikaga ei mõõdeta.',
    sections: [
      {
        title: '1. Andmetöötleja ja ulatus',
        paragraphs: [
          `${COMPANY_NAME} on Giftlist Studio veebilehe, töölaua, galerii, hinnastuse, sisselogimise ja hostitud avalike kinginimekirjade andmetöötleja.`,
          `Registreeritud aadress: ${COMPANY_ADDRESS}.`,
          'See poliitika kehtib andmetele, mida töödeldakse konto loomisel, nimekirja koostamisel või jagamisel, meedia üleslaadimisel, broneeringute kogumisel, turunduslehtede külastamisel või avaliku nimekirja kasutamisel külalisena.',
        ],
      },
      {
        title: '2. Milliseid isikuandmeid töötleme',
        points: [
          'Konto- ja profiiliandmed, näiteks e-posti aadress, kuvatav nimi, profiilipildi URL, sisselogimise pakkujate tunnused, konto loomise aeg ning triali ja ligipääsu staatus.',
          'Nimekirja looja koostatud sisu, sealhulgas nimekirja pealkiri, slug, sündmuse tüüp, kujundus, nähtavus, paroolikaitse staatus, intro tekst, toimumise kuupäev ja koht, kingitused, lood, ratta küsimused ning järjestuse metaandmed.',
          'Hostitud meedia metaandmed, näiteks failitee, failitüüp, faili suurus ja video kestus. Pilte võidakse optimeerida ja videoid võidakse toetatud pakettides töödelda MP4 formaati.',
          'Külaliste sisestatud broneeringuandmed, sealhulgas nimi, valikuline sõnum, valik kas nimi võib olla avalikult nähtav, broneeringu aeg ja valitud kingitus.',
          'Arvelduse ja referral andmed, näiteks valitud pakett, valuuta, summa, checkouti identifikaatorid, makseviited, referral koodid, reward-saldo ja ligipääsuperioodi ajatemplid.',
          'Tehnilised ja turvaandmed, näiteks sisselogimise püsimine, parooliga nimekirja ligipääsu-küpsis, küpsiste valik, serverilogid ning kuritarvituse tõkestamise või veaotsingu metaandmed.',
          'Piiratud analüütikaandmed ainult valitud lehtedel ja ainult siis, kui külastaja on andnud analüütika nõusoleku.',
        ],
      },
      {
        title: '3. Mis võib muutuda avalikuks',
        points: [
          'Kui nimekirja looja seab nimekirja avalikuks või parooliga avalikuks, võivad nimekirja pealkiri, intro sisu, sündmuse esitlus, kingitused, lood ja muu avaldatud sisu muutuda nähtavaks kõigile, kellel on link või parool.',
          'Kui külaline broneerib kingituse, näeb nimekirja looja alati töölaual selle kingituse juures külalise nime ja võimalikku sõnumit.',
          'Külaline saab eraldi valida, kas tema nimi võib olla kingituse kaardil avalikult nähtav. Kui külaline nime avalikustamist ei luba, näeb nimekirja looja seda nime siiski töölaual privaatselt.',
          'Kingituse broneerimise sõnum võib pärast broneerimist avalikul kaardil kuvada. Seetõttu peaks nimekirja looja kasutama jagataval lehel ainult sellist külaliste sisendit, mida ollakse valmis avalikult näitama.',
        ],
      },
      {
        title: '4. Milleks andmeid kasutame',
        points: [
          'Kasutajakontode loomiseks ja haldamiseks ning Google’i või e-posti/parooliga sisselogimise võimaldamiseks.',
          'Selleks, et nimekirja looja saaks kinginimekirju koostada, muuta, eelvaadata, avaldada, parooliga kaitsta ja kustutada.',
          'Meedia hostimiseks ning avalike nimekirjade, galerii näidiste ja töölaua eelvaadete kuvamiseks.',
          'Kingituste broneeringute töötlemiseks, topeltbroneeringute vältimiseks ja õige staatuse kuvamiseks nii külalistele kui nimekirja loojale.',
          'Tasulise või tasuta piiramatu ligipääsu aktiveerimiseks, paketi sobivuse arvutamiseks ja teenuse elutsükli sündmuste, näiteks triali lõpu ja purge ajastuse haldamiseks.',
          'Referral soodustuste ja reward credit’ite töötlemiseks.',
          'Teenuse turvalisuse hoidmiseks, väärkasutuse tuvastamiseks, tehniliste piirangute jõustamiseks ja vigade lahendamiseks.',
          'Avalehe, hinnastuse, galerii ja töölaua lehtede mõõtmiseks siis, kui analüütika nõusolek on antud.',
        ],
      },
      {
        title: '5. Õiguslikud alused',
        points: [
          'Lepingu täitmine või lepingueelsete sammude tegemine: kui lood konto, koostad nimekirja, jagad nimekirja või ostad paketi.',
          'Õigustatud huvi: turvalisuse tagamine, väärkasutuse tõkestamine, topelt- või loata broneeringute vältimine, teenuse töökindluse hoidmine ja operatiivne arendamine.',
          'Nõusolek: valikuline analüütika ja muu mõõtmine või salvestus, mis nõuab nõusolekut.',
          'Seadusest tulenev kohustus: kui kohaldub arvelduse, raamatupidamise, pettuse ennetuse või muu kohustusliku säilitamise nõue.',
        ],
      },
      {
        title: '6. Küpsised, brauserisalvestus ja parooliga ligipääs',
        points: [
          'Hädavajalikku salvestust kasutatakse sisselogimise püsimiseks, küpsiste valiku hoidmiseks, parooliga kaitstud avalike nimekirjade avamiseks ja galerii näidisbroneeringute hoidmiseks.',
          'Parooliga avaliku nimekirja õige avamise järel luuakse ligipääsu-küpsis. See on mõeldud automaatselt aeguma pärast oma tehnilist kehtivusaega.',
          'Parooliga kaitstud avalike nimekirjade paroole ei säilitata lihttekstina. Teenus säilitab kontrollväärtused räsitud ja soolatud kujul.',
          'Analüütika on valikuline ja jääb välja, kuni külastaja annab nõusoleku. Avalikke kinginimekirja lehti analüütikaga ei mõõdeta.',
        ],
      },
      {
        title: '7. Teenusepakkujad ja rahvusvahelised andmeedastused',
        points: [
          'Firebase’i kasutatakse autentimiseks, andmebaasiks ja failide salvestamiseks.',
          'Vercelit kasutatakse rakenduse hostimiseks ja edastamiseks.',
          'Stripe’i kasutatakse pakettide checkouti ja maksete töötlemiseks, kui arveldus on aktiveeritud.',
          'Google Analytics 4 võib töötada pärast nõusolekut ainult valitud lehtedel.',
          'Mõned neist teenusepakkujatest võivad töödelda andmeid väljaspool Eestit või väljaspool EMP-d. Sellisel juhul toimub töötlemine teenusepakkuja õiguslike ja lepinguliste kaitsemehhanismide alusel.',
        ],
      },
      {
        title: '8. Säilitamine ja kustutamine',
        points: [
          'Konto profiiliandmeid säilitatakse seni, kuni konto on aktiivne või nii kaua kui see on teenuse suhte toimimiseks vajalik.',
          'Kinginimekirja sisu säilitatakse nimekirja aktiivsuse ajal, kohaldatava triali või tasulise ligipääsu perioodi jooksul ning kuni nimekirja looja selle kustutab või teenuse elutsükkel eemaldab hostitud nimekirja sisu pärast seadistatud ligipääsuperioodi lõppu.',
          'Nimekirja kustutamine töölaualt on mõeldud eemaldama nimekirja dokumendi, hostitud nimekirja meedia, lood, ratta küsimused, broneeringud, paroolisaladuse ja avaliku slug-viite.',
          'Arvelduse, pettuse ennetuse ja raamatupidamise metaandmeid võidakse säilitada kauem, kui see on vajalik õigustatud ärihuvi või seadusest tuleneva kohustuse täitmiseks.',
          'Küpsiste valikut säilitatakse 180 päeva, kui seda varem ei kustutata. Näidisbroneeringute sessionStorage on ajutine ja seotud külastaja praeguse brauseri sessiooniga.',
        ],
      },
      {
        title: '9. Turvalisus ja ligipääsukontroll',
        points: [
          'Töölaua andmetele ligipääs sõltub konto autentimisest ja omandikontrollidest.',
          'Avalikku nimekirja serveeritakse ainult siis, kui vastav ligipääsu staatus on kehtiv, ja parooliga nimekirjad nõuavad edukat parooli kontrolli ning kehtivat ligipääsutokenit.',
          'Broneeringute kirjutamine kasutab serveripoolset valideerimist ja tehinguloogikat, et vältida kingituste konflikte.',
          'Meedia töötlemine ja hostitud sisu ligipääs alluvad salvestusreeglitele, rakenduse kontrollidele ja paketipõhistele piirangutele.',
        ],
      },
      {
        title: '10. Sinu valikud ja õigused',
        points: [
          'Saad lubada ainult hädavajaliku salvestuse ja hoida analüütika välja lülitatuna.',
          'Saad footerist igal ajal avada Küpsiste seaded ja muuta oma analüütika valikut.',
          'Nimekirja looja saab töölaual oma nimekirju muuta või kustutada.',
          'Kohaldatava õiguse järgi võivad sul olla õigus küsida ligipääsu oma andmetele, nende parandamist, kustutamist, töötlemise piiramist või töötlemisele vastuväite esitamist ning esitada kaebus pädevale järelevalveasutusele.',
          `Privaatsusega seotud järelpäringute jaoks võta ühendust ${COMPANY_NAME}-ga sellel lehel toodud ettevõtte andmete kaudu.`,
        ],
      },
      {
        title: '11. Muudatused selles poliitikas',
        paragraphs: [
          'Võime seda poliitikat uuendada siis, kui teenus, õigusnõuded, teenusepakkujad või andmevood muutuvad. Sellel lehel avaldatud versioon on kehtiv versioon.',
        ],
      },
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
      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr),minmax(0,2fr)]">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            {content.updatedLabel}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{content.updatedValue}</p>
        </article>

        <article className="rounded-3xl border border-emerald-400/15 bg-emerald-400/5 p-5">
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
