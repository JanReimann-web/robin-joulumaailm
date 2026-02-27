import { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import {
  assertFails,
  assertSucceeds,
  clearData,
  createTestEnvironment,
  futureTimestamp,
  pastTimestamp,
  seedList,
} from '@/tests/helpers/firebase-test-env'

describe('e2e access lifecycle', () => {
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

  it('switches public access off after expiry and on again after paid pass extension', async () => {
    const ownerId = 'owner-access'
    const listId = 'list-access-lifecycle'
    const itemId = 'item-access-lifecycle'
    const now = Timestamp.fromDate(new Date())

    await seedList(testEnv, {
      listId,
      ownerId,
      visibility: 'public',
      trialEndsAt: futureTimestamp(14),
    })

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await setDoc(doc(db, 'lists', listId, 'items', itemId), {
        listId,
        name: 'Diivanilaud',
        description: 'Modernne laud',
        link: null,
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

    const ownerDb = testEnv.authenticatedContext(ownerId).firestore()
    const guestDb = testEnv.unauthenticatedContext().firestore()

    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId)))
    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId, 'items', itemId)))

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      await updateDoc(doc(db, 'lists', listId), {
        trialEndsAt: pastTimestamp(2),
        paidAccessEndsAt: null,
        purgeAt: pastTimestamp(2),
        updatedAt: Timestamp.fromDate(new Date()),
      })
    })

    await assertFails(getDoc(doc(guestDb, 'lists', listId)))
    await assertFails(getDoc(doc(guestDb, 'lists', listId, 'items', itemId)))
    await assertSucceeds(getDoc(doc(ownerDb, 'lists', listId)))
    await assertSucceeds(getDoc(doc(ownerDb, 'lists', listId, 'items', itemId)))

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      const paidEndsAt = futureTimestamp(90)
      await updateDoc(doc(db, 'lists', listId), {
        paidAccessEndsAt: paidEndsAt,
        purgeAt: paidEndsAt,
        updatedAt: Timestamp.fromDate(new Date()),
      })
    })

    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId)))
    await assertSucceeds(getDoc(doc(guestDb, 'lists', listId, 'items', itemId)))
  })
})
