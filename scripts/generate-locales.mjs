import { build } from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const workspaceRoot = process.cwd()
const tmpDir = path.join(workspaceRoot, '.tmp', 'locale-generator')
const outputPath = path.join(workspaceRoot, 'lib', 'i18n', 'generated.ts')

const targetLocales = [
  'en',
  'et',
  'fi',
  'sv',
  'no',
  'da',
  'de',
  'fr',
  'es',
  'pt',
  'it',
  'pl',
  'ru',
  'lv',
  'lt',
]

const translateLocales = targetLocales.filter((locale) => !['en', 'et'].includes(locale))

const moduleDefinitions = [
  {
    exportName: 'dictionaries',
    build: async () => ({
      en: (await loadModuleExport('lib/i18n/dictionaries/en.ts', 'enDictionary')),
      et: (await loadModuleExport('lib/i18n/dictionaries/et.ts', 'etDictionary')),
    }),
  },
  {
    exportName: 'homeMarketingCopy',
    build: async () => loadModuleExport('app/[locale]/page.tsx', 'homeMarketingCopy'),
  },
  {
    exportName: 'pricingMarketingCopy',
    build: async () => loadModuleExport('app/[locale]/pricing/page.tsx', 'pricingMarketingCopy'),
  },
  {
    exportName: 'weddingPageCopy',
    build: async () => loadModuleExport('app/[locale]/events/[eventType]/page.tsx', 'weddingPageCopy'),
  },
  {
    exportName: 'weddingIntentLeadCopy',
    build: async () => loadModuleExport('components/marketing/WeddingIntentLanding.tsx', 'leadCopy'),
  },
  {
    exportName: 'galleryCopy',
    build: async () => loadModuleExport('components/showcase/ShowcaseGallery.tsx', 'galleryCopy'),
  },
  {
    exportName: 'publicGiftListCopy',
    build: async () => loadModuleExport('components/public/PublicGiftList.tsx', 'PUBLIC_COPY'),
  },
  {
    exportName: 'legalCopy',
    build: async () => loadModuleExport('lib/site/legal.ts', 'LEGAL_COPY'),
  },
  {
    exportName: 'weddingIntentContent',
    build: async () => loadModuleExport('lib/site/wedding-intent.ts', 'weddingIntentContent'),
  },
  {
    exportName: 'cookiePageContent',
    build: async () => loadModuleExport('app/[locale]/cookies/page.tsx', 'COOKIE_PAGE_CONTENT'),
  },
  {
    exportName: 'privacyPageContent',
    build: async () => loadModuleExport('app/[locale]/privacy/page.tsx', 'PRIVACY_PAGE_CONTENT'),
  },
  {
    exportName: 'faqPageContent',
    build: async () => loadModuleExport('app/[locale]/faq/page.tsx', 'FAQ_PAGE_CONTENT'),
  },
  {
    exportName: 'termsPageContent',
    build: async () => loadModuleExport('app/[locale]/terms/page.tsx', 'TERMS_PAGE_CONTENT'),
  },
]

const delimiter = '\n[[[GIFTLIST_STUDIO_SEGMENT]]]\n'
const placeholderPattern = /\{[^}]+\}|\/l\/\[slug\]|Giftlist Studio|Robinio Invest OÜ|Vesivärava 22-4, Tallinn, Estonia/g

const valueCache = new Map()

const inferLoader = (entryPath) => {
  const extension = path.extname(entryPath).toLowerCase()

  if (extension === '.tsx') {
    return 'tsx'
  }

  if (extension === '.ts') {
    return 'ts'
  }

  if (extension === '.jsx') {
    return 'jsx'
  }

  return 'js'
}

