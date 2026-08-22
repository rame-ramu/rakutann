import { FirebaseError } from 'firebase/app'
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { ref, watch } from 'vue'
import type { Router } from 'vue-router'
import { SELECTABLE_CONDITIONS } from '../constants/courseConditions'
import { firestoreDb } from '../firebase'
import type { StudentAttributes } from '../domain/curriculum'
import {
  normalizeApplicableStudentAttributes,
  sanitizeStudentAttributes,
} from '../services/studentAttributes'
import { isValidStudentProfile, parseStudentId } from '../services/studentProfile'
import { store, type Course, type CourseDetail, type ScheduleSlot } from '../store'
import { COURSE_DAYS, COURSE_PERIODS } from './courseSchedule'

export const STORAGE_KEY = 'rakutann-user-state-v1'
const GUEST_STORAGE_KEY = `${STORAGE_KEY}:guest`
const STORAGE_VERSION = 2
const CLOUD_SCHEMA_VERSION = 2
const CLOUD_SAVE_DELAY_MS = 700
const VALID_DAYS = new Set<string>(COURSE_DAYS)
const VALID_PERIODS = new Set<number>(COURSE_PERIODS)
let activeStorageKey: string | null = null
let activeUserId: string | null = null
let isPersistencePaused = true
let isCloudPersistenceReady = false
let hasPendingCloudSave = false
let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null
let cloudWriteQueue: Promise<void> = Promise.resolve()
let cloudSnapshotQueue: Promise<void> = Promise.resolve()
let cloudUnsubscribe: Unsubscribe | null = null
let hasReceivedServerSnapshot = false
let activationGeneration = 0
let changeRevision = 0
let lastModifiedAt = 0

export type CloudSyncStatus = 'idle' | 'syncing' | 'saving' | 'synced' | 'offline'

export const cloudSyncStatus = ref<CloudSyncStatus>('idle')
export const cloudSyncError = ref('')
export const isUserDataReady = ref(false)
export const cloudDataRevision = ref(0)

interface PersistedState {
  version: typeof STORAGE_VERSION
  updatedAt: number
  studentProfile: {
    department: string
    grade: number
    autoDetectedGrade: number | null
    isGradeManuallySelected: boolean
    isHumanInfoStudent: boolean
    organizationCode: string
    admissionYear: number
    attributes: StudentAttributes
  } | null
  timetable: {
    courseIds: string[]
    courses: Course[]
    classrooms: Record<string, string>
  }
  courseDetails: Record<string, CourseDetail>
  favorites: string[]
  selectedTags: string[]
  selectedSemester: '' | '前期' | '後期'
  avoidedTeachersText: string
  freePeriods: ScheduleSlot[]
  includeUnscheduledCourses: boolean
  lastPage: string
}

const canUseLocalStorage = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

const getUserStorageKey = (userId: string) => `${STORAGE_KEY}:${userId}`

const migrateLegacyState = (userStorageKey: string) => {
  if (!canUseLocalStorage()) return

  try {
    if (window.localStorage.getItem(userStorageKey)) return

    const legacyState = window.localStorage.getItem(STORAGE_KEY)
    if (!legacyState) return

    window.localStorage.setItem(userStorageKey, legacyState)
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('以前の保存データの引き継ぎに失敗しました。', error)
  }
}

const isScheduleSlot = (value: unknown): value is ScheduleSlot => {
  if (!value || typeof value !== 'object') return false
  const slot = value as Partial<ScheduleSlot>
  return (
    typeof slot.day === 'string' &&
    typeof slot.period === 'number' &&
    VALID_DAYS.has(slot.day) &&
    VALID_PERIODS.has(slot.period)
  )
}

