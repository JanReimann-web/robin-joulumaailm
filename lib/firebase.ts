import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Kontrolli, kas kõik väärtused on olemas
if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Firebase konfiguratsioon puudub!')
    console.error('Vercel\'is: Lisa keskkonna muutujad Settings → Environment Variables')
    console.error('Olemasolevad väärtused:', {
      apiKey: firebaseConfig.apiKey ? '✅' : '❌',
      projectId: firebaseConfig.projectId ? '✅' : '❌',
      authDomain: firebaseConfig.authDomain ? '✅' : '❌',
      storageBucket: firebaseConfig.storageBucket ? '✅' : '❌',
      messagingSenderId: firebaseConfig.messagingSenderId ? '✅' : '❌',
      appId: firebaseConfig.appId ? '✅' : '❌',
    })
    console.error('Vaata: VERCEL_FIREBASE_SETUP.md faili juhiste jaoks')
  } else {
    console.log('✅ Firebase konfiguratsioon laetud:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    })
  }
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
