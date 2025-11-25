# Seadistusjuhend - Robini Jõulumaailm

## Kiire algus (5 minutit)

### 1. Installeri sõltuvused
```bash
npm install
```

### 2. Firebase seadistus

#### Samm 1: Loo Firebase projekt
1. Mine: https://console.firebase.google.com/
2. Kliki "Add project"
3. Anna projektile nimi (nt "robin-joulumaailm")
4. Järgi viisardeid

#### Samm 2: Luba Firestore
1. Firebase konsoolis: "Firestore Database"
2. Kliki "Create database"
3. Vali "Start in test mode" (hiljem saad reegleid muuta)
4. Vali asukoht (nt "europe-west")

#### Samm 3: Võta konfiguratsioon
1. Firebase konsoolis: ⚙️ Project Settings
2. Keri alla "Your apps"
3. Kliki veebi ikooni (</>)
4. Anna appile nimi
5. Kopeeri konfiguratsioon

#### Samm 4: Loo .env.local
Loo fail `.env.local` projekti juurkaustas:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=robin-joulumaailm.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=robin-joulumaailm
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=robin-joulumaailm.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Loo Firestore andmed

#### Samm 1: Loo "gifts" kogumik
1. Firebase konsoolis: Firestore Database
2. Kliki "Start collection"
3. Collection ID: `gifts`
4. Loo esimene dokument:

**Document ID:** (auto-generate)
```json
{
  "name": "Lego Technic Auto",
  "description": "Kiire auto, mida Robin soovib",
  "status": "available",
  "robinStory": "See auto on nii kiire, et Hippo hakkaks kindlasti haukuma!"
}
```

#### Samm 2: Lisa rohkem kingisoove
Lisa veel dokumente sama struktuuriga. Võid kasutada `scripts/init-firebase-data.js` näidiseid.

### 4. Käivita projekt

```bash
npm run dev
```

Ava: http://localhost:3000

## Järgmised sammud

### Lisa pildid
1. Loo `public/images/` kaust
2. Lisa pildid sinna
3. Uuenda komponente, et kasutada tegelikke faile

### Lisa videod
1. Loo `public/videos/` kaust
2. Lisa Robini videod sinna
3. Uuenda Firestore'i, et lisada `robinVideoUrl` väljad

### Lisa muusika
1. Loo `public/music/` kaust
2. Lisa jõulumuusika (nt `christmas-background.mp3`)
3. Kommenteeri välja `components/BackgroundMusic.tsx` failis audio element

### AI-video päkapikuga
1. Loo konto D-ID-s: https://www.d-id.com/
2. Loo päkapiku video
3. Laadi üles Firebase Storage või `public/videos/`
4. Uuenda `components/ElfEntrance.tsx`

## Tõrkeotsing

### Firebase ei ühendu
- Kontrolli, et `.env.local` on õigesti täidetud
- Veendu, et Firestore on lubatud
- Kontrolli brauseri konsooli vigu

### Kingitused ei lae
- Kontrolli Firestore'i struktuuri
- Veendu, et `gifts` kogumik on loodud
- Kontrolli, et `status` väljad on õiged

### Animatsioonid ei tööta
- Veendu, et `framer-motion` on installitud
- Kontrolli brauseri konsooli vigu

## Abi

Kui tekib küsimusi, vaata:
- README.md - täielik dokumentatsioon
- Firebase dokumentatsioon: https://firebase.google.com/docs
- Next.js dokumentatsioon: https://nextjs.org/docs

