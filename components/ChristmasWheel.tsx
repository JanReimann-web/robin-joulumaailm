'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { WheelItem } from '@/lib/types'
import { Volume2, VolumeX } from 'lucide-react'

export default function ChristmasWheel() {
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WheelItem | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [items, setItems] = useState<WheelItem[]>([])
  const [loading, setLoading] = useState(true)
  const rotate = useMotionValue(0)

  useEffect(() => {
    // Reaalajas andmete kuulamine
    const unsubscribe = onSnapshot(collection(db, 'wheelItems'), (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WheelItem[]
      
      // Kui andmeid pole, kasuta vaikimisi andmeid
      if (itemsData.length === 0) {
        setItems([
          { id: '1', text: 'Robin armastab Legot!', emoji: '🧱' },
          { id: '2', text: 'Hippo on Robin parim sõber', emoji: '🐕' },
          { id: '3', text: 'Robin joonistab imeilusalt', emoji: '🎨' },
          { id: '4', text: 'Robin on kiire jalgpallur', emoji: '⚽' },
          { id: '5', text: 'Robin armastab lugemist', emoji: '📚' },
          { id: '6', text: 'Robin on väga naljakas', emoji: '😄' },
        ])
      } else {
        setItems(itemsData)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSpin = () => {
    if (isSpinning || items.length === 0) return

    setIsSpinning(true)
    setSelectedItem(null)
    setIsPlayingAudio(false)
    setShowAnswer(false)
    
    // Peata praegune audio, kui see mängib
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    const randomRotation = 360 * 5 + Math.random() * 360
    rotate.set(rotate.get() + randomRotation)

    setTimeout(() => {
      const normalizedRotation = (rotate.get() % 360) + 360
      const itemIndex = Math.floor((360 - normalizedRotation) / (360 / items.length)) % items.length
      const selected = items[itemIndex]
      setSelectedItem(selected)
      setIsSpinning(false)
    }, 3000)
  }

  const handleShowAnswer = () => {
    setShowAnswer(true)
    // Mängi helifaili, kui see on olemas
    if (selectedItem?.audioUrl && audioRef.current) {
      setIsPlayingAudio(true)
      audioRef.current.play().catch((error) => {
        console.error('Helifaili mängimise viga:', error)
        setIsPlayingAudio(false)
      })
    }
  }

  const rotation = useTransform(rotate, (value) => `${value}deg`)

  if (loading) {
    return (
      <div className="py-12 px-4">
        <div className="text-center py-20">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white/60">Laen ketast...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center"
      >
        <h2 className="text-3xl font-bold mb-4 text-joulu-gold">
          🎡 Keeruta Robini jõuluketast
        </h2>
        <p className="text-white/80 mb-8">
          Pööra ketast ja kuula, mis Robin räägib!
        </p>

        <div className="relative mb-8">
          <motion.div
            style={{ rotate: rotation }}
            className="w-64 h-64 mx-auto relative"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-joulu-red to-red-900 border-8 border-joulu-gold shadow-2xl">
              {items.map((item, index) => {
                const angle = (360 / items.length) * index
                const radian = (angle * Math.PI) / 180
                const radius = 100
                const x = Math.cos(radian) * radius
                const y = Math.sin(radian) * radius

                return (
                  <div
                    key={item.id}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      transform: `translate(${x - 20}px, ${y - 20}px) rotate(${angle + 90}deg)`,
                    }}
                  >
                    <div className="text-3xl">{item.emoji}</div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
            <div className="text-4xl">⬇️</div>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`px-8 py-4 rounded-lg font-bold text-xl ${
            isSpinning
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-joulu-red hover:bg-red-700'
          } transition-colors`}
        >
          {isSpinning ? 'Keerutab...' : 'Keeruta!'}
        </button>

        {selectedItem && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-8 bg-joulu-gold p-6 rounded-lg border-4 border-joulu-red"
          >
            <div className="text-4xl mb-2">{selectedItem.emoji}</div>
            
            {/* Küsimus */}
            {selectedItem.question && !showAnswer && (
              <div className="mb-4">
                <p className="text-xl font-bold text-slate-900 mb-4">{selectedItem.question}</p>
                <button
                  onClick={handleShowAnswer}
                  className="px-6 py-3 bg-joulu-red hover:bg-red-700 rounded-lg font-bold text-white text-lg transition-colors"
                >
                  Näita vastust
                </button>
              </div>
            )}
            
            {/* Vastus */}
            {showAnswer && (
              <div>
                <p className="text-xl font-bold text-slate-900 mb-4">{selectedItem.text}</p>
                
                {/* Helifail */}
                {selectedItem.audioUrl && (
                  <div className="mt-4">
                    <audio
                      ref={audioRef}
                      src={selectedItem.audioUrl}
                      controls
                      className="w-full"
                      onEnded={() => setIsPlayingAudio(false)}
                      onPlay={() => setIsPlayingAudio(true)}
                      onPause={() => setIsPlayingAudio(false)}
                    />
                    <p className="text-sm text-slate-700 mt-2">🎤 Robin räägib õige vastuse:</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Kui küsimust pole, näita kohe teksti */}
            {!selectedItem.question && (
              <div>
                <p className="text-xl font-bold text-slate-900 mb-4">{selectedItem.text}</p>
                
                {/* Helifail */}
                {selectedItem.audioUrl && (
                  <div className="mt-4">
                    <audio
                      ref={audioRef}
                      src={selectedItem.audioUrl}
                      controls
                      autoPlay
                      className="w-full"
                      onEnded={() => setIsPlayingAudio(false)}
                      onPlay={() => setIsPlayingAudio(true)}
                      onPause={() => setIsPlayingAudio(false)}
                    />
                    <p className="text-sm text-slate-700 mt-2">🎤 Robin räägib:</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
