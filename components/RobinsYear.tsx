'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Photo } from '@/lib/types'

export default function RobinsYear() {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Reaalajas andmete kuulamine
    const q = query(collection(db, 'photos'), orderBy('order', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Photo[]
      setPhotos(photosData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="py-12 px-4 bg-gradient-to-b from-green-900 to-green-800">
        <div className="text-center py-20">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white/60">Laen pilte...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 px-4 bg-gradient-to-b from-green-900 to-green-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-center mb-4 text-joulu-gold">
          📸 Robini aasta
        </h2>
        <p className="text-center text-white/80 mb-8">
          Parimad hetked aastast
        </p>

        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/60">Pilte pole veel lisatud.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer shadow-xl"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="w-full h-full bg-slate-900">
                  {photo.type === 'photo' ? (
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Kui pilt ei lae, näita viga
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-white/60 p-4"><span class="text-4xl mb-2">❌</span><span class="text-xs text-center">Pilt ei lae<br/>Kontrolli URL-i</span></div>'
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎥
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                  <p className="text-sm text-white text-center font-bold">{photo.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal suurele pildile */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="aspect-video bg-black rounded overflow-hidden flex items-center justify-center mb-4">
                  {selectedPhoto.type === 'photo' ? (
                    <img
                      src={selectedPhoto.url}
                      alt={selectedPhoto.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-6xl">🎥</div>
                  )}
                </div>
                <h3 className="text-center text-2xl font-bold mb-2">{selectedPhoto.title}</h3>
                {selectedPhoto.description && (
                  <p className="text-center text-white/80">{selectedPhoto.description}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
