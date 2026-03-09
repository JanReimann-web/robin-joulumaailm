export const BILLING_PLAN_IDS = ['base', 'premium', 'platinum'] as const
export type BillingPlanId = (typeof BILLING_PLAN_IDS)[number]

export const BYTES_IN_MB = 1024 * 1024
export const BASE_MEDIA_LIMIT_BYTES = 50 * BYTES_IN_MB
export const PREMIUM_MEDIA_LIMIT_BYTES = 200 * BYTES_IN_MB
export const PLATINUM_MEDIA_LIMIT_BYTES = 500 * BYTES_IN_MB
export const MAX_VIDEO_DURATION_SECONDS = 60

export type ListMediaUsageSummary = {
  totalBytes: number
  imageBytes: number
  videoBytes: number
  containsVideo: boolean
  maxVideoDurationSeconds: number
}

export type ListMediaUsageIssue =
  | 'media_limit_exceeded'
  | 'video_duration_exceeded'
  | null

export type UploadMediaMetadata = {
  url: string
  path: string
  type: string
  sizeBytes: number
  durationSeconds: number | null
}

export type PersistedMediaMetadata = {
  mediaType: string | null
  mediaSizeBytes: number | null
  mediaDurationSeconds: number | null
}

export const EMPTY_LIST_MEDIA_USAGE_SUMMARY: ListMediaUsageSummary = {
  totalBytes: 0,
  imageBytes: 0,
  videoBytes: 0,
  containsVideo: false,
  maxVideoDurationSeconds: 0,
}

export const BILLING_PLAN_DEFINITIONS: Record<BillingPlanId, {
  id: BillingPlanId
  priceCents: number
  maxMediaBytes: number
  supportsVideo: boolean
}> = {
  base: {
    id: 'base',
    priceCents: 995,
    maxMediaBytes: BASE_MEDIA_LIMIT_BYTES,
    supportsVideo: false,
  },
  premium: {
    id: 'premium',
    priceCents: 1995,
    maxMediaBytes: PREMIUM_MEDIA_LIMIT_BYTES,
    supportsVideo: false,
  },
  platinum: {
    id: 'platinum',
    priceCents: 2995,
    maxMediaBytes: PLATINUM_MEDIA_LIMIT_BYTES,
    supportsVideo: true,
  },
}

const normalizeByteValue = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 0
  }

  return Math.round(value)
}

const normalizeDurationValue = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 0
  }

  return value
}

export const createPersistedMediaMetadata = (params: {
  mediaType: string | null
  mediaSizeBytes: number | null | undefined
  mediaDurationSeconds?: number | null | undefined
}): PersistedMediaMetadata => ({
  mediaType: params.mediaType,
  mediaSizeBytes: normalizeByteValue(params.mediaSizeBytes),
  mediaDurationSeconds: params.mediaType?.startsWith('video/')
    ? normalizeDurationValue(params.mediaDurationSeconds)
    : null,
})

export const getMediaUsageIssue = (
  summary: ListMediaUsageSummary
): ListMediaUsageIssue => {
  if (summary.maxVideoDurationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    return 'video_duration_exceeded'
  }

  if (summary.totalBytes > PLATINUM_MEDIA_LIMIT_BYTES) {
    return 'media_limit_exceeded'
  }

  return null
}

export const resolveRequiredBillingPlanId = (
  summary: ListMediaUsageSummary
): BillingPlanId | null => {
  if (getMediaUsageIssue(summary)) {
    return null
  }

  if (summary.containsVideo) {
    return 'platinum'
  }

  if (summary.totalBytes <= BASE_MEDIA_LIMIT_BYTES) {
    return 'base'
  }

  if (summary.totalBytes <= PREMIUM_MEDIA_LIMIT_BYTES) {
    return 'premium'
  }

  return 'platinum'
}

export const isBillingPlanEligible = (
  planId: BillingPlanId,
  summary: ListMediaUsageSummary
) => {
  const issue = getMediaUsageIssue(summary)
  if (issue) {
    return false
  }

  const plan = BILLING_PLAN_DEFINITIONS[planId]
  if (!plan.supportsVideo && summary.containsVideo) {
    return false
  }

  return summary.totalBytes <= plan.maxMediaBytes
}

export const calculateListMediaUsageSummary = (
  entries: PersistedMediaMetadata[]
): ListMediaUsageSummary => {
  return entries.reduce<ListMediaUsageSummary>((summary, entry) => {
    const sizeBytes = normalizeByteValue(entry.mediaSizeBytes)
    const mediaType = entry.mediaType

    if (!mediaType || sizeBytes <= 0) {
      return summary
    }

    summary.totalBytes += sizeBytes

    if (mediaType.startsWith('video/')) {
      summary.videoBytes += sizeBytes
      summary.containsVideo = true
      summary.maxVideoDurationSeconds = Math.max(
        summary.maxVideoDurationSeconds,
        normalizeDurationValue(entry.mediaDurationSeconds)
      )
      return summary
    }

    if (mediaType.startsWith('image/')) {
      summary.imageBytes += sizeBytes
    }

    return summary
  }, {
    ...EMPTY_LIST_MEDIA_USAGE_SUMMARY,
  })
}

export const formatMediaUsageMegabytes = (bytes: number) => {
  const megabytes = bytes / BYTES_IN_MB

  if (megabytes === 0) {
    return '0 MB'
  }

  if (megabytes >= 100) {
    return `${Math.round(megabytes)} MB`
  }

  if (megabytes >= 10) {
    return `${megabytes.toFixed(1)} MB`
  }

  return `${megabytes.toFixed(2)} MB`
}
