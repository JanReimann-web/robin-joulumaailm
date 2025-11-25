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
    
    if (gift.status === 'available') {
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative cursor-pointer ${gift.status === 'available' ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
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
            {gift.link && gift.status === 'available' && (
              <a
                href={gift.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="mb-3 w-full flex items-center justify-center gap-2 bg-joulu-gold text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-bold text-sm"
              >
                <ShoppingCart size={16} />
                Vaata poes
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

          {/* Ribbon */}
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
