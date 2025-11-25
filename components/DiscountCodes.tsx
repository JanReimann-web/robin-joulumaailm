'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DiscountCode } from '@/lib/types'
import { ExternalLink } from 'lucide-react'

export default function DiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Reaalajas andmete kuulamine
    const unsubscribe = onSnapshot(collection(db, 'discountCodes'), (snapshot) => {
      const codesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiscountCode[]
      setCodes(codesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="py-12 px-4">
        <div className="text-center py-20">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white/60">Laen sooduskoode...</p>
        </div>
      </div>
    )
  }

  if (codes.length === 0) {
    return null
  }

  return (
    <div className="py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-center mb-4 text-joulu-gold">
          🎁 Päkapiku soovitused
        </h2>
        <p className="text-center text-white/80 mb-8">
          Spetsiaalsed pakkumised Robini jaoks
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {codes.map((code, index) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-joulu-green to-green-900 p-6 rounded-lg shadow-xl border-4 border-joulu-gold"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {code.title}
                  </h3>
                  <p className="text-white/80 mb-2">{code.description}</p>
                  <div className="bg-white/20 px-4 py-2 rounded inline-block">
                    <span className="text-lg font-bold text-white">
                      {code.discount}
                    </span>
                  </div>
                </div>
                <div className="text-4xl">🎅</div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60 mb-1">Sooduskood:</p>
                    <p className="text-xl font-bold text-joulu-gold font-mono">
                      {code.code}
                    </p>
                  </div>
                  <a
                    href={code.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-joulu-red px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-bold"
                  >
                    Mine poodi
                    <ExternalLink size={20} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
