'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Gift, DiscountCode, Photo, WheelItem, Letter } from '@/lib/types'
import { Trash2, Edit, Plus, RotateCcw, Save } from 'lucide-react'

type Tab = 'gifts' | 'photos' | 'discounts' | 'wheel' | 'letters'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('gifts')
  
  // Kingitused
  const [gifts, setGifts] = useState<Gift[]>([])
  const [showGiftForm, setShowGiftForm] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [giftFormData, setGiftFormData] = useState({
    name: '',
    description: '',
    image: '',
    link: '',
    robinStory: '',
    robinVideoUrl: '',
  })
  const [giftImageFile, setGiftImageFile] = useState<File | null>(null)
  const [isSavingGift, setIsSavingGift] = useState(false)

  // Pildid
  const [photos, setPhotos] = useState<Photo[]>([])
  const [showPhotoForm, setShowPhotoForm] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [photoFormData, setPhotoFormData] = useState({
    url: '',
    title: '',
    description: '',
    type: 'photo' as 'photo' | 'video',
    order: 0,
  })
  const [autoDetectedPhotoType, setAutoDetectedPhotoType] = useState<'photo' | 'video' | null>(null)

  // Sooduskoodid
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null)
  const [discountFormData, setDiscountFormData] = useState({
    title: '',
    code: '',
    description: '',
    link: '',
    discount: '',
  })

  // Jõuluketas
  const [wheelItems, setWheelItems] = useState<WheelItem[]>([])
  const [showWheelForm, setShowWheelForm] = useState(false)
  const [editingWheelItem, setEditingWheelItem] = useState<WheelItem | null>(null)
  const [wheelFormData, setWheelFormData] = useState({
    text: '',
    emoji: '',
    question: '',
    audioUrl: '',
  })

  // Postkontori kirjad
  const [letters, setLetters] = useState<Letter[]>([])
  const [showLetterForm, setShowLetterForm] = useState(false)
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null)
  const [letterFormData, setLetterFormData] = useState({
    imageUrl: '',
    title: '',
    description: '',
  })

  const [loading, setLoading] = useState(true)
  const ADMIN_PASSWORD = 'robin2024'

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB'
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  const detectMediaTypeFromUrl = (rawUrl: string): 'photo' | 'video' | null => {
    if (!rawUrl) return null
    const cleanUrl = rawUrl.split('#')[0].split('?')[0].toLowerCase()
    const extension = cleanUrl.split('.').pop()
    if (!extension) return null

    const videoExtensions = ['mp4', 'mov', 'webm', 'm4v', 'avi']
    const photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'svg']

    if (videoExtensions.includes(extension)) return 'video'
    if (photoExtensions.includes(extension)) return 'photo'
    return null
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData()
    }
  }, [isAuthenticated])

  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([loadGifts(), loadPhotos(), loadDiscounts(), loadWheelItems(), loadLetters()])
    setLoading(false)
  }

  // ========== KINGITUSED ==========
  const loadGifts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'gifts'))
      const giftsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Gift[]
      setGifts(giftsData)
    } catch (error) {
      console.error('Viga kingituste laadimisel:', error)
    }
  }

  const uploadGiftImage = async (file: File) => {
    const normalizedName = file.name.replace(/\s+/g, '-').toLowerCase()
    const filePath = `gifts/${Date.now()}-${normalizedName}`
    const fileRef = storageRef(storage, filePath)
    const snapshot = await uploadBytes(fileRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSavingGift(true)

      let imageUrl = giftFormData.image.trim() ? giftFormData.image.trim() : null
      if (giftImageFile) {
        imageUrl = await uploadGiftImage(giftImageFile)
      }

      const payload = {
        name: giftFormData.name,
        description: giftFormData.description,
        image: imageUrl,
        link: giftFormData.link.trim() ? giftFormData.link.trim() : null,
        robinStory: giftFormData.robinStory.trim() ? giftFormData.robinStory : null,
        robinVideoUrl: giftFormData.robinVideoUrl.trim() ? giftFormData.robinVideoUrl.trim() : null,
      }

      if (editingGift) {
        const giftRef = doc(db, 'gifts', editingGift.id)
        await updateDoc(giftRef, payload)
      } else {
        await addDoc(collection(db, 'gifts'), {
          ...payload,
          status: 'available',
        })
      }

      resetGiftForm()
      loadGifts()
      alert(editingGift ? '✅ Kingitust uuendatud!' : '✅ Kingitust lisatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    } finally {
      setIsSavingGift(false)
    }
  }

  const handleReleaseGift = async (giftId: string) => {
    if (!confirm('Kas oled kindel, et tahad vabastada selle broneeringu?')) return
    
    try {
      const giftRef = doc(db, 'gifts', giftId)
      await updateDoc(giftRef, {
        status: 'available',
        takenByName: null,
        takenAt: null,
      })
      loadGifts()
      alert('✅ Broneering vabastatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm('Kas oled kindel, et tahad selle kingituse kustutada?')) return
    try {
      await deleteDoc(doc(db, 'gifts', giftId))
      loadGifts()
      alert('✅ Kingitust kustutatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleEditGift = (gift: Gift) => {
    setEditingGift(gift)
    setGiftFormData({
      name: gift.name,
      description: gift.description,
      image: gift.image || '',
      link: gift.link || '',
      robinStory: gift.robinStory || '',
      robinVideoUrl: gift.robinVideoUrl || '',
    })
    setGiftImageFile(null)
    setShowGiftForm(true)
  }

  const resetGiftForm = () => {
    setGiftFormData({
      name: '',
      description: '',
      image: '',
      link: '',
      robinStory: '',
      robinVideoUrl: '',
    })
    setEditingGift(null)
    setGiftImageFile(null)
    setShowGiftForm(false)
  }

  // ========== PILDID ==========
  const loadPhotos = async () => {
    try {
      const q = query(collection(db, 'photos'), orderBy('order', 'asc'))
      const querySnapshot = await getDocs(q)
      const photosData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        console.log('Firestore dokument:', doc.id, data)
        return {
          id: doc.id,
          ...data
        }
      }) as Photo[]
      console.log('Kõik pildid Firestore\'ist:', photosData)
      setPhotos(photosData)
    } catch (error) {
      console.error('Viga piltide laadimisel:', error)
    }
  }

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Kontrolli, et URL on täidetud
    if (!photoFormData.url || photoFormData.url.trim() === '') {
      alert('❌ Viga: URL on kohustuslik!')
      return
    }
    
    try {
      const dataToSave = {
        url: photoFormData.url.trim(),
        title: photoFormData.title,
        description: photoFormData.description || null,
        type: photoFormData.type,
        order: photoFormData.order || 0,
      }
      
      console.log('Salvestan Firestore\'i:', dataToSave)
      
      if (editingPhoto) {
        const photoRef = doc(db, 'photos', editingPhoto.id)
        await updateDoc(photoRef, dataToSave)
        alert(`✅ Pilti uuendatud! URL: ${dataToSave.url}`)
      } else {
        const docRef = await addDoc(collection(db, 'photos'), dataToSave)
        console.log('Dokument lisatud ID-ga:', docRef.id)
        alert(`✅ Pilt lisatud! URL: ${dataToSave.url}`)
      }
      resetPhotoForm()
      loadPhotos()
    } catch (error: any) {
      console.error('Firestore viga:', error)
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Kas oled kindel, et tahad selle pildi kustutada?')) return
    try {
      await deleteDoc(doc(db, 'photos', photoId))
      loadPhotos()
      alert('✅ Pilt kustutatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo)
    setPhotoFormData({
      url: photo.url,
      title: photo.title,
      description: photo.description || '',
      type: photo.type,
      order: photo.order || 0,
    })
    setShowPhotoForm(true)
    setAutoDetectedPhotoType(photo.type)
  }

  const resetPhotoForm = () => {
    setPhotoFormData({
      url: '',
      title: '',
      description: '',
      type: 'photo',
      order: 0,
    })
    setEditingPhoto(null)
    setShowPhotoForm(false)
    setAutoDetectedPhotoType(null)
  }

  // ========== SOODUSKOODID ==========
  const loadDiscounts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'discountCodes'))
      const discountsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiscountCode[]
      setDiscounts(discountsData)
    } catch (error) {
      console.error('Viga sooduskoodide laadimisel:', error)
    }
  }

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingDiscount) {
        const discountRef = doc(db, 'discountCodes', editingDiscount.id)
        await updateDoc(discountRef, discountFormData)
      } else {
        await addDoc(collection(db, 'discountCodes'), discountFormData)
      }
      resetDiscountForm()
      loadDiscounts()
      alert(editingDiscount ? '✅ Sooduskoodi uuendatud!' : '✅ Sooduskood lisatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleDeleteDiscount = async (discountId: string) => {
    if (!confirm('Kas oled kindel, et tahad selle sooduskoodi kustutada?')) return
    try {
      await deleteDoc(doc(db, 'discountCodes', discountId))
      loadDiscounts()
      alert('✅ Sooduskood kustutatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleEditDiscount = (discount: DiscountCode) => {
    setEditingDiscount(discount)
    setDiscountFormData({
      title: discount.title,
      code: discount.code,
      description: discount.description,
      link: discount.link,
      discount: discount.discount,
    })
    setShowDiscountForm(true)
  }

  const resetDiscountForm = () => {
    setDiscountFormData({
      title: '',
      code: '',
      description: '',
      link: '',
      discount: '',
    })
    setEditingDiscount(null)
    setShowDiscountForm(false)
  }

  // ========== JÕULUKETAS ==========
  const loadWheelItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'wheelItems'))
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WheelItem[]
      setWheelItems(itemsData)
    } catch (error) {
      console.error('Viga ketta elementide laadimisel:', error)
    }
  }

  const handleWheelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingWheelItem) {
        const itemRef = doc(db, 'wheelItems', editingWheelItem.id)
        await updateDoc(itemRef, {
          text: wheelFormData.text,
          emoji: wheelFormData.emoji,
          question: wheelFormData.question || null,
          audioUrl: wheelFormData.audioUrl || null,
        })
      } else {
        await addDoc(collection(db, 'wheelItems'), {
          text: wheelFormData.text,
          emoji: wheelFormData.emoji,
          question: wheelFormData.question || null,
          audioUrl: wheelFormData.audioUrl || null,
        })
      }
      resetWheelForm()
      loadWheelItems()
      alert(editingWheelItem ? '✅ Ketta elementi uuendatud!' : '✅ Ketta element lisatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleDeleteWheelItem = async (itemId: string) => {
    if (!confirm('Kas oled kindel, et tahad selle elemendi kustutada?')) return
    try {
      await deleteDoc(doc(db, 'wheelItems', itemId))
      loadWheelItems()
      alert('✅ Element kustutatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleEditWheelItem = (item: WheelItem) => {
    setEditingWheelItem(item)
    setWheelFormData({
      text: item.text,
      emoji: item.emoji,
      question: item.question || '',
      audioUrl: item.audioUrl || '',
    })
    setShowWheelForm(true)
  }

  const resetWheelForm = () => {
    setWheelFormData({
      text: '',
      emoji: '',
      question: '',
      audioUrl: '',
    })
    setEditingWheelItem(null)
    setShowWheelForm(false)
  }

  // ========== POSTKONTORI KIRJAD ==========
  const loadLetters = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'letters'))
      const lettersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Letter[]
      setLetters(lettersData)
    } catch (error) {
      console.error('Viga kirjade laadimisel:', error)
    }
  }

  const handleLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingLetter) {
        const letterRef = doc(db, 'letters', editingLetter.id)
        await updateDoc(letterRef, {
          imageUrl: letterFormData.imageUrl,
          title: letterFormData.title,
          description: letterFormData.description || null,
        })
      } else {
        await addDoc(collection(db, 'letters'), {
          imageUrl: letterFormData.imageUrl,
          title: letterFormData.title,
          description: letterFormData.description || null,
        })
      }
      resetLetterForm()
      loadLetters()
      alert(editingLetter ? '✅ Kirja uuendatud!' : '✅ Kiri lisatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleDeleteLetter = async (letterId: string) => {
    if (!confirm('Kas oled kindel, et tahad selle kirja kustutada?')) return
    try {
      await deleteDoc(doc(db, 'letters', letterId))
      loadLetters()
      alert('✅ Kiri kustutatud!')
    } catch (error: any) {
      alert(`❌ Viga: ${error.message}`)
    }
  }

  const handleEditLetter = (letter: Letter) => {
    setEditingLetter(letter)
    setLetterFormData({
      imageUrl: letter.imageUrl,
      title: letter.title,
      description: letter.description || '',
    })
    setShowLetterForm(true)
  }

  const resetLetterForm = () => {
    setLetterFormData({
      imageUrl: '',
      title: '',
      description: '',
    })
    setEditingLetter(null)
    setShowLetterForm(false)
  }

  // ========== AUTENTIMINE ==========
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setPassword('')
    } else {
      alert('Vale parool!')
      setPassword('')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-lg border-2 border-joulu-gold max-w-md w-full">
          <h1 className="text-3xl font-bold text-joulu-gold mb-6 text-center">🔐 Admin sisselogimine</h1>
          <div className="mb-4">
            <label className="block mb-2 text-white">Parool</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
              placeholder="Sisesta parool"
              required
            />
          </div>
          <button type="submit" className="w-full px-6 py-3 bg-joulu-red rounded-lg hover:bg-red-700 font-bold">
            Logi sisse
          </button>
        </form>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Laen andmeid...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-joulu-gold mb-2">🎁 Admin Halduskeskus</h1>
            <p className="text-white/60">Halda kõiki lehe sisu</p>
          </div>
          <div className="flex gap-2">
            <a href="/" className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">
              Vaata lehte
            </a>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-red-700 rounded hover:bg-red-600"
            >
              Logi välja
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'gifts' ? 'border-b-2 border-joulu-gold text-joulu-gold' : 'text-white/60 hover:text-white'
            }`}
          >
            🎁 Kingitused ({gifts.length})
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'photos' ? 'border-b-2 border-joulu-gold text-joulu-gold' : 'text-white/60 hover:text-white'
            }`}
          >
            📸 Robini aasta ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'discounts' ? 'border-b-2 border-joulu-gold text-joulu-gold' : 'text-white/60 hover:text-white'
            }`}
          >
            🎁 Sooduskoodid ({discounts.length})
          </button>
          <button
            onClick={() => setActiveTab('wheel')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'wheel' ? 'border-b-2 border-joulu-gold text-joulu-gold' : 'text-white/60 hover:text-white'
            }`}
          >
            🎡 Jõuluketas ({wheelItems.length})
          </button>
          <button
            onClick={() => setActiveTab('letters')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'letters' ? 'border-b-2 border-joulu-gold text-joulu-gold' : 'text-white/60 hover:text-white'
            }`}
          >
            📮 Postkontor ({letters.length})
          </button>
        </div>

        {/* Kingitused Tab */}
        {activeTab === 'gifts' && (
          <div>
            <button
              onClick={() => setShowGiftForm(!showGiftForm)}
              className="mb-6 px-6 py-3 bg-joulu-red rounded-lg hover:bg-red-700 font-bold flex items-center gap-2"
            >
              <Plus size={20} />
              {showGiftForm ? 'Peida vorm' : 'Lisa uus kingitust'}
            </button>

            {showGiftForm && (
              <form onSubmit={handleGiftSubmit} className="bg-slate-800 p-6 rounded-lg mb-8 border-2 border-joulu-gold">
                <h2 className="text-2xl font-bold mb-4">{editingGift ? 'Muuda kingitust' : 'Lisa uus kingitust'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block mb-2">Nimi *</label>
                    <input
                      type="text"
                      required
                      value={giftFormData.name}
                      onChange={(e) => setGiftFormData({ ...giftFormData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Kirjeldus *</label>
                    <textarea
                      required
                      value={giftFormData.description}
                      onChange={(e) => setGiftFormData({ ...giftFormData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Pildi URL</label>
                    <input
                      type="url"
                      value={giftFormData.image}
                      onChange={(e) => setGiftFormData({ ...giftFormData, image: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Laadi pilt üles (valikuline)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setGiftImageFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-joulu-gold file:px-4 file:py-2 file:text-slate-900 cursor-pointer"
                    />
                    <p className="text-xs text-white/60 mt-2">
                      Fail laetakse Firebase Storage'i ja link lisatakse automaatselt.
                    </p>
                    {giftImageFile && (
                      <div className="mt-2 text-xs text-white/80 flex items-center justify-between gap-2">
                        <span>
                          {giftImageFile.name} ({formatFileSize(giftImageFile.size)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setGiftImageFile(null)}
                          className="text-red-300 hover:text-red-200"
                        >
                          Eemalda
                        </button>
                      </div>
                    )}
                    {!giftImageFile && giftFormData.image && (
                      <p className="text-xs text-white/60 mt-2">
                        Praegune pilt: {' '}
                        <a href={giftFormData.image} target="_blank" rel="noopener noreferrer" className="underline text-joulu-gold">
                          Ava
                        </a>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2">Link</label>
                    <input
                      type="url"
                      value={giftFormData.link}
                      onChange={(e) => setGiftFormData({ ...giftFormData, link: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Robini lugu</label>
                    <textarea
                      value={giftFormData.robinStory}
                      onChange={(e) => setGiftFormData({ ...giftFormData, robinStory: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Robini video URL</label>
                    <input
                      type="url"
                      value={giftFormData.robinVideoUrl}
                      onChange={(e) => setGiftFormData({ ...giftFormData, robinVideoUrl: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingGift}
                    className="px-6 py-3 bg-joulu-green rounded-lg hover:bg-green-700 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingGift ? 'Salvestan...' : editingGift ? 'Uuenda' : 'Lisa'}
                  </button>
                  <button
                    type="button"
                    onClick={resetGiftForm}
                    disabled={isSavingGift}
                    className="px-6 py-3 bg-slate-600 rounded-lg hover:bg-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Tühista
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {gifts.map((gift) => (
                <div key={gift.id} className="bg-slate-800 p-4 rounded-lg flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{gift.name}</h3>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                        gift.status === 'available' ? 'bg-green-500' :
                        gift.status === 'taken' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {gift.status === 'available' ? 'Vaba' :
                         gift.status === 'taken' ? 'Võetud' : 'Kingitud'}
                      </span>
                    </div>
                    <p className="text-white/80 mb-2">{gift.description}</p>
                    {gift.takenByName && (
                      <p className="text-sm text-white/60">Võttis: {gift.takenByName}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {gift.status === 'taken' && (
                      <button
                        onClick={() => handleReleaseGift(gift.id)}
                        className="p-2 bg-green-600 rounded hover:bg-green-700"
                        title="Vabasta broneering"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditGift(gift)}
                      className="p-2 bg-blue-600 rounded hover:bg-blue-700"
                      title="Muuda"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteGift(gift.id)}
                      className="p-2 bg-red-600 rounded hover:bg-red-700"
                      title="Kustuta"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pildid Tab */}
        {activeTab === 'photos' && (
          <div>
            <button
              onClick={() => setShowPhotoForm(!showPhotoForm)}
              className="mb-6 px-6 py-3 bg-joulu-red rounded-lg hover:bg-red-700 font-bold flex items-center gap-2"
            >
              <Plus size={20} />
              {showPhotoForm ? 'Peida vorm' : 'Lisa uus pilt'}
            </button>

            {showPhotoForm && (
              <form onSubmit={handlePhotoSubmit} className="bg-slate-800 p-6 rounded-lg mb-8 border-2 border-joulu-gold">
                <h2 className="text-2xl font-bold mb-4">{editingPhoto ? 'Muuda pilti' : 'Lisa uus pilt'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block mb-2">Pildi/Video URL *</label>
                    <input
                      type="text"
                      required
                      value={photoFormData.url}
                      onChange={(e) => {
                        let value = e.target.value
                        // Teisenda Windows failitee veebi URL-iks
                        if (value.includes('public\\videos\\') || value.includes('public/videos/')) {
                          value = value.replace(/.*public[\\\/]videos[\\\/]/, '/videos/')
                        } else if (value.includes('public\\images\\') || value.includes('public/images/')) {
                          value = value.replace(/.*public[\\\/]images[\\\/]/, '/images/')
                        } else if (value.includes('\\videos\\') || value.includes('/videos/')) {
                          value = value.replace(/.*[\\\/]videos[\\\/]/, '/videos/')
                        } else if (value.includes('\\images\\') || value.includes('/images/')) {
                          value = value.replace(/.*[\\\/]images[\\\/]/, '/images/')
                        } else if (value.match(/^[A-Z]:\\/)) {
                          // Windows absoluutne tee
                          const matchVideo = value.match(/public[\\\/]videos[\\\/](.+)$/i)
                          const matchImage = value.match(/public[\\\/]images[\\\/](.+)$/i)
                          if (matchVideo) {
                            value = `/videos/${matchVideo[1].replace(/\\/g, '/')}`
                          } else if (matchImage) {
                            value = `/images/${matchImage[1].replace(/\\/g, '/')}`
                          }
                        }
                        const detectedType = detectMediaTypeFromUrl(value)
                        setPhotoFormData((prev) => ({
                          ...prev,
                          url: value,
                          type: detectedType ?? prev.type,
                        }))
                        setAutoDetectedPhotoType(detectedType)
                      }}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      placeholder={photoFormData.type === 'video' ? '/videos/video.mp4' : '/images/pilt.jpg'}
                    />
                    <p className="text-sm text-white/60 mt-1">
                      💡 <strong>Õige formaat:</strong>
                      {photoFormData.type === 'video' ? (
                        <>
                          <code>/videos/video.mp4</code> (videod peaksid olema <code>public/videos/</code> kaustas)
                          <br />
                          Kui fail on <code>public/videos/Muumi.mp4</code>, siis URL on <code>/videos/Muumi.mp4</code>
                        </>
                      ) : (
                        <>
                          <code>/images/pilt.jpg</code> (pildid peaksid olema <code>public/images/</code> kaustas)
                          <br />
                          Kui fail on <code>public/images/Joulud.jpg</code>, siis URL on <code>/images/Joulud.jpg</code>
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block mb-2">Tüüp</label>
                    <select
                      value={photoFormData.type}
                      onChange={(e) => {
                        setPhotoFormData({ ...photoFormData, type: e.target.value as 'photo' | 'video' })
                        setAutoDetectedPhotoType(null)
                      }}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    >
                      <option value="photo">Foto</option>
                      <option value="video">Video</option>
                    </select>
                    {autoDetectedPhotoType && (
                      <p className="text-xs text-green-300 mt-1">
                        Tuvastatud automaatselt: {autoDetectedPhotoType === 'video' ? 'Video' : 'Foto'}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Pealkiri *</label>
                    <input
                      type="text"
                      required
                      value={photoFormData.title}
                      onChange={(e) => setPhotoFormData({ ...photoFormData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Kirjeldus (loomulik tekst, mis räägib pildist)</label>
                    <textarea
                      value={photoFormData.description}
                      onChange={(e) => setPhotoFormData({ ...photoFormData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      rows={4}
                      placeholder="Nt: See on pilt, kus Robin mängib Legoga. Ta oli väga õnnelik..."
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Järjekord (väiksem = kuvatakse esimesena)</label>
                    <input
                      type="number"
                      value={photoFormData.order}
                      onChange={(e) => setPhotoFormData({ ...photoFormData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button type="submit" className="px-6 py-3 bg-joulu-green rounded-lg hover:bg-green-700 font-bold">
                    {editingPhoto ? 'Uuenda' : 'Lisa'}
                  </button>
                  <button type="button" onClick={resetPhotoForm} className="px-6 py-3 bg-slate-600 rounded-lg hover:bg-slate-500">
                    Tühista
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${photo.type === 'video' ? 'bg-blue-600' : 'bg-green-600'}`}>
                      {photo.type === 'video' ? 'Video' : 'Foto'}
                    </span>
                    <span className="text-xs text-white/50">
                      Järjekord: {photo.order ?? 0}
                    </span>
                  </div>
                  <div className="aspect-square bg-slate-700 rounded mb-3 overflow-hidden">
                    {photo.type === 'photo' ? (
                      <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎥</div>
                    )}
                  </div>
                  <h3 className="font-bold mb-1">{photo.title}</h3>
                  {photo.description && <p className="text-sm text-white/60 mb-3">{photo.description}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPhoto(photo)}
                      className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                    >
                      Muuda
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="px-3 py-2 bg-red-600 rounded hover:bg-red-700 text-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sooduskoodid Tab */}
        {activeTab === 'discounts' && (
          <div>
            <button
              onClick={() => setShowDiscountForm(!showDiscountForm)}
              className="mb-6 px-6 py-3 bg-joulu-red rounded-lg hover:bg-red-700 font-bold flex items-center gap-2"
            >
              <Plus size={20} />
              {showDiscountForm ? 'Peida vorm' : 'Lisa uus sooduskood'}
            </button>

            {showDiscountForm && (
              <form onSubmit={handleDiscountSubmit} className="bg-slate-800 p-6 rounded-lg mb-8 border-2 border-joulu-gold">
                <h2 className="text-2xl font-bold mb-4">{editingDiscount ? 'Muuda sooduskoodi' : 'Lisa uus sooduskood'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Pealkiri *</label>
                    <input
                      type="text"
                      required
                      value={discountFormData.title}
                      onChange={(e) => setDiscountFormData({ ...discountFormData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Sooduskood *</label>
                    <input
                      type="text"
                      required
                      value={discountFormData.code}
                      onChange={(e) => setDiscountFormData({ ...discountFormData, code: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Kirjeldus *</label>
                    <textarea
                      required
                      value={discountFormData.description}
                      onChange={(e) => setDiscountFormData({ ...discountFormData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Link *</label>
                    <input
                      type="url"
                      required
                      value={discountFormData.link}
                      onChange={(e) => setDiscountFormData({ ...discountFormData, link: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Soodus *</label>
                    <input
                      type="text"
                      required
                      value={discountFormData.discount}
                      onChange={(e) => setDiscountFormData({ ...discountFormData, discount: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      placeholder="-15%"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button type="submit" className="px-6 py-3 bg-joulu-green rounded-lg hover:bg-green-700 font-bold">
                    {editingDiscount ? 'Uuenda' : 'Lisa'}
                  </button>
                  <button type="button" onClick={resetDiscountForm} className="px-6 py-3 bg-slate-600 rounded-lg hover:bg-slate-500">
                    Tühista
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discounts.map((discount) => (
                <div key={discount.id} className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">{discount.title}</h3>
                  <p className="text-white/80 mb-2">{discount.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-white/60">Kood:</p>
                      <p className="font-mono font-bold text-joulu-gold">{discount.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/60">Soodus:</p>
                      <p className="font-bold text-lg">{discount.discount}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDiscount(discount)}
                      className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Muuda
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="px-3 py-2 bg-red-600 rounded hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jõuluketas Tab */}
        {activeTab === 'wheel' && (
          <div>
            <button
              onClick={() => setShowWheelForm(!showWheelForm)}
              className="mb-6 px-6 py-3 bg-joulu-red rounded-lg hover:bg-red-700 font-bold flex items-center gap-2"
            >
              <Plus size={20} />
              {showWheelForm ? 'Peida vorm' : 'Lisa uus ketta element'}
            </button>

            {showWheelForm && (
              <form onSubmit={handleWheelSubmit} className="bg-slate-800 p-6 rounded-lg mb-8 border-2 border-joulu-gold">
                <h2 className="text-2xl font-bold mb-4">{editingWheelItem ? 'Muuda ketta elementi' : 'Lisa uus ketta element'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Tekst (vastus) *</label>
                    <input
                      type="text"
                      required
                      value={wheelFormData.text}
                      onChange={(e) => setWheelFormData({ ...wheelFormData, text: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      placeholder="Nt: Robin armastab Legot!"
                    />
                    <p className="text-sm text-white/60 mt-1">See on õige vastus, mis näidatakse pärast küsimust</p>
                  </div>
                  <div>
                    <label className="block mb-2">Emoji *</label>
                    <input
                      type="text"
                      required
                      value={wheelFormData.emoji}
                      onChange={(e) => setWheelFormData({ ...wheelFormData, emoji: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      placeholder="🧱"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Küsimus (valikuline)</label>
                    <textarea
                      value={wheelFormData.question}
                      onChange={(e) => setWheelFormData({ ...wheelFormData, question: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      rows={2}
                      placeholder="Nt: Mida Robin armastab mängida?"
                    />
                    <p className="text-sm text-white/60 mt-1">Kui lisad küsimuse, näidatakse see enne vastust. Kasutaja saab mõelda vastust ja siis vajutada "Näita vastust" nuppu.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Helifaili URL (valikuline - Robin räägib õige vastuse)</label>
                    <input
                      type="url"
                      value={wheelFormData.audioUrl}
                      onChange={(e) => setWheelFormData({ ...wheelFormData, audioUrl: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      placeholder="/audio/robin-räägib.mp3 või täielik URL"
                    />
                    <p className="text-sm text-white/60 mt-1">Kui lisad helifaili, mängib see, kui kasutaja vajutab "Näita vastust" nuppu. Robin räägib õige vastuse.</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button type="submit" className="px-6 py-3 bg-joulu-green rounded-lg hover:bg-green-700 font-bold">
                    {editingWheelItem ? 'Uuenda' : 'Lisa'}
                  </button>
                  <button type="button" onClick={resetWheelForm} className="px-6 py-3 bg-slate-600 rounded-lg hover:bg-slate-500">
                    Tühista
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wheelItems.map((item) => (
                <div key={item.id} className="bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{item.emoji}</span>
                    <p className="font-bold text-lg">{item.text}</p>
                  </div>
                  {item.question && (
                    <p className="text-sm text-white/80 mb-2">❓ Küsimus: {item.question}</p>
                  )}
                  {item.audioUrl && (
                    <p className="text-sm text-white/60 mb-2">🎤 Helifail: {item.audioUrl}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditWheelItem(item)}
                      className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Muuda
                    </button>
                    <button
                      onClick={() => handleDeleteWheelItem(item.id)}
                      className="px-3 py-2 bg-red-600 rounded hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Postkontori kirjad Tab */}
        {activeTab === 'letters' && (
          <div>
            <button
              onClick={() => setShowLetterForm(!showLetterForm)}
              className="mb-6 px-6 py-3 bg-joulu-red rounded-lg hover:bg-red-700 font-bold flex items-center gap-2"
            >
              <Plus size={20} />
              {showLetterForm ? 'Peida vorm' : 'Lisa uus kiri'}
            </button>

            {showLetterForm && (
              <form onSubmit={handleLetterSubmit} className="bg-slate-800 p-6 rounded-lg mb-8 border-2 border-joulu-gold">
                <h2 className="text-2xl font-bold mb-4">{editingLetter ? 'Muuda kirja' : 'Lisa uus kiri'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block mb-2">Robini kirja foto URL *</label>
                    <input
                      type="text"
                      required
                      value={letterFormData.imageUrl}
                      onChange={(e) => {
                        let value = e.target.value
                        // Teisenda Windows failitee veebi URL-iks
                        if (value.includes('public\\images\\') || value.includes('public/images/')) {
                          value = value.replace(/.*public[\\\/]images[\\\/]/, '/images/')
                        } else if (value.includes('\\images\\') || value.includes('/images/')) {
                          value = value.replace(/.*[\\\/]images[\\\/]/, '/images/')
                        } else if (value.match(/^[A-Z]:\\/)) {
                          // Windows absoluutne tee
                          const match = value.match(/public[\\\/]images[\\\/](.+)$/i)
                          if (match) {
                            value = `/images/${match[1].replace(/\\/g, '/')}`
                          }
                        }
                        setLetterFormData({ ...letterFormData, imageUrl: value })
                      }}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      placeholder="/images/robin-kiri.jpg"
                    />
                    <p className="text-sm text-white/60 mt-1">
                      💡 <strong>Õige formaat:</strong> <code>/images/robin-kiri.jpg</code>
                      <br />
                      Foto Robini kirjutatud kirjast. Kui fail on <code>public/images/robin-kiri.jpg</code>, siis URL on <code>/images/robin-kiri.jpg</code>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Pealkiri *</label>
                    <input
                      type="text"
                      required
                      value={letterFormData.title}
                      onChange={(e) => setLetterFormData({ ...letterFormData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      placeholder="Nt: Robini jõulukiri"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-2">Kirjeldus (valikuline)</label>
                    <textarea
                      value={letterFormData.description}
                      onChange={(e) => setLetterFormData({ ...letterFormData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                      rows={3}
                      placeholder="Lühike kirjeldus kirjast..."
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button type="submit" className="px-6 py-3 bg-joulu-green rounded-lg hover:bg-green-700 font-bold">
                    {editingLetter ? 'Uuenda' : 'Lisa'}
                  </button>
                  <button type="button" onClick={resetLetterForm} className="px-6 py-3 bg-slate-600 rounded-lg hover:bg-slate-500">
                    Tühista
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {letters.map((letter) => (
                <div key={letter.id} className="bg-slate-800 p-4 rounded-lg">
                  <div className="aspect-video bg-slate-700 rounded mb-3 overflow-hidden">
                    <img src={letter.imageUrl} alt={letter.title} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold mb-1">{letter.title}</h3>
                  {letter.description && (
                    <p className="text-sm text-white/60 mb-3">{letter.description}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditLetter(letter)}
                      className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Muuda
                    </button>
                    <button
                      onClick={() => handleDeleteLetter(letter.id)}
                      className="px-3 py-2 bg-red-600 rounded hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
