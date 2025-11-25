'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function ElfFootprints() {
  const [footprints, setFootprints] = useState<Array<{ id: number; top: number }>>([])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      const topPercent = scrollPercent * 100

      // Loo uus jälg iga 5% scrolli kohta
      const footprintId = Math.floor(scrollPercent * 20)
      
      setFootprints(prev => {
        const exists = prev.find(f => f.id === footprintId)
        if (!exists && scrollPercent > 0) {
          return [...prev, { id: footprintId, top: topPercent }].slice(-10) // Hoida viimased 10
        }
        return prev
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed left-4 top-0 bottom-0 w-8 pointer-events-none z-10">
      {footprints.map((footprint) => (
        <motion.div
          key={footprint.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute text-2xl"
          style={{ 
            top: `${footprint.top}%`,
            left: 0,
            filter: 'hue-rotate(0deg) saturate(2) brightness(1.2)', // Teeb punaseks
            color: '#C41E3A' // Jõulupunane
          }}
        >
          <span style={{ color: '#C41E3A', textShadow: '0 0 10px rgba(196, 30, 58, 0.5)' }}>👣</span>
        </motion.div>
      ))}
    </div>
  )
}

