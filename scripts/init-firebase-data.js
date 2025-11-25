// Skript Firebase andmete algseadistamiseks
// Käivita: node scripts/init-firebase-data.js

// Näidiskingitused - saad hiljem Firebase konsoolis muuta
const sampleGifts = [
  {
    name: 'Lego Technic Auto',
    description: 'Kiire auto, mida Robin soovib',
    status: 'available',
    robinStory: 'See auto on nii kiire, et Hippo hakkaks kindlasti haukuma!',
  },
  {
    name: 'Jalgpallipall',
    description: 'Uus jalgpallipall treeninguteks',
    status: 'available',
    robinStory: 'Selle palliga saan ma väga palju väravaid!',
  },
  {
    name: 'Joonistusraamat',
    description: 'Spetsiaalne joonistusraamat',
    status: 'available',
    robinStory: 'Siia saan ma joonistada kõik oma lemmikloomad!',
  },
  {
    name: 'Raamat',
    description: 'Põnev seiklusraamat',
    status: 'available',
  },
  {
    name: 'Mänguasjad',
    description: 'Erinevad mänguasjad',
    status: 'available',
  },
]

const sampleDiscountCodes = [
  {
    title: 'Päkapikupoest',
    code: 'ROBIN15',
    description: 'Saad -15% kõigile toodetele',
    link: 'https://example.com',
    discount: '-15%',
  },
  {
    title: 'Lego pakkumine',
    code: 'LEGO20',
    description: 'Leidsime hea Lego pakkumise siin',
    link: 'https://example.com',
    discount: '-20%',
  },
]

console.log('Kasuta seda skripti Firebase konsoolis või lisa andmed käsitsi.')
console.log('\nKingitused:')
console.log(JSON.stringify(sampleGifts, null, 2))
console.log('\nSooduskoodid:')
console.log(JSON.stringify(sampleDiscountCodes, null, 2))

