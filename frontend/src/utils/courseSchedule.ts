import type { Course, ScheduleSlot } from '../store'

export const COURSE_DAYS = ['月', '火', '水', '木', '金'] as const
export const COURSE_PERIODS = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14] as const

const courseDaySet = new Set<string>(COURSE_DAYS)
const coursePeriodSet = new Set<number>(COURSE_PERIODS)

export const getCourseDays = (course: Pick<Course, 'day'>) =>
  course.day
    .split('・')
    .map((day) => day.trim())
    .filter((day) => courseDaySet.has(day))

export const getCourseScheduleSlots = (course: Pick<Course, 'day' | 'period'>): ScheduleSlot[] => {
  if (course.period === null || !coursePeriodSet.has(course.period)) return []
  return getCourseDays(course).map((day) => ({ day, period: course.period as number }))
}

export const isUnscheduledCourse = (course: Pick<Course, 'day' | 'period'>) =>
  getCourseScheduleSlots(course).length === 0

export const courseMatchesSelectedSchedule = (
  course: Pick<Course, 'day' | 'period'>,
  selectedSchedule: readonly ScheduleSlot[],
  includeUnscheduledCourses: boolean,
) => {
  const courseSlots = getCourseScheduleSlots(course)
  if (courseSlots.length === 0) return includeUnscheduledCourses
  return courseSlots.every((courseSlot) =>
    selectedSchedule.some(
      (selectedSlot) =>
        selectedSlot.day === courseSlot.day && selectedSlot.period === courseSlot.period,
    ),
  )
}

export const coursesHaveScheduleConflict = (
  first: Pick<Course, 'day' | 'period'>,
  second: Pick<Course, 'day' | 'period'>,
) => {
  const secondKeys = new Set(
    getCourseScheduleSlots(second).map((slot) => `${slot.day}:${slot.period}`),
  )
  return getCourseScheduleSlots(first).some((slot) => secondKeys.has(`${slot.day}:${slot.period}`))
}

export const formatCourseSchedule = (course: Pick<Course, 'day' | 'period'>) => {
  if (isUnscheduledCourse(course)) return '集中・曜日時限未定'
  return `${course.day}${course.period}限`
}
