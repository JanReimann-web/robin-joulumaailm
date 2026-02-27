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

const isSupportedMediaType = (contentType: string) => {
  return (
    contentType.startsWith('image/')
    || contentType.startsWith('video/')
    || contentType.startsWith('audio/')
  )
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

export const validateMediaFile = (file: File) => {
  if (!isSupportedMediaType(file.type)) {
    throw new MediaValidationError('unsupported_type')
  }

  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new MediaValidationError('file_too_large')
  }
}

export const uploadItemMedia = async (params: {
  listId: string
  file: File
}) => {
  validateMediaFile(params.file)

  const safeName = buildSafeFileName(params.file.name || 'media')
  const objectId = `${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const mediaPath = `lists/${params.listId}/items/${objectId}`
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

export const deleteItemMediaByPath = async (mediaPath: string | null) => {
  if (!mediaPath) {
    return
  }

  const mediaRef = ref(storage, mediaPath)
  await deleteObject(mediaRef)
}