const sanitizeStringArray = (value: unknown) => {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

const legacyAttendancePointLabel = ['出席', '点'].join('')
const selectableConditionSet = new Set(SELECTABLE_CONDITIONS)
const legacyFieldTags: Record<string, string[]> = {
  '情報・データ': ['情報・数理', 'プログラミング・システム', 'AI・データ'],
  '心理・人間': ['心理・認知'],
  'ビジネス・経営': ['社会・ビジネス'],
  '語学・国際': ['語学・コミュニケーション'],
  'デザイン・表現': ['メディア・デザイン'],
  '健康・福祉': ['健康・スポーツ'],
}

const normalizeTagNames = (tags: string[]) => [
  ...new Set(
    tags
      .flatMap((tag) => legacyFieldTags[tag] ?? [tag])
      .map((tag) => tag.replace(legacyAttendancePointLabel, '態度点'))
      .filter((tag) => selectableConditionSet.has(tag)),
  ),
]

const sanitizeSchedule = (value: unknown) => {
  return Array.isArray(value) ? value.filter(isScheduleSlot) : []
}

const sanitizeSemester = (value: unknown): '' | '前期' | '後期' => {
  return value === '前期' || value === '後期' ? value : ''
}

const sanitizeCourse = (value: unknown): Course | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const course = value as Partial<Course>
  if (
    typeof course.id !== 'string' ||
    !/^2026_\d{6}-\d{2,}$/.test(course.id) ||
    typeof course.baseCourseCode !== 'string' ||
    typeof course.name !== 'string' ||
    typeof course.instructor !== 'string' ||
    typeof course.semester !== 'string' ||
    typeof course.day !== 'string' ||
    (course.period !== null && typeof course.period !== 'number') ||
    !Array.isArray(course.conditions) ||
    !Array.isArray(course.tagReasons)
  ) {
    return null
  }
  return course as Course
}

const sanitizeCourses = (value: unknown) =>
  Array.isArray(value)
    ? value.map(sanitizeCourse).filter((course): course is Course => Boolean(course))
    : []

const sanitizeStudentProfile = (value: unknown): PersistedState['studentProfile'] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const profile = value as Partial<NonNullable<PersistedState['studentProfile']>>
  if (
    typeof profile.department !== 'string' ||
    !profile.department.trim() ||
    typeof profile.grade !== 'number' ||
    !Number.isFinite(profile.grade) ||
    typeof profile.organizationCode !== 'string' ||
    !/^[A-Z]{3}$/.test(profile.organizationCode) ||
    typeof profile.admissionYear !== 'number' ||
    !Number.isInteger(profile.admissionYear)
  ) {
    return null
  }

  return {
    department: profile.department,
    grade: profile.grade,
    autoDetectedGrade:
      typeof profile.autoDetectedGrade === 'number' && Number.isFinite(profile.autoDetectedGrade)
        ? profile.autoDetectedGrade
        : null,
    isGradeManuallySelected: profile.isGradeManuallySelected === true,
    isHumanInfoStudent: profile.isHumanInfoStudent === true,
    organizationCode: profile.organizationCode,
    admissionYear: profile.admissionYear,
    attributes: sanitizeStudentAttributes(profile.attributes),
  }
}

const sanitizeClassrooms = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([courseId, classroom]) =>
      typeof courseId === 'string' && typeof classroom === 'string' && classroom.trim().length > 0,
  ) as [string, string][]

  return Object.fromEntries(entries)
}

const sanitizeCourseDetails = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const details: Record<string, CourseDetail> = {}
  for (const [courseId, detailValue] of Object.entries(value as Record<string, unknown>)) {
    if (!courseId || !detailValue || typeof detailValue !== 'object' || Array.isArray(detailValue))
      continue

    const detail = detailValue as Partial<CourseDetail>
    const room = typeof detail.room === 'string' ? detail.room.trim() : ''
    const memo = typeof detail.memo === 'string' ? detail.memo : ''
    if (room || memo) {
      details[courseId] = { room, memo }
    }
  }

  return details
}

const normalizePersistedState = (value: unknown): PersistedState | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const storedVersion = (value as { version?: number }).version
  if (storedVersion !== 1 && storedVersion !== STORAGE_VERSION) return null
  const state = value as Partial<PersistedState>

  return {
    version: STORAGE_VERSION,
    updatedAt:
      typeof state.updatedAt === 'number' && Number.isFinite(state.updatedAt) ? state.updatedAt : 0,
    studentProfile: sanitizeStudentProfile(state.studentProfile),
    timetable: {
      courseIds: sanitizeStringArray(state.timetable?.courseIds),
      courses: sanitizeCourses(state.timetable?.courses),
      classrooms: sanitizeClassrooms(state.timetable?.classrooms),
    },
    courseDetails: sanitizeCourseDetails(state.courseDetails),
    favorites: sanitizeStringArray(state.favorites),
    selectedTags: sanitizeStringArray(state.selectedTags),
    selectedSemester: sanitizeSemester(state.selectedSemester),
    avoidedTeachersText:
      typeof state.avoidedTeachersText === 'string' ? state.avoidedTeachersText : '',
    freePeriods: sanitizeSchedule(state.freePeriods),
    includeUnscheduledCourses: state.includeUnscheduledCourses === true,
    lastPage:
      typeof state.lastPage === 'string' && state.lastPage.startsWith('/') ? state.lastPage : '',
  }
}

