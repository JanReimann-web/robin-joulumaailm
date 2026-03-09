import { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import {
  assertSucceeds,
  clearData,
  createTestEnvironment,
  futureTimestamp,
  seedAccountEntitlement,
  seedList,
} from '@/tests/helpers/firebase-test-env'

describe('e2e complimentary access flow', () => {
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

  it('allows a complimentary owner to publish publicly without paid package', async () => {
    const ownerId = 'owner-complimentary'
    const listId = 'list-complimentary-flow'
    const itemId = 'item-complimentary'
    const now = Timestamp.fromDate(new Date())

    await seedList(testEnv, {
      listId,
      ownerId,
      slug: 'complimentary-list',
      visibility: 'public',
      trialEndsAt: futureTimestamp(14),
      paidAccessEndsAt: null,
    })
    await seedAccountEntitlement(testEnv, {
      userId: ownerId,
    })

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'lists', listId, 'items', itemId), {
        listId,
        order: 0,
        name: 'Coffee machine',
        description: 'For long mornings',
        link: 'https://shop.example/coffee-machine',
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
    })

    const guestDb = testEnv.unauthenticatedContext().firestore()

    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId)))
    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId, 'items', itemId)))

    await assertSucceeds(
      updateDoc(doc(guestDb, 'lists', listId, 'items', itemId), {
        status: 'reserved',
        reservedByName: 'Guest',
        reservedMessage: 'Reserved with complimentary access',
        reservedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    )
  })
})
