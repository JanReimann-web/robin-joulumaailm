'use client'

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { storage } from '@/lib/firebase'

const MAX_MEDIA_SIZE_MB = 30
const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024

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

export class MediaValidationError extends Error {
  code: 'unsupported_type' | 'file_too_large'

  constructor(code: 'unsupported_type' | 'file_too_large') {
    super(code)
    this.code = code
  }
}

export const validateMediaFile = (
  file: File,
  allowedPrefixes: AllowedMediaPrefix[] = DEFAULT_ALLOWED_PREFIXES
) => {
  if (!isSupportedMediaType(file.type, allowedPrefixes)) {
    throw new MediaValidationError('unsupported_type')
  }

  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new MediaValidationError('file_too_large')
  }
}

type UploadListMediaParams = {
  listId: string
  sectionPath: string
  file: File
  allowedPrefixes?: AllowedMediaPrefix[]
}

const uploadListMedia = async (params: UploadListMediaParams) => {
  validateMediaFile(params.file, params.allowedPrefixes ?? DEFAULT_ALLOWED_PREFIXES)

  const safeName = buildSafeFileName(params.file.name || 'media')
  const objectId = `${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const mediaPath = `lists/${params.listId}/${params.sectionPath}/${objectId}`
  const mediaRef = ref(storage, mediaPath)

  await uploadBytes(mediaRef, params.file, {
    contentType: params.file.type,
  })

  const mediaUrl = await getDownloadURL(mediaRef)

  return {
    url: mediaUrl,
    path: mediaPath,
    type: params.file.type,
  }
}

export const uploadItemMedia = async (params: {
  listId: string
  file: File
}) => {
  return uploadListMedia({
    listId: params.listId,
    sectionPath: 'items',
    file: params.file,
    allowedPrefixes: ['image/', 'video/', 'audio/'],
  })
}

export const uploadStoryMedia = async (params: {
  listId: string
  file: File
}) => {
  return uploadListMedia({
    listId: params.listId,
    sectionPath: 'stories',
    file: params.file,
    allowedPrefixes: ['image/', 'video/'],
  })
}

export const uploadWheelAnswerAudio = async (params: {
  listId: string
  file: File
}) => {
  return uploadListMedia({
    listId: params.listId,
    sectionPath: 'wheel',
    file: params.file,
    allowedPrefixes: ['audio/'],
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
