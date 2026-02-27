import admin from 'firebase-admin'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dryRun = process.argv.includes('--dry-run')
const batchSize = Math.max(
  1,
  Number.parseInt(process.env.PURGE_BATCH_SIZE ?? '25', 10)
)

const loadLocalEnvFile = () => {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    return
  }

  const raw = readFileSync(envPath, 'utf8')
  raw.split(/\r?\n/).forEach((line) => {
    const entry = line.trim()
    if (!entry || entry.startsWith('#')) {
      return
    }

    const separatorIndex = entry.indexOf('=')
    if (separatorIndex <= 0) {
      return
    }

    const key = entry.slice(0, separatorIndex).trim()
    if (!key || process.env[key]) {
      return
    }

    let value = entry.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  })
}

loadLocalEnvFile()

if (!admin.apps.length) {
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT
    ?? process.env.FIREBASE_PROJECT_ID
    ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) {
    throw new Error(
      'Missing project id. Set FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID).'
    )
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET
  const appConfig = {
    projectId,
    ...(storageBucket ? { storageBucket } : {}),
  }

  admin.initializeApp(Object.keys(appConfig).length > 0 ? appConfig : undefined)
}

const db = admin.firestore()
const now = new Date()
const nowTimestamp = admin.firestore.Timestamp.fromDate(now)

const log = (message) => {
  const time = new Date().toISOString()
  console.log(`[${time}] ${message}`)
}

const deleteSubcollection = async (collectionRef) => {
  while (true) {
    const snapshot = await collectionRef.limit(300).get()
    if (snapshot.empty) {
      return
    }

    const batch = db.batch()
    snapshot.docs.forEach((entry) => batch.delete(entry.ref))
    await batch.commit()
  }
}

const deleteSlugClaimsForList = async (listId, slugFromList) => {
  if (slugFromList) {
    await db.collection('slugClaims').doc(slugFromList).delete().catch(() => null)
  }

  const claimsByList = await db
    .collection('slugClaims')
    .where('listId', '==', listId)
    .get()

  if (claimsByList.empty) {
    return 0
  }

  const batch = db.batch()
  claimsByList.docs.forEach((entry) => batch.delete(entry.ref))
  await batch.commit()
  return claimsByList.size
}

const deleteListStorage = async (listId) => {
  try {
    const bucket = admin.storage().bucket()
    await bucket.deleteFiles({ prefix: `lists/${listId}/`, force: true })
    return true
  } catch {
    return false
  }
}

const run = async () => {
  log(`Starting purge job. Mode=${dryRun ? 'dry-run' : 'delete'} batchSize=${batchSize}`)

  const dueListsSnapshot = await db
    .collection('lists')
    .where('purgeAt', '<=', nowTimestamp)
    .limit(batchSize)
    .get()

  if (dueListsSnapshot.empty) {
    log('No lists are due for purge.')
    return
  }

  let deletedLists = 0
  let deletedItems = 0
  let deletedReservations = 0
  let deletedSlugClaims = 0
  let deletedStorageFolders = 0

  for (const entry of dueListsSnapshot.docs) {
    const listId = entry.id
    const payload = entry.data()
    const slug =
      typeof payload.slug === 'string' && payload.slug.length > 0
        ? payload.slug
        : null

    const itemsSnapshot = await entry.ref.collection('items').get()
    const reservationsSnapshot = await entry.ref.collection('reservations').get()

    if (dryRun) {
      log(
        `DRY-RUN list=${listId} slug=${slug ?? '-'} items=${itemsSnapshot.size} reservations=${reservationsSnapshot.size}`
      )
      continue
    }

    await deleteSubcollection(entry.ref.collection('items'))
    await deleteSubcollection(entry.ref.collection('reservations'))

    const removedClaims = await deleteSlugClaimsForList(listId, slug)
    const removedStorage = await deleteListStorage(listId)

    await entry.ref.delete()

    deletedLists += 1
    deletedItems += itemsSnapshot.size
    deletedReservations += reservationsSnapshot.size
    deletedSlugClaims += removedClaims
    if (removedStorage) {
      deletedStorageFolders += 1
    }

    log(`Deleted list=${listId} slug=${slug ?? '-'} items=${itemsSnapshot.size} reservations=${reservationsSnapshot.size}`)
  }

  log(
    `Finished purge. deletedLists=${deletedLists} deletedItems=${deletedItems} deletedReservations=${deletedReservations} deletedSlugClaims=${deletedSlugClaims} deletedStorageFolders=${deletedStorageFolders}`
  )
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('default credentials')) {
    console.error(
      'Missing Google admin credentials. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json'
    )
  }

  console.error(error)
  process.exitCode = 1
})
