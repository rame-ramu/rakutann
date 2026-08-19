import { FirebaseError } from 'firebase/app'
import type { User } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { computed, ref, shallowRef, watch } from 'vue'
import { firestoreDb } from './firebase'
import { store, type Course } from './store'
import { getCurrentAcademicYear } from './utils/academicYear'

const FRIEND_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const FRIEND_CODE_LENGTH = 8
const SCHEDULE_SAVE_DELAY_MS = 700
const MEMO_SAVE_DELAY_MS = 700
const MAX_SHARED_MEMO_MEMBERS = 5

export interface FriendProfile {
  uid: string
  displayName: string
  photoURL: string
  friendCode: string
}

export interface SharedScheduleCourse {
  id: string
  name: string
  day: string
  period: number
  semester: string
}

export interface FriendSummary extends FriendProfile {
  courses: SharedScheduleCourse[]
}

export interface IncomingFriendRequest {
  senderUid: string
  profile: FriendProfile
}

export interface SharedMemoGroup {
  id: string
  academicYear: number
  courseId: string
  courseName: string
  memberIds: string[]
  memo: string
}

interface FriendEntry {
  profile: FriendProfile | null
  courses: SharedScheduleCourse[]
}

class FriendCodeCollisionError extends Error {}

export const myFriendProfile = shallowRef<FriendProfile | null>(null)
export const friends = ref<FriendSummary[]>([])
export const incomingFriendRequests = ref<IncomingFriendRequest[]>([])
export const sharedMemoGroups = ref<SharedMemoGroup[]>([])
export const isFriendFeatureLoading = ref(false)
export const friendFeatureError = ref('')
export const friendActionMessage = ref('')
export const pendingFriendRequestCount = computed(() => incomingFriendRequests.value.length)

let activeUserId: string | null = null
let initializationGeneration = 0
let isPersistenceStarted = false
let scheduleSaveTimer: ReturnType<typeof setTimeout> | null = null
const rootUnsubscribes: Unsubscribe[] = []
const friendUnsubscribes = new Map<string, Unsubscribe[]>()
const memoGroupUnsubscribes = new Map<string, Unsubscribe>()
const friendEntries = new Map<string, FriendEntry>()
const memoGroupsById = new Map<string, SharedMemoGroup>()
const pendingMemoValues = new Map<string, string>()
const memoSaveTimers = new Map<string, ReturnType<typeof setTimeout>>()

const normalizeProfile = (uid: string, value: unknown): FriendProfile | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const profile = value as Partial<FriendProfile>
  if (profile.uid !== uid || typeof profile.friendCode !== 'string') return null

  return {
    uid,
    displayName:
      typeof profile.displayName === 'string' && profile.displayName.trim()
        ? profile.displayName.trim().slice(0, 80)
        : 'Googleユーザー',
    photoURL: typeof profile.photoURL === 'string' ? profile.photoURL : '',
    friendCode: profile.friendCode,
  }
}

const normalizeCourses = (value: unknown): SharedScheduleCourse[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter((course): course is SharedScheduleCourse => {
      if (!course || typeof course !== 'object' || Array.isArray(course)) return false
      const item = course as Partial<SharedScheduleCourse>
      return (
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.day === 'string' &&
        typeof item.period === 'number' &&
        Number.isInteger(item.period) &&
        item.period >= 1 &&
        item.period <= 5 &&
        typeof item.semester === 'string'
      )
    })
    .map((course) => ({
      id: course.id,
      name: course.name,
      day: course.day,
      period: course.period,
      semester: course.semester,
    }))
}

const normalizeMemoGroup = (id: string, value: unknown): SharedMemoGroup | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const group = value as Partial<SharedMemoGroup>
  if (
    typeof group.academicYear !== 'number' ||
    typeof group.courseId !== 'string' ||
    typeof group.courseName !== 'string' ||
    !Array.isArray(group.memberIds) ||
    !group.memberIds.every((uid): uid is string => typeof uid === 'string') ||
    typeof group.memo !== 'string'
  ) {
    return null
  }

  return {
    id,
    academicYear: group.academicYear,
    courseId: group.courseId,
    courseName: group.courseName,
    memberIds: [...group.memberIds],
    memo: pendingMemoValues.get(id) ?? group.memo,
  }
}

const getFriendErrorMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return '友達機能でエラーが発生しました。時間をおいて、もう一度お試しください。'
  }

  switch (error.code) {
    case 'permission-denied':
      return '友達機能のアクセス設定を確認してください。'
    case 'unavailable':
      return 'オフラインのため、友達機能に接続できません。'
    case 'not-found':
      return '対象のデータが見つかりませんでした。'
    default:
      return '友達機能に接続できませんでした。時間をおいてお試しください。'
  }
}

const generateFriendCode = () => {
  const randomValues = new Uint32Array(FRIEND_CODE_LENGTH)
  crypto.getRandomValues(randomValues)
  return Array.from(
    randomValues,
    (value) => FRIEND_CODE_CHARACTERS[value % FRIEND_CODE_CHARACTERS.length],
  ).join('')
}

const syncFriends = () => {
  friends.value = Array.from(friendEntries.values())
    .filter((entry): entry is { profile: FriendProfile; courses: SharedScheduleCourse[] } =>
      Boolean(entry.profile),
    )
    .map((entry) => ({ ...entry.profile, courses: entry.courses }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'))
}

const syncMemoGroups = () => {
  sharedMemoGroups.value = Array.from(memoGroupsById.values()).sort((a, b) =>
    a.courseName.localeCompare(b.courseName, 'ja'),
  )
}

const ensureFriendProfile = async (user: User) => {
  const profileReference = doc(firestoreDb, 'profiles', user.uid)
  const existingProfile = await getDoc(profileReference)

  if (existingProfile.exists()) {
    const profile = normalizeProfile(user.uid, existingProfile.data())
    if (!profile) throw new Error('Invalid friend profile')

    await setDoc(
      profileReference,
      {
        displayName: user.displayName?.trim().slice(0, 80) || 'Googleユーザー',
        photoURL: user.photoURL || '',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    return {
      ...profile,
      displayName: user.displayName?.trim().slice(0, 80) || 'Googleユーザー',
      photoURL: user.photoURL || '',
    }
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const friendCode = generateFriendCode()
    const codeReference = doc(firestoreDb, 'friendCodes', friendCode)

    try {
      return await runTransaction(firestoreDb, async (transaction) => {
        const [latestProfile, codeSnapshot] = await Promise.all([
          transaction.get(profileReference),
          transaction.get(codeReference),
        ])

        if (latestProfile.exists()) {
          const profile = normalizeProfile(user.uid, latestProfile.data())
          if (!profile) throw new Error('Invalid friend profile')
          return profile
        }
        if (codeSnapshot.exists()) throw new FriendCodeCollisionError()

        const profile: FriendProfile = {
          uid: user.uid,
          displayName: user.displayName?.trim().slice(0, 80) || 'Googleユーザー',
          photoURL: user.photoURL || '',
          friendCode,
        }

        transaction.set(profileReference, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        transaction.set(codeReference, {
          code: friendCode,
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
        })
        return profile
      })
    } catch (error) {
      if (error instanceof FriendCodeCollisionError) continue
      throw error
    }
  }

  throw new Error('Unable to allocate friend code')
}

const subscribeToFriend = (friendUid: string, generation: number) => {
  if (friendUnsubscribes.has(friendUid)) return

  friendEntries.set(friendUid, { profile: null, courses: [] })
  const unsubscribes: Unsubscribe[] = []

  unsubscribes.push(
    onSnapshot(
      doc(firestoreDb, 'profiles', friendUid),
      (snapshot) => {
        if (generation !== initializationGeneration || !snapshot.exists()) return
        const profile = normalizeProfile(friendUid, snapshot.data())
        if (!profile) return
        const entry = friendEntries.get(friendUid)
        if (!entry) return
        entry.profile = profile
        syncFriends()
      },
      () => {
        if (generation !== initializationGeneration) return
        friendEntries.delete(friendUid)
        syncFriends()
      },
    ),
  )

  unsubscribes.push(
    onSnapshot(
      doc(firestoreDb, 'sharedSchedules', friendUid, 'years', String(getCurrentAcademicYear())),
      (snapshot) => {
        if (generation !== initializationGeneration) return
        const entry = friendEntries.get(friendUid)
        if (!entry) return
        entry.courses = snapshot.exists() ? normalizeCourses(snapshot.data().courses) : []
        syncFriends()
      },
      () => {
        if (generation !== initializationGeneration) return
        const entry = friendEntries.get(friendUid)
        if (!entry) return
        entry.courses = []
        syncFriends()
      },
    ),
  )

  friendUnsubscribes.set(friendUid, unsubscribes)
}

const unsubscribeFromFriend = (friendUid: string) => {
  for (const unsubscribe of friendUnsubscribes.get(friendUid) || []) unsubscribe()
  friendUnsubscribes.delete(friendUid)
  friendEntries.delete(friendUid)
  syncFriends()
}

const subscribeToFriends = (userId: string, generation: number) => {
  rootUnsubscribes.push(
    onSnapshot(
      collection(firestoreDb, 'friends', userId, 'members'),
      (snapshot) => {
        if (generation !== initializationGeneration || userId !== activeUserId) return
        const friendIds = new Set(snapshot.docs.map((friendDocument) => friendDocument.id))

        for (const friendUid of friendUnsubscribes.keys()) {
          if (!friendIds.has(friendUid)) unsubscribeFromFriend(friendUid)
        }
        for (const friendUid of friendIds) subscribeToFriend(friendUid, generation)
      },
      (error) => {
        if (generation !== initializationGeneration) return
        friendFeatureError.value = getFriendErrorMessage(error)
      },
    ),
  )
}

const subscribeToIncomingRequests = (userId: string, generation: number) => {
  rootUnsubscribes.push(
    onSnapshot(
      collection(firestoreDb, 'friendRequests', userId, 'requests'),
      async (snapshot) => {
        try {
          const requests = await Promise.all(
            snapshot.docs.map(async (requestDocument) => {
              const senderUid = requestDocument.id
              const profileSnapshot = await getDoc(doc(firestoreDb, 'profiles', senderUid))
              if (!profileSnapshot.exists()) return null
              const profile = normalizeProfile(senderUid, profileSnapshot.data())
              return profile ? { senderUid, profile } : null
            }),
          )

          if (generation !== initializationGeneration || userId !== activeUserId) return
          incomingFriendRequests.value = requests.filter(
            (request): request is IncomingFriendRequest => request !== null,
          )
        } catch (error) {
          if (generation === initializationGeneration) {
            friendFeatureError.value = getFriendErrorMessage(error)
          }
        }
      },
      (error) => {
        if (generation !== initializationGeneration) return
        friendFeatureError.value = getFriendErrorMessage(error)
      },
    ),
  )
}

const subscribeToMemoGroup = (groupId: string, generation: number) => {
  if (memoGroupUnsubscribes.has(groupId)) return

  const unsubscribe = onSnapshot(
    doc(firestoreDb, 'sharedMemoGroups', groupId),
    (snapshot) => {
      if (generation !== initializationGeneration) return
      if (!snapshot.exists()) {
        memoGroupsById.delete(groupId)
      } else {
        const group = normalizeMemoGroup(groupId, snapshot.data())
        if (group) memoGroupsById.set(groupId, group)
      }
      syncMemoGroups()
    },
    () => {
      if (generation !== initializationGeneration) return
      memoGroupsById.delete(groupId)
      syncMemoGroups()
    },
  )

  memoGroupUnsubscribes.set(groupId, unsubscribe)
}

const subscribeToMemoMemberships = (userId: string, generation: number) => {
  rootUnsubscribes.push(
    onSnapshot(
      collection(firestoreDb, 'memoMemberships', userId, 'groups'),
      (snapshot) => {
        if (generation !== initializationGeneration || userId !== activeUserId) return
        const groupIds = new Set(snapshot.docs.map((membership) => membership.id))

        for (const [groupId, unsubscribe] of memoGroupUnsubscribes) {
          if (groupIds.has(groupId)) continue
          unsubscribe()
          memoGroupUnsubscribes.delete(groupId)
          memoGroupsById.delete(groupId)
        }
        for (const groupId of groupIds) subscribeToMemoGroup(groupId, generation)
        syncMemoGroups()
      },
      (error) => {
        if (generation !== initializationGeneration) return
        friendFeatureError.value = getFriendErrorMessage(error)
      },
    ),
  )
}

const buildSharedCourses = (courses: Course[]): SharedScheduleCourse[] => {
  return courses
    .filter(
      (course): course is Course & { period: number } =>
        course.period !== null && course.day !== '他',
    )
    .map((course) => ({
      id: course.id,
      name: course.name,
      day: course.day,
      period: course.period,
      semester: course.semester,
    }))
}

export const flushFriendSchedule = async () => {
  if (scheduleSaveTimer) {
    clearTimeout(scheduleSaveTimer)
    scheduleSaveTimer = null
  }
  if (!activeUserId) return

  const userId = activeUserId
  const academicYear = getCurrentAcademicYear()
  try {
    await setDoc(
      doc(firestoreDb, 'sharedSchedules', userId, 'years', String(academicYear)),
      {
        ownerUid: userId,
        academicYear,
        courses: buildSharedCourses(store.candidateCourses),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    if (userId === activeUserId) friendFeatureError.value = getFriendErrorMessage(error)
  }
}

const scheduleFriendScheduleSave = () => {
  if (!activeUserId) return
  if (scheduleSaveTimer) clearTimeout(scheduleSaveTimer)
  scheduleSaveTimer = setTimeout(() => void flushFriendSchedule(), SCHEDULE_SAVE_DELAY_MS)
}

export const startFriendPersistence = () => {
  if (isPersistenceStarted) return
  isPersistenceStarted = true

  watch(() => store.candidateCourses.map((course) => course.id), scheduleFriendScheduleSave, {
    deep: true,
  })
}

export const initializeFriendFeatures = async (user: User) => {
  if (activeUserId === user.uid && isFriendFeatureLoading.value) return

  deactivateFriendFeatures()
  const generation = ++initializationGeneration
  activeUserId = user.uid
  isFriendFeatureLoading.value = true
  friendFeatureError.value = ''
  friendActionMessage.value = ''

  try {
    myFriendProfile.value = await ensureFriendProfile(user)
    if (generation !== initializationGeneration || user.uid !== activeUserId) return

    subscribeToFriends(user.uid, generation)
    subscribeToIncomingRequests(user.uid, generation)
    subscribeToMemoMemberships(user.uid, generation)
    await flushFriendSchedule()
  } catch (error) {
    if (generation === initializationGeneration) {
      friendFeatureError.value = getFriendErrorMessage(error)
    }
  } finally {
    if (generation === initializationGeneration) isFriendFeatureLoading.value = false
  }
}

export const deactivateFriendFeatures = () => {
  initializationGeneration += 1
  activeUserId = null
  if (scheduleSaveTimer) clearTimeout(scheduleSaveTimer)
  scheduleSaveTimer = null

  while (rootUnsubscribes.length > 0) rootUnsubscribes.pop()?.()
  for (const unsubscribes of friendUnsubscribes.values()) {
    for (const unsubscribe of unsubscribes) unsubscribe()
  }
  for (const unsubscribe of memoGroupUnsubscribes.values()) unsubscribe()
  for (const timer of memoSaveTimers.values()) clearTimeout(timer)

  friendUnsubscribes.clear()
  memoGroupUnsubscribes.clear()
  memoSaveTimers.clear()
  pendingMemoValues.clear()
  friendEntries.clear()
  memoGroupsById.clear()
  myFriendProfile.value = null
  friends.value = []
  incomingFriendRequests.value = []
  sharedMemoGroups.value = []
  isFriendFeatureLoading.value = false
  friendFeatureError.value = ''
  friendActionMessage.value = ''
}

export const sendFriendRequest = async (rawCode: string) => {
  if (!activeUserId) return false
  friendFeatureError.value = ''
  friendActionMessage.value = ''

  const friendCode = rawCode.toUpperCase().replace(/[^A-Z2-9]/g, '')
  if (friendCode.length !== FRIEND_CODE_LENGTH) {
    friendFeatureError.value = '友達コードは英数字8文字で入力してください。'
    return false
  }

  try {
    const codeSnapshot = await getDoc(doc(firestoreDb, 'friendCodes', friendCode))
    if (!codeSnapshot.exists()) {
      friendFeatureError.value = 'その友達コードは見つかりませんでした。'
      return false
    }

    const receiverUid = codeSnapshot.data().ownerUid
    if (typeof receiverUid !== 'string') throw new Error('Invalid friend code')
    if (receiverUid === activeUserId) {
      friendFeatureError.value = '自分の友達コードは入力できません。'
      return false
    }

    const friendship = await getDoc(
      doc(firestoreDb, 'friends', activeUserId, 'members', receiverUid),
    )
    if (friendship.exists()) {
      friendFeatureError.value = 'すでに友達です。'
      return false
    }

    const reverseRequest = await getDoc(
      doc(firestoreDb, 'friendRequests', activeUserId, 'requests', receiverUid),
    )
    if (reverseRequest.exists()) {
      friendFeatureError.value =
        'この相手から申請が届いています。「届いた友達申請」から承認してください。'
      return false
    }

    const requestReference = doc(
      firestoreDb,
      'friendRequests',
      receiverUid,
      'requests',
      activeUserId,
    )
    const existingRequest = await getDoc(requestReference)
    if (existingRequest.exists()) {
      friendFeatureError.value = 'すでに友達申請を送っています。'
      return false
    }

    await setDoc(requestReference, {
      senderUid: activeUserId,
      receiverUid,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    friendActionMessage.value = '友達申請を送りました。相手の承認をお待ちください。'
    return true
  } catch (error) {
    friendFeatureError.value = getFriendErrorMessage(error)
    return false
  }
}

export const approveFriendRequest = async (senderUid: string) => {
  if (!activeUserId) return false
  const receiverUid = activeUserId
  friendFeatureError.value = ''
  friendActionMessage.value = ''

  try {
    const requestReference = doc(firestoreDb, 'friendRequests', receiverUid, 'requests', senderUid)
    const requestSnapshot = await getDoc(requestReference)
    if (!requestSnapshot.exists()) {
      friendFeatureError.value = 'この友達申請は取り消されています。'
      return false
    }

    const friendshipData = {
      acceptedBy: receiverUid,
      requestedBy: senderUid,
      acceptedAt: serverTimestamp(),
    }
    const batch = writeBatch(firestoreDb)
    batch.set(doc(firestoreDb, 'friends', receiverUid, 'members', senderUid), {
      ...friendshipData,
      userId: receiverUid,
      friendUid: senderUid,
    })
    batch.set(doc(firestoreDb, 'friends', senderUid, 'members', receiverUid), {
      ...friendshipData,
      userId: senderUid,
      friendUid: receiverUid,
    })
    await batch.commit()
    await deleteDoc(requestReference)
    const reverseRequestReference = doc(
      firestoreDb,
      'friendRequests',
      senderUid,
      'requests',
      receiverUid,
    )
    const reverseRequest = await getDoc(reverseRequestReference)
    if (reverseRequest.exists()) await deleteDoc(reverseRequestReference)
    friendActionMessage.value = '友達に追加しました。'
    return true
  } catch (error) {
    friendFeatureError.value = getFriendErrorMessage(error)
    return false
  }
}

export const declineFriendRequest = async (senderUid: string) => {
  if (!activeUserId) return
  friendFeatureError.value = ''
  friendActionMessage.value = ''

  try {
    await deleteDoc(doc(firestoreDb, 'friendRequests', activeUserId, 'requests', senderUid))
    friendActionMessage.value = '友達申請を削除しました。'
  } catch (error) {
    friendFeatureError.value = getFriendErrorMessage(error)
  }
}

export const removeFriend = async (friendUid: string) => {
  if (!activeUserId) return false
  const userId = activeUserId
  friendFeatureError.value = ''
  friendActionMessage.value = ''

  try {
    const batch = writeBatch(firestoreDb)
    batch.delete(doc(firestoreDb, 'friends', userId, 'members', friendUid))
    batch.delete(doc(firestoreDb, 'friends', friendUid, 'members', userId))
    await batch.commit()
    friendActionMessage.value = '友達から削除しました。共有情報は表示されなくなります。'
    return true
  } catch (error) {
    friendFeatureError.value = getFriendErrorMessage(error)
    return false
  }
}

export const getFriendsInSlot = (day: string, period: number) => {
  return friends.value.filter((friend) =>
    friend.courses.some((course) => course.day === day && course.period === period),
  )
}

export const getFriendsForCourse = (courseId: string) => {
  return friends.value.filter((friend) => friend.courses.some((course) => course.id === courseId))
}

export const getFriendProfile = (uid: string) => {
  if (uid === myFriendProfile.value?.uid) return myFriendProfile.value
  return friends.value.find((friend) => friend.uid === uid) || null
}

const verifyAllMembersAreFriends = async (memberIds: string[]) => {
  for (let first = 0; first < memberIds.length; first += 1) {
    for (let second = first + 1; second < memberIds.length; second += 1) {
      const firstId = memberIds[first]
      const secondId = memberIds[second]
      if (!firstId || !secondId) return false
      const friendship = await getDoc(doc(firestoreDb, 'friends', firstId, 'members', secondId))
      if (!friendship.exists()) return false
    }
  }
  return true
}

export const createSharedMemoGroup = async (course: Course, selectedFriendIds: string[]) => {
  if (!activeUserId) return null
  friendFeatureError.value = ''
  friendActionMessage.value = ''

  const courseFriendIds = new Set(getFriendsForCourse(course.id).map((friend) => friend.uid))
  const uniqueFriendIds = Array.from(new Set(selectedFriendIds)).filter((uid) =>
    courseFriendIds.has(uid),
  )
  const memberIds = [activeUserId, ...uniqueFriendIds].sort()

  if (memberIds.length < 2) {
    friendFeatureError.value = '共有する友達を1人以上選んでください。'
    return null
  }
  if (memberIds.length > MAX_SHARED_MEMO_MEMBERS) {
    friendFeatureError.value = '共有メモは自分を含めて5人までです。'
    return null
  }

  const existingGroup = sharedMemoGroups.value.find(
    (group) =>
      group.academicYear === getCurrentAcademicYear() &&
      group.courseId === course.id &&
      group.memberIds.length === memberIds.length &&
      group.memberIds.every((uid, index) => uid === memberIds[index]),
  )
  if (existingGroup) return existingGroup.id

  try {
    if (!(await verifyAllMembersAreFriends(memberIds))) {
      friendFeatureError.value = '選んだ全員がお互いに友達の場合だけ共有できます。'
      return null
    }

    const groupReference = doc(collection(firestoreDb, 'sharedMemoGroups'))
    const academicYear = getCurrentAcademicYear()
    const batch = writeBatch(firestoreDb)
    batch.set(groupReference, {
      academicYear,
      courseId: course.id,
      courseName: course.name,
      memberIds,
      memo: '',
      createdBy: activeUserId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    for (const memberId of memberIds) {
      batch.set(doc(firestoreDb, 'memoMemberships', memberId, 'groups', groupReference.id), {
        groupId: groupReference.id,
        memberId,
        createdAt: serverTimestamp(),
      })
    }
    await batch.commit()
    friendActionMessage.value = '共有メモを作成しました。'
    return groupReference.id
  } catch (error) {
    friendFeatureError.value = getFriendErrorMessage(error)
    return null
  }
}

export const saveSharedMemo = (groupId: string, memo: string) => {
  if (!activeUserId || memo.length > 2000) return
  pendingMemoValues.set(groupId, memo)

  const group = memoGroupsById.get(groupId)
  if (group) {
    group.memo = memo
    syncMemoGroups()
  }

  const currentTimer = memoSaveTimers.get(groupId)
  if (currentTimer) clearTimeout(currentTimer)
  memoSaveTimers.set(
    groupId,
    setTimeout(() => {
      memoSaveTimers.delete(groupId)
      void persistSharedMemo(groupId)
    }, MEMO_SAVE_DELAY_MS),
  )
}

const persistSharedMemo = async (groupId: string) => {
  const value = pendingMemoValues.get(groupId)
  if (value === undefined || !activeUserId) return

  try {
    await updateDoc(doc(firestoreDb, 'sharedMemoGroups', groupId), {
      memo: value,
      updatedAt: serverTimestamp(),
    })
    if (pendingMemoValues.get(groupId) === value) pendingMemoValues.delete(groupId)
  } catch (error) {
    friendFeatureError.value = getFriendErrorMessage(error)
  }
}

export const flushSharedMemos = async () => {
  for (const timer of memoSaveTimers.values()) clearTimeout(timer)
  memoSaveTimers.clear()
  await Promise.all(Array.from(pendingMemoValues.keys(), persistSharedMemo))
}
