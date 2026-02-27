import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  getFirestore,
} from 'firebase/firestore'

const loadEnvFromFile = () => {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    return
  }

  const raw = fs.readFileSync(envPath, 'utf8')
  const lines = raw.split(/\r?\n/)
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue
    const separatorIndex = line.indexOf('=')
    if (separatorIndex < 0) continue
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  const parsed = {
    listId: '',
    itemId: '',
    attempts: 8,
    guestPrefix: 'guest',
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    const value = args[index + 1]
    if (!value) continue

    if (arg === '--listId') parsed.listId = value
    if (arg === '--itemId') parsed.itemId = value
    if (arg === '--attempts') parsed.attempts = Number(value)
    if (arg === '--guestPrefix') parsed.guestPrefix = value
  }

  return parsed
}

const ensureEnv = () => {
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ]

  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`)
  }
}

const main = async () => {
  loadEnvFromFile()
  ensureEnv()

  const { listId, itemId, attempts, guestPrefix } = parseArgs()

  if (!listId || !itemId) {
    console.error(
      'Usage: node scripts/race-reservation.mjs --listId <listId> --itemId <itemId> [--attempts 8]'
    )
    process.exit(1)
  }

  if (!Number.isFinite(attempts) || attempts < 2) {
    console.error('--attempts must be at least 2')
    process.exit(1)
  }

  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  })

  const db = getFirestore(app)
  const itemRef = doc(db, 'lists', listId, 'items', itemId)

  const reserveOnce = async (attemptIndex) => {
    const reservationRef = doc(collection(db, 'lists', listId, 'reservations'))
    const guestName = `${guestPrefix}-${attemptIndex + 1}`

    try {
      await runTransaction(db, async (transaction) => {
        const itemSnap = await transaction.get(itemRef)
        if (!itemSnap.exists()) {
          throw new Error('item_not_found')
        }

        const status = itemSnap.data().status
        if (status !== 'available') {
          throw new Error('item_unavailable')
        }

        transaction.update(itemRef, {
          status: 'reserved',
          reservedByName: guestName,
          reservedMessage: null,
          reservedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        transaction.set(reservationRef, {
          itemId,
          guestName,
          guestMessage: null,
          status: 'active',
          createdAt: serverTimestamp(),
        })
      })

      return { ok: true, attempt: attemptIndex + 1, guestName }
    } catch (error) {
      const code = error instanceof Error ? error.message : 'unknown_error'
      return { ok: false, attempt: attemptIndex + 1, code }
    }
  }

  const attemptsArray = Array.from({ length: attempts }, (_, i) => i)
  const results = await Promise.all(attemptsArray.map((i) => reserveOnce(i)))

  const success = results.filter((result) => result.ok)
  const failed = results.filter((result) => !result.ok)

  console.log('Race test summary')
  console.log(`Attempts: ${attempts}`)
  console.log(`Success: ${success.length}`)
  console.log(`Failed: ${failed.length}`)

  for (const entry of results) {
    if (entry.ok) {
      console.log(`Attempt ${entry.attempt}: SUCCESS (${entry.guestName})`)
    } else {
      console.log(`Attempt ${entry.attempt}: FAILED (${entry.code})`)
    }
  }

  if (success.length > 1) {
    console.error(
      'ERROR: more than one reservation succeeded. Transaction safety is broken.'
    )
    process.exit(2)
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Race test failed: ${message}`)
  process.exit(1)
})
