# Vercel Firebase seadistus - Firestore andmed ei lae

## ⚠️ Probleem

Kui Firestore andmed ei jõua Vercel'i lehele, on tõenäoliselt probleem Firebase keskkonna muutujatega.

## ✅ Lahendus: Lisa keskkonna muutujad Vercel'is

### Samm 1: Ava Vercel'i projekt

1. Mine: https://vercel.com/dashboard
2. Vali oma projekt: `robin-joulumaailm`
3. Klõpsa "Settings" (üleval paremal)

### Samm 2: Lisa keskkonna muutujad

1. Vali "Environment Variables" vasakul menüüs
2. Lisa kõik järgmised muutujad:

**Production, Preview, Development** (vali kõik kolm):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCnboAYfkIg6IYsGXJNnIvNAFgebR5vvOM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kingid-5582a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kingid-5582a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kingid-5582a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=672396741574
NEXT_PUBLIC_FIREBASE_APP_ID=1:672396741574:web:9c8b041dde4b671c22c0c7
```

**Tähtis:**
- Kopeeri väärtused oma `.env.local` failist
- Ära lisa tühikuid `=` märgi ümber
- Ära lisa jutumärke

### Samm 3: Redeploy projekt

Pärast keskkonna muutujate lisamist:

1. Mine "Deployments" sektsiooni
2. Leia viimane deploy
3. Klõpsa kolme punkti (⋯) → "Redeploy"
4. Kinnita "Redeploy"
5. Oota 1-2 minutit

### Samm 4: Kontrolli

1. Ava oma Vercel'i leht
2. Ava brauseri konsool (F12)
3. Vaata, kas on vigu
4. Kontrolli, kas Firebase konfiguratsioon on laetud

## 🔍 Kuidas kontrollida, kas töötab

### Brauseri konsoolis (F12):

Kui Firebase on õigesti seadistatud, peaksid nägema:
```
✅ Firebase konfiguratsioon laetud: {projectId: "kingid-5582a", ...}
```

Kui näed:
```
❌ Firebase konfiguratsioon puudub!
```
Siis on keskkonna muutujad puudu või valed.

## 🆘 Kui ikka ei tööta

### 1. Kontrolli Firestore reegleid

Firebase konsoolis → Firestore Database → Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /gifts/{giftId} {
      allow read, write: if true;
    }
    match /photos/{photoId} {
      allow read, write: if true;
    }
    match /discountCodes/{discountId} {
      allow read, write: if true;
    }
    match /wheelItems/{itemId} {
      allow read, write: if true;
    }
    match /letters/{letterId} {
      allow read, write: if true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. Kontrolli Vercel'i logisid

1. Vercel Dashboard → Deployments
2. Klõpsa viimase deploy'i peale
3. Vaata "Logs" sektsiooni
4. Otsi vigu

### 3. Kontrolli brauseri konsooli

1. Ava Vercel'i leht
2. F12 → Console
3. Otsi Firebase vigu
4. Kontrolli, kas andmed laevad

## 📝 Kiire kontroll

Kui tahad kiiresti kontrollida:

1. Ava Vercel'i leht
2. F12 → Console
3. Kirjuta: `console.log(process.env)`
4. Kontrolli, kas `NEXT_PUBLIC_FIREBASE_*` väärtused on olemas

## ✅ Pärast parandamist

Kui oled keskkonna muutujad lisatud ja redeploy'inud:

1. Värskenda lehte (Ctrl+F5)
2. Kontrolli brauseri konsooli
3. Vaata, kas andmed laevad
4. Testi admin lehte: `/admin`

