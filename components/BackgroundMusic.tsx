'use client'

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SiteSettings } from '@/lib/types'

export default function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(true)
  const [musicUrl, setMusicUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      const data = snapshot.data() as SiteSettings | undefined
      setMusicUrl(data?.musicUrl ?? null)
    })

    return () => unsub()
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
      if (!isMuted && musicUrl) {
        audioRef.current.play().catch(() => {
          // Autoplay võib ebaõnnestuda, see on normaalne
        })
      }
    }
  }, [isMuted, musicUrl])

  if (!musicUrl) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur px-3 py-2 rounded-full shadow-lg">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMuted(!isMuted)}
          className="bg-joulu-red p-3 rounded-full shadow-xl hover:bg-red-700 transition-colors"
          aria-label={isMuted ? 'Lülita muusika sisse' : 'Lülita muusika välja'}
        >
          {isMuted ? (
            <VolumeX size={20} className="text-white" />
          ) : (
            <Volume2 size={20} className="text-white" />
          )}
        </motion.button>

        <a
          href={musicUrl}
          download
          className="text-white/80 hover:text-white flex items-center gap-1 text-sm"
        >
          <Download size={16} />
          Laadi alla
        </a>
      </div>

      <audio ref={audioRef} src={musicUrl} loop className="hidden" />
    </div>
  )
}

