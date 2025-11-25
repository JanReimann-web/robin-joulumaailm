# Admin juhend - Täielik halduskeskus

## 🔐 Admin-paneeli ligipääs

Admin-paneel on kaitstud parooliga. Vaikimisi parool on: `robin2024`

**Muuda parooli:** Ava fail `app/admin/page.tsx` ja muuda rida:
```typescript
const ADMIN_PASSWORD = 'robin2024' // Muuda see oma parooliks!
```

## 📍 Admin-paneeli aadress

- **Arendus:** http://localhost:3000/admin
- **Tootmine:** https://sinu-domeen.com/admin

## 🎯 Funktsioonid

Admin-paneelil on kolm peamist sektsiooni:

### 1. 🎁 Kingitused

**Funktsioonid:**
- ✅ Lisa uusi kingisoove
- ✅ Muuda olemasolevaid kingisoove
- ✅ **Vabasta broneeringuid** (nupp rohelise noolega)
- ✅ Kustuta kingisoove
- ✅ Vaata kõiki kingisoove ja nende staatust

**Staatuse süsteem:**
- **Vaba** - Uued kingitused on alati "Vaba"
- **Võetud** - Muutub automaatselt, kui kasutaja valib kingitust
- **Kingitud** - Saad märkida käsitsi Firestore'is, kui vaja

**Vabasta broneering:**
1. Leia "Võetud" staatusega kingitust
2. Klõpsa rohelist noole nuppu (🔄)
3. Kinnita
4. ✅ Kingitust muutub tagasi "Vaba" staatusse

### 2. 📸 Robini aasta

**Funktsioonid:**
- ✅ Lisa uusi pilte/videosid
- ✅ Muuda olemasolevaid pilte
- ✅ **Lisa kirjeldus** - loomulik tekst, mis räägib pildist
- ✅ Määra järjekord (väiksem = kuvatakse esimesena)
- ✅ Kustuta pilte

**Kuidas lisada pilti:**
1. Vali "Robini aasta" vahekaart
2. Klõpsa "Lisa uus pilt"
3. Täida vorm:
   - **Pildi URL*** - nt: `/images/pilt.jpg` või täielik URL
   - **Pealkiri*** - nt: "Jõulud"
   - **Kirjeldus** - loomulik tekst, mis räägib pildist (nt: "See on pilt, kus Robin mängib Legoga. Ta oli väga õnnelik...")
   - **Tüüp** - Foto või Video
   - **Järjekord** - väiksem number = kuvatakse esimesena
4. Klõpsa "Lisa"

**Kirjeldus kuvatakse:**
- Modal'is, kui kasutaja klikib pilti
- See loob personaalsema kogemuse

### 3. 🎁 Sooduskoodid

**Funktsioonid:**
- ✅ Lisa uusi sooduskoode
- ✅ Muuda olemasolevaid sooduskoode
- ✅ Kustuta sooduskoode

**Kuidas lisada sooduskoodi:**
1. Vali "Sooduskoodid" vahekaart
2. Klõpsa "Lisa uus sooduskood"
3. Täida vorm:
   - **Pealkiri*** - nt: "Päkapikupoest"
   - **Sooduskood*** - nt: "ROBIN15"
   - **Kirjeldus*** - nt: "Saad -15% kõigile toodetele"
   - **Link*** - nt: "https://example.com"
   - **Soodus*** - nt: "-15%"
4. Klõpsa "Lisa"

## 📝 Näide: Esimene kingitust

1. Ava http://localhost:3000/admin
2. Sisesta parool: `robin2024`
3. Vali "Kingitused" vahekaart
4. Klõpsa "Lisa uus kingitust"
5. Täida:
   ```
   Nimi: Lego Technic Auto
   Kirjeldus: Kiire auto, mida Robin soovib
   Robini lugu: See auto on nii kiire, et Hippo hakkaks kindlasti haukuma!
   ```
6. Klõpsa "Lisa"
7. ✅ Kingitust ilmub kohe avalehel

## 📸 Näide: Esimene pilt Robini aastast

1. Vali "Robini aasta" vahekaart
2. Klõpsa "Lisa uus pilt"
3. Täida:
   ```
   Pildi URL: /images/Joulud.jpg
   Pealkiri: Jõulud
   Kirjeldus: See on pilt Robini esimestest jõuludest. Ta oli väga õnnelik, kui nägi jõuluvana kinke. Hippo oli ka seal ja nad mängisid koos.
   Tüüp: Foto
   Järjekord: 1
   ```
4. Klõpsa "Lisa"
5. ✅ Pilt ilmub kohe avalehel

## 🔄 Vabasta broneering

Kui keegi on valinud kingitust, aga tahad seda vabastada:

1. Leia "Võetud" staatusega kingitust
2. Klõpsa rohelist noole nuppu (🔄) - "Vabasta broneering"
3. Kinnita
4. ✅ Kingitust muutub tagasi "Vaba" staatusse
5. ✅ Nimi eemaldatakse

## 🔗 Lehe jagamine

### Avaleht (ilma admin funktsioonideta)

Jaga ainult avalehte: **http://localhost:3000**

Kasutajad näevad:
- ✅ Kõik kingitused
- ✅ Saavad valida kingitust
- ✅ Näevad staatust
- ✅ Näevad pilte Robini aastast
- ✅ Näevad sooduskoode
- ❌ Ei näe admin-paneeli
- ❌ Ei saa lisada/muuta sisu

### Admin-paneel (kaitstud)

Admin-paneel on eraldi lehel: **http://localhost:3000/admin**

- 🔐 Kaitstud parooliga
- ✅ Ainult admin saab ligi
- ✅ Saab hallata kõiki sektsioone

## ⚠️ Tähtis

- **Staatust muudab kasutaja** - kui kasutaja valib kingitust, muutub staatus "Võetud"
- **Admin saab vabastada** - vabasta broneeringuid rohelise noole nupuga
- **Uued kingitused on alati "Vaba"**
- **Piltide kirjeldused** loovad personaalsema kogemuse
- **Admin-paneel on eraldi lehel** - saad jagada avalehte ilma admin funktsioonideta

## 🆘 Tõrkeotsing

### Parool ei tööta
- Kontrolli, et parool on õige
- Vaata `app/admin/page.tsx` faili

### Andmed ei salvestu
- Kontrolli Firestore reegleid Firebase konsoolis
- Kontrolli brauseri konsooli vigu (F12)

### Pildid ei ilmu
- Kontrolli, et pildi URL on õige
- Kontrolli, et pildid on `public/images/` kaustas
- Kontrolli, et Firestore'is on `photos` kogumik
