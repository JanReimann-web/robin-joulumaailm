'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function GiftProgress() {
  const [progress, setProgress] = useState(0)
  const [totalGifts, setTotalGifts] = useState(0)
  const [giftedCount, setGiftedCount] = useState(0)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'gifts'), (snapshot) => {
      const total = snapshot.size
      const gifted = snapshot.docs.filter(
        doc => doc.data().status === 'gifted' || doc.data().status === 'taken'
      ).length

      setTotalGifts(total)
      setGiftedCount(gifted)
      setProgress(total > 0 ? (gifted / total) * 100 : 0)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="py-8 px-4 bg-gradient-to-r from-green-900 to-green-800">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-4 text-joulu-gold">
          Kingipakid liiguvad põhjapõtrade juurde 🎅
        </h3>

        <div className="relative">
          {/* Progress bar */}
          <div className="h-12 bg-slate-700 rounded-full overflow-hidden border-4 border-joulu-gold relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-joulu-red to-joulu-gold relative overflow-hidden"
            >
              {/* Animated gifts */}
              {Array.from({ length: Math.floor(giftedCount / 2) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -50 }}
                  animate={{ x: '100%' }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                  className="absolute top-1/2 -translate-y-1/2 text-2xl"
                >
                  🎁
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-4 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <span>📦</span>
              <span>0 kingitust</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-joulu-gold">
                {Math.round(progress)}%
              </div>
              <div className="text-xs">
                {giftedCount} / {totalGifts} kingitust
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>🎅</span>
              <span>Põhjapõtra</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

