import { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import {
  assertFails,
  assertSucceeds,
  clearData,
  createTestEnvironment,
  futureTimestamp,
  pastTimestamp,
  seedList,
  TEST_STORAGE_BUCKET,
} from '@/tests/helpers/firebase-test-env'

describe('storage rules', () => {
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

  it('allows list owner to upload supported media under list path', async () => {
    const ownerId = 'owner-storage'
    const listId = 'list-storage-owner'
    const path = `lists/${listId}/items/photo.jpg`

    await seedList(testEnv, {
      listId,
      ownerId,
      visibility: 'private',
      trialEndsAt: futureTimestamp(14),
    })

    const ownerStorage = testEnv
      .authenticatedContext(ownerId)
      .storage(`gs://${TEST_STORAGE_BUCKET}`)
    await assertSucceeds(
      ownerStorage
        .ref(path)
        .putString('image-bytes', 'raw', {
          contentType: 'image/jpeg',
        })
        .then(() => true)
    )
  })

  it('blocks unsupported media upload type for owner', async () => {
    const ownerId = 'owner-storage'
    const listId = 'list-storage-type'
    const path = `lists/${listId}/items/readme.txt`

    await seedList(testEnv, {
      listId,
      ownerId,
      visibility: 'private',
      trialEndsAt: futureTimestamp(14),
    })

    const ownerStorage = testEnv
      .authenticatedContext(ownerId)
      .storage(`gs://${TEST_STORAGE_BUCKET}`)
    await assertFails(
      ownerStorage
        .ref(path)
        .putString('not-media', 'raw', {
          contentType: 'text/plain',
        })
        .then(() => true)
    )
  })

  it('allows public read for active public list assets and blocks expired list assets', async () => {
    const activeListId = 'list-storage-public-active'
    const expiredListId = 'list-storage-public-expired'
    const activePath = `lists/${activeListId}/stories/photo.jpg`
    const expiredPath = `lists/${expiredListId}/stories/photo.jpg`

    await seedList(testEnv, {
      listId: activeListId,
      ownerId: 'owner-public',
      visibility: 'public',
      trialEndsAt: futureTimestamp(14),
    })
    await seedList(testEnv, {
      listId: expiredListId,
      ownerId: 'owner-public',
      visibility: 'public',
      trialEndsAt: pastTimestamp(1),
      paidAccessEndsAt: null,
    })

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminStorage = context.storage(`gs://${TEST_STORAGE_BUCKET}`)
      await adminStorage.ref(activePath).putString('active-file', 'raw', {
        contentType: 'image/jpeg',
      })
      await adminStorage.ref(expiredPath).putString('expired-file', 'raw', {
        contentType: 'image/jpeg',
      })
    })

    const guestStorage = testEnv
      .unauthenticatedContext()
      .storage(`gs://${TEST_STORAGE_BUCKET}`)
    await assertSucceeds(guestStorage.ref(activePath).getMetadata())
    await assertFails(guestStorage.ref(expiredPath).getMetadata())
  })

  it('blocks non-owner writes to list assets', async () => {
    const ownerId = 'owner-storage'
    const guestId = 'guest-storage'
    const listId = 'list-storage-non-owner'
    const path = `lists/${listId}/items/guest.jpg`

    await seedList(testEnv, {
      listId,
      ownerId,
      visibility: 'public',
      trialEndsAt: futureTimestamp(14),
    })

    const guestStorage = testEnv
      .authenticatedContext(guestId)
      .storage(`gs://${TEST_STORAGE_BUCKET}`)
    await assertFails(
      guestStorage
        .ref(path)
        .putString('guest-image', 'raw', {
          contentType: 'image/jpeg',
        })
        .then(() => true)
    )
  })

  it('enforces user media folder isolation', async () => {
    const aliceStorage = testEnv
      .authenticatedContext('alice')
      .storage(`gs://${TEST_STORAGE_BUCKET}`)
    const bobStorage = testEnv
      .authenticatedContext('bob')
      .storage(`gs://${TEST_STORAGE_BUCKET}`)
    const userPath = 'users/alice/profile/avatar.png'

    await assertSucceeds(
      aliceStorage
        .ref(userPath)
        .putString('avatar', 'raw', {
          contentType: 'image/png',
        })
        .then(() => true)
    )
    await assertSucceeds(aliceStorage.ref(userPath).getMetadata())

    await assertFails(
      bobStorage
        .ref(userPath)
        .putString('hijack', 'raw', {
          contentType: 'image/png',
        })
        .then(() => true)
    )
    await assertFails(bobStorage.ref(userPath).getMetadata())
  })
})
