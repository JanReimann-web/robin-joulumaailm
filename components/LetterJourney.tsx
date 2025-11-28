'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const FALLBACK_VIDEO = '/videos/Muumi.mp4'

export default function LetterJourney() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoFileName, setVideoFileName] = useState<string | null>(null)

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'site')
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      const data = snap.data()
      setVideoUrl(data?.letterVideoUrl ?? null)
      setVideoFileName(data?.letterVideoFileName ?? null)
    })
    return () => unsubscribe()
  }, [])

  const resolvedVideoUrl = videoUrl || FALLBACK_VIDEO
  const isCustomVideo = Boolean(videoUrl)

  return (
    <div className="py-12 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="text-4xl font-bold mb-4 text-joulu-gold">
          📮 Robini kirja teekond
        </h2>
        <p className="text-white/80 mb-8">
          Vaata, kuidas Robin kirja postitab ja see liigub põhjapõtrade juurde
        </p>

        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-slate-800 rounded-lg p-4 sm:p-8 border-4 border-joulu-gold mb-6"
        >
          <div className="aspect-video bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg overflow-hidden mb-4">
            <video
              src={resolvedVideoUrl}
              controls
              playsInline
              className="w-full h-full object-cover"
              poster="/images/Joulud.jpg"
            >
              Teie brauser ei toeta video elementi.
            </video>
          </div>

          <p className="text-white/80">
            {isCustomVideo
              ? 'Viimati lisatud video admin-lehelt.'
              : 'Hetkel kasutame vaikimisi videot, kuni admin lisab oma klipi.'}
          </p>
          {videoFileName && (
            <p className="text-white/60 text-sm mt-1">Fail: {videoFileName}</p>
          )}
          <p className="text-white/60 text-sm mt-3">
            Kui soovid näha uut klippi, laadi see admin-lehe seadetest üles ja see uuendub siin automaatselt.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

