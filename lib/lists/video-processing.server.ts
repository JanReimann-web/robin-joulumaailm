import 'server-only'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { tmpdir } from 'node:os'
import ffmpegPath from 'ffmpeg-static'
import { adminStorage } from '@/lib/firebase/admin'
import {
  MAX_VIDEO_DURATION_SECONDS,
  UploadMediaMetadata,
} from '@/lib/lists/plans'

export const PROCESSABLE_VIDEO_SECTION_PATHS = [
  'intro',
  'items',
  'stories',
] as const

export type ProcessableVideoSectionPath =
  (typeof PROCESSABLE_VIDEO_SECTION_PATHS)[number]

const TARGET_VIDEO_CONTENT_TYPE = 'video/mp4'
const TARGET_VIDEO_EXTENSION = 'mp4'
const TARGET_VIDEO_WIDTH = 1280
const TARGET_VIDEO_HEIGHT = 720
const TARGET_VIDEO_BITRATE = '2200k'
const TARGET_VIDEO_MAXRATE = '2500k'
const TARGET_VIDEO_BUFSIZE = '5000k'
const TARGET_AUDIO_BITRATE = '128k'
const MAX_STDERR_LENGTH = 12_000
const TARGET_VIDEO_FILTER = [
  `scale=w=${TARGET_VIDEO_WIDTH}:h=${TARGET_VIDEO_HEIGHT}:force_original_aspect_ratio=decrease`,
  'pad=width=ceil(iw/2)*2:height=ceil(ih/2)*2:x=(ow-iw)/2:y=(oh-ih)/2:color=black',
  'setsar=1',
].join(',')

type VideoProcessingErrorCode =
  | 'invalid_section'
  | 'invalid_source'
  | 'video_probe_failed'
  | 'video_too_long'
  | 'video_processing_failed'
  | 'video_processing_unavailable'

export class VideoProcessingError extends Error {
  code: VideoProcessingErrorCode

