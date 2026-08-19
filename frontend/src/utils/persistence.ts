import { watch } from 'vue'
import type { Router } from 'vue-router'
import { store, mockCourses, type CourseDetail, type ScheduleSlot } from '../store'

export const STORAGE_KEY = 'rakutann-user-state-v1'
const STORAGE_VERSION = 1
const VALID_DAYS = new Set(['月', '火', '水', '木', '金'])
const VALID_PERIODS = new Set([1, 2, 3, 4, 5])
let activeStorageKey: string | null = null
let isPersistencePaused = true

interface PersistedState {
  version: typeof STORAGE_VERSION
  timetable: {
    courseIds: string[]
    classrooms: Record<string, string>
  }
  courseDetails: Record<string, CourseDetail>
  favorites: string[]
  selectedTags: string[]
  selectedSemester: '' | '前期' | '後期'
  avoidedTeachersText: string
  freePeriods: ScheduleSlot[]
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

const normalizeTagName = (tag: string) => {
  return tag.replace(legacyAttendancePointLabel, '態度点')
}

const sanitizeSchedule = (value: unknown) => {
  return Array.isArray(value) ? value.filter(isScheduleSlot) : []
}

const sanitizeSemester = (value: unknown): '' | '前期' | '後期' => {
  return value === '前期' || value === '後期' ? value : ''
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

const readStoredState = () => {
  if (!canUseLocalStorage() || !activeStorageKey) return null

  try {
    const rawState = window.localStorage.getItem(activeStorageKey)
    if (!rawState) return null

    const parsed = JSON.parse(rawState) as Partial<PersistedState>
    if (parsed.version !== STORAGE_VERSION) return null

    return parsed
  } catch (error) {
    console.warn('保存データの読み込みに失敗しました。初期状態で起動します。', error)
    return null
  }
}

const buildPersistedState = (): PersistedState => ({
  version: STORAGE_VERSION,
  timetable: {
    courseIds: store.candidateCourses.map((course) => course.id),
    classrooms: store.classrooms,
  },
  courseDetails: store.courseDetails,
  favorites: [],
  selectedTags: store.selectedConditions,
  selectedSemester: store.selectedSemester,
  avoidedTeachersText: store.avoidedTeachersText,
  freePeriods: store.selectedSchedule,
  lastPage: store.lastPage,
})

export const savePersistedState = () => {
  if (isPersistencePaused || !canUseLocalStorage() || !activeStorageKey) return

  try {
    window.localStorage.setItem(activeStorageKey, JSON.stringify(buildPersistedState()))
  } catch (error) {
    console.warn('保存データの書き込みに失敗しました。', error)
  }
}

export const loadPersistedState = () => {
  const savedState = readStoredState()
  if (!savedState) return

  const courseIds = sanitizeStringArray(savedState.timetable?.courseIds)
  const coursesById = new Map(mockCourses.map((course) => [course.id, course]))
  const savedClassrooms = sanitizeClassrooms(savedState.timetable?.classrooms)
  const savedCourseDetails = sanitizeCourseDetails(savedState.courseDetails)

  for (const [courseId, classroom] of Object.entries(savedClassrooms)) {
    if (!savedCourseDetails[courseId]) {
      savedCourseDetails[courseId] = { room: classroom, memo: '' }
    } else if (!savedCourseDetails[courseId].room) {
      savedCourseDetails[courseId].room = classroom
    }
  }

  store.selectedConditions = sanitizeStringArray(savedState.selectedTags).map(normalizeTagName)
  store.selectedSemester = sanitizeSemester(savedState.selectedSemester)
  store.selectedSchedule = sanitizeSchedule(savedState.freePeriods)
  store.candidateCourses = courseIds
    .map((courseId) => coursesById.get(courseId))
    .filter((course): course is NonNullable<typeof course> => Boolean(course))
  store.courseDetails = savedCourseDetails
  store.classrooms = sanitizeClassrooms(
    Object.fromEntries(
      Object.entries(savedCourseDetails)
        .filter(([, detail]) => detail.room)
        .map(([courseId, detail]) => [courseId, detail.room]),
    ),
  )
  store.avoidedTeachersText =
    typeof savedState.avoidedTeachersText === 'string' ? savedState.avoidedTeachersText : ''
  store.lastPage =
    typeof savedState.lastPage === 'string' && savedState.lastPage.startsWith('/')
      ? savedState.lastPage
      : ''
}

export const activateUserPersistence = (userId: string) => {
  isPersistencePaused = true
  store.resetSelections()

  activeStorageKey = getUserStorageKey(userId)
  migrateLegacyState(activeStorageKey)
  loadPersistedState()

  isPersistencePaused = false
}

export const deactivateUserPersistence = () => {
  isPersistencePaused = true
  activeStorageKey = null
  store.resetSelections()
}

export const startPersistence = (router: Router) => {
  router.afterEach((to) => {
    store.lastPage = to.fullPath
  })

  watch(
    () => ({
      timetable: store.candidateCourses.map((course) => course.id),
      classrooms: { ...store.classrooms },
      courseDetails: { ...store.courseDetails },
      selectedTags: [...store.selectedConditions],
      selectedSemester: store.selectedSemester,
      avoidedTeachersText: store.avoidedTeachersText,
      freePeriods: store.selectedSchedule.map((slot) => ({ ...slot })),
      lastPage: store.lastPage,
    }),
    savePersistedState,
    { deep: true },
  )
}

export const clearPersistedState = () => {
  isPersistencePaused = true

  if (canUseLocalStorage() && activeStorageKey) {
    try {
      window.localStorage.removeItem(activeStorageKey)
    } catch (error) {
      console.warn('保存データの削除に失敗しました。', error)
    }
  }

  store.resetSelections()
}

export const resumePersistence = () => {
  isPersistencePaused = false
}
