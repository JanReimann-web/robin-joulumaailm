import 'server-only'
import { DecodedIdToken } from 'firebase-admin/auth'
import { adminAuth } from '@/lib/firebase/admin'

const DEFAULT_GALLERY_CURATOR_EMAILS = ['jaanes79@gmail.com']

const normalizeEmail = (value: string) => value.trim().toLowerCase()

const getConfiguredCuratorEmails = () => {
  const configuredEmails = (process.env.GALLERY_CURATOR_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  const sourceEmails = configuredEmails.length > 0
    ? configuredEmails
    : DEFAULT_GALLERY_CURATOR_EMAILS

  return new Set(sourceEmails.map(normalizeEmail))
}

export const canManageGalleryExamples = async (
  decodedToken: DecodedIdToken
) => {
  if (decodedToken.galleryCurator === true || decodedToken.admin === true) {
    return true
  }

  const curatorEmails = getConfiguredCuratorEmails()
  const tokenEmail = typeof decodedToken.email === 'string'
    ? normalizeEmail(decodedToken.email)
    : ''

  if (tokenEmail && curatorEmails.has(tokenEmail)) {
    return true
  }

  const userRecord = await adminAuth.getUser(decodedToken.uid)
  const userEmail = typeof userRecord.email === 'string'
    ? normalizeEmail(userRecord.email)
    : ''

  return userEmail.length > 0 && curatorEmails.has(userEmail)
}
