import { Locale } from '@/lib/i18n/config'
import { enDictionary } from '@/lib/i18n/dictionaries/en'
import { etDictionary } from '@/lib/i18n/dictionaries/et'

const dictionaries = {
  en: enDictionary,
  et: etDictionary,
} as const

export const getDictionary = (locale: Locale) => {
  return dictionaries[locale]
}
