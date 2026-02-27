import 'server-only'
import { App, AppOptions, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    return null
  }

  const parsed = JSON.parse(raw) as Record<string, string>
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
  }

  return parsed
}

const createAdminApp = (): App => {
  const projectId =
    process.env.FIREBASE_PROJECT_ID
    ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET
    ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const serviceAccount = parseServiceAccount()

  const options: AppOptions = {
    ...(projectId ? { projectId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
    ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
  }

  return initializeApp(Object.keys(options).length > 0 ? options : undefined)
}

const adminApp = getApps()[0] ?? createAdminApp()

export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
export const adminStorage = getStorage(adminApp)
