import fs from 'node:fs'
import path from 'node:path'
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { Timestamp, doc, setDoc } from 'firebase/firestore'

export const TEST_PROJECT_ID = 'demo-kingid-tests'
export const TEST_STORAGE_BUCKET = `${TEST_PROJECT_ID}.appspot.com`

export const createTestEnvironment = async () => {
  const firestoreRules = fs.readFileSync(
    path.resolve(process.cwd(), 'firestore.rules'),
    'utf8'
  )
  const storageRules = fs.readFileSync(
    path.resolve(process.cwd(), 'storage.rules'),
    'utf8'
  )

  return initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: firestoreRules,
    },
    storage: {
      host: '127.0.0.1',
      port: 9199,
      rules: storageRules,
    },
  })
}

export const clearData = async (testEnv: RulesTestEnvironment) => {
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await testEnv.clearFirestore()
      return
    } catch (rawError) {
      const message = rawError instanceof Error ? rawError.message : String(rawError)
      const isLockTimeout = message.includes('Transaction lock timeout')
      const isLastAttempt = attempt === maxAttempts

      if (!isLockTimeout || isLastAttempt) {
        throw rawError
      }

      await new Promise((resolve) => {
        setTimeout(resolve, attempt * 150)
      })
    }
  }
}

export const futureTimestamp = (daysAhead = 14) =>
  Timestamp.fromDate(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000))

export const pastTimestamp = (daysBehind = 1) =>
  Timestamp.fromDate(new Date(Date.now() - daysBehind * 24 * 60 * 60 * 1000))

export const seedList = async (
  testEnv: RulesTestEnvironment,
  params: {
    listId: string
    ownerId: string
    visibility?: 'public' | 'private'
    trialEndsAt?: Timestamp | null
    paidAccessEndsAt?: Timestamp | null
    slug?: string
  }
) => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'lists', params.listId), {
      ownerId: params.ownerId,
      title: 'Test List',
      slug: params.slug ?? params.listId,
      eventType: 'birthday',
      templateId: 'classic',
      visibility: params.visibility ?? 'public',
      status: 'draft',
      billingModel: 'one_time_90d',
      trialEndsAt: params.trialEndsAt ?? futureTimestamp(),
      paidAccessEndsAt: params.paidAccessEndsAt ?? null,
      purgeAt: params.trialEndsAt ?? futureTimestamp(),
      createdAt: futureTimestamp(0),
      updatedAt: futureTimestamp(0),
    })
  })
}

export { assertFails, assertSucceeds }
