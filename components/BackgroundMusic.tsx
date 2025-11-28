'use client'

import { useState, useRef, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

const DEFAULT_MUSIC_URL = process.env.NEXT_PUBLIC_BACKGROUND_MUSIC_URL || '/audio/christmas-background.mp3'

export default function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const [remoteMusicUrl, setRemoteMusicUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastSourceRef = useRef<string | null>(null)

  const resolvedMusicUrl = remoteMusicUrl || DEFAULT_MUSIC_URL

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'site')
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      const musicUrl = snap.data()?.musicUrl as string | undefined
      setRemoteMusicUrl(musicUrl ?? null)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !resolvedMusicUrl) return
    if (lastSourceRef.current === resolvedMusicUrl) return
    lastSourceRef.current = resolvedMusicUrl

    audio.src = resolvedMusicUrl
    audio.load()

    const attemptAutoplay = async () => {
      try {
        const shouldUnmuteAfterStart = !isMuted
        audio.muted = true
        await audio.play()
        setNeedsInteraction(false)
        setTimeout(() => {
          if (audioRef.current && shouldUnmuteAfterStart) {
            audioRef.current.muted = false
          }
        }, 150)
      } catch (error) {
        console.warn('Taustamuusika autoplay ebaõnnestus, ootan kasutaja tegevust.', error)
        setNeedsInteraction(true)
      }
    }

    attemptAutoplay()
  }, [resolvedMusicUrl])

  useEffect(() => {
    if (!resolvedMusicUrl) return
    const audio = audioRef.current
    if (!audio) return

    audio.muted = isMuted
    if (isMuted) {
      audio.pause()
    } else {
      audio
        .play()
        .then(() => setNeedsInteraction(false))
        .catch(() => setNeedsInteraction(true))
    }
  }, [isMuted, resolvedMusicUrl])

  useEffect(() => {
    if (!needsInteraction || !resolvedMusicUrl) return

    const resumeOnInteraction = () => {
      if (!audioRef.current) return
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.muted = isMuted
          setNeedsInteraction(false)
        })
        .catch((error) => {
          console.warn('Kasutaja interaktsioonist hoolimata ei saanud heli käivitada:', error)
        })
    }

    document.addEventListener('pointerdown', resumeOnInteraction, { once: true })
    return () => {
      document.removeEventListener('pointerdown', resumeOnInteraction)
    }
  }, [needsInteraction, isMuted, resolvedMusicUrl])

  if (!resolvedMusicUrl) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMuted(!isMuted)}
        className="bg-joulu-red p-4 rounded-full shadow-xl hover:bg-red-700 transition-colors"
        aria-label={isMuted ? 'Lülita muusika sisse' : 'Lülita muusika välja'}
        aria-pressed={!isMuted}
      >
        {isMuted ? (
          <VolumeX size={24} className="text-white" />
        ) : (
          <Volume2 size={24} className="text-white" />
        )}
      </motion.button>

      {needsInteraction && (
        <p className="mt-2 text-xs text-white/80 text-center">
          Aktiveeri heli puudutusega
        </p>
      )}

      <audio
        ref={audioRef}
        loop
        autoPlay
        preload="auto"
        playsInline
        className="hidden"
      />
    </div>
  )
}

