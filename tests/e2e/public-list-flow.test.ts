import { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import {
  assertFails,
  assertSucceeds,
  clearData,
  createTestEnvironment,
  seedList,
} from '@/tests/helpers/firebase-test-env'

describe('e2e public list flow', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await createTestEnvironment()
  })

  beforeEach(async () => {
    await clearData(testEnv)
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  it('supports owner create -> guest view -> guest reserve happy path', async () => {
    const ownerId = 'owner-happy'
    const listId = 'list-happy-path'
    const itemId = 'item-happy'
    const now = Timestamp.fromDate(new Date())

    const ownerDb = testEnv.authenticatedContext(ownerId).firestore()
    const guestDb = testEnv.unauthenticatedContext().firestore()

    await seedList(testEnv, {
      listId,
      ownerId,
      slug: 'marju-ja-kalev',
      visibility: 'public',
      paidAccessEndsAt: Timestamp.fromDate(
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      ),
    })

    await assertSucceeds(
      setDoc(doc(ownerDb, 'lists', listId, 'items', itemId), {
        listId,
        order: 0,
        name: 'Vaas',
        description: 'Sobib meile elutuppa',
        link: 'https://shop.example/item',
        mediaUrl: null,
        mediaPath: null,
        mediaType: null,
        status: 'available',
        reservedByName: null,
        reservedMessage: null,
        reservedAt: null,
        createdAt: now,
        updatedAt: now,
      })
    )

    await assertSucceeds(
      setDoc(doc(ownerDb, 'lists', listId, 'stories', 'story-1'), {
        listId,
        order: 0,
        title: 'Kuidas kohtusime',
        body: 'Kohvikus.',
        mediaUrl: null,
        mediaPath: null,
        mediaType: null,
        createdAt: now,
        updatedAt: now,
      })
    )

    await assertSucceeds(
      setDoc(doc(ownerDb, 'lists', listId, 'wheelEntries', 'wheel-1'), {
        listId,
        order: 0,
        question: 'Mis oli esimene reis?',
        answerText: 'Itaalia',
        createdAt: now,
        updatedAt: now,
      })
    )

    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId)))
    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId, 'items', itemId)))
    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId, 'stories', 'story-1')))
    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId, 'wheelEntries', 'wheel-1')))

    await assertSucceeds(
      updateDoc(doc(guestDb, 'lists', listId, 'items', itemId), {
        status: 'reserved',
        reservedByName: 'Mari',
        reservedMessage: 'Kohtume peol',
        reservedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )

    await assertSucceeds(
      setDoc(doc(guestDb, 'lists', listId, 'reservations', 'reservation-1'), {
        itemId,
        guestName: 'Mari',
        guestMessage: 'Kohtume peol',
        status: 'active',
        createdAt: Timestamp.fromDate(new Date()),
      })
    )

    const secondGuestDb = testEnv.unauthenticatedContext().firestore()
    await assertFails(
      updateDoc(doc(secondGuestDb, 'lists', listId, 'items', itemId), {
        status: 'reserved',
        reservedByName: 'Jaan',
        reservedMessage: 'Topelt',
        reservedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )
  })
})


