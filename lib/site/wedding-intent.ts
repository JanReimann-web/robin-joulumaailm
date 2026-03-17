import type { Locale } from '@/lib/i18n/config'

export const WEDDING_INTENT_SLUGS = [
  'wedding-gift-list',
  'private-wedding-registry',
  'wedding-registry-alternative',
  'wedding-gift-page-for-guests',
] as const

export type WeddingIntentSlug = (typeof WEDDING_INTENT_SLUGS)[number]

type WeddingIntentContent = {
  seoTitle: string
  seoDescription: string
  eyebrow: string
  title: string
  body: string
  benefitTitle: string
  benefits: string[]
  faqTitle: string
  faqEntries: Array<{
    question: string
    answer: string
  }>
}

const weddingIntentContent: Record<Locale, Record<WeddingIntentSlug, WeddingIntentContent>> = {
  en: {
    'wedding-gift-list': {
      seoTitle: 'Wedding Gift List | Giftlist Studio',
      seoDescription:
        'Create a beautiful wedding gift list with reservations, private sharing, and no duplicate gifts.',
      eyebrow: 'Wedding gift list',
      title: 'A wedding gift list guests can understand at a glance',
      body:
        'Giftlist Studio gives couples one elegant wedding gift page with clear reservations, private sharing options, and a simpler guest experience than a messy spreadsheet or group chat.',
      benefitTitle: 'Why couples start here',
      benefits: [
        'One polished page for gifts, story content, and event details',
        'Reservations prevent duplicate gifts before guests buy',
        'Built to convert the first wedding purchase into later lifecycle events',
      ],
      faqTitle: 'Questions couples ask about wedding gift lists',
      faqEntries: [
        {
          question: 'Can guests reserve gifts before they buy them?',
          answer: 'Yes. Guests can reserve gifts on the public page so other guests see what is already taken.',
        },
        {
          question: 'Can I keep the list private?',
          answer: 'Yes. Depending on your plan, you can share the page publicly or protect it with a password.',
        },
        {
          question: 'Can I test the page before publishing?',
          answer: 'Yes. Every list starts with a free trial so you can build and preview before activating the live page.',
        },
      ],
    },
    'private-wedding-registry': {
      seoTitle: 'Private Wedding Registry | Giftlist Studio',
      seoDescription:
        'Set up a private wedding registry alternative with password protection, reservation tracking, and one elegant guest page.',
      eyebrow: 'Private wedding registry',
      title: 'A private wedding registry without the generic registry feel',
      body:
        'When you want invited guests only, Giftlist Studio gives you a wedding page with password protection, clean sharing, and reservation tracking that still feels personal.',
      benefitTitle: 'Built for private sharing',
      benefits: [
        'Password-protected public pages for invited guests',
        'Cleaner guest flow than passing around files or chat threads',
        'Wedding-first experience that can later support baby showers and birthdays',
      ],
      faqTitle: 'Questions about private wedding registry pages',
      faqEntries: [
        {
          question: 'Do guests need an account to view the page?',
          answer: 'No. Guests use the shared link, and if needed, the password you provide.',
        },
        {
          question: 'Can I still track gift reservations?',
          answer: 'Yes. Privacy settings do not remove reservation tracking.',
        },
        {
          question: 'Is this only for weddings?',
          answer: 'Wedding is the main launch wedge, but the same account can return for other life events later.',
        },
      ],
    },
    'wedding-registry-alternative': {
      seoTitle: 'Wedding Registry Alternative | Giftlist Studio',
      seoDescription:
        'Use Giftlist Studio as a wedding registry alternative with elegant design, private sharing, and duplicate-proof reservations.',
      eyebrow: 'Wedding registry alternative',
      title: 'A wedding registry alternative for couples who want something more personal',
      body:
        'Giftlist Studio works when you want the practical parts of a registry, but with a more beautiful page, more flexible sharing, and a stronger story-driven presentation.',
      benefitTitle: 'Where it wins',
      benefits: [
        'More aesthetic and story-led than a generic registry page',
        'Private or password-protected sharing when needed',
        'Guests can reserve gifts without creating duplicate purchases',
      ],
      faqTitle: 'Questions about registry alternatives',
      faqEntries: [
        {
          question: 'What makes this different from a traditional registry?',
          answer: 'It focuses on one beautiful event page with sharing, privacy, and reservation clarity instead of a large marketplace flow.',
        },
        {
          question: 'Can I include non-store gift ideas?',
          answer: 'Yes. You can add the gift ideas you actually want instead of being limited to one catalog.',
        },
        {
          question: 'Can this lead to future event pages too?',
          answer: 'Yes. Wedding is the first purchase, but the same household can come back for future milestone events.',
        },
      ],
    },
    'wedding-gift-page-for-guests': {
      seoTitle: 'Wedding Gift Page for Guests | Giftlist Studio',
      seoDescription:
        'Create a wedding gift page for guests with clear gift reservations, event details, and a polished public experience.',
      eyebrow: 'Wedding gift page for guests',
      title: 'Give guests one clear wedding gift page instead of scattered instructions',
      body:
        'Giftlist Studio helps couples share one page where guests can understand the event, see gift ideas, and reserve items before buying them.',
      benefitTitle: 'Why guests use it',
      benefits: [
        'Guests see what is available before they buy',
        'One link is easier than multiple messages and updates',
        'The page feels polished enough to share confidently with family and friends',
      ],
      faqTitle: 'Questions about guest-facing gift pages',
      faqEntries: [
        {
          question: 'Can I add event story content too?',
          answer: 'Yes. You can add stories, visuals, and event details alongside the gift list.',
        },
        {
          question: 'Can guests access it on mobile?',
          answer: 'Yes. Public pages are built to work on both desktop and mobile.',
        },
        {
          question: 'Can we start free before guests see it?',
          answer: 'Yes. You can build during the free trial and activate the live page when ready.',
        },
      ],
    },
  },
  et: {
    'wedding-gift-list': {
      seoTitle: 'Pulmade kinginimekiri | Giftlist Studio',
      seoDescription:
        'Loo ilus pulmade kinginimekiri broneeringute, privaatse jagamise ja topeltkingitusteta.',
      eyebrow: 'Pulmade kinginimekiri',
      title: 'Pulmade kinginimekiri, millest külaline saab kohe aru',
      body:
        'Giftlist Studio annab paarile ühe elegantse pulmade kingilehe koos selgete broneeringute, privaatsete jagamisvalikute ja lihtsama külaliste kogemusega kui tabel või grupichat.',
      benefitTitle: 'Miks paarid siit alustavad',
      benefits: [
        'Üks viimistletud leht kingituste, loo sisu ja sündmuse detailide jaoks',
        'Broneeringud hoiavad topeltkingitused ära enne ostu',
        'Ehitatud nii, et pulma esimene ost looks tee järgmisteks elutsükli sündmusteks',
      ],
      faqTitle: 'Küsimused, mida paarid pulmade kinginimekirja kohta küsivad',
      faqEntries: [
        {
          question: 'Kas külalised saavad kingitusi enne ostu broneerida?',
          answer: 'Jah. Külalised saavad avalikul lehel kingitusi broneerida, et teised näeksid, mis on juba valitud.',
        },
        {
          question: 'Kas ma saan nimekirja privaatsena hoida?',
          answer: 'Jah. Sõltuvalt paketist saad lehe jagada avalikult või kaitsta selle parooliga.',
        },
        {
          question: 'Kas ma saan lehte enne avalikustamist testida?',
          answer: 'Jah. Iga nimekiri alustab tasuta katseajaga, et saaksid enne aktiveerimist kõik valmis ehitada ja üle vaadata.',
        },
      ],
    },
    'private-wedding-registry': {
      seoTitle: 'Privaatne pulmaregister | Giftlist Studio',
      seoDescription:
        'Loo privaatne pulmaregistri alternatiiv paroolikaitse, broneeringute jälgimise ja ühe elegantse külaliste lehega.',
      eyebrow: 'Privaatne pulmaregister',
      title: 'Privaatne pulmaregister ilma tavalise registri külma tundeta',
      body:
        'Kui soovid lehte ainult kutsutud külalistele, annab Giftlist Studio sulle paroolikaitse, puhta jagamisvoo ja broneeringute jälgimise, mis tundub siiski isiklik.',
      benefitTitle: 'Ehitatud privaatseks jagamiseks',
      benefits: [
        'Parooliga kaitstud avalikud lehed kutsutud külalistele',
        'Puhtam külaliste voog kui failide või chatide edasi-tagasi saatmine',
        'Pulmadele suunatud kogemus, mis saab hiljem toetada ka baby shower’eid ja sünnipäevi',
      ],
      faqTitle: 'Küsimused privaatse pulmaregistri lehtede kohta',
      faqEntries: [
        {
          question: 'Kas külalistel on vaja konto luua?',
          answer: 'Ei. Külaline kasutab sinu jagatud linki ja vajadusel parooli.',
        },
        {
          question: 'Kas kingituste broneeringud jäävad alles?',
          answer: 'Jah. Privaatsusvalikud ei eemalda broneeringute jälgimist.',
        },
        {
          question: 'Kas see on ainult pulmade jaoks?',
          answer: 'Pulm on peamine launch wedge, aga sama konto saab hiljem kasutada ka teisteks eluetappide sündmusteks.',
        },
      ],
    },
    'wedding-registry-alternative': {
      seoTitle: 'Pulmaregistri alternatiiv | Giftlist Studio',
      seoDescription:
        'Kasuta Giftlist Studiot pulmaregistri alternatiivina koos elegantse disaini, privaatse jagamise ja topeltkingitusi vältiva broneerimisega.',
      eyebrow: 'Pulmaregistri alternatiiv',
      title: 'Pulmaregistri alternatiiv paaridele, kes tahavad midagi isiklikumat',
      body:
        'Giftlist Studio töötab siis, kui tahad registri praktilist poolt, aga ilusama lehe, paindlikuma jagamise ja tugevama looga esitlusega.',
      benefitTitle: 'Kus see võidab',
      benefits: [
        'Esteetilisem ja loo-kesksem kui tavaline registrileht',
        'Privaatne või parooliga kaitstud jagamine vajaduse korral',
        'Külalised saavad kingitusi broneerida ilma topeltostudeta',
      ],
      faqTitle: 'Küsimused registri alternatiivide kohta',
      faqEntries: [
        {
          question: 'Mis eristab seda tavalisest registrist?',
          answer: 'Fookus on ühel ilusal sündmuse lehel koos jagamise, privaatsuse ja broneeringute selgusega, mitte suure poevooga.',
        },
        {
          question: 'Kas ma saan lisada kingiideid ka väljaspool poekataloogi?',
          answer: 'Jah. Saad lisada just need kingiideed, mida päriselt soovid.',
        },
        {
          question: 'Kas sellest võib saada alus ka järgmisteks sündmusteks?',
          answer: 'Jah. Pulm on esimene ost, aga sama majapidamine saab hiljem tagasi tulla järgmiste tähtsate sündmuste jaoks.',
        },
      ],
    },
    'wedding-gift-page-for-guests': {
      seoTitle: 'Pulmade kingileht külalistele | Giftlist Studio',
      seoDescription:
        'Loo pulmade kingileht külalistele koos selgete broneeringute, sündmuse detailide ja viimistletud avaliku kogemusega.',
      eyebrow: 'Pulmade kingileht külalistele',
      title: 'Anna külalistele üks selge pulmade kingileht laiali juhiste asemel',
      body:
        'Giftlist Studio aitab paaril jagada ühte lehte, kus külaline saab sündmusest aru, näeb kingiideid ja saab eseme enne ostu ära broneerida.',
      benefitTitle: 'Miks see külaliste jaoks töötab',
      benefits: [
        'Külaline näeb enne ostu, mis on veel saadaval',
        'Üks link on lihtsam kui mitu sõnumit ja jooksvaid uuendusi',
        'Leht näeb piisavalt viimistletud välja, et seda pere ja sõpradega julgelt jagada',
      ],
      faqTitle: 'Küsimused külalistele suunatud kingilehe kohta',
      faqEntries: [
        {
          question: 'Kas ma saan lisada ka loo sisu ja sündmuse infot?',
          answer: 'Jah. Saad lisada lugusid, visuaale ja sündmuse detaile koos kinginimekirjaga.',
        },
        {
          question: 'Kas külalised saavad lehte kasutada mobiilis?',
          answer: 'Jah. Avalikud lehed on tehtud töötama nii desktopis kui mobiilis.',
        },
        {
          question: 'Kas saame alustada tasuta enne kui külalised seda näevad?',
          answer: 'Jah. Saad tasuta katseajal kõik valmis teha ja aktiveerida lehe siis, kui oled valmis.',
        },
      ],
    },
  },
}

export const isWeddingIntentSlug = (value: string): value is WeddingIntentSlug => {
  return WEDDING_INTENT_SLUGS.includes(value as WeddingIntentSlug)
}

export const getWeddingIntentContent = (
  locale: Locale,
  slug: WeddingIntentSlug
) => {
  return weddingIntentContent[locale][slug]
}
