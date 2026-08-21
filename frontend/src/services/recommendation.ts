import type { Course } from '../store'

export const getConditionMatchCount = (course: Course, selectedConditions: readonly string[]) =>
  course.conditions.filter((condition) => selectedConditions.includes(condition)).length

export const compareCoursesByConditions = (
  first: Course,
  second: Course,
  selectedConditions: readonly string[],
) =>
  getConditionMatchCount(second, selectedConditions) -
  getConditionMatchCount(first, selectedConditions)
