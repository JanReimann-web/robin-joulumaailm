'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ElfEntrance() {
  const [showGreeting, setShowGreeting] = useState(true)
  const [showElf, setShowElf] = useState(false)
  const [showChest, setShowChest] = useState(false)

  useEffect(() => {
    // Kuvame tervituse
    const timer1 = setTimeout(() => {
      setShowGreeting(false)
      setShowElf(true)
    }, 3000)

    // Päkapikk astub välja
    const timer2 = setTimeout(() => {
      setShowChest(true)
    }, 4000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center z-10"
          >
            <motion.h1
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl md:text-6xl font-bold text-joulu-gold mb-4"
            >
              Tere, Jõuluvana!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-white/80"
            >
              Robin kutsub sind oma jõulumaailma
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showElf && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <div className="flex flex-col items-center">
              {/* Päkapiku placeholder - saad hiljem asendada AI-videoga */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-48 bg-joulu-red rounded-full flex items-center justify-center mb-4 shadow-2xl"
              >
                <span className="text-6xl">🎅</span>
              </motion.div>

              {showChest && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="mt-8"
                >
                  <div className="bg-joulu-gold p-6 rounded-lg shadow-xl border-4 border-joulu-red">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900 mb-2">
                        📮
                      </p>
                      <p className="text-slate-900">
                        Päkapik avab kirstu ja hakkab lugema...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

