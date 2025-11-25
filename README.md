# Robini Jõulumaailm 🎄

Interaktiivne jõulusoovide veebileht Robini jaoks. Täielik "jõulumaailm" telefonis koos kõigi soovitud funktsioonidega.

## ✨ Funktsioonid

### 🎬 Avaleht ja animatsioonid
- ❄️ **Lumehelbed animatsioon** - pidevalt sajab lund
- 🎅 **Päkapiku sisenemise animatsioon** - fade-in efekt, päkapikk avab kirstu
- 📮 **Postkasti animatsioon** - interaktiivne postkast, mida saab avada

### 🎁 Kingisoovide süsteem
- **Interaktiivne kingipundar** - kõik tooted kinkepakkidena
- **Staatuse sildid**: "Vaba", "Võetud", "Kingitud"
- **Anonüümne või nimeline valimine** - kasutaja saab valida
- **Reaalajas uuendused** - Firebase'iga sünkroonitud
- **Robini lood** - iga kingisoovi juures võib olla Robini lühike video/audio

### 📸 Robini aasta
- **Mini-album galerii** - pildid ja videod aastast
- **Modal suurele pildile** - klikkimisel avatakse suurem vaade

### 🎡 Interaktiivsed elemendid
- **Jõuluketas** - keerutamisega ilmub juhuslik Robini tsitaat
- **Päkapiku jalajäljed** - skrollimisel ilmuvad jäljed vasakul servas
- **Kingituste progress-bar** - animatsioon, kuidas kingid liiguvad põhjapõtrade juurde

### 🎁 Sooduskoodid
- **Päkapiku soovitused** - ilusad kaardid sooduskoodidega
- **Otselinkid poodidesse** - ühe klikiga checkout

### 📮 Kirja teekond
- **Video placeholder** - Robini kirja postitamise video
- **Interaktiivne kaart** - Eesti kaart põhjapõtradega
- **Animaatiline rada** - punane jälg kaardil

### 🎵 Muusika
- **Taustamuusika** - valikuga kinni panna (paremal alumine nupp)

### 💝 Tänukaart
- **Automaatne tänukaart** - kingituse valimisel ilmub tänukaart
- **Confetti animatsioon** - ilus efekt

## 🚀 Setup

### 1. Installeri sõltuvused

```bash
npm install
```

### 2. Firebase seadistus

1. Loo Firebase projekt: https://console.firebase.google.com/
2. Luba Firestore Database
3. Loo `.env.local` fail projekti juurkaustas:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore andmebaas

Loo Firestore'is `gifts` kogumik. Iga dokument peaks olema järgmise struktuuriga:

```javascript
{
  name: "Lego Technic Auto",           // string (nõutav)
  description: "Kiire auto...",        // string (nõutav)
  image: "https://...",                // string (valikuline)
  link: "https://...",                 // string (valikuline)
  status: "available",                  // "available" | "taken" | "gifted"
  takenByName: null,                    // string | null
  takenAt: null,                        // string | null
  robinStory: "See auto on nii kiire...", // string (valikuline)
  robinVideoUrl: "https://...",        // string (valikuline)
}
```

**Näidiskingitused** - vaata `scripts/init-firebase-data.js`

### 4. Käivita arendusserver

```bash
npm run dev
```

Ava brauseris: http://localhost:3000

## 📁 Projekti struktuur

```
├── app/
│   ├── layout.tsx          # Põhilayout
│   ├── page.tsx            # Avaleht
│   └── globals.css         # Globaalsed stiilid
├── components/
│   ├── Snowflakes.tsx      # Lumehelbed
│   ├── ElfEntrance.tsx     # Päkapiku sisenemine
│   ├── GiftBox.tsx         # Üksik kingituse kaart
│   ├── GiftPile.tsx        # Kingisoovide süsteem
│   ├── RobinsYear.tsx      # Aasta galerii
│   ├── DiscountCodes.tsx   # Sooduskoodid
│   ├── LetterJourney.tsx   # Kirja teekond
│   ├── ThankYouCard.tsx    # Tänukaart
│   ├── ElfFootprints.tsx   # Päkapiku jäljed
│   ├── ChristmasWheel.tsx  # Jõuluketas
│   ├── GiftProgress.tsx    # Progress-bar
│   ├── PostOfficeBox.tsx   # Postkast
│   ├── RobinStory.tsx      # Robini lood
│   └── BackgroundMusic.tsx  # Muusika
├── lib/
│   ├── firebase.ts         # Firebase konfiguratsioon
│   └── types.ts            # TypeScript tüübid
└── public/                 # Staatilised failid
```

## 🎨 Kohandamine

### Värvid

Muuda värve `tailwind.config.js` failis:
- `joulu-red` - punane
- `joulu-green` - roheline
- `joulu-gold` - kuldne
- `joulu-snow` - lumi

### Pildid ja videod

1. Lisa pildid `public/images/` kausta
2. Lisa videod `public/videos/` kausta
3. Uuenda komponente, et kasutada tegelikke faile

### AI-video päkapikuga

Integreerimiseks saad kasutada:
- **D-ID** - https://www.d-id.com/ (parim lipsync)
- **Runway Gen-2** - https://runwayml.com/
- **Pika Labs** - https://pika.art/
- **Sora** - kui ligipääs on

### Robini videod/audio

Iga kingisoovi jaoks:
1. Salvesta lühike video või audio (5-10 sek)
2. Laadi üles Firebase Storage või `public/videos/`
3. Lisa URL `robinVideoUrl` väljale Firestore'is

## 📝 Järgmised sammud

1. ✅ **Lisa tegelikud pildid** - asenda placeholder'id
2. ✅ **Integreeri AI-video** - päkapiku video D-ID või sarnasega
3. ✅ **Lisa Robini videod** - iga kingisoovi jaoks
4. ✅ **Lisa muusika** - jõulumuusika `public/music/` kausta
5. ✅ **Kohanda värve** - vastavalt soovile
6. ✅ **Testi mobiilil** - veendu, et kõik töötab hästi

## 🛠️ Tehnilised detailid

- **Next.js 14** - React framework
- **TypeScript** - tüübiturva
- **Tailwind CSS** - stiilid
- **Framer Motion** - animatsioonid
- **Firebase Firestore** - reaalajas andmebaas
- **Lucide React** - ikoonid

## 📱 Mobiili optimeerimine

Kõik komponendid on mobiilile optimeeritud:
- Responsiivne disain
- Touch-friendly nupud
- Optimeeritud animatsioonid
- Kiire laadimisaeg

## 🎉 Valmis!

Nüüd on sul täielik jõulumaailm telefonis! Lisa oma sisu ja naudi! 🎄

## 📚 Lisadokumentatsioon

Vaata `SETUP.md` faili täpsema seadistusjuhendi jaoks.
