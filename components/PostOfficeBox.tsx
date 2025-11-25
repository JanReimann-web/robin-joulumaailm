'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Letter } from '@/lib/types'

export default function PostOfficeBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [showLetter, setShowLetter] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)

  useEffect(() => {
    // Reaalajas andmete kuulamine
    const unsubscribe = onSnapshot(collection(db, 'letters'), (snapshot) => {
      const lettersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Letter[]
      setLetters(lettersData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleOpenBox = () => {
    setIsOpen(true)
    
    // Kui on kirju, näita esimest kirja animatsiooniga
    if (letters.length > 0) {
      setTimeout(() => {
        setSelectedLetter(letters[0])
        setShowLetter(true)
      }, 500) // Oota, kuni postkast avatakse
    }
  }

  const handleCloseLetter = () => {
    setShowLetter(false)
    setTimeout(() => {
      setSelectedLetter(null)
    }, 300)
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-8 text-joulu-gold">
          📮 Jõuluvana postkontor
        </h2>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-white/60">Laen postkontorit...</p>
          </div>
        ) : (
          <>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative inline-block cursor-pointer"
              onClick={isOpen ? () => setIsOpen(false) : handleOpenBox}
            >
              {/* Postkast */}
              <div className="bg-gradient-to-br from-joulu-red to-red-900 p-8 rounded-lg shadow-2xl border-4 border-joulu-gold relative overflow-hidden">
                {/* Postkasti uks */}
                <motion.div
                  animate={{ rotateX: isOpen ? -90 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="origin-top relative z-10"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="bg-joulu-gold p-6 rounded-t-lg border-4 border-joulu-red">
                    <div className="text-6xl mb-2">📬</div>
                    <p className="text-slate-900 font-bold text-lg">
                      {isOpen ? 'Sulge' : 'Ava'} postkast
                    </p>
                  </div>
                </motion.div>

                {/* Postkasti sisu */}
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 space-y-2"
                  >
                    {letters.length === 0 ? (
                      <div className="bg-white/10 p-4 rounded text-white/80">
                        <p>Postkast on tühi</p>
                      </div>
                    ) : (
                      letters.map((letter, i) => (
                        <motion.div
                          key={letter.id}
                          initial={{ x: -100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.2 }}
                          className="bg-white p-4 rounded shadow-lg text-slate-900 cursor-pointer hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLetter(letter)
                            setShowLetter(true)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">✉️</span>
                            <div className="text-left flex-1">
                              <p className="font-bold">{letter.title}</p>
                              {letter.description && (
                                <p className="text-sm text-slate-600">{letter.description}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* Postkasti alus */}
                <div className="bg-slate-800 h-4 rounded-b-lg mt-2"></div>
              </div>
            </motion.div>

            <p className="mt-6 text-white/80">
              Kliki postkastile, et näha Robini kirju
            </p>
          </>
        )}

        {/* Animaatiline ümbrik Robini kirjaga */}
        <AnimatePresence>
          {showLetter && selectedLetter && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 100 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={handleCloseLetter}
            >
              <motion.div
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Ümbrik */}
                <div className="relative">
                  {/* Ümbriku tagakülg */}
                  <motion.div
                    initial={{ rotateX: 0 }}
                    animate={{ rotateX: -180 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-lg shadow-2xl"
                    style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                  >
                    <div className="p-8 flex items-center justify-center h-full">
                      <span className="text-6xl">✉️</span>
                    </div>
                  </motion.div>

                  {/* Ümbriku esikülg koos kirjaga */}
                  <motion.div
                    initial={{ rotateX: 180 }}
                    animate={{ rotateX: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="relative bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-lg shadow-2xl p-8"
                    style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                  >
                    {/* Ümbriku kate */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-t-lg origin-top">
                      <motion.div
                        initial={{ rotateX: 0 }}
                        animate={{ rotateX: -180 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="h-full flex items-center justify-center"
                      >
                        <span className="text-4xl">📮</span>
                      </motion.div>
                    </div>

                    {/* Kirja sisu */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="relative z-10 bg-white rounded-lg p-6 mt-8 shadow-xl"
                    >
                      <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">
                        {selectedLetter.title}
                      </h3>
                      
                      {/* Robini kirja foto */}
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={selectedLetter.imageUrl}
                          alt={selectedLetter.title}
                          className="w-full h-auto object-contain"
                        />
                      </div>

                      {selectedLetter.description && (
                        <p className="text-slate-700 text-center">
                          {selectedLetter.description}
                        </p>
                      )}

                      <button
                        onClick={handleCloseLetter}
                        className="mt-6 w-full px-6 py-3 bg-joulu-red rounded-lg hover:bg-red-700 text-white font-bold"
                      >
                        Sulge
                      </button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