const readStoredState = () => {
  if (!canUseLocalStorage() || !activeStorageKey) return null

  try {
    const rawState = window.localStorage.getItem(activeStorageKey)
    if (!rawState) return null

    return normalizePersistedState(JSON.parse(rawState))
  } catch (error) {
    console.warn('保存データの読み込みに失敗しました。初期状態で起動します。', error)
    return null
  }
}

const buildPersistedState = (): PersistedState => ({
  version: STORAGE_VERSION,
  updatedAt: lastModifiedAt,
  studentProfile:
    store.department &&
    store.grade &&
    store.studentProfile &&
    isValidStudentProfile(store.studentProfile)
      ? {
          department: store.department,
          grade: store.grade,
          autoDetectedGrade: store.autoDetectedGrade,
          isGradeManuallySelected: store.isGradeManuallySelected,
          isHumanInfoStudent: store.isHumanInfoStudent,
          organizationCode: store.studentProfile.organizationCode,
          admissionYear: store.studentProfile.admissionYear,
          attributes: sanitizeStudentAttributes(store.studentProfile.attributes),
        }
      : null,
  timetable: {
    courseIds: store.candidateCourses.map((course) => course.id),
    courses: store.candidateCourses,
    classrooms: store.classrooms,
  },
  courseDetails: store.courseDetails,
  favorites: [],
  selectedTags: store.selectedConditions,
  selectedSemester: store.selectedSemester,
  avoidedTeachersText: store.avoidedTeachersText,
  freePeriods: store.selectedSchedule,
  includeUnscheduledCourses: store.includeUnscheduledCourses,
  lastPage: store.lastPage,
})

const writeLocalState = () => {
  if (!canUseLocalStorage() || !activeStorageKey) return
  try {
    window.localStorage.setItem(activeStorageKey, JSON.stringify(buildPersistedState()))
  } catch (error) {
    console.warn('保存データの書き込みに失敗しました。', error)
  }
}

export const savePersistedState = () => {
  if (isPersistencePaused) return
  writeLocalState()
}

