'use client'

import { useState, useEffect } from 'react'
import Snowflakes from '@/components/Snowflakes'
import ElfEntrance from '@/components/ElfEntrance'
import GiftPile from '@/components/GiftPile'
import RobinsYear from '@/components/RobinsYear'
import DiscountCodes from '@/components/DiscountCodes'
import LetterJourney from '@/components/LetterJourney'
import ThankYouCard from '@/components/ThankYouCard'
import ElfFootprints from '@/components/ElfFootprints'
import ChristmasWheel from '@/components/ChristmasWheel'
import GiftProgress from '@/components/GiftProgress'
import BackgroundMusic from '@/components/BackgroundMusic'
import PostOfficeBox from '@/components/PostOfficeBox'
import { motion } from 'framer-motion'

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
          <RobinsYear />

          {/* Christmas Wheel */}
          <ChristmasWheel />

          {/* Discount Codes */}
          <DiscountCodes />

          {/* Post Office Box */}
          <PostOfficeBox />

          {/* Letter Journey */}
          <LetterJourney />

          {/* Footer */}
          <footer className="py-12 px-4 text-center text-white/60">
            <p>Loodud Robinile ❤️</p>
            <p className="text-sm mt-2">2024</p>
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

