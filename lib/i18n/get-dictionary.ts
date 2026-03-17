import { Locale } from '@/lib/i18n/config'
import { dictionaries } from '@/lib/i18n/generated'

export const getDictionary = (locale: Locale) => {
  return dictionaries[locale]
}