const applyPersistedState = async (
  savedState: PersistedState,
  shouldApply: () => boolean = () => true,
) => {
  const courseIds = savedState.timetable.courseIds
  const coursesById = new Map(savedState.timetable.courses.map((course) => [course.id, course]))
  const missingCourseIds = courseIds.filter((courseId) => !coursesById.has(courseId))
  if (missingCourseIds.length > 0) {
    const { getRuntimeCoursesByIds } = await import('../services/eligibilityRuntime')
    for (const course of await getRuntimeCoursesByIds(missingCourseIds)) {
      coursesById.set(course.id, course)
    }
  }
  const savedClassrooms = savedState.timetable.classrooms
  const savedCourseDetails = savedState.courseDetails

  for (const [courseId, classroom] of Object.entries(savedClassrooms)) {
    if (!savedCourseDetails[courseId]) {
      savedCourseDetails[courseId] = { room: classroom, memo: '' }
    } else if (!savedCourseDetails[courseId].room) {
      savedCourseDetails[courseId].room = classroom
    }
  }

  if (!shouldApply()) return false

  const wasPersistencePaused = isPersistencePaused
  isPersistencePaused = true

  try {
    store.resetSelections()

    if (savedState.studentProfile) {
      const admissionYearSuffix = String(savedState.studentProfile.admissionYear).slice(-2)
      const parsedProfile = parseStudentId(
        `${admissionYearSuffix}000${savedState.studentProfile.organizationCode}`,
        {
          actualCurrentYear: savedState.studentProfile.grade,
          attributes: savedState.studentProfile.attributes,
        },
      )
      store.studentId = ''
      store.studentProfile = isValidStudentProfile(parsedProfile) ? parsedProfile : null
      if (isValidStudentProfile(parsedProfile)) {
        parsedProfile.attributes = normalizeApplicableStudentAttributes(parsedProfile)
      }
      store.profileWarning = parsedProfile.profileWarning
      store.department = savedState.studentProfile.department
      store.grade = savedState.studentProfile.grade
      store.autoDetectedGrade = savedState.studentProfile.autoDetectedGrade
      store.isGradeManuallySelected = savedState.studentProfile.isGradeManuallySelected
      store.isHumanInfoStudent = savedState.studentProfile.isHumanInfoStudent
    }
    store.selectedConditions = normalizeTagNames(savedState.selectedTags)
    store.selectedSemester = savedState.selectedSemester
    store.selectedSchedule = savedState.freePeriods
    store.includeUnscheduledCourses = savedState.includeUnscheduledCourses
    store.candidateCourses = courseIds
      .map((courseId) => coursesById.get(courseId))
      .filter((course): course is NonNullable<typeof course> => Boolean(course))
    store.courseDetails = { ...savedCourseDetails }
    store.classrooms = sanitizeClassrooms(
      Object.fromEntries(
        Object.entries(savedCourseDetails)
          .filter(([, detail]) => detail.room)
          .map(([courseId, detail]) => [courseId, detail.room]),
      ),
    )
    store.avoidedTeachersText = savedState.avoidedTeachersText
    store.lastPage = savedState.lastPage
    lastModifiedAt = savedState.updatedAt
  } finally {
    isPersistencePaused = wasPersistencePaused
  }

  return true
}

export const loadPersistedState = async () => {
  const savedState = readStoredState()
  if (!savedState) return null

  return (await applyPersistedState(savedState)) ? savedState : null
}

const cancelScheduledCloudSave = () => {
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer)
    cloudSaveTimer = null
  }
}

const stopCloudSubscription = () => {
  cloudUnsubscribe?.()
  cloudUnsubscribe = null
}

const getCloudSyncErrorMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return 'クラウド保存に接続できません。データはこの端末に保存されています。'
  }

  switch (error.code) {
    case 'permission-denied':
      return 'クラウド保存のアクセス設定を確認してください。データはこの端末に保存されています。'
    case 'failed-precondition':
    case 'not-found':
      return 'Cloud Firestoreの設定が必要です。データはこの端末に保存されています。'
    case 'unavailable':
      return 'オフラインのため、データはこの端末に保存されています。'
    default:
      return 'クラウド保存に接続できません。データはこの端末に保存されています。'
  }
}

const writeCloudState = (userId: string) => {
  const state = buildPersistedState()
  const queuedWrite = cloudWriteQueue.then(() =>
    setDoc(doc(firestoreDb, 'users', userId), {
      schemaVersion: CLOUD_SCHEMA_VERSION,
      state,
      updatedAt: serverTimestamp(),
    }),
  )

  cloudWriteQueue = queuedWrite.catch(() => undefined)
  return queuedWrite
}

export const flushCloudSave = async () => {
  cancelScheduledCloudSave()
  if (!isCloudPersistenceReady || !activeUserId || !hasPendingCloudSave) return

  const userId = activeUserId
  const generation = activationGeneration
  const savedRevision = changeRevision
  cloudSyncStatus.value = 'saving'
  cloudSyncError.value = ''

  try {
    await writeCloudState(userId)
    if (generation === activationGeneration && userId === activeUserId) {
      if (savedRevision === changeRevision) {
        hasPendingCloudSave = false
        cloudSyncStatus.value = 'synced'
      }
    }
  } catch (error) {
    if (generation === activationGeneration && userId === activeUserId) {
      cloudSyncStatus.value = 'offline'
      cloudSyncError.value = getCloudSyncErrorMessage(error)
    }
  }
}

