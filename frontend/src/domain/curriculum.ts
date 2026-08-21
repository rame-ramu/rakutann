export type StudentLevel = 'undergraduate' | 'graduate'
export type StudentType = 'U' | 'M' | 'D'
export type ProgramLevel = 'undergraduate' | 'masters_or_doctoral_first' | 'doctoral_latter'
export type StudentAttributeValue = boolean | string
export type StudentAttributes = Record<string, StudentAttributeValue>
export type CourseScope =
  | 'university_common'
  | 'faculty_common'
  | 'department_common'
  | 'major'
  | 'open_course'
  | 'graduate_program'

export interface StudentAttributeOption {
  value: string
  label: string
}

export interface StudentAttributeApplicability {
  studentLevel: StudentLevel
  organizationCodes?: string[]
  admissionYearFrom: number
  admissionYearTo: number
  currentYearFrom: number
  currentYearTo: number
}

export interface StudentAttributeSourceEvidence {
  sourceFile: string
  sourcePage: number
  sourceRule: string
}

export interface StudentAttributeDefinition {
  id: string
  type: 'boolean' | 'single_select'
  label: string
  description: string
  required: boolean
  options?: StudentAttributeOption[]
  appliesTo: StudentAttributeApplicability[]
  visibleWhen?: {
    attributeId: string
    equals: StudentAttributeValue
  }
  sourceEvidence: StudentAttributeSourceEvidence[]
}

export interface CourseAttributeRule {
  id: string
  attributeId: string
  effect: 'hard_requirement' | 'classification_only'
  operator: 'equals' | 'not_equals'
  expectedValue: StudentAttributeValue
  courseCode: string
  studentLevel: StudentLevel
  organizationCodes: string[]
  admissionYearFrom: number
  admissionYearTo: number
  sourceFile: string
  sourcePage: number
  ruleSourcePage: number
  sourceRule: string
}

export interface AdmissionOrganizationOverride {
  admissionYearFrom: number
  admissionYearTo: number
  faculty?: string | null
  graduateSchool?: string | null
  department?: string | null
  major?: string | null
  course?: string | null
  specialization?: string | null
}

export interface StudentOrganization {
  code: string
  studentLevel: StudentLevel
  studentType: StudentType
  programLevel: ProgramLevel
  faculty: string | null
  graduateSchool: string | null
  department: string | null
  major: string | null
  course: string | null
  specialization: string | null
  campus: string
  validCurrentYears2026: number[]
  aliases: string[]
  admissionOrganizationOverrides?: AdmissionOrganizationOverride[]
}

export interface CurriculumCourse {
  studentLevel: StudentLevel
  studentTypes: StudentType[]
  admissionYearFrom: number
  admissionYearTo: number
  faculty: string | null
  graduateSchool: string | null
  department: string | null
  major: string | null
  course: string | null
  specialization: string | null
  organizationCodes: string[]
  organizationResolution: 'resolved' | 'unknown'
  courseScope: CourseScope
  courseCode: string
  numbering?: string | null
  courseName: string
  credits: number | null
  eligibleYears: number[]
  minYear: number | null
  semester: string | null
  conditionText: string
  eligibilityStatus: 'eligible' | 'conditional'
  hardExcludes: string[]
  excludedOrganizationCodes?: string[]
  sourceFile: string
  sourcePage: number
  sourcePrintedPage: number | null
  changeApplied?: boolean
}

export interface CourseReplacement {
  studentLevel: StudentLevel
  studentTypes: StudentType[]
  admissionYearFrom: number
  admissionYearTo: number
  organizationCodes: string[]
  fromCourseCode: string
  fromCourseName: string
  toCourseCode: string
  toCourseName: string | null
  effectiveAcademicYear: number | null
  sourceFile: string
  sourcePage: number
}

export interface CourseRelation {
  relationType: string
  organizationCodes?: string[]
  sourceFile: string
  sourcePage: number
}

export interface GeneratedCourseOffering {
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
  prerequisiteReason?: string
  groupWorkLabel?: string
  groupWorkReason?: string
  field: string
  sourceField: string
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
  sourceFile: string
  sourceRow: number
}
