'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import Snowflakes from '@/components/Snowflakes'
import ElfEntrance from '@/components/ElfEntrance'
import GiftPile from '@/components/GiftPile'
import ThankYouCard from '@/components/ThankYouCard'
import ElfFootprints from '@/components/ElfFootprints'
import GiftProgress from '@/components/GiftProgress'
import BackgroundMusic from '@/components/BackgroundMusic'
import { motion } from 'framer-motion'

// Lazy load komponendid, mis ei ole kohe vajalikud
const RobinsYear = lazy(() => import('@/components/RobinsYear'))
const DiscountCodes = lazy(() => import('@/components/DiscountCodes'))
const LetterJourney = lazy(() => import('@/components/LetterJourney'))
const ChristmasWheel = lazy(() => import('@/components/ChristmasWheel'))
const PostOfficeBox = lazy(() => import('@/components/PostOfficeBox'))

export default function Home() {
  const [showEntrance, setShowEntrance] = useState(true)
  const [showThankYou, setShowThankYou] = useState(false)
  const [selectedGift, setSelectedGift] = useState<string>()

  useEffect(() => {
    // Peida sisenemise animatsioon 5 sekundi pärast
    const timer = setTimeout(() => {
      setShowEntrance(false)
    }, 6000)

    return () => clearTimeout(timer)
  }, [])

  const handleGiftSelected = (giftName: string) => {
    setSelectedGift(giftName)
    setShowThankYou(true)
  }

  return (
    <main className="min-h-screen relative">
      <Snowflakes />
      <ElfFootprints />
      <BackgroundMusic />

      {showEntrance ? (
        <ElfEntrance />
      ) : (
        <div className="relative z-10">
          {/* Header */}
          <header className="text-center py-12 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold text-joulu-gold mb-4"
            >
              Robini Jõulumaailm
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-white/80"
            >
              Tere tulemast! Siin on Robin ja tema jõulusoovid
            </motion.p>
          </header>

          {/* Gift Progress */}
          <GiftProgress />

          {/* Main Content */}
          <GiftPile onGiftSelected={handleGiftSelected} />

          {/* Robin's Year */}
          <Suspense fallback={<div className="py-12 px-4 text-center"><div className="text-4xl mb-4">⏳</div><p className="text-white/60">Laen...</p></div>}>
            <RobinsYear />
          </Suspense>

          {/* Christmas Wheel */}
          <Suspense fallback={<div className="py-12 px-4 text-center"><div className="text-4xl mb-4">⏳</div><p className="text-white/60">Laen...</p></div>}>
            <ChristmasWheel />
          </Suspense>

          {/* Discount Codes */}
          <Suspense fallback={null}>
            <DiscountCodes />
          </Suspense>

          {/* Post Office Box */}
          <Suspense fallback={<div className="py-12 px-4 text-center"><div className="text-4xl mb-4">⏳</div><p className="text-white/60">Laen...</p></div>}>
            <PostOfficeBox />
          </Suspense>

          {/* Letter Journey */}
          <Suspense fallback={<div className="py-12 px-4 text-center"><div className="text-4xl mb-4">⏳</div><p className="text-white/60">Laen...</p></div>}>
            <LetterJourney />
          </Suspense>

          {/* Footer */}
          <footer className="py-12 px-4 text-center text-white/60">
            <p>Loodud Robini sõpradele ❤️</p>
            <p className="text-sm mt-2">2025</p>
          </footer>
        </div>
      )}

      <ThankYouCard
        show={showThankYou}
        onClose={() => setShowThankYou(false)}
        giftName={selectedGift}
      />
    </main>
  )
}

