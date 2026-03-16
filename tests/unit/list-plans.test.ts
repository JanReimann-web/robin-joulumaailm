import {
  calculateListMediaUsageSummary,
  getMediaUsageIssue,
  isBillingPlanEligible,
  resolveRequiredBillingPlanId,
} from '@/lib/lists/plans'

const createImageEntry = () => ({
  mediaType: 'image/webp',
  mediaSizeBytes: 120_000,
  mediaDurationSeconds: null,
})

const createVideoEntry = (durationSeconds = 30) => ({
  mediaType: 'video/mp4',
  mediaSizeBytes: 1_500_000,
  mediaDurationSeconds: durationSeconds,
})

describe('list billing plan helpers', () => {
  it('counts media files and videos even when billing is no longer MB-driven', () => {
    const summary = calculateListMediaUsageSummary([
      createImageEntry(),
      createImageEntry(),
      createVideoEntry(),
    ])

    expect(summary.totalMediaCount).toBe(3)
    expect(summary.imageCount).toBe(2)
    expect(summary.videoCount).toBe(1)
    expect(summary.containsVideo).toBe(true)
  })

  it('resolves required plan by media file counts', () => {
    expect(
      resolveRequiredBillingPlanId(
        calculateListMediaUsageSummary(Array.from({ length: 25 }, createImageEntry))
      )
    ).toBe('base')

    expect(
      resolveRequiredBillingPlanId(
        calculateListMediaUsageSummary(Array.from({ length: 26 }, createImageEntry))
      )
    ).toBe('premium')

    expect(
      resolveRequiredBillingPlanId(
        calculateListMediaUsageSummary(Array.from({ length: 51 }, createImageEntry))
      )
    ).toBe('platinum')
  })

  it('requires at least premium for password-protected public visibility', () => {
    const summary = calculateListMediaUsageSummary(Array.from({ length: 5 }, createImageEntry))

    expect(resolveRequiredBillingPlanId(summary, { visibility: 'public_password' })).toBe('premium')
    expect(isBillingPlanEligible('base', summary, { visibility: 'public_password' })).toBe(false)
    expect(isBillingPlanEligible('premium', summary, { visibility: 'public_password' })).toBe(true)
  })

  it('requires platinum for any video and enforces the 20 video limit', () => {
    const oneVideoSummary = calculateListMediaUsageSummary([
      ...Array.from({ length: 10 }, createImageEntry),
      createVideoEntry(),
    ])

    expect(resolveRequiredBillingPlanId(oneVideoSummary)).toBe('platinum')
    expect(isBillingPlanEligible('premium', oneVideoSummary)).toBe(false)
    expect(isBillingPlanEligible('platinum', oneVideoSummary)).toBe(true)

    const tooManyVideosSummary = calculateListMediaUsageSummary(
      Array.from({ length: 21 }, () => createVideoEntry())
    )

    expect(getMediaUsageIssue(tooManyVideosSummary)).toBe('video_count_exceeded')
  })

  it('rejects media sets that exceed the platinum file count or max video duration', () => {
    const tooManyFilesSummary = calculateListMediaUsageSummary(
      Array.from({ length: 201 }, createImageEntry)
    )
    const tooLongVideoSummary = calculateListMediaUsageSummary([createVideoEntry(61)])

    expect(getMediaUsageIssue(tooManyFilesSummary)).toBe('media_limit_exceeded')
    expect(resolveRequiredBillingPlanId(tooManyFilesSummary)).toBeNull()
    expect(getMediaUsageIssue(tooLongVideoSummary)).toBe('video_duration_exceeded')
  })
})
