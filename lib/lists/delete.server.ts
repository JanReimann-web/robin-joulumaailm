import 'server-only'
import { DocumentReference } from 'firebase-admin/firestore'
import { adminDb, adminStorage } from '@/lib/firebase/admin'

type ListSubcollection = 'items' | 'reservations' | 'stories' | 'wheelEntries'

const deleteSubcollection = async (
  listRef: DocumentReference,
  collectionName: ListSubcollection
) => {
  let deletedCount = 0

  while (true) {
    const snapshot = await listRef.collection(collectionName).limit(300).get()
    if (snapshot.empty) {
      break
    }

    const batch = adminDb.batch()
    snapshot.docs.forEach((entry) => batch.delete(entry.ref))
    await batch.commit()

    deletedCount += snapshot.size
  }

  return deletedCount
}

const deleteSlugClaimsForList = async (listId: string, slug: string | null) => {
  let deletedCount = 0

  if (slug) {
    const slugRef = adminDb.collection('slugClaims').doc(slug)
    const slugSnapshot = await slugRef.get()
    if (slugSnapshot.exists) {
      await slugRef.delete()
      deletedCount += 1
    }
  }

  const claimSnapshot = await adminDb
    .collection('slugClaims')
    .where('listId', '==', listId)
    .get()

  if (!claimSnapshot.empty) {
    const batch = adminDb.batch()
    claimSnapshot.docs.forEach((entry) => batch.delete(entry.ref))
    await batch.commit()
    deletedCount += claimSnapshot.size
  }

  return deletedCount
}

const deleteListStorage = async (listId: string, ownerId: string | null) => {
  const bucket = adminStorage.bucket()
  const prefixes = [`lists/${listId}/`]

  if (ownerId) {
    prefixes.push(`users/${ownerId}/lists/${listId}/`)
  }

  let deletedPrefixes = 0

  for (const prefix of prefixes) {
    try {
      await bucket.deleteFiles({ prefix, force: true })
      deletedPrefixes += 1
    } catch {
      continue
    }
  }

  return deletedPrefixes
}

export const deleteListWithAssets = async (params: {
  listId: string
  slug: string | null
  ownerId: string | null
}) => {
  const listRef = adminDb.collection('lists').doc(params.listId)

  const deletedItems = await deleteSubcollection(listRef, 'items')
  const deletedReservations = await deleteSubcollection(listRef, 'reservations')
  const deletedStories = await deleteSubcollection(listRef, 'stories')
  const deletedWheelEntries = await deleteSubcollection(listRef, 'wheelEntries')
  const deletedSlugClaims = await deleteSlugClaimsForList(params.listId, params.slug)

  const secretRef = adminDb.collection('listAccessSecrets').doc(params.listId)
  const secretSnapshot = await secretRef.get()
  if (secretSnapshot.exists) {
    await secretRef.delete()
  }

  await listRef.delete()

  const deletedStoragePrefixes = await deleteListStorage(params.listId, params.ownerId)

  return {
    deletedList: 1,
    deletedItems,
    deletedReservations,
    deletedStories,
    deletedWheelEntries,
    deletedSlugClaims,
    deletedSecrets: secretSnapshot.exists ? 1 : 0,
    deletedStoragePrefixes,
  }
}
