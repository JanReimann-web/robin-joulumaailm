'use client'

import { FirebaseError } from 'firebase/app'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { auth, storage } from '@/lib/firebase'
import {
  MAX_VIDEO_DURATION_SECONDS,
  UploadMediaMetadata,
} from '@/lib/lists/plans'

const MAX_IMAGE_UPLOAD_SIZE_MB = 30
const MAX_VIDEO_UPLOAD_SIZE_MB = 250
const MAX_AUDIO_UPLOAD_SIZE_MB = 30
const MAX_IMAGE_UPLOAD_SIZE_BYTES = MAX_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024
const MAX_VIDEO_UPLOAD_SIZE_BYTES = MAX_VIDEO_UPLOAD_SIZE_MB * 1024 * 1024
const MAX_AUDIO_UPLOAD_SIZE_BYTES = MAX_AUDIO_UPLOAD_SIZE_MB * 1024 * 1024
const MAX_IMAGE_DIMENSION = 2200
const COMPRESSED_IMAGE_QUALITY = 0.82
const COMPRESSED_IMAGE_TYPE = 'image/webp'

type AllowedMediaPrefix = 'image/' | 'video/' | 'audio/'

const DEFAULT_ALLOWED_PREFIXES: AllowedMediaPrefix[] = [
  'image/',
  'video/',
  'audio/',
]

const isSupportedMediaType = (
  contentType: string,
  allowedPrefixes: AllowedMediaPrefix[] = DEFAULT_ALLOWED_PREFIXES
) => {
  return allowedPrefixes.some((prefix) => contentType.startsWith(prefix))
}

const buildSafeFileName = (rawName: string) => {
  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

const replaceFileExtension = (fileName: string, extension: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, '')
  return `${baseName}.${extension}`
}

const resolveFileSizeLimit = (contentType: string) => {
  if (contentType.startsWith('video/')) {
    return MAX_VIDEO_UPLOAD_SIZE_BYTES
  }

  if (contentType.startsWith('audio/')) {
    return MAX_AUDIO_UPLOAD_SIZE_BYTES
  }

  return MAX_IMAGE_UPLOAD_SIZE_BYTES
}

const loadImageElement = (file: File) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('image_decode_failed'))
    }

    image.src = objectUrl
  })
}

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
) => {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

const compressImageFile = async (file: File) => {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  const image = await loadImageElement(file)
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longestSide > MAX_IMAGE_DIMENSION
    ? MAX_IMAGE_DIMENSION / longestSide
    : 1

  const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale))
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    return file
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const compressedBlob = await canvasToBlob(
    canvas,
    COMPRESSED_IMAGE_TYPE,
    COMPRESSED_IMAGE_QUALITY
  )

  if (!compressedBlob) {
    return file
  }

  if (compressedBlob.size >= file.size && scale === 1) {
    return file
  }

  const nextFileName = replaceFileExtension(file.name || 'image', 'webp')

  return new File([compressedBlob], nextFileName, {
    type: COMPRESSED_IMAGE_TYPE,
    lastModified: Date.now(),
  })
}

const getVideoDurationSeconds = (file: File) => {
  return new Promise<number>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration)
        ? Math.ceil(video.duration)
        : 0
      cleanup()
      resolve(duration)
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('video_metadata_failed'))
    }

    video.src = objectUrl
  })
}

export class MediaValidationError extends Error {
  code:
    | 'unsupported_type'
    | 'file_too_large'
    | 'video_too_long'

  constructor(code: 'unsupported_type' | 'file_too_large' | 'video_too_long') {
    super(code)
    this.code = code
  }
}

export class MediaProcessingError extends Error {
  code:
    | 'missing_auth'
    | 'invalid_auth'
    | 'video_processing_failed'
    | 'video_processing_timeout'
    | 'video_queue_full'
    | 'video_processing_unavailable'
    | 'video_probe_failed'
    | 'invalid_source'
    | 'invalid_section'
  details: string | null

