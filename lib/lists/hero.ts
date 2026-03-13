export const formatHeroEventDate = (
  value: string | null,
  locale: string
) => {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const parsedDate = new Date(`${normalized}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return normalized
  }

  return new Intl.DateTimeFormat(locale === 'et' ? 'et-EE' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)
}
