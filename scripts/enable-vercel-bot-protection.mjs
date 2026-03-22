import fs from 'node:fs'
import path from 'node:path'

const PROJECT_FILE = path.resolve(process.cwd(), '.vercel', 'project.json')
const VERCEL_AUTH_FILE = path.join(
  process.env.APPDATA ?? '',
  'com.vercel.cli',
  'Data',
  'auth.json'
)

const readJsonFile = (filePath) => {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const projectLink = readJsonFile(PROJECT_FILE)
const token = process.env.VERCEL_TOKEN
  ?? readJsonFile(VERCEL_AUTH_FILE).token

if (!projectLink?.projectId || !projectLink?.orgId || !token) {
  throw new Error('Missing Vercel project link or authentication token')
}

const configEndpoint = `https://api.vercel.com/v1/security/firewall/config?projectId=${projectLink.projectId}&teamId=${projectLink.orgId}`
const activeConfigEndpoint = `https://api.vercel.com/v1/security/firewall/config/active?projectId=${projectLink.projectId}&teamId=${projectLink.orgId}`
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const fetchActiveConfig = async () => {
  const response = await fetch(activeConfigEndpoint, {
    method: 'GET',
    headers,
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to read Vercel Firewall config: ${response.status} ${body}`)
  }

  return await response.json()
}

const desiredManagedRules = {
  bot_protection: {
    active: true,
    action: 'challenge',
  },
}

const applyFirewallConfig = async () => {
  const existingConfig = await fetchActiveConfig()
  const createResponse = await fetch(configEndpoint, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      firewallEnabled: true,
      managedRules: {
        ...(existingConfig?.managedRules ?? {}),
        bot_protection: {
          ...(existingConfig?.managedRules?.bot_protection ?? {}),
          active: true,
          action: 'challenge',
        },
      },
    }),
  })

  if (!createResponse.ok) {
    const body = await createResponse.text()
    throw new Error(`Failed to create Vercel Firewall config: ${createResponse.status} ${body}`)
  }

  return await createResponse.json()
}

const result = await applyFirewallConfig()
const botProtection = result?.managedRules?.bot_protection ?? desiredManagedRules.bot_protection

console.log(
  `Enabled Vercel bot protection (${botProtection.action}) for project ${projectLink.projectId}`
)