  constructor(code: VideoProcessingErrorCode) {
    super(code)
    this.code = code
  }
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

const createFirebaseDownloadUrl = (
  bucketName: string,
  objectPath: string,
  token: string
) => {
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`
}

const captureProcessError = (stderr: string, fallbackCode: VideoProcessingErrorCode) => {
  const trimmed = stderr.trim()
  if (!trimmed) {
    return new VideoProcessingError(fallbackCode)
  }

  const error = new VideoProcessingError(fallbackCode)
  error.cause = trimmed
  return error
}

const parseDurationSeconds = (value: unknown) => {
  const durationSeconds = Math.ceil(Number(value))
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return null
  }

  return durationSeconds
}

const parseFfmpegDurationSeconds = (output: string) => {
  const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i)
  if (!durationMatch) {
    return null
  }

  const hours = Number(durationMatch[1])
  const minutes = Number(durationMatch[2])
  const seconds = Number(durationMatch[3])
  const totalSeconds = Math.ceil((hours * 60 * 60) + (minutes * 60) + seconds)

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return null
  }

  return totalSeconds
}

const appendLimitedOutput = (current: string, chunk: string) => {
  const next = current + chunk
  if (next.length <= MAX_STDERR_LENGTH) {
    return next
  }

  return next.slice(-MAX_STDERR_LENGTH)
}

const runBinary = (
  executablePath: string,
  args: string[],
  options?: {
    captureStdout?: boolean
    allowNonZeroExit?: boolean
  }
) => {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const launch = async () => {
      if (process.platform !== 'win32') {
        await fs.chmod(executablePath, 0o755).catch(() => undefined)
      }

      const child = spawn(executablePath, args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (chunk) => {
        if (options?.captureStdout) {
          stdout += chunk.toString()
        }
      })

      child.stderr.on('data', (chunk) => {
        stderr = appendLimitedOutput(stderr, chunk.toString())
      })

      child.on('error', (spawnError) => {
        const error = new VideoProcessingError('video_processing_unavailable')
        error.cause = spawnError instanceof Error
          ? spawnError.message
          : String(spawnError)
        reject(error)
      })

      child.on('close', (code) => {
        if (code === 0 || options?.allowNonZeroExit) {
          resolve({ stdout, stderr })
          return
        }

        reject(captureProcessError(stderr, 'video_processing_failed'))
      })
    }

    launch().catch((launchError) => {
      const error = new VideoProcessingError('video_processing_unavailable')
      error.cause = launchError instanceof Error
        ? launchError.message
        : String(launchError)
      reject(error)
    })
  })
}

const probeVideoDurationSeconds = async (inputPath: string) => {
  if (!ffmpegPath) {
    throw new VideoProcessingError('video_processing_unavailable')
  }

  try {
    const result = await runBinary(
      ffmpegPath,
      [
        '-hide_banner',
        '-i',
        inputPath,
      ],
      {
        captureStdout: true,
        allowNonZeroExit: true,
      }
    )

    const durationSeconds = parseFfmpegDurationSeconds(`${result.stdout}\n${result.stderr}`)
    if (durationSeconds === null) {
      throw new Error('invalid_duration')
    }

    return durationSeconds
  } catch (error) {
    if (error instanceof VideoProcessingError) {
      throw error
    }

    throw new VideoProcessingError('video_probe_failed')
  }
}

const resolveVideoDurationSeconds = async (
  inputPath: string,
  fallbackDurationSeconds: number | null
) => {
  try {
    return await probeVideoDurationSeconds(inputPath)
  } catch (error) {
    if (
      fallbackDurationSeconds
      && error instanceof VideoProcessingError
      && (
        error.code === 'video_probe_failed'
        || error.code === 'video_processing_unavailable'
      )
    ) {
      return fallbackDurationSeconds
    }

    throw error
  }
}

const transcodeVideo = async (inputPath: string, outputPath: string) => {
  if (!ffmpegPath) {
    throw new VideoProcessingError('video_processing_unavailable')
  }

  await runBinary(ffmpegPath, [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-nostdin',
    '-i',
    inputPath,
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
    '-vf',
    TARGET_VIDEO_FILTER,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-level',
    '4.0',
    '-b:v',
    TARGET_VIDEO_BITRATE,
    '-maxrate',
    TARGET_VIDEO_MAXRATE,
    '-bufsize',
    TARGET_VIDEO_BUFSIZE,
    '-movflags',
    '+faststart',
    '-c:a',
    'aac',
    '-b:a',
    TARGET_AUDIO_BITRATE,
    '-ac',
    '2',
    '-ar',
    '48000',
    '-map_metadata',
    '-1',
    '-threads',
    '1',
    outputPath,
  ])
}

const deleteStorageObjectIfExists = async (objectPath: string) => {
  try {
    await adminStorage.bucket().file(objectPath).delete()
  } catch {
    return
  }
}

const isProcessableSectionPath = (
  value: string
): value is ProcessableVideoSectionPath => {
  return PROCESSABLE_VIDEO_SECTION_PATHS.includes(
    value as ProcessableVideoSectionPath
  )
}

export const processStoredVideoUpload = async (params: {
  userId: string
  listId: string
  sectionPath: string
  incomingPath: string
}) : Promise<UploadMediaMetadata> => {
  if (!isProcessableSectionPath(params.sectionPath)) {
    throw new VideoProcessingError('invalid_section')
  }

  const expectedPrefix = `users/${params.userId}/lists/${params.listId}/_incoming/${params.sectionPath}/`
  if (!params.incomingPath.startsWith(expectedPrefix)) {
    throw new VideoProcessingError('invalid_source')
  }

  const bucket = adminStorage.bucket()
  const incomingFile = bucket.file(params.incomingPath)
  const [exists] = await incomingFile.exists()
  if (!exists) {
    throw new VideoProcessingError('invalid_source')
  }

  const [incomingMetadata] = await incomingFile.getMetadata()
  const fallbackDurationSeconds = parseDurationSeconds(
    incomingMetadata.metadata?.durationSeconds
  )

  const tempDirectory = await fs.mkdtemp(join(tmpdir(), 'giftlist-video-'))
  const inputExtension = extname(params.incomingPath) || '.mp4'
  const inputPath = join(tempDirectory, `input${inputExtension}`)
  const outputPath = join(tempDirectory, `output.${TARGET_VIDEO_EXTENSION}`)

  try {
    await incomingFile.download({ destination: inputPath })

    const durationSeconds = await resolveVideoDurationSeconds(
      inputPath,
      fallbackDurationSeconds
    )
    if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      throw new VideoProcessingError('video_too_long')
    }

    await transcodeVideo(inputPath, outputPath)

    const outputDurationSeconds = await resolveVideoDurationSeconds(
      outputPath,
      fallbackDurationSeconds
    )
    if (outputDurationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      throw new VideoProcessingError('video_too_long')
    }

    const outputStats = await fs.stat(outputPath)
    const originalFileName = buildSafeFileName(
      replaceFileExtension(
        basename(params.incomingPath),
        TARGET_VIDEO_EXTENSION
      )
    )
    const finalObjectName = `${Date.now()}-${randomUUID()}-${originalFileName}`
    const finalPath = `users/${params.userId}/lists/${params.listId}/${params.sectionPath}/${finalObjectName}`
    const downloadToken = randomUUID()

    await bucket.upload(outputPath, {
      destination: finalPath,
      metadata: {
        contentType: TARGET_VIDEO_CONTENT_TYPE,
        cacheControl: 'public,max-age=31536000,immutable',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          sizeBytes: String(outputStats.size),
          durationSeconds: String(outputDurationSeconds),
          processedBy: 'server-transcode',
          sourcePath: params.incomingPath,
        },
      },
    })

    return {
      url: createFirebaseDownloadUrl(bucket.name, finalPath, downloadToken),
      path: finalPath,
      type: TARGET_VIDEO_CONTENT_TYPE,
      sizeBytes: outputStats.size,
      durationSeconds: outputDurationSeconds,
    }
  } finally {
    await deleteStorageObjectIfExists(params.incomingPath)
    await fs.rm(tempDirectory, { recursive: true, force: true }).catch(() => undefined)
  }
}
