'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

const MUSIC_URL = process.env.NEXT_PUBLIC_BACKGROUND_MUSIC_URL || '/audio/christmas-background.mp3'

export default function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const playAudio = useCallback(async () => {
    if (!audioRef.current) return
    try {
      await audioRef.current.play()
    } catch (error) {
      console.warn('Taustamuusika autoplay ebaõnnestus, ootan kasutaja tegevust.', error)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
      if (isMuted) {
        audioRef.current.pause()
      } else {
        playAudio()
      }
    }
  }, [isMuted, playAudio])

  useEffect(() => {
    if (isMuted) {
      return
    }

    const resumeOnInteraction = () => {
      playAudio()
    }

    document.addEventListener('pointerdown', resumeOnInteraction, { once: true })
    return () => {
      document.removeEventListener('pointerdown', resumeOnInteraction)
    }
  }, [isMuted, playAudio])

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

