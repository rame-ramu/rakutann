import { describe, expect, it } from 'vitest'
import {
  getApplicableStudentAttributes,
  getMissingRequiredStudentAttributes,
  getStudentAttributeMaster,
} from '../studentAttributes'
import { isValidStudentProfile, parseStudentId, type ValidStudentProfile } from '../studentProfile'

const profile = (
  studentId: string,
  actualCurrentYear?: number,
  attributes: Record<string, boolean | string> = {},
): ValidStudentProfile => {
  const parsed = parseStudentId(studentId, { actualCurrentYear, attributes })
  if (!isValidStudentProfile(parsed)) throw new Error(`${studentId}を解析できません。`)
  return parsed
}

const applicableIds = (studentProfile: ValidStudentProfile) =>
  getApplicableStudentAttributes(studentProfile).map((attribute) => attribute.id)

describe('student attribute master', () => {
  it('属性IDが重複せず、許可された固定属性8件だけを保持する', () => {
    const attributes = getStudentAttributeMaster()
    expect(attributes).toHaveLength(8)
    expect(new Set(attributes.map((attribute) => attribute.id)).size).toBe(8)
    expect(attributes.map((attribute) => attribute.id)).toEqual([
      'teacherTrainingRegistered',
      'otherDepartmentTeachingLicenseApproved',
      'curatorProgramRegistered',
      'librarianProgramRegistered',
      'firstLanguage',
      'educationCourse',
      'languageSpecialization',
      'glocomCourse',
    ])
  })

  it('NKUには共通の課程登録と第一言語だけを表示する', () => {
    expect(applicableIds(profile('25001NKU'))).toEqual([
      'teacherTrainingRegistered',
      'curatorProgramRegistered',
      'librarianProgramRegistered',
      'firstLanguage',
    ])
  })

  it('他学科免履修はFCUかつ教職課程登録時だけ表示する', () => {
    expect(applicableIds(profile('25001FCU'))).not.toContain(
      'otherDepartmentTeachingLicenseApproved',
    )
    expect(
      applicableIds(
        profile('25001FCU', undefined, {
          teacherTrainingRegistered: true,
        }),
      ),
    ).toContain('otherDepartmentTeachingLicenseApproved')
    expect(
      applicableIds(
        profile('25001NKU', undefined, {
          teacherTrainingRegistered: true,
        }),
      ),
    ).not.toContain('otherDepartmentTeachingLicenseApproved')
    expect(
      applicableIds(
        profile('24001FCU', undefined, {
          teacherTrainingRegistered: true,
        }),
      ),
    ).not.toContain('otherDepartmentTeachingLicenseApproved')
  })

  it('教育学部コースは2025・2026年度入学の2年次以降だけに表示する', () => {
    expect(applicableIds(profile('25001KEU'))).toContain('educationCourse')
    expect(applicableIds(profile('26001KEU'))).not.toContain('educationCourse')
    expect(applicableIds(profile('26001KEU', 2))).toContain('educationCourse')
    expect(applicableIds(profile('24001KEU'))).not.toContain('educationCourse')
  })

  it('GLU専修は2026年度入学者の2年次以降だけに表示する', () => {
    expect(applicableIds(profile('26001GLU'))).not.toContain('languageSpecialization')
    expect(applicableIds(profile('26001GLU', 2))).toContain('languageSpecialization')
    expect(applicableIds(profile('25001GLU'))).not.toContain('languageSpecialization')
  })

  it('GLOCOMコースは2022年度以降入学の2年次以降だけに表示する', () => {
    expect(applicableIds(profile('25001EXU'))).toContain('glocomCourse')
    expect(applicableIds(profile('26001EXU'))).not.toContain('glocomCourse')
    expect(applicableIds(profile('21001EXU', 4))).not.toContain('glocomCourse')
  })

  it('大学院生には学部向け追加属性を表示しない', () => {
    expect(applicableIds(profile('25001FPM'))).toEqual([])
    expect(applicableIds(profile('25001FPD'))).toEqual([])
  })

  it('第一言語と該当するコース・専修だけを必須選択として返す', () => {
    expect(getMissingRequiredStudentAttributes(profile('25001NKU')).map(({ id }) => id)).toEqual([
      'firstLanguage',
    ])
    expect(
      getMissingRequiredStudentAttributes(
        profile('25001KEU', undefined, { firstLanguage: 'ja' }),
      ).map(({ id }) => id),
    ).toEqual(['educationCourse'])
  })
})
