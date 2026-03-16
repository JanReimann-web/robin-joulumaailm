export const BILLING_PLAN_IDS = ['base', 'premium', 'platinum'] as const
export type BillingPlanId = (typeof BILLING_PLAN_IDS)[number]

export const BYTES_IN_MB = 1024 * 1024
export const BASE_IMAGE_LIMIT = 25
export const PREMIUM_IMAGE_LIMIT = 50
export const PLATINUM_MEDIA_LIMIT = 200
export const PLATINUM_VIDEO_LIMIT = 20
export const MAX_VIDEO_DURATION_SECONDS = 60
export type BillingVisibility = 'public' | 'public_password' | 'private'

export type ListMediaUsageSummary = {
  totalBytes: number
  imageBytes: number
  videoBytes: number
  containsVideo: boolean
  maxVideoDurationSeconds: number
  imageCount: number
  videoCount: number
  totalMediaCount: number
}

export type ListMediaUsageIssue =
  | 'media_limit_exceeded'
  | 'video_count_exceeded'
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
  imageCount: 0,
  videoCount: 0,
  totalMediaCount: 0,
}

export const BILLING_PLAN_DEFINITIONS: Record<BillingPlanId, {
  id: BillingPlanId
  priceCents: number
  maxMediaCount: number
  maxVideoCount: number
  supportsVideo: boolean
  allowsPasswordProtection: boolean
}> = {
  base: {
    id: 'base',
    priceCents: 995,
    maxMediaCount: BASE_IMAGE_LIMIT,
    maxVideoCount: 0,
    supportsVideo: false,
    allowsPasswordProtection: false,
  },
  premium: {
    id: 'premium',
    priceCents: 1995,
    maxMediaCount: PREMIUM_IMAGE_LIMIT,
    maxVideoCount: 0,
    supportsVideo: false,
    allowsPasswordProtection: true,
  },
  platinum: {
    id: 'platinum',
    priceCents: 2995,
    maxMediaCount: PLATINUM_MEDIA_LIMIT,
    maxVideoCount: PLATINUM_VIDEO_LIMIT,
    supportsVideo: true,
    allowsPasswordProtection: true,
  },
}

const BILLING_PLAN_PRIORITY: Record<BillingPlanId, number> = {
  base: 0,
  premium: 1,
  platinum: 2,
}

const resolveVisibilityRequiredPlanId = (
  visibility: BillingVisibility | null | undefined
): BillingPlanId => {
  return visibility === 'public_password' ? 'premium' : 'base'
}

const maxRequiredPlanId = (
  left: BillingPlanId,
  right: BillingPlanId
): BillingPlanId => {
  return BILLING_PLAN_PRIORITY[left] >= BILLING_PLAN_PRIORITY[right]
    ? left
    : right
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

  if (summary.videoCount > PLATINUM_VIDEO_LIMIT) {
    return 'video_count_exceeded'
  }

  if (summary.totalMediaCount > PLATINUM_MEDIA_LIMIT) {
    return 'media_limit_exceeded'
  }

  return null
}

export const resolveRequiredBillingPlanId = (
  summary: ListMediaUsageSummary,
  options?: {
    visibility?: BillingVisibility | null
  }
): BillingPlanId | null => {
  if (getMediaUsageIssue(summary)) {
    return null
  }

  const mediaRequiredPlanId = summary.containsVideo
    ? 'platinum'
    : summary.totalMediaCount <= BASE_IMAGE_LIMIT
      ? 'base'
      : summary.totalMediaCount <= PREMIUM_IMAGE_LIMIT
        ? 'premium'
        : 'platinum'

  return maxRequiredPlanId(
    mediaRequiredPlanId,
    resolveVisibilityRequiredPlanId(options?.visibility)
  )
}

export const isVisibilityAllowedForPlan = (
  planId: BillingPlanId | null,
  visibility: BillingVisibility | null | undefined
) => {
  if (visibility !== 'public_password') {
    return true
  }

  if (!planId) {
    return false
  }

  return BILLING_PLAN_DEFINITIONS[planId].allowsPasswordProtection
}

export const isBillingPlanEligible = (
  planId: BillingPlanId,
  summary: ListMediaUsageSummary,
  options?: {
    visibility?: BillingVisibility | null
  }
) => {
  const issue = getMediaUsageIssue(summary)
  if (issue) {
    return false
  }

  const plan = BILLING_PLAN_DEFINITIONS[planId]
  if (!plan.supportsVideo && summary.containsVideo) {
    return false
  }

  if (summary.totalMediaCount > plan.maxMediaCount) {
    return false
  }

  if (summary.videoCount > plan.maxVideoCount) {
    return false
  }

  if (!isVisibilityAllowedForPlan(planId, options?.visibility)) {
    return false
  }

  return true
}

export const calculateListMediaUsageSummary = (
  entries: PersistedMediaMetadata[]
): ListMediaUsageSummary => {
  return entries.reduce<ListMediaUsageSummary>((summary, entry) => {
    const mediaType = entry.mediaType

    if (!mediaType) {
      return summary
    }

    const sizeBytes = normalizeByteValue(entry.mediaSizeBytes)
    summary.totalMediaCount += 1
    summary.totalBytes += sizeBytes

    if (mediaType.startsWith('video/')) {
      summary.videoBytes += sizeBytes
      summary.containsVideo = true
      summary.videoCount += 1
      summary.maxVideoDurationSeconds = Math.max(
        summary.maxVideoDurationSeconds,
        normalizeDurationValue(entry.mediaDurationSeconds)
      )
      return summary
    }

    if (mediaType.startsWith('image/')) {
      summary.imageBytes += sizeBytes
      summary.imageCount += 1
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
