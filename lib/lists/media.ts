'use client'

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

const uploadListMedia = async (
  params: UploadListMediaParams
): Promise<UploadMediaMetadata> => {
  const allowedPrefixes = params.allowedPrefixes ?? DEFAULT_ALLOWED_PREFIXES
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
  await deleteObject(mediaRef)
}

export const deleteItemMediaByPath = deleteMediaByPath
