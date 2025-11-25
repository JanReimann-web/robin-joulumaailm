'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  // TODO: Lisa tegelik muusika fail
  // const musicUrl = '/music/christmas-background.mp3'

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
      if (!isMuted) {
        audioRef.current.play().catch(() => {
          // Autoplay võib ebaõnnestuda, see on normaalne
        })
      }
    }
  }, [isMuted])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMuted(!isMuted)}
        className="bg-joulu-red p-4 rounded-full shadow-xl hover:bg-red-700 transition-colors"
        aria-label={isMuted ? 'Lülita muusika sisse' : 'Lülita muusika välja'}
      >
        {isMuted ? (
          <VolumeX size={24} className="text-white" />
        ) : (
          <Volume2 size={24} className="text-white" />
        )}
      </motion.button>

      {/* Audio element - kommenteeri välja kui pole muusikat */}
      {/* {musicUrl && (
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          className="hidden"
        />
      )} */}
    </div>
  )
}

