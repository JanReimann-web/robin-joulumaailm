import admin from 'firebase-admin'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULT_CURATOR_EMAIL = 'jaanes79@gmail.com'
const EVENT_TYPES = [
  'wedding',
  'birthday',
  'kidsBirthday',
  'babyShower',
  'graduation',
  'housewarming',
  'christmas',
]

const parseCliArgs = () => {
  const args = process.argv.slice(2)
  const flags = new Set(args.filter((entry) => entry.startsWith('--')))
  const emailFlag = args.find((entry) => entry.startsWith('--email='))
  const uidFlag = args.find((entry) => entry.startsWith('--uid='))

  return {
    dryRun: flags.has('--dry-run'),
    email: emailFlag ? emailFlag.slice('--email='.length).trim() : DEFAULT_CURATOR_EMAIL,
    uid: uidFlag ? uidFlag.slice('--uid='.length).trim() : '',
  }
}

const { dryRun, email, uid } = parseCliArgs()

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
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const appConfig = {
    projectId,
    ...(storageBucket ? { storageBucket } : {}),
  }

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson)
    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
    }

    appConfig.credential = admin.credential.cert(serviceAccount)
  }

  admin.initializeApp(appConfig)
}

const db = admin.firestore()

const toMillis = (value) => {
  if (value instanceof admin.firestore.Timestamp) {
    return value.toMillis()
  }

  return 0
}

const log = (message) => {
  const time = new Date().toISOString()
  console.log(`[${time}] ${message}`)
}

const chooseBestListForEvent = (entries) => {
  return [...entries].sort((left, right) => {
    const leftUpdatedAt = toMillis(left.updatedAt)
    const rightUpdatedAt = toMillis(right.updatedAt)
    if (leftUpdatedAt !== rightUpdatedAt) {
      return rightUpdatedAt - leftUpdatedAt
    }

    const leftCreatedAt = toMillis(left.createdAt)
    const rightCreatedAt = toMillis(right.createdAt)
    return rightCreatedAt - leftCreatedAt
  })[0] ?? null
}

const run = async () => {
  if (!uid && !email) {
    throw new Error('Missing curator identity. Pass --uid=<firebase_uid> or --email=user@example.com')
  }

  log(
    `Starting gallery example migration for ${uid || email}. Mode=${dryRun ? 'dry-run' : 'write'}`
  )

  let ownerId = uid
  if (!ownerId) {
    const normalizedEmail = email.trim().toLowerCase()
    const userProfileSnapshot = await db
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get()

    if (!userProfileSnapshot.empty) {
      ownerId = userProfileSnapshot.docs[0].id
      log(`Resolved curator uid from users collection: ${ownerId}`)
    } else {
      const userRecord = await admin.auth().getUserByEmail(normalizedEmail)
      ownerId = userRecord.uid
      log(`Resolved curator uid from Firebase Auth: ${ownerId}`)
    }
  } else {
    log(`Using curator uid from CLI: ${ownerId}`)
  }

  const listsSnapshot = await db
    .collection('lists')
    .where('ownerId', '==', ownerId)
    .get()

  const publicLists = listsSnapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .filter((entry) => entry.visibility === 'public' && EVENT_TYPES.includes(entry.eventType))

  if (publicLists.length === 0) {
    log('No public lists found for this curator. Nothing to migrate.')
    return
  }

  const selectedByEvent = new Map()

  EVENT_TYPES.forEach((eventType) => {
    const matchingLists = publicLists.filter((entry) => entry.eventType === eventType)
    if (matchingLists.length === 0) {
      log(`Missing public list for event=${eventType}`)
      return
    }

    const selectedList = chooseBestListForEvent(matchingLists)
    if (!selectedList) {
      return
    }

    selectedByEvent.set(eventType, selectedList)

    log(
      `Selected event=${eventType} listId=${selectedList.id} slug=${selectedList.slug ?? '-'} title=${selectedList.title ?? '-'}`
    )

    if (matchingLists.length > 1) {
      const skippedIds = matchingLists
        .filter((entry) => entry.id !== selectedList.id)
        .map((entry) => entry.id)
        .join(', ')
      log(`Skipped additional lists for event=${eventType}: ${skippedIds}`)
    }
  })

  if (selectedByEvent.size === 0) {
    log('No eligible gallery examples were selected.')
    return
  }

  const existingSnapshot = await db
    .collection('galleryExamples')
    .where('ownerId', '==', ownerId)
    .get()

  const selectedEventTypes = new Set(selectedByEvent.keys())
  const staleDocs = existingSnapshot.docs.filter((entry) => !selectedEventTypes.has(entry.id))

  if (dryRun) {
    if (staleDocs.length > 0) {
      log(`Would delete stale galleryExamples docs: ${staleDocs.map((entry) => entry.id).join(', ')}`)
    }

    log(`Dry run complete. Selected ${selectedByEvent.size} gallery examples.`)
    return
  }

  const batch = db.batch()
  const now = admin.firestore.FieldValue.serverTimestamp()

  for (const [eventType, selectedList] of selectedByEvent.entries()) {
    const docRef = db.collection('galleryExamples').doc(eventType)
    const existingDoc = existingSnapshot.docs.find((entry) => entry.id === eventType)
    const payload = {
      eventType,
      listId: selectedList.id,
      ownerId,
      updatedAt: now,
      ...(existingDoc ? {} : { createdAt: now }),
    }

    batch.set(docRef, payload, { merge: true })
  }

  staleDocs.forEach((entry) => batch.delete(entry.ref))
  await batch.commit()

  log(`Migration complete. Updated ${selectedByEvent.size} gallery examples.`)
  if (staleDocs.length > 0) {
    log(`Deleted stale galleryExamples docs: ${staleDocs.map((entry) => entry.id).join(', ')}`)
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('default credentials')) {
    console.error(
      'Missing Google admin credentials. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json or FIREBASE_SERVICE_ACCOUNT_JSON.'
    )
  }

  console.error(error)
  process.exitCode = 1
})
