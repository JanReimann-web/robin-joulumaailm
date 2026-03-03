import { sanitizeSlug } from '@/lib/lists/slug'

export const PUBLIC_URL_CODE_LENGTH = 6

const PUBLIC_URL_CODE_PATTERN = new RegExp(`^[0-9]{${PUBLIC_URL_CODE_LENGTH}}$`)

const padCode = (value: number) => {
  return value.toString().padStart(PUBLIC_URL_CODE_LENGTH, '0')
}

export const sanitizePublicUrlCode = (value: string) => {
  return value.replace(/[^0-9]/g, '').slice(0, PUBLIC_URL_CODE_LENGTH)
}

export const isValidPublicUrlCode = (value: string) => {
  return PUBLIC_URL_CODE_PATTERN.test(value)
}

export const generatePublicUrlCode = () => {
  const maxExclusive = 10 ** PUBLIC_URL_CODE_LENGTH

  if (
    typeof globalThis.crypto !== 'undefined'
    && typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const randomBytes = new Uint32Array(1)
    globalThis.crypto.getRandomValues(randomBytes)
    const randomValue = randomBytes[0] % maxExclusive
    return padCode(randomValue)
  }

  return padCode(Math.floor(Math.random() * maxExclusive))
}

export const buildPublicSlug = (
  publicUrlCode: string,
  rawSlug: string
) => {
  const normalizedCode = sanitizePublicUrlCode(publicUrlCode)
  const normalizedSlug = sanitizeSlug(rawSlug)
  return sanitizeSlug(`${normalizedCode}-${normalizedSlug}`)
}

export const extractUrlNameFromPublicSlug = (publicSlug: string) => {
  return publicSlug.replace(new RegExp(`^[0-9]{${PUBLIC_URL_CODE_LENGTH}}-`), '')
}