const scheduleCloudSave = () => {
  if (!isCloudPersistenceReady || !activeUserId || !hasPendingCloudSave) return

  cancelScheduledCloudSave()
  cloudSyncStatus.value = 'saving'
  cloudSyncError.value = ''

  const userId = activeUserId
  const generation = activationGeneration

  cloudSaveTimer = setTimeout(async () => {
    cloudSaveTimer = null
    if (generation !== activationGeneration || userId !== activeUserId) return

    await flushCloudSave()
  }, CLOUD_SAVE_DELAY_MS)
}

const makeUserDataAvailable = (generation: number, userId: string) => {
  if (generation !== activationGeneration || userId !== activeUserId) return

  isPersistencePaused = false
  isUserDataReady.value = true
}

const applyCloudState = async (cloudState: PersistedState, generation: number, userId: string) => {
  const revisionBeforeLoad = changeRevision
  const applied = await applyPersistedState(
    cloudState,
    () =>
      generation === activationGeneration &&
      userId === activeUserId &&
      revisionBeforeLoad === changeRevision &&
      !hasPendingCloudSave,
  )

  if (!applied) return false

  writeLocalState()
  cloudDataRevision.value += 1
  return true
}

const handleCloudSnapshot = async (
  snapshot: DocumentSnapshot,
  generation: number,
  userId: string,
  preserveLocalChanges: boolean,
) => {
  if (generation !== activationGeneration || userId !== activeUserId) return

  const isServerSnapshot = !snapshot.metadata.fromCache

  if (!snapshot.exists()) {
    makeUserDataAvailable(generation, userId)

    // An empty cache does not prove that the server document is absent. Waiting for the
    // server snapshot prevents a slow connection from overwriting existing cloud data.
    if (!isServerSnapshot) return

    hasReceivedServerSnapshot = true
    if (lastModifiedAt === 0) lastModifiedAt = Date.now()
    hasPendingCloudSave = true
    isCloudPersistenceReady = true
    scheduleCloudSave()
    return
  }

  const cloudState = normalizePersistedState(snapshot.data().state)
  if (!cloudState) throw new Error('Invalid cloud state')

  makeUserDataAvailable(generation, userId)

  if (!isServerSnapshot) {
    if (!preserveLocalChanges && !hasPendingCloudSave && cloudState.updatedAt > lastModifiedAt) {
      await applyCloudState(cloudState, generation, userId)
    }
    return
  }

  const isInitialServerSnapshot = !hasReceivedServerSnapshot
  hasReceivedServerSnapshot = true

  if (preserveLocalChanges || hasPendingCloudSave) {
    isCloudPersistenceReady = true
    scheduleCloudSave()
    return
  }

  if (isInitialServerSnapshot) {
    if (cloudState.updatedAt >= lastModifiedAt) {
      await applyCloudState(cloudState, generation, userId)
    } else {
      hasPendingCloudSave = true
    }
  } else if (cloudState.updatedAt !== lastModifiedAt) {
    await applyCloudState(cloudState, generation, userId)
  }

  if (generation !== activationGeneration || userId !== activeUserId) return

  isCloudPersistenceReady = true
  cloudSyncError.value = ''
  if (hasPendingCloudSave) {
    scheduleCloudSave()
  } else {
    cloudSyncStatus.value = 'synced'
  }
}

const handleCloudSubscriptionError = (error: unknown, generation: number, userId: string) => {
  if (generation !== activationGeneration || userId !== activeUserId) return

  console.warn('クラウド保存のリアルタイム同期に失敗しました。端末内の保存を使用します。', error)
  isCloudPersistenceReady = false
  cloudSyncStatus.value = 'offline'
  cloudSyncError.value = getCloudSyncErrorMessage(error)
  makeUserDataAvailable(generation, userId)
}

