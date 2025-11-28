'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ThankYouCardProps {
  show: boolean
  onClose: () => void
  giftName?: string
}

export default function ThankYouCard({ show, onClose, giftName }: ThankYouCardProps) {
  const [confetti, setConfetti] = useState<number[]>([])

  useEffect(() => {
    if (show) {
      setConfetti(Array.from({ length: 50 }, (_, i) => i))
      const timer = setTimeout(() => {
        onClose()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        className="bg-gradient-to-br from-joulu-red to-red-900 p-8 rounded-lg shadow-2xl border-4 border-joulu-gold max-w-md w-full relative overflow-hidden"
      >
        {/* Confetti */}
        {confetti.map((i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            initial={{
              x: Math.random() * 400,
              y: -50,
              rotate: 0,
            }}
            animate={{
              y: 600,
              rotate: 360,
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: Math.random() * 0.5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
            }}
          >
            {['🎉', '🎊', '✨', '⭐', '💫'][Math.floor(Math.random() * 5)]}
          </motion.div>
        ))}

        <div className="relative z-10 text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="text-6xl mb-4"
          >
            🎁
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Aitäh!
          </h2>
          <p className="text-white/90 text-lg mb-2">
            Aitäh, et aitad Robinil jõuluunistust täita!
          </p>
          {giftName && (
            <p className="text-white/80 mb-4">
              Valisid: <span className="font-bold">{giftName}</span>
            </p>
          )}
          <p className="text-white/80">
            Päkapikud lisavad sinu nime heade inimeste nimekirja 😊
          </p>
        </div>
      </motion.div>
    </div>
  )
}

