import { readFileSync } from 'node:fs'
import { after, before, beforeEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

const projectId = 'demo-rakutann-friends'
const rulesPath = fileURLToPath(new URL('../../firestore.rules', import.meta.url))
let testEnvironment

const firestoreFor = (uid) => testEnvironment.authenticatedContext(uid).firestore()

const createProfile = async (uid, friendCode) => {
  const database = firestoreFor(uid)
  await assertSucceeds(
    runTransaction(database, async (transaction) => {
      transaction.set(doc(database, 'profiles', uid), {
        uid,
        displayName: uid,
        photoURL: '',
        friendCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      transaction.set(doc(database, 'friendCodes', friendCode), {
        code: friendCode,
        ownerUid: uid,
        createdAt: serverTimestamp(),
      })
    }),
  )
}

const requestFriendship = async (senderUid, receiverUid) => {
  const database = firestoreFor(senderUid)
  await assertSucceeds(
    setDoc(doc(database, 'friendRequests', receiverUid, 'requests', senderUid), {
      senderUid,
      receiverUid,
      status: 'pending',
      createdAt: serverTimestamp(),
    }),
  )
}

const writeFriendship = async (actorUid, senderUid, receiverUid) => {
  const database = firestoreFor(actorUid)
  const batch = writeBatch(database)
  const acceptance = {
    acceptedBy: receiverUid,
    requestedBy: senderUid,
    acceptedAt: serverTimestamp(),
  }
  batch.set(doc(database, 'friends', receiverUid, 'members', senderUid), {
    ...acceptance,
    userId: receiverUid,
    friendUid: senderUid,
  })
  batch.set(doc(database, 'friends', senderUid, 'members', receiverUid), {
    ...acceptance,
    userId: senderUid,
    friendUid: receiverUid,
  })
  return batch.commit()
}

const acceptFriendship = async (senderUid, receiverUid) => {
  await requestFriendship(senderUid, receiverUid)
  await assertSucceeds(writeFriendship(receiverUid, senderUid, receiverUid))
}

const createSharedSchedule = async (uid) => {
  const database = firestoreFor(uid)
  await assertSucceeds(
    setDoc(doc(database, 'sharedSchedules', uid, 'years', '2026'), {
      ownerUid: uid,
      academicYear: 2026,
      courses: [
        {
          id: '2026_course-1',
          name: 'テスト授業',
          day: '月',
          period: 1,
          semester: '前期',
        },
      ],
      updatedAt: serverTimestamp(),
    }),
  )
}

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync(rulesPath, 'utf8') },
  })
})

beforeEach(async () => {
  await testEnvironment.clearFirestore()
})

after(async () => {
  await testEnvironment.cleanup()
})

test('friend codes are created atomically and profiles stay private before a request', async () => {
  await createProfile('alice', 'ABCD2345')
  await createProfile('bob', 'WXYZ6789')

  await assertSucceeds(getDoc(doc(firestoreFor('bob'), 'friendCodes', 'ABCD2345')))
  await assertFails(getDoc(doc(firestoreFor('bob'), 'profiles', 'alice')))

  await requestFriendship('bob', 'alice')
  await assertSucceeds(getDoc(doc(firestoreFor('alice'), 'profiles', 'bob')))
})

test('only the receiver can list and approve incoming friend requests', async () => {
  await requestFriendship('alice', 'bob')

  await assertSucceeds(
    getDoc(doc(firestoreFor('bob'), 'friendRequests', 'bob', 'requests', 'alice')),
  )
  await assertFails(
    getDoc(doc(firestoreFor('carol'), 'friendRequests', 'bob', 'requests', 'alice')),
  )
  await assertFails(writeFriendship('alice', 'alice', 'bob'))
  await assertSucceeds(writeFriendship('bob', 'alice', 'bob'))
})

test('accepted friends can read schedules while outsiders cannot', async () => {
  await acceptFriendship('alice', 'bob')
  await createSharedSchedule('bob')

  await assertSucceeds(
    getDoc(doc(firestoreFor('alice'), 'sharedSchedules', 'bob', 'years', '2026')),
  )
  await assertFails(getDoc(doc(firestoreFor('carol'), 'sharedSchedules', 'bob', 'years', '2026')))
})

test('removing both friendship records immediately revokes schedule access', async () => {
  await acceptFriendship('alice', 'bob')
  await createSharedSchedule('bob')

  const database = firestoreFor('alice')
  const batch = writeBatch(database)
  batch.delete(doc(database, 'friends', 'alice', 'members', 'bob'))
  batch.delete(doc(database, 'friends', 'bob', 'members', 'alice'))
  await assertSucceeds(batch.commit())

  await assertFails(getDoc(doc(firestoreFor('alice'), 'sharedSchedules', 'bob', 'years', '2026')))
})

test('a group memo requires every member pair to be friends', async () => {
  await acceptFriendship('alice', 'bob')
  await acceptFriendship('alice', 'carol')

  const database = firestoreFor('alice')
  const groupReference = doc(database, 'sharedMemoGroups', 'group-1')
  const createGroup = () => {
    const batch = writeBatch(database)
    batch.set(groupReference, {
      academicYear: 2026,
      courseId: '2026_course-1',
      courseName: 'テスト授業',
      memberIds: ['alice', 'bob', 'carol'],
      memo: '',
      createdBy: 'alice',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    for (const memberId of ['alice', 'bob', 'carol']) {
      batch.set(doc(database, 'memoMemberships', memberId, 'groups', 'group-1'), {
        groupId: 'group-1',
        memberId,
        createdAt: serverTimestamp(),
      })
    }
    return batch.commit()
  }

  await assertFails(createGroup())
  await acceptFriendship('bob', 'carol')
  await assertSucceeds(createGroup())
  await assertSucceeds(getDoc(doc(firestoreFor('bob'), 'sharedMemoGroups', 'group-1')))
  await assertFails(getDoc(doc(firestoreFor('dave'), 'sharedMemoGroups', 'group-1')))
  await assertSucceeds(
    updateDoc(doc(firestoreFor('carol'), 'sharedMemoGroups', 'group-1'), {
      memo: '全員で共有するメモ',
      updatedAt: serverTimestamp(),
    }),
  )
})

test('five mutually connected friends can create a shared memo', async () => {
  const memberIds = ['alice', 'bob', 'carol', 'dave', 'eve']
  for (let first = 0; first < memberIds.length; first += 1) {
    for (let second = first + 1; second < memberIds.length; second += 1) {
      await acceptFriendship(memberIds[first], memberIds[second])
    }
  }

  const database = firestoreFor('alice')
  const batch = writeBatch(database)
  batch.set(doc(database, 'sharedMemoGroups', 'group-5'), {
    academicYear: 2026,
    courseId: '2026_course-1',
    courseName: 'テスト授業',
    memberIds,
    memo: '',
    createdBy: 'alice',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  for (const memberId of memberIds) {
    batch.set(doc(database, 'memoMemberships', memberId, 'groups', 'group-5'), {
      groupId: 'group-5',
      memberId,
      createdAt: serverTimestamp(),
    })
  }

  await assertSucceeds(batch.commit())
})