export const activateUserPersistence = async (userId: string) => {
  const generation = ++activationGeneration

  cancelScheduledCloudSave()
  stopCloudSubscription()
  isPersistencePaused = true
  isCloudPersistenceReady = false
  hasPendingCloudSave = false
  hasReceivedServerSnapshot = false
  cloudSnapshotQueue = Promise.resolve()
  isUserDataReady.value = false
  cloudSyncStatus.value = 'syncing'
  cloudSyncError.value = ''
  activeUserId = userId
  lastModifiedAt = 0
  store.resetSelections()

  activeStorageKey = getUserStorageKey(userId)
  migrateLegacyState(activeStorageKey)
  const localState = await loadPersistedState()
  if (generation !== activationGeneration || userId !== activeUserId) return

  if (localState) makeUserDataAvailable(generation, userId)

  cloudUnsubscribe = onSnapshot(
    doc(firestoreDb, 'users', userId),
    { includeMetadataChanges: true },
    (snapshot) => {
      const preserveLocalChanges = hasPendingCloudSave || snapshot.metadata.hasPendingWrites
      cloudSnapshotQueue = cloudSnapshotQueue
        .then(() => handleCloudSnapshot(snapshot, generation, userId, preserveLocalChanges))
        .catch((error: unknown) => handleCloudSubscriptionError(error, generation, userId))
    },
    (error) => handleCloudSubscriptionError(error, generation, userId),
  )
}

export const activateGuestPersistence = async () => {
  activationGeneration += 1
  cancelScheduledCloudSave()
  stopCloudSubscription()
  isPersistencePaused = true
  isCloudPersistenceReady = false
  hasPendingCloudSave = false
  isUserDataReady.value = false
  cloudSyncStatus.value = 'idle'
  cloudSyncError.value = ''
  activeUserId = null
  activeStorageKey = GUEST_STORAGE_KEY
  lastModifiedAt = 0
  store.resetSelections()
  await loadPersistedState()
  isPersistencePaused = false
  isUserDataReady.value = true
}

export const deactivateUserPersistence = () => {
  activationGeneration += 1
  cancelScheduledCloudSave()
  stopCloudSubscription()
  isPersistencePaused = true
  isCloudPersistenceReady = false
  hasPendingCloudSave = false
  isUserDataReady.value = false
  cloudSyncStatus.value = 'idle'
  cloudSyncError.value = ''
  activeStorageKey = null
  activeUserId = null
  lastModifiedAt = 0
  store.resetSelections()
}

export const startPersistence = (router: Router) => {
  router.afterEach((to) => {
    store.lastPage = to.fullPath
  })

  watch(
    () => ({
      studentProfile: {
        department: store.department,
        grade: store.grade,
        autoDetectedGrade: store.autoDetectedGrade,
        isGradeManuallySelected: store.isGradeManuallySelected,
        isHumanInfoStudent: store.isHumanInfoStudent,
        organizationCode: store.studentProfile?.organizationCode,
        admissionYear: store.studentProfile?.admissionYear,
        attributes: { ...store.studentProfile?.attributes },
      },
      timetable: store.candidateCourses.map((course) => course.id),
      classrooms: { ...store.classrooms },
      courseDetails: { ...store.courseDetails },
      selectedTags: [...store.selectedConditions],
      selectedSemester: store.selectedSemester,
      avoidedTeachersText: store.avoidedTeachersText,
      freePeriods: store.selectedSchedule.map((slot) => ({ ...slot })),
      includeUnscheduledCourses: store.includeUnscheduledCourses,
      lastPage: store.lastPage,
    }),
    () => {
      if (isPersistencePaused) return

      lastModifiedAt = Date.now()
      changeRevision += 1
      hasPendingCloudSave = true
      savePersistedState()
      scheduleCloudSave()
    },
    { deep: true, flush: 'sync' },
  )
}

export const clearPersistedState = async () => {
  cancelScheduledCloudSave()
  isPersistencePaused = true
  hasPendingCloudSave = false

  if (canUseLocalStorage() && activeStorageKey) {
    try {
      window.localStorage.removeItem(activeStorageKey)
    } catch (error) {
      console.warn('保存データの削除に失敗しました。', error)
    }
  }

  const userId = activeUserId
  lastModifiedAt = Date.now()
  changeRevision += 1
  store.resetSelections()
  writeLocalState()

  if (!userId) return

  cloudSyncStatus.value = 'saving'
  cloudSyncError.value = ''

  try {
    await writeCloudState(userId)
    if (userId === activeUserId) {
      cloudSyncStatus.value = 'synced'
    }
  } catch (error) {
    if (userId === activeUserId) {
      hasPendingCloudSave = true
      cloudSyncStatus.value = 'offline'
      cloudSyncError.value = getCloudSyncErrorMessage(error)
    }
  }
}

export const resumePersistence = () => {
  isPersistencePaused = false
}
