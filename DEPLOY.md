# Deploy juhend - Robini Jõulumaailm

## ⚠️ Oluline

GitHub Pages **ei toeta Next.js rakendusi otse**. See näitab ainult README.md faili.

## ✅ Soovitatud: Vercel (tasuta ja lihtne)

Vercel on Next.js'i looja poolt loodud ja on parim valik Next.js rakenduste jaoks.

### Kuidas deploy'da Vercel'is:

1. **Loo Vercel'i konto:**
   - Mine: https://vercel.com/
   - Logi sisse GitHub'i kontoga

2. **Deploy projekt:**
   - Klõpsa "Add New Project"
   - Vali oma GitHub'i repo: `robin-joulumaailm`
   - Vercel tuvastab automaatselt, et see on Next.js projekt

3. **Seadista keskkonna muutujad:**
   - Environment Variables sektsioonis lisa:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=sinu_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sinu_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=sinu_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sinu_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sinu_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=sinu_app_id
     ```

4. **Deploy:**
   - Klõpsa "Deploy"
   - Oota mõni minut
   - ✅ Sinu leht on nüüd elus!

5. **Automaatne deploy:**
   - Iga kord, kui push'id GitHub'i, deploy'ib Vercel automaatselt uue versiooni

## Alternatiiv: Netlify

1. Mine: https://www.netlify.com/
2. Logi sisse GitHub'i kontoga
3. "Add new site" → "Import an existing project"
4. Vali oma repo
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Lisa keskkonna muutujad (nagu Vercel'is)
7. Deploy!

## Alternatiiv: GitHub Actions (keerulisem)

Kui tahad kasutada GitHub Pages'i, pead seadistama GitHub Actions'i:

1. Loo `.github/workflows/deploy.yml` fail
2. Seadista build ja deploy
3. See on keerulisem kui Vercel

## 📝 Soovitus

**Kasuta Vercel'i** - see on:
- ✅ Tasuta
- ✅ Automaatne deploy GitHub'ist
- ✅ Parim Next.js tugi
- ✅ Kiire ja lihtne
- ✅ HTTPS automaatselt
- ✅ Kohandatud domeenid

## 🔗 Pärast deploy'it

Pärast Vercel'i deploy'it saad:
- Jagada linki: `https://robin-joulumaailm.vercel.app`
- Lisa oma domeen (valikuline)
- Automaatsed uuendused iga GitHub push'iga

