import { reactive } from 'vue'
import { getExclusiveConditionSiblings } from '../constants/courseConditions'
import {
  isValidStudentProfile,
  parseStudentId,
  type StudentProfile,
} from '../services/studentProfile'
import {
  createDefaultStudentAttributes,
  normalizeApplicableStudentAttributes,
} from '../services/studentAttributes'
import type { StudentAttributeValue } from '../domain/curriculum'
import { coursesHaveScheduleConflict, getCourseScheduleSlots } from '../utils/courseSchedule'

export interface Course {
  id: string
  syllabusUrl?: string
  baseCourseCode: string
  classNumber: string
  years: number[]
  name: string
  instructor: string
  semester: string
  day: string
  period: number | null
  credits: number
  classFormat: string
  attendancePercent: number
  reportPercent: number
  examPercent: number
  onDemandPercent: number
  onDemandClasses: number
  onDemandLabel: string
  hasPrerequisite: boolean
  prerequisiteLabel: string
  field: string
  conditions: string[]
  tagReasons: { tag: string; reason: string }[]
  description: string
  evaluation: {
    attendance: number
    quiz: number
    midtermExam: number
    finalExam: number
    assignment: number
    midtermAssignment: number
    finalAssignment: number
  }
  faculty?: string[]
  campus?: string
}

export interface ScheduleSlot {
  day: string
  period: number
}

export interface CourseDetail {
  room: string
  memo: string
}

const formatOrganization = (profile: StudentProfile) =>
  [
    ...new Set(
      [
        profile.faculty ?? profile.graduateSchool,
        profile.department,
        profile.major,
        profile.course,
        profile.specialization,
      ].filter((value): value is string => Boolean(value)),
    ),
  ].join(' ')

