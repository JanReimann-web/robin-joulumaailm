# Tõrkeotsing - Firestore salvestamine ei tööta

## 🔍 Kiire kontroll

### 1. Kontrolli brauseri konsooli

1. Ava admin-paneel: http://localhost:3000/admin
2. Vajuta `F12` (või paremklõps → "Inspect")
3. Mine "Console" vahekaardile
4. Proovi salvestada kingitust
5. Vaata, mis vead ilmuvad

**Levinumad vead:**
- `permission-denied` → Firestore reeglid on valed
- `unavailable` → Firebase pole saadaval
- `Missing or insufficient permissions` → Firestore reeglid on valed

### 2. Kontrolli Firebase konfiguratsiooni

1. Ava brauseri konsool (F12)
2. Kirjuta: `console.log(process.env)`
3. Kontrolli, kas kõik `NEXT_PUBLIC_FIREBASE_*` väärtused on olemas

**Kui väärtused puuduvad:**
- Taaskäivita dev server: `Ctrl+C` ja siis `npm run dev`
- Kontrolli, et `.env.local` fail on projekti juurkaustas
- Kontrolli, et faili nimi on täpselt `.env.local` (mitte `env.local`)

### 3. Kontrolli Firestore reegleid

1. Mine Firebase konsooli: https://console.firebase.google.com/
2. Vali projekt → Firestore Database → "Rules" vahekaart
3. Veendu, et reeglid on:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /gifts/{giftId} {
      allow read, write: if true;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Klõpsa "Publish" (kui muutsid)

### 4. Kontrolli .env.local faili

1. VS Code'is ava `.env.local` fail
2. Veendu, et kõik väärtused on täidetud:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kingid-xxxxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=kingid-xxxxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kingid-xxxxx.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=672396741574
   NEXT_PUBLIC_FIREBASE_APP_ID=1:672396741574:web:...
   ```

3. **Tähtis:** 
   - Ära lisa tühikuid `=` märgi ümber
   - Ära lisa jutumärke väärtuste ümber
   - Ära lisa kommentaare rea lõppu

### 5. Taaskäivita dev server

Pärast `.env.local` muutmist PEAD taaskäivitama serveri:

1. Terminalis: `Ctrl+C` (peatab serveri)
2. Käivita uuesti: `npm run dev`
3. Ava uuesti: http://localhost:3000/admin

## 🛠️ Samm-sammuline lahendus

### Samm 1: Kontrolli Firebase konfiguratsiooni

Ava `.env.local` ja kontrolli, et kõik väärtused on õiged. Võta need Firebase konsoolist:

1. Firebase konsool → ⚙️ Project Settings
2. "Your apps" → vali web app
3. "SDK setup and configuration" → "Config"
4. Kopeeri väärtused

### Samm 2: Taaskäivita server

```bash
# Peata server (Ctrl+C)
# Käivita uuesti
npm run dev
```

### Samm 3: Kontrolli Firestore reegleid

Vaata üleval olevaid reegleid ja veendu, et need on õiged.

### Samm 4: Testi brauseri konsoolis

1. Ava admin-paneel
2. Ava brauseri konsool (F12)
3. Proovi salvestada kingitust
4. Vaata, mis vead ilmuvad

## 📞 Kui ikka ei tööta

Kui ikka ei tööta, anna teada:
1. Mis viga ilmub brauseri konsoolis?
2. Kas Firestore reeglid on õiged?
3. Kas `.env.local` fail on täidetud?
4. Kas server on taaskäivitatud pärast `.env.local` muutmist?

