'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

const MUSIC_URL = process.env.NEXT_PUBLIC_BACKGROUND_MUSIC_URL || '/audio/christmas-background.mp3'

export default function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const attemptAutoplay = async () => {
      try {
        const shouldUnmuteAfterStart = !isMuted
        audio.muted = true
        await audio.play()
        setTimeout(() => {
          if (audioRef.current && shouldUnmuteAfterStart) {
            audioRef.current.muted = false
          }
        }, 200)
      } catch (error) {
        console.warn('Taustamuusika autoplay ebaõnnestus, ootan kasutaja tegevust.', error)
        setNeedsInteraction(true)
      }
    }

    attemptAutoplay()
  }, []) // run once on mount

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = isMuted
    if (isMuted) {
      audio.pause()
    } else {
      audio.play().catch(() => setNeedsInteraction(true))
    }
  }, [isMuted])

  useEffect(() => {
    if (!needsInteraction) return

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
  }, [needsInteraction, isMuted])

  if (!MUSIC_URL) {
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
        src={MUSIC_URL}
        loop
        autoPlay
        preload="auto"
        className="hidden"
      />
    </div>
  )
}