export const store = reactive({
  studentId: '',
  studentProfile: null as StudentProfile | null,
  profileWarning: null as string | null,
  grade: null as number | null,
  autoDetectedGrade: null as number | null,
  isGradeManuallySelected: false,
  department: null as string | null,
  isHumanInfoStudent: false,
  selectedConditions: [] as string[],
  selectedSemester: '' as '' | '前期' | '後期',
  selectedSchedule: [] as ScheduleSlot[],
  includeUnscheduledCourses: false,
  candidateCourses: [] as Course[],
  classrooms: {} as Record<string, string>,
  courseDetails: {} as Record<string, CourseDetail>,
  avoidedTeachersText: '',
  selectedCourse: null as Course | null,
  lastPage: '',

  setStudentId(id: string) {
    const profile = parseStudentId(id)
    this.studentId = profile.studentId
    this.studentProfile = profile
    this.profileWarning = profile.profileWarning
    if (!isValidStudentProfile(profile)) {
      this.grade = null
      this.autoDetectedGrade = null
      this.isGradeManuallySelected = false
      this.department = null
      this.isHumanInfoStudent = false
      return
    }

    this.autoDetectedGrade = profile.estimatedCurrentYear
    this.grade = profile.currentYear
    this.isGradeManuallySelected = false
    this.isHumanInfoStudent = ['NKU', 'NDU', 'NMU'].includes(profile.organizationCode)
    profile.attributes = createDefaultStudentAttributes(profile)
    this.department = formatOrganization(profile)
  },

  setGrade(grade: number) {
    this.grade = grade
    this.isGradeManuallySelected = this.autoDetectedGrade !== grade
    if (this.studentProfile && isValidStudentProfile(this.studentProfile)) {
      const updatedProfile = this.studentId
        ? parseStudentId(this.studentId, {
            actualCurrentYear: grade,
            attributes: this.studentProfile.attributes,
          })
        : this.studentProfile
      if (isValidStudentProfile(updatedProfile)) {
        updatedProfile.currentYear = grade
        const applicableDefaults = createDefaultStudentAttributes(updatedProfile, grade)
        updatedProfile.attributes = normalizeApplicableStudentAttributes(
          updatedProfile,
          {
            ...applicableDefaults,
            ...updatedProfile.attributes,
          },
          grade,
        )
        this.studentProfile = updatedProfile
        this.profileWarning = updatedProfile.profileWarning
        this.department = formatOrganization(updatedProfile)
      }
    }
  },

  setStudentAttribute(attributeId: string, value: StudentAttributeValue) {
    if (!this.studentProfile || !isValidStudentProfile(this.studentProfile)) return
    this.studentProfile.attributes = {
      ...this.studentProfile.attributes,
      [attributeId]: value,
    }
    this.studentProfile.attributes = normalizeApplicableStudentAttributes(
      this.studentProfile,
      this.studentProfile.attributes,
      this.grade ?? this.studentProfile.currentYear,
    )
  },

  toggleCondition(condition: string) {
    const index = this.selectedConditions.indexOf(condition)
    if (index === -1) {
      const exclusiveSiblings = new Set(getExclusiveConditionSiblings(condition))
      this.selectedConditions = this.selectedConditions.filter(
        (selected) => !exclusiveSiblings.has(selected),
      )
      this.selectedConditions.push(condition)
    } else {
      this.selectedConditions.splice(index, 1)
    }
  },

  setIncludeUnscheduledCourses(include: boolean) {
    this.includeUnscheduledCourses = include
  },

  setSelectedSemester(semester: '' | '前期' | '後期') {
    this.selectedSemester = this.selectedSemester === semester ? '' : semester
  },

  toggleSchedule(day: string, period: number) {
    const hasCandidate = this.candidateCourses.some((course) =>
      getCourseScheduleSlots(course).some((slot) => slot.day === day && slot.period === period),
    )
    if (hasCandidate) return

    const index = this.selectedSchedule.findIndex((s) => s.day === day && s.period === period)
    if (index === -1) {
      this.selectedSchedule.push({ day, period })
    } else {
      this.selectedSchedule.splice(index, 1)
    }
  },

  addCandidateCourse(course: Course) {
    if (
      this.candidateCourses.some(
        (candidate) => candidate.id !== course.id && coursesHaveScheduleConflict(course, candidate),
      )
    ) {
      return false
    }

    for (const courseSlot of getCourseScheduleSlots(course)) {
      const hasSchedule = this.selectedSchedule.some(
        (slot) => slot.day === courseSlot.day && slot.period === courseSlot.period,
      )
      if (!hasSchedule) this.selectedSchedule.push(courseSlot)
    }

    const hasCourse = this.candidateCourses.some((candidate) => candidate.id === course.id)
    if (!hasCourse) {
      this.candidateCourses.push(course)
    }
    return true
  },

  removeCandidateCourse(courseId: string) {
    this.candidateCourses = this.candidateCourses.filter((course) => course.id !== courseId)
    delete this.classrooms[courseId]
    delete this.courseDetails[courseId]
  },

  setClassroom(courseId: string, classroom: string) {
    this.setCourseRoom(courseId, classroom)
  },

  getCourseRoom(courseId: string) {
    return this.courseDetails[courseId]?.room || this.classrooms[courseId] || ''
  },

  setCourseRoom(courseId: string, room: string) {
    const detail = this.courseDetails[courseId] || { room: '', memo: '' }
    const value = room.trim()

    if (value) {
      this.classrooms[courseId] = value
    } else {
      delete this.classrooms[courseId]
    }

    detail.room = value
    if (detail.room || detail.memo) {
      this.courseDetails[courseId] = detail
    } else {
      delete this.courseDetails[courseId]
    }
  },

  getCourseMemo(courseId: string) {
    return this.courseDetails[courseId]?.memo || ''
  },

  setCourseMemo(courseId: string, memo: string) {
    const detail = this.courseDetails[courseId] || {
      room: this.classrooms[courseId] || '',
      memo: '',
    }
    detail.memo = memo

    if (detail.room || detail.memo) {
      this.courseDetails[courseId] = detail
    } else {
      delete this.courseDetails[courseId]
    }
  },

  setAvoidedTeachers(value: string) {
    this.avoidedTeachersText = value
  },

  setSelectedCourse(course: Course | null) {
    this.selectedCourse = course
  },

  resetSelections() {
    this.studentId = ''
    this.studentProfile = null
    this.profileWarning = null
    this.grade = null
    this.autoDetectedGrade = null
    this.isGradeManuallySelected = false
    this.department = null
    this.isHumanInfoStudent = false
    this.selectedConditions = []
    this.selectedSemester = ''
    this.selectedSchedule = []
    this.includeUnscheduledCourses = false
    this.candidateCourses = []
    this.classrooms = {}
    this.courseDetails = {}
    this.avoidedTeachersText = ''
    this.selectedCourse = null
    this.lastPage = ''
  },
})
