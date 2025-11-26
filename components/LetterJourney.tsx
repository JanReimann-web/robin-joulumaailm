'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SiteSettings } from '@/lib/types'

export default function LetterJourney() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      const data = snapshot.data() as SiteSettings | undefined
      setVideoUrl(data?.letterVideoUrl ?? null)
      setLoading(false)
    })

    return () => unsub()
  }, [])

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
          Vaata, kuidas Robin postitab kirja jõuluvanale
        </p>

        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-slate-800 rounded-lg p-6 sm:p-8 border-4 border-joulu-gold"
        >
          <div className="aspect-video bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
            {loading ? (
              <div className="text-white/70 text-lg">Laen videot...</div>
            ) : videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-cover"
                poster="/images/Ratas.jpg"
              />
            ) : (
              <div className="text-white/80">
                <p className="text-2xl mb-2">🎬</p>
                <p>Lisa admin vaates video, et näidata Robini kirja postitamist.</p>
              </div>
            )}
          </div>

          <p className="text-white/80">
            Video jutustab loo, kuidas Robin kirjutab südantsoojendava kirja ja
            saadab selle päkapikkude kaudu põhjapõtradele.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

