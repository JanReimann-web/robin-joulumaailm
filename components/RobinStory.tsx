'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Play, Volume2 } from 'lucide-react'

interface RobinStoryProps {
  story?: string
  videoUrl?: string
  audioUrl?: string
}

export default function RobinStory({ story, videoUrl, audioUrl }: RobinStoryProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  if (!story && !videoUrl && !audioUrl) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-joulu-gold/30">
      <div className="flex items-start gap-3">
        <div className="text-3xl">🎤</div>
        <div className="flex-1">
          <h4 className="font-bold text-joulu-gold mb-2">Robin räägib:</h4>
          
          {story && (
            <p className="text-white/90 mb-3 italic">"{story}"</p>
          )}

          {(videoUrl || audioUrl) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-joulu-red px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Volume2 size={18} />
                    <span>Peata</span>
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    <span>Kuula</span>
                  </>
                )}
              </button>
              {videoUrl && (
                <span className="text-sm text-white/60">Video saadaval</span>
              )}
            </div>
          )}

          {isPlaying && videoUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
              <video
                src={videoUrl}
                controls
                className="w-full rounded-lg"
                autoPlay
              />
            </motion.div>
          )}

          {isPlaying && audioUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4"
            >
              <audio src={audioUrl} controls autoPlay className="w-full" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

