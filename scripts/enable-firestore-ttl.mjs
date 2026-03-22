import fs from 'node:fs'
import path from 'node:path'
import { GoogleAuth } from 'google-auth-library'

const DEFAULT_DATABASE = '(default)'
const TTL_COLLECTION_GROUPS = ['requestRateLimits', 'videoProcessingJobs']
const TTL_FIELD_PATH = 'expiresAt'
const ENV_FILE_PATH = path.resolve(process.cwd(), '.env.local')
const OPERATION_POLL_INTERVAL_MS = 5000
const OPERATION_POLL_ATTEMPTS = 120

const readEnvFile = () => {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    return {}
  }

  return fs.readFileSync(ENV_FILE_PATH, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      if (!line || line.trim().startsWith('#')) {
        return acc
      }

      const separatorIndex = line.indexOf('=')
      if (separatorIndex <= 0) {
        return acc
      }

      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      if (!key) {
        return acc
      }

      acc[key] = value
      return acc
    }, {})
}

const envFile = readEnvFile()
const FIREBASE_TOOLS_CONFIG = path.join(
  process.env.USERPROFILE ?? '',
  '.config',
  'configstore',
  'firebase-tools.json'
)
const FIREBASE_CLIENT_ID =
  process.env.FIREBASE_CLIENT_ID
  ?? '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET =
  process.env.FIREBASE_CLIENT_SECRET
  ?? 'j9iVZfS8kkCEFUPaAeJV0sAi'

const rawServiceAccount =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ?? envFile.FIREBASE_SERVICE_ACCOUNT_JSON
const projectId =
  process.env.FIREBASE_PROJECT_ID
  ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ?? envFile.FIREBASE_PROJECT_ID
  ?? envFile.NEXT_PUBLIC_FIREBASE_PROJECT_ID

if (!rawServiceAccount || !projectId) {
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID')
}

const serviceAccount = JSON.parse(rawServiceAccount)
if (typeof serviceAccount.private_key === 'string') {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
}

const getServiceAccountAccessToken = async () => {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/datastore'],
  })

  return await auth.getAccessToken()
}

const getFirebaseCliConfig = () => {
  if (!fs.existsSync(FIREBASE_TOOLS_CONFIG)) {
    return null
  }

  return JSON.parse(fs.readFileSync(FIREBASE_TOOLS_CONFIG, 'utf8'))
}

const refreshFirebaseUserAccessToken = async () => {
  const firebaseToolsConfig = getFirebaseCliConfig()
  const refreshToken = firebaseToolsConfig?.tokens?.refresh_token
  if (!refreshToken) {
    return null
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: FIREBASE_CLIENT_ID,
      client_secret: FIREBASE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to refresh Firebase CLI access token: ${response.status} ${body}`)
  }

  const tokens = await response.json()
  if (!tokens?.access_token) {
    throw new Error('Firebase CLI token refresh returned no access token')
  }

  return tokens.access_token
}

const buildHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
})

const getFieldEndpoint = (collectionGroup) => {
  const fieldPath = encodeURIComponent(TTL_FIELD_PATH)
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(DEFAULT_DATABASE)}/collectionGroups/${collectionGroup}/fields/${fieldPath}`
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const readFieldConfig = async (collectionGroup, headers) => {
  const response = await fetch(getFieldEndpoint(collectionGroup), {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to read Firestore field config for ${collectionGroup}.${TTL_FIELD_PATH}: ${response.status} ${body}`)
  }

  return await response.json()
}

const waitForOperation = async (operationName, headers) => {
  const operationUrl = `https://firestore.googleapis.com/v1/${operationName}`

  for (let attempt = 0; attempt < OPERATION_POLL_ATTEMPTS; attempt += 1) {
    const response = await fetch(operationUrl, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Failed to poll Firestore TTL operation ${operationName}: ${response.status} ${body}`)
    }

    const operation = await response.json()
    if (operation.done) {
      if (operation.error) {
        throw new Error(`Firestore TTL operation failed: ${JSON.stringify(operation.error)}`)
      }

      return operation.response ?? null
    }

    await sleep(OPERATION_POLL_INTERVAL_MS)
  }

  throw new Error(`Timed out waiting for Firestore TTL operation ${operationName}`)
}

const enableCollectionGroupTtl = async (collectionGroup, headers) => {
  const existingConfig = await readFieldConfig(collectionGroup, headers)
  if (existingConfig?.ttlConfig) {
    return 'already_enabled'
  }

  const endpoint = `${getFieldEndpoint(collectionGroup)}?updateMask=ttlConfig`

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      ttlConfig: {},
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to enable TTL for ${collectionGroup}.${TTL_FIELD_PATH}: ${response.status} ${body}`)
  }

  const operation = await response.json()
  if (operation?.name) {
    await waitForOperation(operation.name, headers)
  }

  return 'enabled'
}

const tryEnableTtl = async (accessToken) => {
  const headers = buildHeaders(accessToken)

  for (const collectionGroup of TTL_COLLECTION_GROUPS) {
    const result = await enableCollectionGroupTtl(collectionGroup, headers)
    if (result === 'already_enabled') {
      console.log(`Firestore TTL already enabled for ${collectionGroup}.${TTL_FIELD_PATH}`)
      continue
    }

    console.log(`Enabled Firestore TTL for ${collectionGroup}.${TTL_FIELD_PATH}`)
  }
}

const serviceAccountAccessToken = await getServiceAccountAccessToken()
if (serviceAccountAccessToken) {
  try {
    await tryEnableTtl(serviceAccountAccessToken)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('403')) {
      throw error
    }

    const userAccessToken = await refreshFirebaseUserAccessToken()
    if (!userAccessToken) {
      throw error
    }

    await tryEnableTtl(userAccessToken)
  }
} else {
  const userAccessToken = await refreshFirebaseUserAccessToken()
  if (!userAccessToken) {
    throw new Error('Unable to obtain any Firestore admin access token')
  }

  await tryEnableTtl(userAccessToken)
}