  constructor(
    code:
      | 'missing_auth'
      | 'invalid_auth'
      | 'video_processing_failed'
      | 'video_processing_timeout'
      | 'video_queue_full'
      | 'video_processing_unavailable'
      | 'video_probe_failed'
      | 'invalid_source'
      | 'invalid_section',
    details?: string | null
  ) {
    super(details?.trim() || code)
    this.code = code
    this.details = details?.trim() ? details.trim() : null
  }
}

export const validateMediaFile = async (
  file: File,
  allowedPrefixes: AllowedMediaPrefix[] = DEFAULT_ALLOWED_PREFIXES
) => {
  if (!isSupportedMediaType(file.type, allowedPrefixes)) {
    throw new MediaValidationError('unsupported_type')
  }

  if (file.size > resolveFileSizeLimit(file.type)) {
    throw new MediaValidationError('file_too_large')
  }

  if (file.type.startsWith('video/')) {
    const durationSeconds = await getVideoDurationSeconds(file)
    if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      throw new MediaValidationError('video_too_long')
    }
  }
}

type PreparedUploadMedia = {
  file: File
  durationSeconds: number | null
}

const prepareUploadMedia = async (
  file: File,
  allowedPrefixes: AllowedMediaPrefix[]
): Promise<PreparedUploadMedia> => {
  await validateMediaFile(file, allowedPrefixes)

  if (file.type.startsWith('image/')) {
    const compressedFile = await compressImageFile(file)
    if (compressedFile.size > resolveFileSizeLimit(compressedFile.type)) {
      throw new MediaValidationError('file_too_large')
    }

    return {
      file: compressedFile,
      durationSeconds: null,
    }
  }

  if (file.type.startsWith('video/')) {
    const durationSeconds = await getVideoDurationSeconds(file)
    if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      throw new MediaValidationError('video_too_long')
    }

    return {
      file,
      durationSeconds,
    }
  }

  return {
    file,
    durationSeconds: null,
  }
}

type UploadListMediaParams = {
  listId: string
  ownerId?: string
  sectionPath: string
  file: File
  allowedPrefixes?: AllowedMediaPrefix[]
}

type ProcessVideoErrorPayload = {
  error?: string
  details?: string | null
}

type QueuedVideoJobPayload = {
  jobId?: string
  status?: 'queued'
}

type VideoJobStatusPayload =
  | {
      jobId?: string
      status?: 'queued' | 'processing'
    }
  | {
      jobId?: string
      status?: 'completed'
      media?: UploadMediaMetadata
    }
  | {
      jobId?: string
      status?: 'failed'
      error?: string
      details?: string | null
    }

const normalizeProcessingErrorDetails = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.replace(/\s+/g, ' ').trim().slice(0, 500)
  return normalized.length > 0 ? normalized : null
}

const createObjectId = (safeName: string) => {
  const randomPart = (
    typeof globalThis.crypto !== 'undefined'
    && typeof globalThis.crypto.randomUUID === 'function'
  )
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2)

  return `${Date.now()}-${randomPart}-${safeName}`
}

const resolveOwnerId = (ownerId?: string) => {
  const normalizedOwnerId = ownerId?.trim()
  if (normalizedOwnerId) {
    return normalizedOwnerId
  }

  const authOwnerId = auth.currentUser?.uid?.trim()
  if (authOwnerId) {
    return authOwnerId
  }

  return null
}

