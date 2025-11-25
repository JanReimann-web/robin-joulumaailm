'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function LetterJourney() {
  const [showMap, setShowMap] = useState(false)

  return (
    <div className="py-12 px-4 bg-gradient-to-b from-green-900 to-green-800">
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
          className="bg-slate-800 rounded-lg p-8 border-4 border-joulu-gold mb-6"
        >
          {/* Video placeholder */}
          <div className="aspect-video bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">📹</span>
            </div>
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <p className="text-white text-xl">Video Robini kirja postitamisest</p>
            </div>
          </div>

          <button
            onClick={() => setShowMap(!showMap)}
            className="bg-joulu-red px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-bold"
          >
            {showMap ? 'Peida kaart' : 'Näita kaarti'}
          </button>
        </motion.div>

        {showMap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-slate-800 rounded-lg p-8 border-4 border-joulu-gold"
          >
            <div className="relative aspect-video bg-gradient-to-br from-green-800 to-blue-800 rounded-lg overflow-hidden">
              {/* Eesti kaart placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl mb-2 block">🗺️</span>
                  <p className="text-white">Eesti kaart</p>
                </div>
              </div>

              {/* Animaatiline rada */}
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0"
              >
                <svg className="w-full h-full">
                  <motion.path
                    d="M 50 400 Q 200 200 400 100 T 800 50"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="4"
                    strokeDasharray="10 5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </svg>
              </motion.div>

              {/* Põhjapõtrade marker */}
              <div className="absolute top-10 right-20">
                <div className="bg-white rounded-full p-3 shadow-xl">
                  <span className="text-2xl">🎅</span>
                </div>
                <p className="text-white text-sm mt-2 text-center">Põhjapõtra</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

