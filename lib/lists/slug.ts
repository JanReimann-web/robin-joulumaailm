const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SLUG_MIN_LEN = 3
const SLUG_MAX_LEN = 32

const RESERVED_SLUGS = new Set([
  'en',
  'et',
  'l',
  'admin',
  'login',
  'pricing',
  'dashboard',
  'api',
])

export const sanitizeSlug = (input: string): string => {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const isValidSlug = (slug: string): boolean => {
  if (slug.length < SLUG_MIN_LEN || slug.length > SLUG_MAX_LEN) {
    return false
  }

  return SLUG_PATTERN.test(slug)
}

export const isReservedSlug = (slug: string): boolean => {
  return RESERVED_SLUGS.has(slug)
}
