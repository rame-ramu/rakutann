import type {
  CourseRelation,
  CourseReplacement,
  CurriculumCourse,
  GeneratedCourseOffering,
} from '../domain/curriculum'
import type { ValidStudentProfile } from './studentProfile'
import { evaluateCourseAttributeRule, getCourseAttributeRules } from './studentAttributes'

type OpenCourseRecord = {
  courseCode: string
  organizationCodes?: string[]
  admissionYearFrom?: number
  admissionYearTo?: number
}

export interface EligibilityEngineData {
  curriculum: CurriculumCourse[]
  offerings: GeneratedCourseOffering[]
  replacements: CourseReplacement[]
  relations: CourseRelation[]
  openCourses: OpenCourseRecord[]
}

let curriculum: CurriculumCourse[] = []
let offerings: GeneratedCourseOffering[] = []
let replacements: CourseReplacement[] = []
let relations: CourseRelation[] = []
let openCourses: OpenCourseRecord[] = []
let isEligibilityEngineInitialized = false

const offeringsByCode = new Map<string, GeneratedCourseOffering[]>()
const replacementsByFromCode = new Map<string, CourseReplacement[]>()
let curriculumByLevel: Record<'undergraduate' | 'graduate', CurriculumCourse[]> = {
  undergraduate: [],
  graduate: [],
}

export const initializeEligibilityEngine = (data: EligibilityEngineData) => {
  curriculum = data.curriculum
  offerings = data.offerings
  replacements = data.replacements
  relations = data.relations
  openCourses = data.openCourses

  offeringsByCode.clear()
  for (const offering of offerings) {
    const classes = offeringsByCode.get(offering.baseCourseCode) ?? []
    classes.push(offering)
    offeringsByCode.set(offering.baseCourseCode, classes)
  }

  replacementsByFromCode.clear()
  for (const replacement of replacements) {
    const candidates = replacementsByFromCode.get(replacement.fromCourseCode) ?? []
    candidates.push(replacement)
    replacementsByFromCode.set(replacement.fromCourseCode, candidates)
  }

  curriculumByLevel = {
    undergraduate: curriculum.filter((course) => course.studentLevel === 'undergraduate'),
    graduate: curriculum.filter((course) => course.studentLevel === 'graduate'),
  }
  isEligibilityEngineInitialized = true
}

const assertEligibilityEngineInitialized = () => {
  if (!isEligibilityEngineInitialized) {
    throw new Error('履修判定データが読み込まれていません。')
  }
}

export type EligibilityDecisionType = 'eligible' | 'conditional' | 'related_future' | 'excluded'

export interface EligibilityDecision {
  sourceCourseCode: string
  courseCode: string
  decision: EligibilityDecisionType
  internalReasons: string[]
  replacementFrom?: string
  sourceFile: string
  sourcePage: number
}

export interface EligibilityResult {
  eligibleCourseCodes: ReadonlySet<string>
  conditionalCourseCodes: ReadonlySet<string>
  relatedFutureCourseCodes: ReadonlySet<string>
  eligibleOfferings: GeneratedCourseOffering[]
  decisions: EligibilityDecision[]
}

export interface EligibilityOptions {
  currentYear?: number
  debug?: boolean
}

const relationAppliesToAdmission = (relation: CourseRelation, admissionYear: number) => {
  if (relation.sourceFile.includes('2026')) return admissionYear === 2026
  if (relation.sourceFile.includes('2025')) return admissionYear === 2025
  if (relation.sourceFile.includes('2024')) return admissionYear <= 2024
  return false
}

const permittedOrganizationCodes = (profile: ValidStudentProfile) => {
  const permitted = new Set([profile.organizationCode])
  for (const relation of relations) {
    if (!relation.relationType.startsWith('explicit_cross_')) continue
    if (!relation.organizationCodes?.includes(profile.organizationCode)) continue
    if (!relationAppliesToAdmission(relation, profile.admissionYear)) continue
    for (const code of relation.organizationCodes) permitted.add(code)
  }
  return permitted
}

const admissionMatches = (
  record: { admissionYearFrom: number; admissionYearTo: number },
  admissionYear: number,
) => admissionYear >= record.admissionYearFrom && admissionYear <= record.admissionYearTo

