import { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import {
  Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  assertFails,
  assertSucceeds,
  clearData,
  createTestEnvironment,
  futureTimestamp,
  pastTimestamp,
  seedList,
} from '@/tests/helpers/firebase-test-env'

describe('firestore rules', () => {
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

  it('allows owner to create a valid list', async () => {
    const ownerId = 'owner-1'
    const listId = 'list-valid-create'
    const trialEndsAt = futureTimestamp(14)

    const ownerDb = testEnv.authenticatedContext(ownerId).firestore()
    await assertSucceeds(
      setDoc(doc(ownerDb, 'lists', listId), {
        ownerId,
        title: 'Valid List',
        slug: 'valid-list',
        eventType: 'birthday',
        templateId: 'classic',
        visibility: 'public',
        status: 'draft',
        billingModel: 'one_time_90d',
        trialEndsAt,
        paidAccessEndsAt: null,
        purgeAt: trialEndsAt,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )
  })

  it('blocks public read for private list and allows owner read', async () => {
    await seedList(testEnv, {
      listId: 'list-private',
      ownerId: 'owner-private',
      visibility: 'private',
      trialEndsAt: futureTimestamp(),
    })

    const ownerDb = testEnv.authenticatedContext('owner-private').firestore()
    const anonDb = testEnv.unauthenticatedContext().firestore()

    await assertSucceeds(getDoc(doc(ownerDb, 'lists', 'list-private')))
    await assertFails(getDoc(doc(anonDb, 'lists', 'list-private')))
  })

  it('allows public read only when list is public and active', async () => {
    await seedList(testEnv, {
      listId: 'list-public-active',
      ownerId: 'owner-public',
      visibility: 'public',
      trialEndsAt: futureTimestamp(),
    })
    await seedList(testEnv, {
      listId: 'list-public-expired',
      ownerId: 'owner-public',
      visibility: 'public',
      trialEndsAt: pastTimestamp(),
      paidAccessEndsAt: null,
    })

    const anonDb = testEnv.unauthenticatedContext().firestore()

    await assertSucceeds(getDoc(doc(anonDb, 'lists', 'list-public-active')))
    await assertFails(getDoc(doc(anonDb, 'lists', 'list-public-expired')))
  })

  it('allows only valid public reservation update for available items', async () => {
    const listId = 'list-reservation'
    const itemId = 'item-1'
    await seedList(testEnv, {
      listId,
      ownerId: 'owner-reservation',
      visibility: 'public',
      trialEndsAt: futureTimestamp(),
    })

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'lists', listId, 'items', itemId), {
        listId,
        name: 'Vaas',
        description: 'Test item',
        link: null,
        mediaUrl: null,
        mediaPath: null,
        mediaType: null,
        status: 'available',
        reservedByName: null,
        reservedMessage: null,
        reservedAt: null,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    })

    const anonDb = testEnv.unauthenticatedContext().firestore()
    const itemRef = doc(anonDb, 'lists', listId, 'items', itemId)

    await assertSucceeds(
      updateDoc(itemRef, {
        status: 'reserved',
        reservedByName: 'Guest',
        reservedMessage: 'See you!',
        reservedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )

    await assertFails(
      updateDoc(itemRef, {
        name: 'Changed by guest',
      })
    )
  })

  it('allows owner to manage stories and wheel entries, public read-only', async () => {
    const listId = 'list-story-wheel'
    const ownerId = 'owner-story'

    await seedList(testEnv, {
      listId,
      ownerId,
      visibility: 'public',
      trialEndsAt: futureTimestamp(),
    })

    const ownerDb = testEnv.authenticatedContext(ownerId).firestore()
    const anonDb = testEnv.unauthenticatedContext().firestore()
    const storyRef = doc(ownerDb, 'lists', listId, 'stories', 'story-1')
    const wheelRef = doc(ownerDb, 'lists', listId, 'wheelEntries', 'wheel-1')

    await assertSucceeds(
      setDoc(storyRef, {
        listId,
        title: 'How we met',
        body: 'At the cafe.',
        mediaUrl: null,
        mediaPath: null,
        mediaType: null,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )

    await assertSucceeds(
      setDoc(wheelRef, {
        listId,
        question: 'What is our song?',
        answerText: 'Song title',
        answerAudioUrl: null,
        answerAudioPath: null,
        answerAudioType: null,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )

    await assertSucceeds(getDoc(doc(anonDb, 'lists', listId, 'stories', 'story-1')))
    await assertSucceeds(getDoc(doc(anonDb, 'lists', listId, 'wheelEntries', 'wheel-1')))

    await assertFails(
      setDoc(doc(anonDb, 'lists', listId, 'stories', 'story-2'), {
        listId,
        title: 'Anonymous write',
        body: 'Should fail',
        mediaUrl: null,
        mediaPath: null,
        mediaType: null,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )
  })
})

