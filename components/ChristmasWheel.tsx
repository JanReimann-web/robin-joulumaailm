'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { WheelItem } from '@/lib/types'

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

    const randomRotation = 360 * 6 + Math.random() * 360
    const targetRotation = rotate.get() + randomRotation

    const onSpinComplete = () => {
      const normalizedRotation = (rotate.get() % 360) + 360
      const itemIndex = Math.floor((360 - normalizedRotation) / (360 / items.length)) % items.length
      const selected = items[itemIndex]
      setSelectedItem(selected)
      setIsSpinning(false)
    }

    const controls = animate(rotate, targetRotation, {
      duration: 3.2,
      ease: [0.2, 0.8, 0.2, 1],
    })

    if ('then' in controls && typeof controls.then === 'function') {
      controls.then(onSpinComplete).catch((error) => {
        console.error('Ketta animatsiooni viga:', error)
        onSpinComplete()
      })
    } else {
      onSpinComplete()
    }
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
            className="w-72 h-72 mx-auto relative drop-shadow-2xl"
          >
            <WheelCanvas items={items} />
          </motion.div>

          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 bg-white rounded-full border-4 border-joulu-red shadow-inner" />
          </div>

          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[30px] border-l-transparent border-r-transparent border-b-joulu-gold drop-shadow-lg" />
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
            
            {selectedItem.question && showAnswer && (
              <div>
                <p className="text-xl font-bold text-slate-900 mb-4">{selectedItem.text}</p>
                {selectedItem.audioUrl && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3 justify-center text-slate-900 font-semibold text-lg mb-2">
                      <span role="img" aria-label="microphone" className="text-2xl">
                        🎤
                      </span>
                      <span>{selectedItem.robinAudioLabel || 'Kuula kuidas Robin ütleb õige vastuse'}</span>
                    </div>
                    <audio
                      ref={audioRef}
                      src={selectedItem.audioUrl}
                      controls
                      className="w-full"
                      onEnded={() => setIsPlayingAudio(false)}
                      onPlay={() => setIsPlayingAudio(true)}
                      onPause={() => setIsPlayingAudio(false)}
                    />
                  </div>
                )}
              </div>
            )}
            
            {!selectedItem.question && (
              <div>
                {!showAnswer && (
                  <div className="mb-4">
                    <button
                      onClick={handleShowAnswer}
                      className="px-6 py-3 bg-joulu-red hover:bg-red-700 rounded-lg font-bold text-white text-lg transition-colors"
                    >
                      Näita vastust
                    </button>
                  </div>
                )}
                {showAnswer && (
                  <>
                    <p className="text-xl font-bold text-slate-900 mb-4">{selectedItem.text}</p>
                    {selectedItem.audioUrl && (
                      <div className="mt-4">
                        <div className="flex items-center gap-3 justify-center text-slate-900 font-semibold text-lg mb-2">
                          <span role="img" aria-label="microphone" className="text-2xl">
                            🎤
                          </span>
                          <span>{selectedItem.robinAudioLabel || 'Kuula kuidas Robin ütleb õige vastuse'}</span>
                        </div>
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
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

function WheelCanvas({ items }: { items: WheelItem[] }) {
  if (items.length === 0) {
    return (
      <div className="w-full h-full rounded-full border-8 border-joulu-gold bg-slate-700 flex items-center justify-center text-white/70">
        🎡
      </div>
    )
  }

  const palette = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#c084fc']

  const segmentBackground = items
    .map((item, index) => {
      const start = (index / items.length) * 100
      const end = ((index + 1) / items.length) * 100
      return `${palette[index % palette.length]} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div
      className="absolute inset-0 rounded-full border-8 border-joulu-gold shadow-2xl overflow-hidden"
      style={{ backgroundImage: `conic-gradient(${segmentBackground})` }}
    >
      {items.map((item, index) => {
        const angle = (360 / items.length) * index + (180 / items.length)
        return (
          <div
            key={item.id}
            className="absolute inset-0"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className="absolute left-1/2 top-6 -translate-x-1/2 flex items-center justify-center text-white drop-shadow-lg">
              <span className="text-3xl">{item.emoji}</span>
            </div>
          </div>
        )
      })}

      {/* jagajad */}
      {items.map((_, index) => (
        <div
          key={`divider-${index}`}
          className="absolute inset-0"
          style={{ transform: `rotate(${(360 / items.length) * index}deg)` }}
        >
          <div className="absolute top-0 left-1/2 h-1/2 w-[2px] bg-white/40" />
        </div>
      ))}
    </div>
  )
}