const replacementMatches = (
  replacement: CourseReplacement,
  profile: ValidStudentProfile,
  permittedCodes: ReadonlySet<string>,
) =>
  replacement.studentLevel === profile.studentLevel &&
  replacement.studentTypes.includes(profile.studentType) &&
  admissionMatches(replacement, profile.admissionYear) &&
  replacement.organizationCodes.some((code) => permittedCodes.has(code)) &&
  (replacement.effectiveAcademicYear === null || replacement.effectiveAcademicYear <= 2026)

const resolveToOfferingCodes = (
  courseCode: string,
  profile: ValidStudentProfile,
  permittedCodes: ReadonlySet<string>,
  visited = new Set<string>(),
): { codes: string[]; replacementApplied: boolean } => {
  if (visited.has(courseCode)) return { codes: [], replacementApplied: false }
  const nextVisited = new Set(visited).add(courseCode)
  const applicableReplacements = (replacementsByFromCode.get(courseCode) ?? []).filter(
    (replacement) => replacementMatches(replacement, profile, permittedCodes),
  )
  if (applicableReplacements.length > 0) {
    const resolved = applicableReplacements.flatMap(
      (replacement) =>
        resolveToOfferingCodes(replacement.toCourseCode, profile, permittedCodes, nextVisited)
          .codes,
    )
    return { codes: [...new Set(resolved)], replacementApplied: true }
  }
  return {
    codes: offeringsByCode.has(courseCode) ? [courseCode] : [],
    replacementApplied: false,
  }
}

const addDecision = (
  decisions: EligibilityDecision[],
  options: EligibilityOptions,
  decision: EligibilityDecision,
) => {
  if (decision.decision !== 'excluded' || options.debug) decisions.push(decision)
}

