import attributeRuleData from '../../data/generated/course_attribute_rule_master.json'
import attributeMasterData from '../../data/generated/student_attribute_master.json'
import type {
  CourseAttributeRule,
  CurriculumCourse,
  StudentAttributeDefinition,
  StudentAttributes,
  StudentAttributeValue,
} from '../domain/curriculum'
import type { ValidStudentProfile } from './studentProfile'

const attributeMaster = attributeMasterData as StudentAttributeDefinition[]
const attributeRules = attributeRuleData as CourseAttributeRule[]
const attributeById = new Map(attributeMaster.map((attribute) => [attribute.id, attribute]))
const attributeRulesByCourseCode = new Map<string, CourseAttributeRule[]>()

for (const rule of attributeRules) {
  const rules = attributeRulesByCourseCode.get(rule.courseCode) ?? []
  rules.push(rule)
  attributeRulesByCourseCode.set(rule.courseCode, rules)
}

const applicabilityMatches = (
  definition: StudentAttributeDefinition,
  profile: ValidStudentProfile,
  currentYear: number,
) =>
  (!definition.visibleWhen ||
    profile.attributes[definition.visibleWhen.attributeId] === definition.visibleWhen.equals) &&
  definition.appliesTo.some(
    (applicability) =>
      applicability.studentLevel === profile.studentLevel &&
      profile.admissionYear >= applicability.admissionYearFrom &&
      profile.admissionYear <= applicability.admissionYearTo &&
      currentYear >= applicability.currentYearFrom &&
      currentYear <= applicability.currentYearTo &&
      (!applicability.organizationCodes ||
        applicability.organizationCodes.includes(profile.organizationCode)),
  )

export const getStudentAttributeMaster = () => attributeMaster

export const getApplicableStudentAttributes = (
  profile: ValidStudentProfile,
  currentYear = profile.currentYear,
) => attributeMaster.filter((definition) => applicabilityMatches(definition, profile, currentYear))

export const isStudentAttributeValueValid = (
  definition: StudentAttributeDefinition,
  value: unknown,
): value is StudentAttributeValue => {
  if (definition.type === 'boolean') return typeof value === 'boolean'
  return (
    typeof value === 'string' &&
    Boolean(definition.options?.some((option) => option.value === value))
  )
}

export const sanitizeStudentAttributes = (value: unknown): StudentAttributes => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const source = value as Record<string, unknown>
  const sanitized: StudentAttributes = {}
  for (const definition of attributeMaster) {
    const candidate = source[definition.id]
    if (isStudentAttributeValueValid(definition, candidate)) {
      sanitized[definition.id] = candidate
    }
  }
  return sanitized
}

export const createDefaultStudentAttributes = (
  profile: ValidStudentProfile,
  currentYear = profile.currentYear,
): StudentAttributes =>
  Object.fromEntries(
    getApplicableStudentAttributes(profile, currentYear)
      .filter((definition) => definition.type === 'boolean')
      .map((definition) => [definition.id, false]),
  )

export const normalizeApplicableStudentAttributes = (
  profile: ValidStudentProfile,
  value: unknown = profile.attributes,
  currentYear = profile.currentYear,
): StudentAttributes => {
  const sanitized = sanitizeStudentAttributes(value)
  const profileWithSanitizedAttributes: ValidStudentProfile = {
    ...profile,
    attributes: sanitized,
  }
  const normalized: StudentAttributes = {}
  for (const definition of getApplicableStudentAttributes(
    profileWithSanitizedAttributes,
    currentYear,
  )) {
    const candidate = sanitized[definition.id]
    if (isStudentAttributeValueValid(definition, candidate)) {
      normalized[definition.id] = candidate
    } else if (definition.type === 'boolean') {
      normalized[definition.id] = false
    }
  }
  return normalized
}

export const getMissingRequiredStudentAttributes = (
  profile: ValidStudentProfile,
  currentYear = profile.currentYear,
) =>
  getApplicableStudentAttributes(profile, currentYear).filter(
    (definition) =>
      definition.required &&
      !isStudentAttributeValueValid(definition, profile.attributes[definition.id]),
  )

const ruleMatchesProfileAndCourse = (
  rule: CourseAttributeRule,
  profile: ValidStudentProfile,
  course: CurriculumCourse,
) =>
  rule.studentLevel === profile.studentLevel &&
  rule.courseCode === course.courseCode &&
  rule.sourceFile === course.sourceFile &&
  rule.sourcePage === course.sourcePage &&
  profile.admissionYear >= rule.admissionYearFrom &&
  profile.admissionYear <= rule.admissionYearTo &&
  rule.organizationCodes.includes(profile.organizationCode)

export const getCourseAttributeRules = (profile: ValidStudentProfile, course: CurriculumCourse) =>
  (attributeRulesByCourseCode.get(course.courseCode) ?? []).filter((rule) =>
    ruleMatchesProfileAndCourse(rule, profile, course),
  )

export type AttributeRuleEvaluation = 'satisfied' | 'unsatisfied' | 'unknown'

export const evaluateCourseAttributeRule = (
  rule: CourseAttributeRule,
  attributes: StudentAttributes,
): AttributeRuleEvaluation => {
  const definition = attributeById.get(rule.attributeId)
  if (!definition) return 'unknown'

  const rawValue = attributes[rule.attributeId]
  const value = definition.type === 'boolean' && rawValue === undefined ? false : rawValue
  if (!isStudentAttributeValueValid(definition, value)) return 'unknown'

  const matches = value === rule.expectedValue
  return rule.operator === 'equals'
    ? matches
      ? 'satisfied'
      : 'unsatisfied'
    : matches
      ? 'unsatisfied'
      : 'satisfied'
}
