'use client'

import { motion } from 'framer-motion'
import { Gift } from '@/lib/types'
import { useState } from 'react'
import RobinStory from './RobinStory'
import { ExternalLink, ShoppingCart } from 'lucide-react'

interface GiftBoxProps {
  gift: Gift
  onSelect: (giftId: string, name?: string) => void
}

export default function GiftBox({ gift, onSelect }: GiftBoxProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedName, setSelectedName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const isAvailable = gift.status === 'available'

  const getStatusColor = () => {
    switch (gift.status) {
      case 'available':
        return 'bg-green-500'
      case 'taken':
        return 'bg-yellow-500'
      case 'gifted':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (gift.status) {
      case 'available':
        return 'Vaba'
      case 'taken':
        return `Võetud${gift.takenByName ? ` - ${gift.takenByName}` : ''}`
      case 'gifted':
        return 'Kingitud'
      default:
        return ''
    }
  }

  const handleSelect = (e: React.MouseEvent) => {
    // Kui klikitakse linki, ära ava modal
    if ((e.target as HTMLElement).closest('a')) {
      return
    }
    
    if (isAvailable) {
      setShowModal(true)
    }
  }

  const handleConfirm = () => {
    onSelect(gift.id, isAnonymous ? undefined : selectedName)
    setShowModal(false)
    setSelectedName('')
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Ära käivita handleSelect
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: isAvailable ? 1.05 : 1 }}
        whileTap={{ scale: isAvailable ? 0.95 : 1 }}
        className={`relative ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
        onClick={handleSelect}
      >
        <div className="bg-gradient-to-br from-joulu-red to-red-800 p-6 rounded-lg shadow-xl border-4 border-joulu-gold relative overflow-hidden">
          {/* Pakkimispaber pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-repeat" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }} />
          </div>

          <div className="relative z-10">
            {/* Valiku lint */}
            {!isAvailable && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
                <div className="absolute inset-0">
                  <div className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-gradient-to-b from-joulu-gold via-yellow-300 to-joulu-gold opacity-80" />
                  <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 bg-gradient-to-r from-joulu-gold via-yellow-300 to-joulu-gold opacity-80" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
                    <span className="absolute inset-0 rounded-full bg-yellow-200/70 blur-md" />
                    <span className="absolute inset-2 rounded-full bg-gradient-to-br from-joulu-gold to-yellow-300 border-2 border-white shadow-inner" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Kingitus valitud
                </div>
              </div>
            )}

            {/* Pildi sektsioon */}
            {gift.image && (
              <div className="mb-4 rounded-lg overflow-hidden aspect-square bg-slate-900">
                <img
                  src={gift.image}
                  alt={gift.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}

            <div className="text-center mb-4">
              {!gift.image && <div className="text-5xl mb-2">🎁</div>}
              <h3 className="text-lg font-bold text-white mb-2">{gift.name}</h3>
              <p className="text-sm text-white/80 mb-4">{gift.description}</p>
            </div>

            {/* Link nupp */}
            {gift.link && (
              <a
                href={gift.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className={`mb-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  isAvailable
                    ? 'bg-joulu-gold text-slate-900 hover:bg-yellow-400'
                    : 'bg-white/90 text-slate-900 hover:bg-white'
                }`}
              >
                <ShoppingCart size={16} />
                {isAvailable ? 'Vaata poes' : 'Ava link poes'}
                <ExternalLink size={14} />
              </a>
            )}

            {/* Status badge */}
            <div className={`${getStatusColor()} text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2`}>
              {getStatusText()}
            </div>

            {/* Robin story */}
            {gift.robinStory && (
              <div className="mt-2">
                <RobinStory 
                  story={gift.robinStory}
                  videoUrl={gift.robinVideoUrl}
                />
              </div>
            )}
          </div>

          {/* Ribbon dekoratsioon nurgas */}
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] border-t-joulu-gold" />
        </div>
      </motion.div>

      {/* Modal valimiseks */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-slate-800 rounded-lg p-6 max-w-md w-full border-4 border-joulu-gold"
          >
            <h3 className="text-2xl font-bold mb-4 text-center">Vali kingitust!</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(true)}
                    className="w-4 h-4"
                  />
                  <span>Anonüümne (lihtsalt märgin ära)</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isAnonymous}
                    onChange={() => setIsAnonymous(false)}
                    className="w-4 h-4"
                  />
                  <span>Nimeline</span>
                </label>
              </div>

              {!isAnonymous && (
                <motion.input
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="text"
                  placeholder="Sinu nimi"
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                />
              )}

              {!isAnonymous && (
                <textarea
                  placeholder="Väike soov Robini jaoks (valikuline)"
                  className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 mt-2"
                  rows={3}
                />
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-600 rounded hover:bg-slate-500"
              >
                Tühista
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-joulu-red rounded hover:bg-red-700 font-bold"
              >
                Võtan!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
