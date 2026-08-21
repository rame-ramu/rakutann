import type {
  CourseRelation,
  CourseReplacement,
  CurriculumCourse,
  GeneratedCourseOffering,
} from '../domain/curriculum'
import type { Course } from '../store'
import {
  getEligibilityResult,
  initializeEligibilityEngine,
  type EligibilityOptions,
  type EligibilityResult,
} from './eligibilityEngine'
import type { ValidStudentProfile } from './studentProfile'

const runtimeDataBaseUrl = `${import.meta.env.BASE_URL}data/runtime/`

let runtimeDataPromise: Promise<GeneratedCourseOffering[]> | null = null

const fetchRuntimeJson = async <T>(filename: string): Promise<T> => {
  const response = await fetch(`${runtimeDataBaseUrl}${filename}`)
  if (!response.ok) {
    throw new Error(`履修判定データを取得できませんでした (${filename}: ${response.status})`)
  }
  return (await response.json()) as T
}

export const loadEligibilityRuntime = () => {
  if (runtimeDataPromise) return runtimeDataPromise

  runtimeDataPromise = Promise.all([
    fetchRuntimeJson<CurriculumCourse[]>('curriculum_master.json'),
    fetchRuntimeJson<GeneratedCourseOffering[]>('course_offerings_2026.json'),
    fetchRuntimeJson<CourseReplacement[]>('course_replacement_master.json'),
    fetchRuntimeJson<CourseRelation[]>('course_relation_master.json'),
    fetchRuntimeJson<
      Array<{
        courseCode: string
        organizationCodes?: string[]
        admissionYearFrom?: number
        admissionYearTo?: number
      }>
    >('open_courses_master.json'),
  ])
    .then(([curriculum, offerings, replacements, relations, openCourses]) => {
      initializeEligibilityEngine({
        curriculum,
        offerings,
        replacements,
        relations,
        openCourses,
      })
      return offerings
    })
    .catch((error) => {
      runtimeDataPromise = null
      throw error
    })

  return runtimeDataPromise
}

export const getRuntimeEligibilityResult = async (
  profile: ValidStudentProfile,
  options: EligibilityOptions = {},
): Promise<EligibilityResult> => {
  await loadEligibilityRuntime()
  return getEligibilityResult(profile, options)
}

export const getRuntimeCoursesByIds = async (courseIds: readonly string[]): Promise<Course[]> => {
  if (courseIds.length === 0) return []
  const offerings = await loadEligibilityRuntime()
  const requestedIds = new Set(courseIds)
  return offerings.filter((course) => requestedIds.has(course.id)) as Course[]
}
