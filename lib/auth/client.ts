import { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { Timestamp, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const TRIAL_DAYS = 14

const buildTrialEnd = () => {
  const date = new Date()
  date.setDate(date.getDate() + TRIAL_DAYS)
  return Timestamp.fromDate(date)
}

const upsertUserProfile = async (user: User, isNewUser: boolean) => {
  const userRef = doc(db, 'users', user.uid)
  const payload: Record<string, unknown> = {
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    providerIds: user.providerData.map((provider) => provider.providerId),
    lastLoginAt: serverTimestamp(),
  }

  if (isNewUser) {
    payload.createdAt = serverTimestamp()
    payload.trialStartedAt = serverTimestamp()
    payload.trialEndsAt = buildTrialEnd()
    payload.trialStatus = 'active'
  }

  await setDoc(userRef, payload, { merge: true })
}

export const signInWithGoogle = async (): Promise<UserCredential> => {
  const credential = await signInWithPopup(auth, googleProvider)
  const userInfo = getAdditionalUserInfo(credential)

  await upsertUserProfile(credential.user, Boolean(userInfo?.isNewUser))
  return credential
}

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  await upsertUserProfile(credential.user, false)
  return credential
}

export const createAccountWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await upsertUserProfile(credential.user, true)

  try {
    await sendEmailVerification(credential.user)
  } catch (error) {
    // Account creation must not fail if verification email sending fails.
    if (!(error instanceof FirebaseError)) {
      throw error
    }
  }

  return credential
}

export const signOutUser = async () => {
  await signOut(auth)
}

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email)
}
