# Kuidas uuendada GitHub'i ja Vercel'i pärast muudatusi

## 📝 Pärast muudatuste tegemist

Kui oled teinud muudatusi koodis (nt muutnud värve, lisatud funktsioone), pead need GitHub'i ja Vercel'i laadima.

## 🔄 Kiire juhend

### 1. Salvesta muudatused Git'i

```bash
# Vaata, mis on muutunud
git status

# Lisa kõik muudatused
git add .

# Tee commit
git commit -m "Muudan tausta tagasi siniseks"

# Laadi GitHub'i
git push origin main
```

### 2. Vercel deploy'ib automaatselt!

- ✅ Kui oled push'inud GitHub'i, deploy'ib Vercel **automaatselt** uue versiooni
- ✅ Sa ei pea Vercel'is midagi tegema!
- ✅ Oota 1-2 minutit ja muudatused on elus

## 📋 Täpsemalt

### Samm 1: Kontrolli muudatusi

```bash
git status
```

Näitab, millised failid on muutunud.

### Samm 2: Lisa muudatused

```bash
git add .
```

See lisab kõik muudatused.

### Samm 3: Tee commit

```bash
git commit -m "Kirjeldus muudatustest"
```

Näiteks:
- `"Muudan tausta tagasi siniseks"`
- `"Lisasin uue funktsiooni"`
- `"Parandasin vea"`

### Samm 4: Laadi GitHub'i

```bash
git push origin main
```

See laadib muudatused GitHub'i.

### Samm 5: Oota Vercel'i deploy'i

- Vercel tuvastab automaatselt uue commit'i
- Alustab automaatselt build'i
- Oota 1-2 minutit
- Muudatused on elus!

## 🔍 Kuidas kontrollida

1. **GitHub:**
   - Mine oma repo: https://github.com/SINU_KASUTAJANIMI/robin-joulumaailm
   - Vaata, kas uus commit on olemas

2. **Vercel:**
   - Mine: https://vercel.com/dashboard
   - Vaata "Deployments" sektsiooni
   - Näed, kas uus deploy on käimas või valmis

3. **Leht:**
   - Ava oma Vercel'i leht
   - Värskenda lehte (Ctrl+F5)
   - Vaata, kas muudatused on näha

## ⚡ Kiire viis

Kui tahad kiiresti:

```bash
git add . && git commit -m "Muudatused" && git push origin main
```

See teeb kõik ühe käsuga!

## 💡 Näpunäited

- **Commit sõnumid:** Kirjuta selged, lühikesed kirjeldused
- **Sageli push'i:** Ära oota liiga kaua, push'i regulaarselt
- **Vercel'i logid:** Kui midagi ei tööta, vaata Vercel'i logisid

## 🆘 Kui midagi ei tööta

1. Kontrolli, kas `git push` õnnestus
2. Vaata Vercel'i dashboard'is deploy'i staatust
3. Kontrolli Vercel'i logisid vigu
4. Proovi värskendada lehte (Ctrl+F5)