const delay = (ms: number) => {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

const kickQueuedVideoJob = async (params: {
  jobId: string
  idToken: string
}) => {
  await fetch('/api/lists/media/process-video/run', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${params.idToken}`,
    },
    body: JSON.stringify({
      jobId: params.jobId,
    }),
    keepalive: true,
  }).catch(() => undefined)
}

const pollQueuedVideoJob = async (params: {
  jobId: string
  idToken: string
}) => {
  const startedAtMs = Date.now()
  let pollAttempt = 0

  while ((Date.now() - startedAtMs) < (1000 * 60 * 4)) {
    pollAttempt += 1

    if (pollAttempt === 1 || pollAttempt % 4 === 0) {
      void kickQueuedVideoJob({
        jobId: params.jobId,
        idToken: params.idToken,
      })
    }

    await delay(pollAttempt === 1 ? 1_000 : 2_000)

    const response = await fetch(
      `/api/lists/media/process-video/${encodeURIComponent(params.jobId)}`,
      {
        headers: {
          authorization: `Bearer ${params.idToken}`,
        },
      }
    )

    const payload = await response
      .json()
      .catch(() => ({ error: 'video_processing_failed' })) as
      | VideoJobStatusPayload
      | ProcessVideoErrorPayload

    if (!response.ok) {
      const errorCode = 'error' in payload ? payload.error : undefined
      const details = normalizeProcessingErrorDetails(
        'details' in payload ? payload.details : null
      )

      if (response.status === 401 && errorCode === 'missing_auth') {
        throw new MediaProcessingError('missing_auth', details)
      }

      if (response.status === 401 && errorCode === 'invalid_auth') {
        throw new MediaProcessingError('invalid_auth', details)
      }

      throw new MediaProcessingError('video_processing_failed', details)
    }

    if ('status' in payload && payload.status === 'completed' && payload.media) {
      return payload.media
    }

    if ('status' in payload && payload.status === 'failed') {
      const details = normalizeProcessingErrorDetails(payload.details)

      if (payload.error === 'video_too_long') {
        throw new MediaValidationError('video_too_long')
      }

      if (payload.error === 'video_processing_unavailable') {
        throw new MediaProcessingError('video_processing_unavailable', details)
      }

      if (payload.error === 'video_probe_failed') {
        throw new MediaProcessingError('video_probe_failed', details)
      }

      if (payload.error === 'invalid_section') {
        throw new MediaProcessingError('invalid_section', details)
      }

      if (payload.error === 'invalid_source') {
        throw new MediaProcessingError('invalid_source', details)
      }

      if (payload.error === 'video_queue_full') {
        throw new MediaProcessingError('video_queue_full', details)
      }

      throw new MediaProcessingError(
        payload.error === 'video_processing_timeout'
          ? 'video_processing_timeout'
          : 'video_processing_failed',
        details
      )
    }
  }

  throw new MediaProcessingError(
    'video_processing_timeout',
    'Video processing timed out while waiting for the worker to finish.'
  )
}

const processUploadedVideo = async (params: UploadListMediaParams) => {
  const prepared = await prepareUploadMedia(params.file, ['video/'])
  const safeName = buildSafeFileName(prepared.file.name || 'video')
  const objectId = createObjectId(safeName)
  const ownerId = resolveOwnerId(params.ownerId)
  if (!ownerId) {
    throw new MediaProcessingError('missing_auth')
  }

  const incomingPath = `users/${ownerId}/lists/${params.listId}/_incoming/${params.sectionPath}/${objectId}`
  const incomingRef = ref(storage, incomingPath)

  await uploadBytes(incomingRef, prepared.file, {
    contentType: prepared.file.type,
    customMetadata: {
      sizeBytes: String(prepared.file.size),
      ...(prepared.durationSeconds
        ? { durationSeconds: String(prepared.durationSeconds) }
        : {}),
      processingState: 'incoming',
    },
  })

  let isJobQueued = false

  try {
    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) {
      throw new MediaProcessingError('missing_auth')
    }

    const response = await fetch('/api/lists/media/process-video', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        listId: params.listId,
        sectionPath: params.sectionPath,
        incomingPath,
      }),
    })

    const payload = await response
      .json()
      .catch(() => ({ error: 'video_processing_failed' })) as
      | QueuedVideoJobPayload
      | ProcessVideoErrorPayload

    if (!response.ok) {
      if (payload && 'error' in payload) {
        const details = normalizeProcessingErrorDetails(payload.details)

        if (payload.error === 'video_too_long') {
          throw new MediaValidationError('video_too_long')
        }

        if (payload.error === 'missing_auth') {
          throw new MediaProcessingError('missing_auth', details)
        }

        if (payload.error === 'invalid_auth') {
          throw new MediaProcessingError('invalid_auth', details)
        }

        if (payload.error === 'video_processing_unavailable') {
          throw new MediaProcessingError('video_processing_unavailable', details)
        }

        if (payload.error === 'video_queue_full') {
          throw new MediaProcessingError('video_queue_full', details)
        }

        if (payload.error === 'video_probe_failed') {
          throw new MediaProcessingError('video_probe_failed', details)
        }

        if (payload.error === 'invalid_section') {
          throw new MediaProcessingError('invalid_section', details)
        }

        if (payload.error === 'invalid_source') {
          throw new MediaProcessingError('invalid_source', details)
        }

        if (payload.error === 'video_processing_failed') {
          throw new MediaProcessingError('video_processing_failed', details)
        }
      }

      throw new MediaProcessingError('video_processing_failed')
    }

    if (!('status' in payload) || payload.status !== 'queued' || !payload.jobId) {
      throw new MediaProcessingError('video_processing_failed')
    }

    isJobQueued = true

    return await pollQueuedVideoJob({
      jobId: payload.jobId,
      idToken,
    })
  } catch (error) {
    if (!isJobQueued) {
      await deleteObject(incomingRef).catch(() => undefined)
    }
    throw error
  }
}

const uploadListMedia = async (
  params: UploadListMediaParams
): Promise<UploadMediaMetadata> => {
  const allowedPrefixes = params.allowedPrefixes ?? DEFAULT_ALLOWED_PREFIXES
  if (!isSupportedMediaType(params.file.type, allowedPrefixes)) {
    throw new MediaValidationError('unsupported_type')
  }

  if (params.file.type.startsWith('video/')) {
    return processUploadedVideo(params)
  }

  const prepared = await prepareUploadMedia(params.file, allowedPrefixes)
  const safeName = buildSafeFileName(prepared.file.name || 'media')
  const objectId = createObjectId(safeName)
  const ownerId = resolveOwnerId(params.ownerId)
  const mediaRootPath = ownerId
    ? `users/${ownerId}/lists/${params.listId}`
    : `lists/${params.listId}`
  const mediaPath = `${mediaRootPath}/${params.sectionPath}/${objectId}`
  const mediaRef = ref(storage, mediaPath)

  await uploadBytes(mediaRef, prepared.file, {
    contentType: prepared.file.type,
    customMetadata: {
      sizeBytes: String(prepared.file.size),
      ...(prepared.durationSeconds
        ? { durationSeconds: String(prepared.durationSeconds) }
        : {}),
    },
  })

  const mediaUrl = await getDownloadURL(mediaRef)

  return {
    url: mediaUrl,
    path: mediaPath,
    type: prepared.file.type,
    sizeBytes: prepared.file.size,
    durationSeconds: prepared.durationSeconds,
  }
}

export const uploadItemMedia = async (params: {
  listId: string
  ownerId?: string
  file: File
}) => {
  return uploadListMedia({
    listId: params.listId,
    ownerId: params.ownerId,
    sectionPath: 'items',
    file: params.file,
    allowedPrefixes: ['image/', 'video/'],
  })
}

export const uploadStoryMedia = async (params: {
  listId: string
  ownerId?: string
  file: File
}) => {
  return uploadListMedia({
    listId: params.listId,
    ownerId: params.ownerId,
    sectionPath: 'stories',
    file: params.file,
    allowedPrefixes: ['image/', 'video/'],
  })
}

export const uploadWheelAnswerAudio = async (params: {
  listId: string
  ownerId?: string
  file: File
}) => {
  return uploadListMedia({
    listId: params.listId,
    ownerId: params.ownerId,
    sectionPath: 'wheel',
    file: params.file,
    allowedPrefixes: ['audio/'],
  })
}

export const uploadListIntroMedia = async (params: {
  listId: string
  ownerId?: string
  file: File
}) => {
  return uploadListMedia({
    listId: params.listId,
    ownerId: params.ownerId,
    sectionPath: 'intro',
    file: params.file,
    allowedPrefixes: ['image/', 'video/'],
  })
}

export const deleteMediaByPath = async (mediaPath: string | null) => {
  if (!mediaPath) {
    return
  }

  const mediaRef = ref(storage, mediaPath)
  try {
    await deleteObject(mediaRef)
  } catch (rawError) {
    if (
      rawError instanceof FirebaseError
      && rawError.code === 'storage/object-not-found'
    ) {
      return
    }

    throw rawError
  }
}

export const deleteItemMediaByPath = deleteMediaByPath
