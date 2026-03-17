import { notFound } from 'next/navigation'
import LegalPageShell from '@/components/site/LegalPageShell'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getLegalCopy } from '@/lib/site/legal'

type FaqEntry = {
  question: string
  answer: string[]
}

type FaqSection = {
  id: string
  title: string
  entries: FaqEntry[]
}

const FAQ_PAGE_CONTENT: Record<Locale, {
  updatedLabel: string
  updatedValue: string
  sectionJumpLabel: string
  sections: FaqSection[]
}> = {
  en: {
    updatedLabel: 'Last updated',
    updatedValue: 'March 16, 2026',
    sectionJumpLabel: 'Jump to a topic',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting started',
        entries: [
          {
            question: 'How do I create my first gift list?',
            answer: [
              'Sign in with Google or email/password, open the dashboard, and create a new list with a title, public slug, event type, design, and visibility.',
              'Every new list starts with a 14-day trial so you can build and preview the experience before activating a paid access period.',
            ],
          },
          {
            question: 'Can I edit the design and event settings later?',
            answer: [
              'Yes. You can change the event type, design, intro text, media, and visibility settings from the dashboard after the list has been created.',
              'If a setting requires a higher package level, the dashboard will prompt you to activate a suitable package first.',
            ],
          },
          {
            question: 'What is visible during the 14-day trial?',
            answer: [
              'During trial you can build the list, upload content, and preview how the page will look.',
              'Public hosting depends on the list having an active published-access state. Trial is mainly for setup and preview before the 90-day paid period is activated.',
            ],
          },
        ],
      },
      {
        id: 'packages-pricing',
        title: 'Packages and pricing',
        entries: [
          {
            question: 'What are the current package differences?',
            answer: [
              'Base supports up to 25 photos.',
              'Premium supports up to 50 photos and adds password-protected public sharing.',
              'Platinum supports up to 200 media files in total, including up to 20 videos.',
            ],
          },
          {
            question: 'How long does paid access last?',
            answer: [
              'A paid package currently activates one list for 90 days.',
              'When the paid access period ends, public hosting and related access can expire according to the product lifecycle rules shown in the dashboard.',
            ],
          },
          {
            question: 'Why do I sometimes see prices in EUR and sometimes in USD?',
            answer: [
              'Giftlist Studio currently resolves pricing currency from the visitor region. European traffic is shown EUR pricing and other regions are shown USD pricing.',
              'The live checkout page always controls the final amount and currency actually charged.',
            ],
          },
          {
            question: 'Can I keep my list private without paying?',
            answer: [
              'Private mode is kept as a visibility option. It is intended for drafting and owner-side access.',
              'Public sharing and some dashboard capabilities depend on the current access state and the package rules that apply to your list.',
            ],
          },
        ],
      },
      {
        id: 'sharing-passwords',
        title: 'Sharing and visibility',
        entries: [
          {
            question: 'What is the difference between public, password-protected, and private?',
            answer: [
              'Public means the list can be opened with its direct link while the list access period is active.',
              'Password-protected public means the guest must enter the correct password before viewing the list. This currently requires Premium or Platinum.',
              'Private is for owner-side editing and previewing rather than open guest access.',
            ],
          },
          {
            question: 'How does password protection work for guests?',
            answer: [
              'After a guest enters the correct password, the site stores a technical access cookie so the guest does not need to re-enter the password on every click.',
              'That access is temporary and the cookie is designed to expire automatically after its validity period.',
            ],
          },
          {
            question: 'Can I change the public link slug after creation?',
            answer: [
              'The slug is created as part of the list identity and is tied to a slug claim in the backend.',
              'If you need a different public link, create it carefully from the start or confirm whether the current dashboard flow supports changing it before sharing it widely.',
            ],
          },
        ],
      },
      {
        id: 'reservations',
        title: 'Gift reservations',
        entries: [
          {
            question: 'What must a guest enter when reserving a gift?',
            answer: [
              'The guest name is required.',
              'A message is optional, and the guest can also choose whether their name may be shown publicly on the reserved gift card.',
            ],
          },
          {
            question: 'What does the list owner see after a reservation?',
            answer: [
              'The dashboard shows the reserved gift together with the guest name, the optional message, and whether the guest allowed their name to be shown publicly.',
              'This lets the host understand both the reservation status and the message left with that specific gift.',
            ],
          },
          {
            question: 'What becomes visible on the public gift card after reservation?',
            answer: [
              'The gift card can show that the item has been reserved.',
              'If the guest allowed public name display, the guest name may also be shown. The guest message may likewise appear on the card once the reservation is complete.',
            ],
          },
          {
            question: 'Can I test reservations from the gallery example pages?',
            answer: [
              'Yes. Gallery examples can run in demo mode so visitors can test the reservation flow.',
              'Demo reservations do not affect the curator’s real example list and are designed to reset automatically after roughly 5 minutes.',
            ],
          },
        ],
      },
      {
        id: 'media',
        title: 'Media uploads',
        entries: [
          {
            question: 'Which media can I upload?',
            answer: [
              'Giftlist Studio supports images throughout the list experience. Video support is available on plans that allow it.',
              'Images may be optimized automatically. Supported videos are processed server-side into a web-friendly MP4 format.',
            ],
          },
          {
            question: 'What is the video limit?',
            answer: [
              'Videos are currently limited to Platinum lists, up to 20 videos per list, and each video can be up to 60 seconds long.',
              'The dashboard also shows these limits so hosts can plan their list before uploading.',
            ],
          },
          {
            question: 'Why did my video upload fail?',
            answer: [
              'Common causes are unsupported formats, videos longer than 60 seconds, package limits, or server-side processing failures during conversion.',
              'If a video fails, try a shorter clip, a simpler export, or a standard MP4/H.264 file before uploading again.',
            ],
          },
          {
            question: 'Do large photos count against a raw storage cap?',
            answer: [
              'The visible product model is now based primarily on file counts, not just raw megabytes.',
              'However, the service still applies technical file-size and processing limits in the background to keep uploads stable and reliable.',
            ],
          },
        ],
      },
      {
        id: 'billing-referrals',
        title: 'Billing and referrals',
        entries: [
          {
            question: 'How does checkout work?',
            answer: [
              'When billing is enabled, package checkout runs through Stripe. After successful checkout, the selected list receives the corresponding access period.',
              'If a list needs a larger package because of media count, video use, or password protection, the checkout flow will guide you to the right plan.',
            ],
          },
          {
            question: 'How do referral codes work?',
            answer: [
              'Eligible users can generate up to 3 active referral codes. A valid referral code gives the buyer 20% off one qualifying purchase.',
              'Each successful redeemed referral gives the code owner 10% reward credit for a future purchase, up to a 30% discount on one order.',
            ],
          },
          {
            question: 'Can I use my own referral code?',
            answer: [
              'No. Self-referral is blocked.',
              'Referral availability can also be restricted for complimentary accounts or for buyers who have already used a referral as defined by the live product rules.',
            ],
          },
        ],
      },
      {
        id: 'privacy-security',
        title: 'Privacy and security',
        entries: [
          {
            question: 'Do you track public gift list pages with Google Analytics?',
            answer: [
              'No. Public gift list pages are intentionally excluded from analytics page tracking.',
              'If analytics is enabled in the future, it only runs after consent and only on selected marketing and dashboard pages.',
            ],
          },
          {
            question: 'Are password-protected list passwords stored in plain text?',
            answer: [
              'No. Password verification secrets are stored in hashed and salted form, not as readable plain text passwords.',
            ],
          },
          {
            question: 'What happens when I delete a list?',
            answer: [
              'Deleting a list from the dashboard is designed to remove the hosted list content, related reservations, public slug claim, password secret, and associated media from the active service environment.',
              'Some billing or audit metadata may still be retained where that is necessary for legal or operational reasons.',
            ],
          },
        ],
      },
    ],
  },
  et: {
    updatedLabel: 'Viimati uuendatud',
    updatedValue: '16. märts 2026',
    sectionJumpLabel: 'Liigu teema juurde',
    sections: [
      {
        id: 'getting-started',
        title: 'Alustamine',
        entries: [
          {
            question: 'Kuidas luua oma esimene kinginimekiri?',
            answer: [
              'Logi sisse Google’i või e-posti/parooliga, ava töölaud ja loo uus nimekiri pealkirja, avaliku slug’i, sündmuse tüübi, kujunduse ja nähtavusega.',
              'Iga uus nimekiri alustab 14-päevase trialiga, et saaksid kogemuse valmis ehitada ja eelvaadata enne tasulise ligipääsu aktiveerimist.',
            ],
          },
          {
            question: 'Kas ma saan hiljem kujundust ja sündmuse seadeid muuta?',
            answer: [
              'Jah. Töölaual saad muuta sündmuse tüüpi, kujundust, intro teksti, meediat ja nähtavuse seadeid ka pärast nimekirja loomist.',
              'Kui mõni valik eeldab kõrgemat paketti, juhendab töölaud sind sobiva paketi aktiveerimiseni.',
            ],
          },
          {
            question: 'Mida 14-päevase triali ajal teha saab?',
            answer: [
              'Triali ajal saad nimekirja koostada, sisu üles laadida ja eelvaadata, kuidas leht välja näeb.',
              'Avalik hostimine sõltub sellest, et nimekirjal oleks aktiivne avaldamisligipääs. Trial on mõeldud peamiselt seadistamiseks ja eelvaateks enne 90-päevase tasulise perioodi aktiveerimist.',
            ],
          },
        ],
      },
      {
        id: 'packages-pricing',
        title: 'Paketid ja hinnad',
        entries: [
          {
            question: 'Mis on praegu pakettide peamised erinevused?',
            answer: [
              'Base toetab kuni 25 fotot.',
              'Premium toetab kuni 50 fotot ja lisab parooliga avaliku jagamise.',
              'Platinum toetab kokku kuni 200 meediafaili, millest kuni 20 võivad olla videod.',
            ],
          },
          {
            question: 'Kui kaua tasuline ligipääs kestab?',
            answer: [
              'Tasuline pakett aktiveerib praegu ühe nimekirja 90 päevaks.',
              'Kui tasuline ligipääsuperiood lõpeb, võivad avalik hostimine ja sellega seotud funktsioonid aeguda vastavalt töölaual kuvatud elutsükli reeglitele.',
            ],
          },
          {
            question: 'Miks näen vahel hinda eurodes ja vahel dollarites?',
            answer: [
              'Giftlist Studio määrab hinnavaluuta praegu külastaja piirkonna järgi. Euroopa liiklus näeb EUR hindu ja muud piirkonnad USD hindu.',
              'Ostu hetkel määrab tegeliku makstava summa ja valuuta alati live checkouti leht.',
            ],
          },
          {
            question: 'Kas ma saan nimekirja privaatseks jätta ka ilma maksmata?',
            answer: [
              'Private režiim on nähtavuse valikuna alles. See on mõeldud eelkõige koostamiseks ja omaniku eelvaateks.',
              'Avalik jagamine ja osa töölaua funktsioone sõltuvad siiski nimekirja ligipääsu staatusest ja paketireeglitest.',
            ],
          },
        ],
      },
      {
        id: 'sharing-passwords',
        title: 'Jagamine ja nähtavus',
        entries: [
          {
            question: 'Mis vahe on avalikul, parooliga avalikul ja privaatsel nimekirjal?',
            answer: [
              'Avalik nimekiri avaneb aktiivse ligipääsu korral otse jagatava lingiga.',
              'Parooliga avalik nimekiri nõuab enne sisu nägemist õige parooli sisestamist. Praegu eeldab see vähemalt Premium või Platinum paketti.',
              'Private on mõeldud nimekirja loojale koostamiseks ja eelvaateks, mitte vabaks külaliste ligipääsuks.',
            ],
          },
          {
            question: 'Kuidas paroolikaitse külalise jaoks töötab?',
            answer: [
              'Pärast õige parooli sisestamist salvestab veebileht tehnilise ligipääsu-küpsise, et külaline ei peaks igal klikil parooli uuesti sisestama.',
              'See ligipääs on ajutine ja küpsis on mõeldud automaatselt aeguma pärast oma kehtivusaega.',
            ],
          },
          {
            question: 'Kas avalikku slug’i saab pärast loomist muuta?',
            answer: [
              'Slug on osa nimekirja identiteedist ja seotud backendis slug claim’iga.',
              'Kui vajad teistsugust avalikku linki, tasub see hoolikalt paika panna juba loomise hetkel või kontrollida enne laia jagamist, kas töölaud seda muudatust toetab.',
            ],
          },
        ],
      },
      {
        id: 'reservations',
        title: 'Kingituste broneerimine',
        entries: [
          {
            question: 'Mida külaline peab kingituse broneerimisel sisestama?',
            answer: [
              'Külalise nimi on kohustuslik.',
              'Sõnum on valikuline ning lisaks saab külaline valida, kas tema nimi tohib olla avalikult nähtav.',
            ],
          },
          {
            question: 'Mida näeb nimekirja looja pärast broneeringut?',
            answer: [
              'Töölaual kuvatakse broneeritud kingituse juures külalise nimi, võimalik sõnum ja info selle kohta, kas nimi tohib avalikult kuvada.',
              'Nii saab nimekirja looja aru nii broneeringu staatusest kui konkreetse kingitusega seotud sõnumist.',
            ],
          },
          {
            question: 'Mis muutub avalikul kingituse kaardil pärast broneeringut?',
            answer: [
              'Kaardil võib kuvada, et kingitus on broneeritud.',
              'Kui külaline lubas oma nime avalikustada, võib nähtavale tulla ka nimi. Samuti võib pärast broneerimist kaardil kuvada külalise sõnum.',
            ],
          },
          {
            question: 'Kas galerii näidislehel saab broneerimist päriselt testida?',
            answer: [
              'Jah. Galerii näidislehed võivad töötada demo režiimis, et külastaja saaks broneerimisvoogu proovida.',
              'Demo broneeringud ei mõjuta kuratori päris nimekirja ja need on mõeldud automaatselt umbes 5 minuti järel lähtestuma.',
            ],
          },
        ],
      },
      {
        id: 'media',
        title: 'Meedia üleslaadimine',
        entries: [
          {
            question: 'Millist meediat ma saan üles laadida?',
            answer: [
              'Giftlist Studio toetab kogu nimekirja kogemuses pilte. Video tugi on saadaval ainult pakettides, mis seda lubavad.',
              'Pilti võidakse automaatselt optimeerida. Toetatud videod töödeldakse serveris veebisõbralikuks MP4 failiks.',
            ],
          },
          {
            question: 'Mis on videote piirangud?',
            answer: [
              'Videod on praegu lubatud ainult Platinum nimekirjades, kuni 20 videot nimekirja kohta, ja iga video võib olla maksimaalselt 60 sekundit pikk.',
              'Töölaud kuvab need piirangud ka kasutajale nähtavalt, et nimekirja oleks lihtsam planeerida.',
            ],
          },
          {
            question: 'Miks mu video üleslaadimine ebaõnnestus?',
            answer: [
              'Levinumad põhjused on toetamata formaat, üle 60 sekundi pikkune video, paketipiirang või serveripoolne töötlemisviga teisendamise ajal.',
              'Kui video ei lähe üles, proovi lühemat klippi, lihtsamat eksporti või standardset MP4/H.264 faili.',
            ],
          },
          {
            question: 'Kas suured fotod arvestavad ainult toormahu järgi?',
            answer: [
              'Nähtav toote loogika põhineb nüüd peamiselt failide arvul, mitte ainult megabaitidel.',
              'Samas rakendab teenus taustal endiselt tehnilisi faili- ja töötlemispiiranguid, et üleslaadimine oleks stabiilne.',
            ],
          },
        ],
      },
      {
        id: 'billing-referrals',
        title: 'Maksed ja referral',
        entries: [
          {
            question: 'Kuidas checkout toimib?',
            answer: [
              'Kui arveldus on aktiveeritud, toimub paketi checkout Stripe’i kaudu. Pärast edukat makset saab valitud nimekiri vastava ligipääsuperioodi.',
              'Kui nimekiri vajab suuremat paketti meedia arvu, videote või paroolikaitse tõttu, juhendab checkout sind õige paketini.',
            ],
          },
          {
            question: 'Kuidas referral koodid toimivad?',
            answer: [
              'Sobilikud kasutajad saavad luua kuni 3 aktiivset referral koodi. Kehtiv referral kood annab ostjale 20% allahindlust ühele sobivale ostule.',
              'Iga edukalt kasutatud referral annab koodi omanikule 10% reward credit’it tulevase ostu jaoks, kuni ühe ostu peal maksimaalselt 30% allahindlust.',
            ],
          },
          {
            question: 'Kas ma saan kasutada enda referral koodi?',
            answer: [
              'Ei. Self-referral on blokeeritud.',
              'Referral võimalus võib olla piiratud ka tasuta piiramatu ligipääsuga kontodel või ostjatel, kes on juba referral soodustust kasutanud, vastavalt live toote reeglitele.',
            ],
          },
        ],
      },
      {
        id: 'privacy-security',
        title: 'Privaatsus ja turvalisus',
        entries: [
          {
            question: 'Kas avalikke kinginimekirja lehti mõõdetakse Google Analyticsiga?',
            answer: [
              'Ei. Avalikud kinginimekirja lehed on teadlikult analüütika lehevaadete jälgimisest välja jäetud.',
              'Kui analüütika on tulevikus aktiveeritud, töötab see ainult nõusoleku alusel ja ainult valitud turundus- ning töölaua lehtedel.',
            ],
          },
          {
            question: 'Kas parooliga nimekirja parool salvestatakse lihttekstina?',
            answer: [
              'Ei. Parooli kontrollimiseks vajalikke väärtusi hoitakse räsitud ja soolatud kujul, mitte loetava lihttekstina.',
            ],
          },
          {
            question: 'Mis juhtub siis, kui ma nimekirja kustutan?',
            answer: [
              'Nimekirja kustutamine töölaualt on mõeldud eemaldama hostitud nimekirja sisu, seotud broneeringud, avaliku slug-viite, paroolisaladuse ja nimekirjaga seotud meedia aktiivsest teenusekeskkonnast.',
              'Mõningaid arvelduse või auditi metaandmeid võidakse siiski säilitada, kui see on vajalik seadusest või operatiivsest põhjusest tulenevalt.',
            ],
          },
        ],
      },
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
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,2fr)]">
        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            {content.updatedLabel}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{content.updatedValue}</p>
        </article>

        <article className="rounded-3xl border border-amber-400/15 bg-amber-400/5 p-5">
          <h2 className="text-xl font-semibold text-white">{content.sectionJumpLabel}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {content.sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/25 hover:text-white"
              >
                {section.title}
              </a>
            ))}
          </div>
        </article>
      </section>

      {content.sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-4 scroll-mt-28">
          <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
          <div className="space-y-3">
            {section.entries.map((entry, index) => (
              <details
                key={entry.question}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 open:border-white/20 open:bg-white/[0.06]"
                open={index === 0}
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-white marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <span>{entry.question}</span>
                    <span className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45 transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <div className="mt-4 space-y-3 text-sm leading-7 text-white/78 sm:text-base">
                  {entry.answer.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </LegalPageShell>
  )
}