const ensureNamedExport = (source, exportName) => {
  const hasNamedExport = new RegExp(`export\\s+(const|function|class)\\s+${exportName}\\b`).test(source)
    || new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`).test(source)

  if (hasNamedExport) {
    return source
  }

  const hasDeclaration = new RegExp(`\\bconst\\s+${exportName}\\b|\\bfunction\\s+${exportName}\\b|\\bclass\\s+${exportName}\\b`).test(source)
  if (!hasDeclaration) {
    return source
  }

  return `${source}\nexport { ${exportName} }\n`
}

const ensureTmpDir = async () => {
  await fs.mkdir(tmpDir, { recursive: true })
  await fs.writeFile(path.join(tmpDir, 'server-only-stub.mjs'), 'export {};\n', 'utf8')
  await fs.writeFile(
    path.join(tmpDir, 'showcase-server-stub.mjs'),
    'export const getPublishedShowcaseEntryForEvent = async () => null;\n',
    'utf8'
  )
  await fs.writeFile(
    path.join(tmpDir, 'billing-markets-server-stub.mjs'),
    'export const resolveBillingMarketFromHeaders = () => ({ availability: "supported" });\n',
    'utf8'
  )
  await fs.writeFile(
    path.join(tmpDir, 'billing-pricing-server-stub.mjs'),
    'export const resolveBillingCurrencyFromHeaders = () => "EUR";\n',
    'utf8'
  )
  await fs.writeFile(
    path.join(tmpDir, 'next-headers-stub.mjs'),
    'export const headers = () => new Headers();\n',
    'utf8'
  )
  await fs.writeFile(
    path.join(tmpDir, 'generated-stub.mjs'),
    [
      'export const dictionaries = {};',
      'export const homeMarketingCopy = {};',
      'export const pricingMarketingCopy = {};',
      'export const weddingPageCopy = {};',
      'export const weddingIntentLeadCopy = {};',
      'export const galleryCopy = {};',
      'export const publicGiftListCopy = {};',
      'export const legalCopy = {};',
      'export const weddingIntentContent = {};',
      'export const cookiePageContent = {};',
      'export const privacyPageContent = {};',
      'export const faqPageContent = {};',
      'export const termsPageContent = {};',
      '',
    ].join('\n'),
    'utf8'
  )
  await fs.writeFile(
    path.join(tmpDir, 'get-dictionary-stub.mjs'),
    'export const getDictionary = () => ({});\n',
    'utf8'
  )
}

const loadModuleExport = async (relativePath, exportName) => {
  await ensureTmpDir()

  const entryPath = path.join(workspaceRoot, relativePath)
  const source = await fs.readFile(entryPath, 'utf8')
  const exportReadySource = ensureNamedExport(source, exportName)
  const bundleResult = await build({
    stdin: {
      contents: exportReadySource,
      resolveDir: path.dirname(entryPath),
      sourcefile: entryPath,
      loader: inferLoader(entryPath),
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    alias: {
      'server-only': path.join(tmpDir, 'server-only-stub.mjs'),
      '@/lib/showcase.server': path.join(tmpDir, 'showcase-server-stub.mjs'),
      '@/lib/billing/markets.server': path.join(tmpDir, 'billing-markets-server-stub.mjs'),
      '@/lib/billing/pricing.server': path.join(tmpDir, 'billing-pricing-server-stub.mjs'),
      '@/lib/i18n/generated': path.join(tmpDir, 'generated-stub.mjs'),
      '@/lib/i18n/get-dictionary': path.join(tmpDir, 'get-dictionary-stub.mjs'),
      'next/headers': path.join(tmpDir, 'next-headers-stub.mjs'),
    },
    write: false,
  })

  const tempFilePath = path.join(
    tmpDir,
    `${exportName}-${path.basename(relativePath).replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.mjs`
  )

  await fs.writeFile(tempFilePath, bundleResult.outputFiles[0].text, 'utf8')
  const moduleUrl = `${pathToFileURL(tempFilePath).href}?v=${Date.now()}`
  const module = await import(moduleUrl)

  if (!(exportName in module)) {
    throw new Error(`Missing export "${exportName}" in ${relativePath}`)
  }

  return structuredClone(module[exportName])
}

const protectPlaceholders = (text) => {
  const replacements = []
  let index = 0

  const protectedText = text.replace(placeholderPattern, (match) => {
    const token = `ZXPH${index}TOKEN`
    replacements.push([token, match])
    index += 1
    return token
  })

  return { protectedText, replacements }
}

const restorePlaceholders = (text, replacements) => {
  return replacements.reduce((nextText, [token, original]) => {
    return nextText.replaceAll(token, original)
  }, text)
}

const translateBatch = async (texts, locale) => {
  if (texts.length === 0) {
    return []
  }

  const protectedItems = texts.map((text) => protectPlaceholders(text))
  const query = protectedItems.map((item) => item.protectedText).join(delimiter)
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&dt=t&tl=' +
    encodeURIComponent(locale) +
    '&q=' +
    encodeURIComponent(query)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Translation request failed for locale ${locale}`)
  }

  const payload = await response.json()
  const translated = payload[0].map((segment) => segment[0]).join('')
  const segments = translated.split(delimiter)

  if (segments.length !== texts.length) {
    throw new Error(`Segment mismatch for locale ${locale}`)
  }

  return segments.map((segment, index) => {
    return restorePlaceholders(segment.trim(), protectedItems[index].replacements)
  })
}

