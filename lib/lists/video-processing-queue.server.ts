import 'server-only'
import { randomUUID } from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { UploadMediaMetadata } from '@/lib/lists/plans'
import {
  assertValidProcessableVideoSource,
  ProcessableVideoSectionPath,
  processStoredVideoUpload,
  VideoProcessingError,
} from '@/lib/lists/video-processing.server'

const VIDEO_PROCESSING_JOBS_COLLECTION = 'videoProcessingJobs'
const VIDEO_PROCESSING_WORKER_LOCK_DOC = adminDb
  .collection('_system')
  .doc('video-processing-workers')

const MAX_ACTIVE_VIDEO_WORKERS = 2
const MAX_OPEN_VIDEO_JOBS_PER_OWNER = 4
const VIDEO_PROCESSING_RETRY_LIMIT = 3
const VIDEO_PROCESSING_JOB_LEASE_TTL_MS = 1000 * 60 * 5
const VIDEO_PROCESSING_JOB_RESULT_TTL_MS = 1000 * 60 * 60 * 24 * 7

export const VIDEO_PROCESSING_JOB_STATUSES = [
  'queued',
  'processing',
  'completed',
  'failed',
] as const

export type VideoProcessingJobStatus =
  (typeof VIDEO_PROCESSING_JOB_STATUSES)[number]

type VideoProcessingJobDoc = {
  ownerId?: string
  listId?: string
  sectionPath?: ProcessableVideoSectionPath
  incomingPath?: string
  status?: VideoProcessingJobStatus
  attempts?: number
  workerId?: string
  errorCode?: string
  errorDetails?: string | null
  output?: UploadMediaMetadata
  nextAttemptAt?: Timestamp | null
  processingStartedAt?: Timestamp | null
  processingLeaseExpiresAt?: Timestamp | null
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
  completedAt?: Timestamp | null
  failedAt?: Timestamp | null
  expiresAt?: Timestamp | null
}

export type VideoProcessingJobSnapshot = {
  id: string
  ownerId: string
  listId: string
  sectionPath: ProcessableVideoSectionPath
  incomingPath: string
  status: VideoProcessingJobStatus
  attempts: number
  errorCode: string | null
  errorDetails: string | null
  output: UploadMediaMetadata | null
  nextAttemptAt: number | null
  processingStartedAt: number | null
  processingLeaseExpiresAt: number | null
  createdAt: number | null
  updatedAt: number | null
  completedAt: number | null
  failedAt: number | null
}

export type VideoProcessingJobResponse =
  | {
      jobId: string
      status: 'queued' | 'processing'
    }
  | {
      jobId: string
      status: 'completed'
      media: UploadMediaMetadata
    }
  | {
      jobId: string
      status: 'failed'
      error: string
      details: string | null
    }

type ProcessVideoJobsResult = {
  ok: boolean
  busy: boolean
  claimedJobId: string | null
  processedJobs: number
}

type ClaimSpecificJobResult =
  | { kind: 'claimed'; job: VideoProcessingJobSnapshot }
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'busy' }
  | { kind: 'done'; job: VideoProcessingJobSnapshot }

const toMillis = (value: unknown) => {
  return value instanceof Timestamp
    ? value.toMillis()
    : null
}

const sanitizeErrorDetails = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)

  return normalized.length > 0 ? normalized : null
}

const mapJobDoc = (
  id: string,
  data: VideoProcessingJobDoc | undefined
): VideoProcessingJobSnapshot | null => {
  if (!data?.ownerId || !data.listId || !data.sectionPath || !data.incomingPath) {
    return null
  }

  return {
    id,
    ownerId: data.ownerId,
    listId: data.listId,
    sectionPath: data.sectionPath,
    incomingPath: data.incomingPath,
    status: data.status ?? 'queued',
    attempts: Number.isFinite(data.attempts) ? Number(data.attempts) : 0,
    errorCode: typeof data.errorCode === 'string' ? data.errorCode : null,
    errorDetails: sanitizeErrorDetails(data.errorDetails),
    output: data.output ?? null,
    nextAttemptAt: toMillis(data.nextAttemptAt),
    processingStartedAt: toMillis(data.processingStartedAt),
    processingLeaseExpiresAt: toMillis(data.processingLeaseExpiresAt),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    completedAt: toMillis(data.completedAt),
    failedAt: toMillis(data.failedAt),
  }
}

