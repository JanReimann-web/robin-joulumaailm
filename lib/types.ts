export interface Gift {
  id: string
  name: string
  description: string
  image?: string
  link?: string
  status: 'available' | 'taken' | 'gifted'
  takenBy?: string
  takenByName?: string
  takenAt?: string
  takenWish?: string
  robinStory?: string
  robinVideoUrl?: string
  robinAudioLabel?: string
}

export interface DiscountCode {
  id: string
  title: string
  code: string
  description: string
  link: string
  discount: string
}

export interface Photo {
  id: string
  url: string
  title: string
  description?: string
  type: 'photo' | 'video'
  order?: number
}

export interface WheelItem {
  id: string
  text: string
  emoji: string
  question?: string
  audioUrl?: string
}

export interface Letter {
  id: string
  imageUrl: string
  title: string
  description?: string
}

export interface SiteSettings {
  musicUrl?: string | null
  musicFileName?: string | null
  letterVideoUrl?: string | null
  letterVideoFileName?: string | null
  updatedAt?: number
}

