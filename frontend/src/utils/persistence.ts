import { watch } from 'vue'
import type { Router } from 'vue-router'
import { store, mockCourses, type ScheduleSlot } from '../store'

export const STORAGE_KEY = 'rakutann-user-state-v1'
const STORAGE_VERSION = 1
const VALID_DAYS = new Set(['月', '火', '水', '木', '金'])
const VALID_PERIODS = new Set([1, 2, 3, 4, 5])
let isPersistencePaused = false

interface PersistedState {
  version: typeof STORAGE_VERSION
  timetable: {
    courseIds: string[]
    classrooms: Record<string, string>
  }
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
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
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
      typeof courseId === 'string' &&
      typeof classroom === 'string' &&
      classroom.trim().length > 0,
  ) as [string, string][]

  return Object.fromEntries(entries)
}

const readStoredState = () => {
  if (!canUseLocalStorage()) return null

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY)
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
  favorites: [],
  selectedTags: store.selectedConditions,
  selectedSemester: store.selectedSemester,
  avoidedTeachersText: store.avoidedTeachersText,
  freePeriods: store.selectedSchedule,
  lastPage: store.lastPage,
})

export const savePersistedState = () => {
  if (isPersistencePaused || !canUseLocalStorage()) return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedState()))
  } catch (error) {
    console.warn('保存データの書き込みに失敗しました。', error)
  }
}

export const loadPersistedState = () => {
  const savedState = readStoredState()
  if (!savedState) return

  const courseIds = sanitizeStringArray(savedState.timetable?.courseIds)
  const coursesById = new Map(mockCourses.map((course) => [course.id, course]))

  store.selectedConditions = sanitizeStringArray(savedState.selectedTags)
  store.selectedSemester = sanitizeSemester(savedState.selectedSemester)
  store.selectedSchedule = sanitizeSchedule(savedState.freePeriods)
  store.candidateCourses = courseIds
    .map((courseId) => coursesById.get(courseId))
    .filter((course): course is NonNullable<typeof course> => Boolean(course))
  store.classrooms = sanitizeClassrooms(savedState.timetable?.classrooms)
  store.avoidedTeachersText =
    typeof savedState.avoidedTeachersText === 'string' ? savedState.avoidedTeachersText : ''
  store.lastPage =
    typeof savedState.lastPage === 'string' && savedState.lastPage.startsWith('/')
      ? savedState.lastPage
      : ''
}

export const startPersistence = (router: Router) => {
  router.afterEach((to) => {
    store.lastPage = to.fullPath
  })

  watch(
    () => ({
      timetable: store.candidateCourses.map((course) => course.id),
      classrooms: { ...store.classrooms },
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

  if (canUseLocalStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('保存データの削除に失敗しました。', error)
    }
  }

  store.resetSelections()
}

export const resumePersistence = () => {
  isPersistencePaused = false
}
