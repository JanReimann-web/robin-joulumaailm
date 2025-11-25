'use client'

import { useEffect, useState } from 'react'

export default function Snowflakes() {
  const [snowflakes, setSnowflakes] = useState<number[]>([])

  useEffect(() => {
    // Loo 50 lumehelbeid
    setSnowflakes(Array.from({ length: 50 }, (_, i) => i))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {snowflakes.map((index) => {
        const left = Math.random() * 100
        const delay = Math.random() * 15
        const duration = 10 + Math.random() * 10
        const size = 5 + Math.random() * 10

        return (
          <div
            key={index}
            className="snowflake absolute top-0 rounded-full bg-white opacity-70"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        )
      })}
    </div>
  )
}

