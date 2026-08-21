import { describe, expect, it } from 'vitest'
import {
  getStudentOrganizationMaster,
  isValidStudentProfile,
  parseStudentId,
} from '../studentProfile'

describe('parseStudentId', () => {
  it('25001NKUを2025年度入学・感性工学専攻2年として解析する', () => {
    const profile = parseStudentId('25001NKU')
    expect(isValidStudentProfile(profile)).toBe(true)
    expect(profile).toMatchObject({
      studentId: '25001NKU',
      admissionYear: 2025,
      estimatedCurrentYear: 2,
      currentYear: 2,
      studentLevel: 'undergraduate',
      faculty: '人間情報学部',
      department: '人間情報学科',
      major: '感性工学専攻',
      studentType: 'U',
      campus: '長久手キャンパス',
      profileWarning: null,
      existenceVerified: false,
    })
  })

  it('25001NDUをデータサイエンス専攻として解析する', () => {
    expect(parseStudentId('25001NDU')).toMatchObject({
      status: 'valid',
      admissionYear: 2025,
      estimatedCurrentYear: 2,
      faculty: '人間情報学部',
      department: '人間情報学科',
      major: 'データサイエンス専攻',
      studentType: 'U',
    })
  })

  it('前後・内部空白、全角文字、小文字を正規化する', () => {
    expect(parseStudentId(' ２５００１ nku ')).toMatchObject({
      status: 'valid',
      studentId: '25001NKU',
      organizationCode: 'NKU',
    })
  })

  it('実学年があれば推定学年より優先する', () => {
    expect(parseStudentId('25001NKU', { actualCurrentYear: 3 })).toMatchObject({
      estimatedCurrentYear: 2,
      currentYear: 3,
    })
    expect(parseStudentId('25001NKU', { actualCurrentYear: 3 }).profileWarning).toContain(
      '登録済み実学年3年',
    )
  })

  it('MとDを課程まで区別する', () => {
    expect(parseStudentId('25001FPM')).toMatchObject({
      status: 'valid',
      studentLevel: 'graduate',
      studentType: 'M',
      programLevel: 'masters_or_doctoral_first',
      graduateSchool: '心理医療科学研究科',
      specialization: '心理学専修',
    })
    expect(parseStudentId('25001FPD')).toMatchObject({
      status: 'valid',
      studentLevel: 'graduate',
      studentType: 'D',
      programLevel: 'doctoral_latter',
      graduateSchool: '心理医療科学研究科',
      specialization: '心理学専修',
    })
  })

  it('入学年度別の正式名称を反映する', () => {
    expect(parseStudentId('26001GMU').major).toBe('観光専攻')
    expect(parseStudentId('25001GMU').major).toBe('国際交流・観光専攻')
  })

  it('対象学年矛盾を警告し、所属を変更しない', () => {
    const profile = parseStudentId('23001NMU')
    expect(profile).toMatchObject({
      status: 'valid',
      major: '数学・情報教員養成専攻',
      estimatedCurrentYear: 4,
    })
    expect(profile.profileWarning).toContain('2026年度対象学年（1年）')
  })

  it('形式不正と未登録所属を推測せず区別する', () => {
    expect(parseStudentId('24XXXNKU01')).toMatchObject({
      status: 'invalid_format',
      unknownOrganization: false,
    })
    expect(parseStudentId('26001ZZU')).toMatchObject({
      status: 'unknown_organization',
      organizationCode: 'ZZU',
      unknownOrganization: true,
    })
  })

  it('CLDの未確定階層を警告として残す', () => {
    const profile = parseStudentId('26001CLD')
    expect(profile.status).toBe('valid')
    expect(profile.graduateSchool).toBeNull()
    expect(profile.profileWarning).toContain('研究科階層')
  })

  it('所属マスターは学部28件・大学院36件で重複がない', () => {
    const organizations = getStudentOrganizationMaster()
    expect(organizations).toHaveLength(64)
    expect(
      organizations.filter((organization) => organization.studentLevel === 'undergraduate'),
    ).toHaveLength(28)
    expect(
      organizations.filter((organization) => organization.studentLevel === 'graduate'),
    ).toHaveLength(36)
    expect(new Set(organizations.map((organization) => organization.code)).size).toBe(64)
  })
})
