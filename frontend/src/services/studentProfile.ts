import organizationMasterData from '../../data/generated/student_org_master.json'
import type {
  ProgramLevel,
  StudentAttributes,
  StudentLevel,
  StudentOrganization,
  StudentType,
} from '../domain/curriculum'

export const REFERENCE_ACADEMIC_YEAR = 2026

const organizationMaster = organizationMasterData as StudentOrganization[]
const organizationByCode = new Map(
  organizationMaster.map((organization) => [organization.code, organization]),
)

export type StudentProfileStatus = 'valid' | 'invalid_format' | 'unknown_organization'

export interface StudentProfile {
  status: StudentProfileStatus
  studentId: string
  individualNumber: string | null
  organizationCode: string | null
  admissionYear: number | null
  estimatedCurrentYear: number | null
  currentYear: number | null
  studentLevel: StudentLevel | null
  faculty: string | null
  graduateSchool: string | null
  department: string | null
  major: string | null
  course: string | null
  specialization: string | null
  studentType: StudentType | null
  programLevel: ProgramLevel | null
  campus: string | null
  profileWarning: string | null
  unknownOrganization: boolean
  existenceVerified: false
  attributes: StudentAttributes
}

export interface ValidStudentProfile extends StudentProfile {
  status: 'valid'
  individualNumber: string
  organizationCode: string
  admissionYear: number
  estimatedCurrentYear: number
  currentYear: number
  studentLevel: StudentLevel
  studentType: StudentType
  programLevel: ProgramLevel
  campus: string
  unknownOrganization: false
}

export interface ParseStudentIdOptions {
  actualCurrentYear?: number | null
  attributes?: StudentAttributes
}

export const normalizeStudentId = (input: string) =>
  input.normalize('NFKC').replace(/\s+/g, '').toUpperCase()

const emptyProfile = (
  studentId: string,
  status: Exclude<StudentProfileStatus, 'valid'>,
  profileWarning: string,
  organizationCode: string | null = null,
): StudentProfile => ({
  status,
  studentId,
  individualNumber: null,
  organizationCode,
  admissionYear: null,
  estimatedCurrentYear: null,
  currentYear: null,
  studentLevel: null,
  faculty: null,
  graduateSchool: null,
  department: null,
  major: null,
  course: null,
  specialization: null,
  studentType: null,
  programLevel: null,
  campus: null,
  profileWarning,
  unknownOrganization: status === 'unknown_organization',
  existenceVerified: false,
  attributes: {},
})

export const parseStudentId = (
  input: string,
  options: ParseStudentIdOptions = {},
): StudentProfile => {
  const studentId = normalizeStudentId(input)
  const match = studentId.match(/^(\d{2})(\d{3})([A-Z]{3})$/)
  if (!match) {
    return emptyProfile(
      studentId,
      'invalid_format',
      '学籍番号は「入学年2桁＋個人番号3桁＋所属コード3文字」で入力してください。',
    )
  }

  const admissionYear = 2000 + Number(match[1])
  const individualNumber = match[2]
  const organizationCode = match[3]
  if (!individualNumber || !organizationCode) {
    return emptyProfile(studentId, 'invalid_format', '学籍番号を解析できません。')
  }
  const organization = organizationByCode.get(organizationCode)
  if (!organization) {
    const unknown = emptyProfile(
      studentId,
      'unknown_organization',
      `所属コード「${organizationCode}」は所属マスターに存在しません。`,
      organizationCode,
    )
    unknown.individualNumber = individualNumber
    unknown.admissionYear = admissionYear
    unknown.estimatedCurrentYear = REFERENCE_ACADEMIC_YEAR - admissionYear + 1
    unknown.currentYear = options.actualCurrentYear ?? unknown.estimatedCurrentYear
    unknown.studentType = organizationCode.at(-1) as StudentType
    return unknown
  }

  const estimatedCurrentYear = REFERENCE_ACADEMIC_YEAR - admissionYear + 1
  const currentYear = options.actualCurrentYear ?? estimatedCurrentYear
  const override = organization.admissionOrganizationOverrides?.find(
    (candidate) =>
      admissionYear >= candidate.admissionYearFrom && admissionYear <= candidate.admissionYearTo,
  )
  const warnings: string[] = []
  if (!organization.validCurrentYears2026.includes(estimatedCurrentYear)) {
    warnings.push(
      `${organizationCode}の2026年度対象学年（${organization.validCurrentYears2026.join('・')}年）と、学籍番号から推定した${estimatedCurrentYear}年が一致しません。`,
    )
  }
  if (options.actualCurrentYear && options.actualCurrentYear !== estimatedCurrentYear) {
    warnings.push(
      `学籍番号からの推定は${estimatedCurrentYear}年ですが、登録済み実学年${options.actualCurrentYear}年を使用します。`,
    )
  }
  if (organization.studentLevel === 'graduate' && !organization.graduateSchool) {
    warnings.push(`${organizationCode}の正式な研究科階層は指定資料から一意に確定できません。`)
  }

  return {
    status: 'valid',
    studentId,
    individualNumber,
    organizationCode,
    admissionYear,
    estimatedCurrentYear,
    currentYear,
    studentLevel: organization.studentLevel,
    faculty: override?.faculty ?? organization.faculty,
    graduateSchool: override?.graduateSchool ?? organization.graduateSchool,
    department: override?.department ?? organization.department,
    major: override?.major ?? organization.major,
    course: override?.course ?? organization.course,
    specialization: override?.specialization ?? organization.specialization,
    studentType: organization.studentType,
    programLevel: organization.programLevel,
    campus: organization.campus,
    profileWarning: warnings.length > 0 ? warnings.join(' ') : null,
    unknownOrganization: false,
    existenceVerified: false,
    attributes: { ...options.attributes },
  }
}

export const isValidStudentProfile = (profile: StudentProfile): profile is ValidStudentProfile =>
  profile.status === 'valid'

export const getStudentOrganizationMaster = () => organizationMaster