export const getEligibilityResult = (
  profile: ValidStudentProfile,
  options: EligibilityOptions = {},
): EligibilityResult => {
  assertEligibilityEngineInitialized()
  const currentYear = options.currentYear ?? profile.currentYear
  const permittedCodes = permittedOrganizationCodes(profile)
  const finalStatuses = new Map<string, 'eligible' | 'conditional'>()
  const relatedFutureCourseCodes = new Set<string>()
  const decisions: EligibilityDecision[] = []
  const relevantCurriculum = curriculumByLevel[profile.studentLevel]

  for (const course of relevantCurriculum) {
    const baseDecision = {
      sourceCourseCode: course.courseCode,
      courseCode: course.courseCode,
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
    }
    if (!course.studentTypes.includes(profile.studentType)) {
      addDecision(decisions, options, {
        ...baseDecision,
        decision: 'excluded',
        internalReasons: ['学生種別が対象外'],
      })
      continue
    }
    if (!admissionMatches(course, profile.admissionYear)) {
      addDecision(decisions, options, {
        ...baseDecision,
        decision: 'excluded',
        internalReasons: ['対象入学年度外'],
      })
      continue
    }
    const officiallyOpen = openCourses.some(
      (openCourse) =>
        openCourse.courseCode === course.courseCode &&
        (!openCourse.organizationCodes ||
          openCourse.organizationCodes.includes(profile.organizationCode)) &&
        (!openCourse.admissionYearFrom || profile.admissionYear >= openCourse.admissionYearFrom) &&
        (!openCourse.admissionYearTo || profile.admissionYear <= openCourse.admissionYearTo),
    )
    const organizationMatches =
      officiallyOpen || course.organizationCodes.some((code) => permittedCodes.has(code))
    if (!organizationMatches) {
      addDecision(decisions, options, {
        ...baseDecision,
        decision: 'excluded',
        internalReasons: ['本人所属・共通科目・明示的他専攻許可のいずれにも該当しない'],
      })
      continue
    }
    if (course.excludedOrganizationCodes?.includes(profile.organizationCode)) {
      addDecision(decisions, options, {
        ...baseDecision,
        decision: 'excluded',
        internalReasons: ['履修要覧の明示的な所属除外'],
      })
      continue
    }

    const attributeRules = getCourseAttributeRules(profile, course)
    const hardAttributeRules = attributeRules.filter((rule) => rule.effect === 'hard_requirement')
    const evaluatedHardRules = hardAttributeRules.map((rule) => ({
      rule,
      evaluation: evaluateCourseAttributeRule(rule, profile.attributes),
    }))
    const failedAttributeRule = evaluatedHardRules.find(
      ({ evaluation }) => evaluation === 'unsatisfied',
    )
    if (failedAttributeRule) {
      addDecision(decisions, options, {
        ...baseDecision,
        decision: 'excluded',
        internalReasons: [
          `追加属性条件を満たさない: ${failedAttributeRule.rule.sourceRule}`,
          `${failedAttributeRule.rule.attributeId}=${String(profile.attributes[failedAttributeRule.rule.attributeId] ?? false)}`,
        ],
      })
      continue
    }
    const hasUnknownAttributeRule = evaluatedHardRules.some(
      ({ evaluation }) => evaluation === 'unknown',
    )
    const matchedClassifications = attributeRules.filter(
      (rule) =>
        rule.effect === 'classification_only' &&
        evaluateCourseAttributeRule(rule, profile.attributes) === 'satisfied',
    )
    if (course.minYear !== null && course.minYear > currentYear) {
      relatedFutureCourseCodes.add(course.courseCode)
      decisions.push({
        ...baseDecision,
        decision: 'related_future',
        internalReasons: [
          `${profile.admissionYear}年度入学`,
          profile.organizationCode,
          `履修年次${course.eligibleYears.join('・')}（現在${currentYear}年）`,
        ],
      })
      continue
    }

    const discontinued = /廃止/.test(course.conditionText)
    const resolution = resolveToOfferingCodes(course.courseCode, profile, permittedCodes)
    if (resolution.codes.length === 0 || (discontinued && !resolution.replacementApplied)) {
      addDecision(decisions, options, {
        ...baseDecision,
        decision: 'excluded',
        internalReasons: [
          discontinued ? '廃止かつ2026年度開講の読替先なし' : '2026年度実授業に科目番号なし',
        ],
      })
      continue
    }

    const status =
      course.eligibilityStatus === 'conditional' || hasUnknownAttributeRule
        ? 'conditional'
        : 'eligible'
    for (const resolvedCode of resolution.codes) {
      const existingStatus = finalStatuses.get(resolvedCode)
      if (!existingStatus || existingStatus === 'conditional' || status === 'eligible') {
        finalStatuses.set(resolvedCode, status)
      }
      decisions.push({
        ...baseDecision,
        courseCode: resolvedCode,
        decision: status,
        replacementFrom: resolution.replacementApplied ? course.courseCode : undefined,
        internalReasons: [
          `${profile.admissionYear}年度入学`,
          profile.organizationCode,
          course.courseScope,
          course.eligibleYears.length > 0
            ? `履修年次${course.eligibleYears.join('・')}`
            : '履修年次不明のためconditional保持',
          ...(resolution.replacementApplied ? [`${course.courseCode}から2026年度科目へ読替`] : []),
          ...evaluatedHardRules
            .filter(({ evaluation }) => evaluation === 'satisfied')
            .map(({ rule }) => `追加属性条件を確認: ${rule.sourceRule}`),
          ...matchedClassifications.map((rule) => `選択属性に対応する科目区分: ${rule.sourceRule}`),
          ...(hasUnknownAttributeRule ? ['追加属性が未選択のためconditional保持'] : []),
          ...(status === 'conditional' ? ['学籍番号だけでは確定できない条件あり'] : []),
        ],
      })
    }
  }

  const eligibleCourseCodes = new Set(finalStatuses.keys())
  const conditionalCourseCodes = new Set(
    [...finalStatuses]
      .filter(([, status]) => status === 'conditional')
      .map(([courseCode]) => courseCode),
  )
  const eligibleOfferings = offerings.filter((offering) =>
    eligibleCourseCodes.has(offering.baseCourseCode),
  )
  return {
    eligibleCourseCodes,
    conditionalCourseCodes,
    relatedFutureCourseCodes,
    eligibleOfferings,
    decisions,
  }
}

export const getEligibleCourses = (
  profile: ValidStudentProfile,
  options: EligibilityOptions = {},
) => getEligibilityResult(profile, options).eligibleCourseCodes

export const getEligibleOfferings = (
  profile: ValidStudentProfile,
  options: EligibilityOptions = {},
) => getEligibilityResult(profile, options).eligibleOfferings