const collectStrings = (value, bucket = new Set()) => {
  if (typeof value === 'string') {
    bucket.add(value)
    return bucket
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, bucket))
    return bucket
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectStrings(entry, bucket))
  }

  return bucket
}

const translateValue = async (value, locale, translations) => {
  if (typeof value === 'string') {
    return translations.get(value) ?? value
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((entry) => translateValue(entry, locale, translations)))
  }

  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, entry]) => {
        return [key, await translateValue(entry, locale, translations)]
      })
    )

    return Object.fromEntries(entries)
  }

  return value
}

const buildLocaleRecord = async (sourceValue) => {
  const nextRecord = {
    en: structuredClone(sourceValue.en),
    et: structuredClone(sourceValue.et),
  }

  const englishStrings = [...collectStrings(sourceValue.en)]

  for (const locale of translateLocales) {
    const translationMap = new Map()
    const uncachedStrings = []

    englishStrings.forEach((text) => {
      const cacheKey = `${locale}::${text}`
      if (valueCache.has(cacheKey)) {
        translationMap.set(text, valueCache.get(cacheKey))
      } else {
        uncachedStrings.push(text)
      }
    })

    for (let index = 0; index < uncachedStrings.length; index += 40) {
      const batch = uncachedStrings.slice(index, index + 40)
      const translatedBatch = await translateBatch(batch, locale)

      batch.forEach((text, batchIndex) => {
        const translatedText = translatedBatch[batchIndex]
        const cacheKey = `${locale}::${text}`
        valueCache.set(cacheKey, translatedText)
        translationMap.set(text, translatedText)
      })
    }

    nextRecord[locale] = await translateValue(sourceValue.en, locale, translationMap)
  }

  return nextRecord
}

const serialize = (value) => {
  return JSON.stringify(value, null, 2)
}

const run = async () => {
  const builtModules = {}

  for (const definition of moduleDefinitions) {
    builtModules[definition.exportName] = await definition.build()
  }

  const localeCollections = {}

  for (const [exportName, value] of Object.entries(builtModules)) {
    localeCollections[exportName] = await buildLocaleRecord(value)
  }

  const fileContents = `import type { Dictionary } from '@/lib/i18n/types'
import type { Locale } from '@/lib/i18n/config'

export const dictionaries: Record<Locale, Dictionary> = ${serialize(localeCollections.dictionaries)}

export const homeMarketingCopy = ${serialize(localeCollections.homeMarketingCopy)} as const
export const pricingMarketingCopy = ${serialize(localeCollections.pricingMarketingCopy)} as const
export const weddingPageCopy = ${serialize(localeCollections.weddingPageCopy)} as const
export const weddingIntentLeadCopy = ${serialize(localeCollections.weddingIntentLeadCopy)} as const
export const galleryCopy = ${serialize(localeCollections.galleryCopy)} as const
export const publicGiftListCopy = ${serialize(localeCollections.publicGiftListCopy)} as const
export const legalCopy = ${serialize(localeCollections.legalCopy)} as const
export const weddingIntentContent = ${serialize(localeCollections.weddingIntentContent)} as const
export const cookiePageContent = ${serialize(localeCollections.cookiePageContent)} as const
export const privacyPageContent = ${serialize(localeCollections.privacyPageContent)} as const
export const faqPageContent = ${serialize(localeCollections.faqPageContent)} as const
export const termsPageContent = ${serialize(localeCollections.termsPageContent)} as const
`

  await fs.writeFile(outputPath, fileContents, 'utf8')
  console.log(`Generated ${outputPath}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