const toJobResponse = (
  job: VideoProcessingJobSnapshot
): VideoProcessingJobResponse => {
  if (job.status === 'completed' && job.output) {
    return {
      jobId: job.id,
      status: 'completed',
      media: job.output,
    }
  }

  if (job.status === 'failed') {
    return {
      jobId: job.id,
      status: 'failed',
      error: job.errorCode ?? 'video_processing_failed',
      details: job.errorDetails,
    }
  }

  return {
    jobId: job.id,
    status: job.status === 'processing' ? 'processing' : 'queued',
  }
}

const shouldRetryErrorCode = (code: string) => {
  return (
    code === 'video_processing_failed'
    || code === 'video_probe_failed'
    || code === 'video_processing_unavailable'
  )
}

const normalizeActiveLeases = (value: unknown, nowMs: number) => {
  if (!value || typeof value !== 'object') {
    return {} as Record<string, number>
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((next, [key, rawValue]) => {
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
      return next
    }

    if (rawValue <= nowMs) {
      return next
    }

    next[key] = rawValue
    return next
  }, {})
}

const acquireVideoWorkerLease = async () => {
  const workerId = randomUUID()
  const nowMs = Date.now()
  const leaseExpiresAtMs = nowMs + VIDEO_PROCESSING_JOB_LEASE_TTL_MS

  const acquiredWorkerId = await adminDb.runTransaction(async (transaction) => {
    const lockSnap = await transaction.get(VIDEO_PROCESSING_WORKER_LOCK_DOC)
    const activeLeases = normalizeActiveLeases(lockSnap.get('leases'), nowMs)

    if (Object.keys(activeLeases).length >= MAX_ACTIVE_VIDEO_WORKERS) {
      return null
    }

    activeLeases[workerId] = leaseExpiresAtMs
    transaction.set(VIDEO_PROCESSING_WORKER_LOCK_DOC, {
      leases: activeLeases,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    return workerId
  })

  return acquiredWorkerId
}

const releaseVideoWorkerLease = async (workerId: string) => {
  await adminDb.runTransaction(async (transaction) => {
    const lockSnap = await transaction.get(VIDEO_PROCESSING_WORKER_LOCK_DOC)
    if (!lockSnap.exists) {
      return
    }

    const activeLeases = normalizeActiveLeases(
      lockSnap.get('leases'),
      Date.now()
    )
    delete activeLeases[workerId]

    transaction.set(VIDEO_PROCESSING_WORKER_LOCK_DOC, {
      leases: activeLeases,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  })
}

const claimVideoJobById = async (params: {
  jobId: string
  workerId: string
  ownerId?: string
}): Promise<ClaimSpecificJobResult> => {
  const jobRef = adminDb.collection(VIDEO_PROCESSING_JOBS_COLLECTION).doc(params.jobId)
  const nowMs = Date.now()
  const leaseExpiresAt = Timestamp.fromMillis(nowMs + VIDEO_PROCESSING_JOB_LEASE_TTL_MS)

  return await adminDb.runTransaction(async (transaction) => {
    const jobSnap = await transaction.get(jobRef)
    if (!jobSnap.exists) {
      return { kind: 'not_found' }
    }

    const mappedJob = mapJobDoc(
      jobSnap.id,
      jobSnap.data() as VideoProcessingJobDoc | undefined
    )
    if (!mappedJob) {
      return { kind: 'not_found' }
    }

    if (params.ownerId && mappedJob.ownerId !== params.ownerId) {
      return { kind: 'forbidden' }
    }

    if (mappedJob.status === 'completed' || mappedJob.status === 'failed') {
      return {
        kind: 'done',
        job: mappedJob,
      }
    }

    if (
      mappedJob.status === 'processing'
      && mappedJob.processingLeaseExpiresAt
      && mappedJob.processingLeaseExpiresAt > nowMs
    ) {
      return { kind: 'busy' }
    }

    if (
      mappedJob.status === 'queued'
      && mappedJob.nextAttemptAt
      && mappedJob.nextAttemptAt > nowMs
    ) {
      return { kind: 'busy' }
    }

    const nextAttempts = mappedJob.attempts + 1

    transaction.set(jobRef, {
      status: 'processing',
      attempts: nextAttempts,
      workerId: params.workerId,
      processingStartedAt: Timestamp.fromMillis(nowMs),
      processingLeaseExpiresAt: leaseExpiresAt,
      updatedAt: FieldValue.serverTimestamp(),
      errorCode: FieldValue.delete(),
      errorDetails: FieldValue.delete(),
      failedAt: FieldValue.delete(),
      completedAt: FieldValue.delete(),
    }, { merge: true })

    return {
      kind: 'claimed',
      job: {
        ...mappedJob,
        status: 'processing',
        attempts: nextAttempts,
        errorCode: null,
        errorDetails: null,
        processingStartedAt: nowMs,
        processingLeaseExpiresAt: leaseExpiresAt.toMillis(),
      },
    }
  })
}

const findNextQueuedJob = async () => {
  const snapshot = await adminDb
    .collection(VIDEO_PROCESSING_JOBS_COLLECTION)
    .where('status', '==', 'queued')
    .limit(20)
    .get()

  const nowMs = Date.now()

  return snapshot.docs
    .map((entry) => mapJobDoc(entry.id, entry.data() as VideoProcessingJobDoc))
    .filter((entry): entry is VideoProcessingJobSnapshot => Boolean(entry))
    .filter((entry) => !entry.nextAttemptAt || entry.nextAttemptAt <= nowMs)
    .sort((left, right) => (left.createdAt ?? 0) - (right.createdAt ?? 0))
}

const findRecoverableProcessingJobs = async () => {
  const snapshot = await adminDb
    .collection(VIDEO_PROCESSING_JOBS_COLLECTION)
    .where('status', '==', 'processing')
    .limit(20)
    .get()

  const nowMs = Date.now()

  return snapshot.docs
    .map((entry) => mapJobDoc(entry.id, entry.data() as VideoProcessingJobDoc))
    .filter((entry): entry is VideoProcessingJobSnapshot => Boolean(entry))
    .filter((entry) => !entry.processingLeaseExpiresAt || entry.processingLeaseExpiresAt <= nowMs)
    .sort((left, right) => (left.processingLeaseExpiresAt ?? 0) - (right.processingLeaseExpiresAt ?? 0))
}

const claimNextAvailableVideoJob = async (workerId: string) => {
  const queuedJobs = await findNextQueuedJob()

  for (const job of queuedJobs) {
    const claimed = await claimVideoJobById({
      jobId: job.id,
      workerId,
    })
    if (claimed.kind === 'claimed') {
      return claimed.job
    }
  }

  const recoverableJobs = await findRecoverableProcessingJobs()
  for (const job of recoverableJobs) {
    const claimed = await claimVideoJobById({
      jobId: job.id,
      workerId,
    })
    if (claimed.kind === 'claimed') {
      return claimed.job
    }
  }

  return null
}

const buildJobExpiryTimestamp = () => {
  return Timestamp.fromMillis(Date.now() + VIDEO_PROCESSING_JOB_RESULT_TTL_MS)
}

const completeVideoJob = async (params: {
  jobId: string
  media: UploadMediaMetadata
}) => {
  await adminDb
    .collection(VIDEO_PROCESSING_JOBS_COLLECTION)
    .doc(params.jobId)
    .set({
      status: 'completed',
      output: params.media,
      processingLeaseExpiresAt: FieldValue.delete(),
      workerId: FieldValue.delete(),
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: buildJobExpiryTimestamp(),
    }, { merge: true })
}

const failVideoJob = async (params: {
  jobId: string
  attempts: number
  error: unknown
}) => {
  const errorCode = params.error instanceof VideoProcessingError
    ? params.error.code
    : 'video_processing_failed'
  const errorDetails = sanitizeErrorDetails(
    params.error instanceof Error
      ? String(params.error.cause ?? params.error.message)
      : null
  )

  const shouldRetry = (
    shouldRetryErrorCode(errorCode)
    && params.attempts < VIDEO_PROCESSING_RETRY_LIMIT
  )

  await adminDb
    .collection(VIDEO_PROCESSING_JOBS_COLLECTION)
    .doc(params.jobId)
    .set({
      status: shouldRetry ? 'queued' : 'failed',
      processingLeaseExpiresAt: FieldValue.delete(),
      workerId: FieldValue.delete(),
      errorCode,
      errorDetails,
      nextAttemptAt: shouldRetry
        ? Timestamp.fromMillis(
            Date.now() + (params.attempts * 15_000)
          )
        : FieldValue.delete(),
      failedAt: shouldRetry ? FieldValue.delete() : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: shouldRetry ? FieldValue.delete() : buildJobExpiryTimestamp(),
    }, { merge: true })
}

const countOpenVideoJobsForOwner = async (ownerId: string) => {
  const snapshot = await adminDb
    .collection(VIDEO_PROCESSING_JOBS_COLLECTION)
    .where('ownerId', '==', ownerId)
    .get()

  return snapshot.docs.reduce((count, entry) => {
    const status = entry.get('status')
    if (status === 'queued' || status === 'processing') {
      return count + 1
    }

    return count
  }, 0)
}

export const enqueueVideoProcessingJob = async (params: {
  ownerId: string
  listId: string
  sectionPath: string
  incomingPath: string
}) => {
  assertValidProcessableVideoSource({
    userId: params.ownerId,
    listId: params.listId,
    sectionPath: params.sectionPath,
    incomingPath: params.incomingPath,
  })

  const openJobs = await countOpenVideoJobsForOwner(params.ownerId)
  if (openJobs >= MAX_OPEN_VIDEO_JOBS_PER_OWNER) {
    throw new VideoProcessingError('video_queue_full')
  }

  const jobRef = adminDb.collection(VIDEO_PROCESSING_JOBS_COLLECTION).doc()
  await jobRef.set({
    ownerId: params.ownerId,
    listId: params.listId,
    sectionPath: params.sectionPath,
    incomingPath: params.incomingPath,
    status: 'queued',
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return {
    jobId: jobRef.id,
    status: 'queued' as const,
  }
}

export const getVideoProcessingJobForOwner = async (params: {
  jobId: string
  ownerId: string
}): Promise<VideoProcessingJobSnapshot | null> => {
  const jobSnap = await adminDb
    .collection(VIDEO_PROCESSING_JOBS_COLLECTION)
    .doc(params.jobId)
    .get()

  if (!jobSnap.exists) {
    return null
  }

  const mappedJob = mapJobDoc(
    jobSnap.id,
    jobSnap.data() as VideoProcessingJobDoc | undefined
  )
  if (!mappedJob || mappedJob.ownerId !== params.ownerId) {
    return null
  }

  return mappedJob
}

export const getVideoProcessingJobResponseForOwner = async (params: {
  jobId: string
  ownerId: string
}) => {
  const job = await getVideoProcessingJobForOwner(params)
  return job ? toJobResponse(job) : null
}

export const processQueuedVideoJobs = async (params: {
  requestedJobId?: string
  ownerId?: string
  limit?: number
}): Promise<ProcessVideoJobsResult> => {
  const workerId = await acquireVideoWorkerLease()
  if (!workerId) {
    return {
      ok: true,
      busy: true,
      claimedJobId: null,
      processedJobs: 0,
    }
  }

  let claimedJobId: string | null = null
  let processedJobs = 0

  try {
    const targetLimit = Math.max(1, params.limit ?? 1)

    for (let index = 0; index < targetLimit; index += 1) {
      let claimedJob: VideoProcessingJobSnapshot | null = null

      if (params.requestedJobId && index === 0) {
        const claimResult = await claimVideoJobById({
          jobId: params.requestedJobId,
          workerId,
          ownerId: params.ownerId,
        })

        if (claimResult.kind === 'claimed') {
          claimedJob = claimResult.job
        } else {
          return {
            ok: claimResult.kind !== 'forbidden' && claimResult.kind !== 'not_found',
            busy: claimResult.kind === 'busy',
            claimedJobId: null,
            processedJobs: 0,
          }
        }
      } else {
        claimedJob = await claimNextAvailableVideoJob(workerId)
      }

      if (!claimedJob) {
        break
      }

      claimedJobId = claimedJob.id

      try {
        const processedMedia = await processStoredVideoUpload({
          userId: claimedJob.ownerId,
          listId: claimedJob.listId,
          sectionPath: claimedJob.sectionPath,
          incomingPath: claimedJob.incomingPath,
        })

        await completeVideoJob({
          jobId: claimedJob.id,
          media: processedMedia,
        })
      } catch (error) {
        await failVideoJob({
          jobId: claimedJob.id,
          attempts: claimedJob.attempts,
          error,
        })
      }

      processedJobs += 1

      if (params.requestedJobId) {
        break
      }
    }

    return {
      ok: true,
      busy: false,
      claimedJobId,
      processedJobs,
    }
  } finally {
    await releaseVideoWorkerLease(workerId)
  }
}
