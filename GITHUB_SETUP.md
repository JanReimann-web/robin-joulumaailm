# GitHub'i üleslaadimise juhend

## Samm 1: Loo GitHub'i repository

1. Mine: https://github.com/new
2. Täida:
   - **Repository name:** `robin-joulumaailm` (või mõni muu nimi)
   - **Description:** "Robini jõulumaailm - interaktiivne jõulusoovide veebileht"
   - **Vali:** Public või Private
   - **Ära lisa:** README, .gitignore, license (need on juba olemas)
3. Klõpsa "Create repository"

## Samm 2: Ühenda projekt GitHub'iga

Pärast repo loomist kopeeri GitHub'i poolt antud käsud ja käivita need terminalis:

```bash
# Asenda YOUR_USERNAME oma GitHub'i kasutajanimega
# Asenda REPO_NAME oma repo nimega

git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## Näide:

Kui sinu GitHub'i kasutajanimi on `jaane` ja repo nimi on `robin-joulumaailm`:

```bash
git remote add origin https://github.com/jaane/robin-joulumaailm.git
git branch -M main
git push -u origin main
```

## Kui on autentimise probleem

### Variant 1: GitHub CLI (soovitatud)
```bash
# Installeri GitHub CLI: https://cli.github.com/
gh auth login
git push -u origin main
```

### Variant 2: Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Vali scope: `repo`
4. Kopeeri token
5. Kasuta token'i paroolina push'imisel

### Variant 3: GitHub Desktop
1. Installeri GitHub Desktop: https://desktop.github.com/
2. File → Add Local Repository
3. Vali kaust: `C:\Users\jaane\AndroidStudioProjects\Kingid`
4. Publish repository

## Järgmised sammud pärast üleslaadimist

1. **Lisa .env.local faili väärtused GitHub'i Secrets** (kui kasutad GitHub Actions)
2. **Seadista Firebase reeglid** - kopeeri `firestore.rules` Firebase konsooli
3. **Deploy** - saad kasutada Vercel, Netlify või mõnda muud platvormi

## Tähtis

- `.env.local` fail on `.gitignore`'is - see ei laeta GitHub'i (hea!)
- Firebase konfiguratsioon peab olema turvaline
- Ära jaga admin parooli avalikult

