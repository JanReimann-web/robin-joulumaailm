'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Gift } from '@/lib/types'
import GiftBox from './GiftBox'
import { motion } from 'framer-motion'

interface GiftPileProps {
  onGiftSelected?: (giftName: string) => void
}

export default function GiftPile({ onGiftSelected }: GiftPileProps) {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Reaalajas andmete kuulamine
    const unsubscribe = onSnapshot(collection(db, 'gifts'), (snapshot) => {
      const giftsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Gift[]
      setGifts(giftsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSelectGift = async (giftId: string, name?: string) => {
    try {
      const giftRef = doc(db, 'gifts', giftId)
      const gift = gifts.find(g => g.id === giftId)
      
      await updateDoc(giftRef, {
        status: 'taken',
        takenByName: name || null,
        takenAt: new Date().toISOString()
      })

      // Kutsume välja callback tänukaardi jaoks
      if (gift && onGiftSelected) {
        onGiftSelected(gift.name)
      }
    } catch (error) {
      console.error('Viga kingituse valimisel:', error)
      alert('Midagi läks valesti. Palun proovi uuesti.')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">⏳</div>
        <p>Laen kingisoove...</p>
      </div>
    )
  }

  return (
    <div className="py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-4xl font-bold text-center mb-8 text-joulu-gold">
          🎁 Kingipundar
        </h2>
        <p className="text-center text-white/80 mb-8">
          Vali kingitust, mida soovid Robini jaoks osta
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map((gift, index) => (
            <motion.div
              key={gift.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GiftBox gift={gift} onSelect={handleSelectGift} />
            </motion.div>
          ))}
        </div>

        {gifts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-white/60">
              Kingisoove pole veel lisatud
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

