import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import curriculumData from '../../../data/generated/curriculum_master.json'
import offeringData from '../../../data/generated/course_offerings_2026.json'
import openCourseData from '../../../data/generated/open_courses_master.json'
import relationData from '../../../data/generated/course_relation_master.json'
import replacementData from '../../../data/generated/course_replacement_master.json'
import type {
  CourseRelation,
  CourseReplacement,
  CurriculumCourse,
  GeneratedCourseOffering,
} from '../../domain/curriculum'
import { SELECTABLE_CONDITIONS } from '../../constants/courseConditions'
import { getCourseScheduleSlots, isUnscheduledCourse } from '../../utils/courseSchedule'
import { getEligibilityResult, initializeEligibilityEngine } from '../eligibilityEngine'
import { isValidStudentProfile, parseStudentId, type ValidStudentProfile } from '../studentProfile'

initializeEligibilityEngine({
  curriculum: curriculumData as CurriculumCourse[],
  offerings: offeringData as GeneratedCourseOffering[],
  replacements: replacementData as CourseReplacement[],
  relations: relationData as CourseRelation[],
  openCourses: openCourseData,
})

const profile = (studentId: string): ValidStudentProfile => {
  const parsed = parseStudentId(studentId)
  if (!isValidStudentProfile(parsed)) throw new Error(`${studentId}を解析できません。`)
  return parsed
}

const profileWithAttributes = (
  studentId: string,
  attributes: Record<string, boolean | string>,
  actualCurrentYear?: number,
): ValidStudentProfile => {
  const parsed = parseStudentId(studentId, { attributes, actualCurrentYear })
  if (!isValidStudentProfile(parsed)) throw new Error(`${studentId}を解析できません。`)
  return parsed
}

describe('getEligibilityResult', () => {
  const nkuProfile = profile('25001NKU')
  const nduProfile = profile('25001NDU')
  const nku = getEligibilityResult(nkuProfile)
  const ndu = getEligibilityResult(nduProfile)
  const nkuOnly = [...nku.eligibleCourseCodes]
    .filter((courseCode) => !ndu.eligibleCourseCodes.has(courseCode))
    .sort()
  const nduOnly = [...ndu.eligibleCourseCodes]
    .filter((courseCode) => !nku.eligibleCourseCodes.has(courseCode))
    .sort()
  const common = [...nku.eligibleCourseCodes]
    .filter((courseCode) => ndu.eligibleCourseCodes.has(courseCode))
    .sort()

  it('画面で選べる全希望タグに2026年度授業が1件以上対応する', () => {
    const offerings = offeringData as GeneratedCourseOffering[]
    for (const condition of SELECTABLE_CONDITIONS) {
      expect(
        offerings.some((offering) => offering.conditions.includes(condition)),
        `${condition}に対応授業がありません。`,
      ).toBe(true)
    }
  })

  it('全6298クラスを通常時間割または集中・曜日時限未定として扱える', () => {
    const offerings = offeringData as GeneratedCourseOffering[]
    const scheduled = offerings.filter((offering) => getCourseScheduleSlots(offering).length > 0)
    const unscheduled = offerings.filter(isUnscheduledCourse)
    expect(scheduled.length + unscheduled.length).toBe(6298)
    expect(unscheduled).toHaveLength(418)
    expect(scheduled.some((offering) => offering.day.includes('・'))).toBe(true)
    expect(scheduled.some((offering) => (offering.period ?? 0) > 5)).toBe(true)
  })

  it('NKUとNDUの2年次候補を専攻別に分離する', () => {
    expect(nku.eligibleCourseCodes.size).toBeGreaterThan(0)
    expect(ndu.eligibleCourseCodes.size).toBeGreaterThan(0)
    expect(nkuOnly.length).toBeGreaterThan(0)
    expect(nduOnly.length).toBeGreaterThan(0)

    const generatedLog = {
      referenceAcademicYear: 2026,
      admissionYear: 2025,
      currentYear: 2,
      NKU: {
        candidateCourseCount: nku.eligibleCourseCodes.size,
        classCount: nku.eligibleOfferings.length,
      },
      NDU: {
        candidateCourseCount: ndu.eligibleCourseCodes.size,
        classCount: ndu.eligibleOfferings.length,
      },
      commonCourseCount: common.length,
      nkuOnlyCourseCount: nkuOnly.length,
      nduOnlyCourseCount: nduOnly.length,
      commonCourseCodes: common,
      nkuOnlyCourseCodes: nkuOnly,
      nduOnlyCourseCodes: nduOnly,
    }
    writeFileSync(
      path.resolve('data/generated/nku_ndu_comparison_2025_year2.json'),
      `${JSON.stringify(generatedLog, null, 2)}\n`,
      'utf8',
    )
  })

  it('他専攻だけに掲載された科目を混入させない', () => {
    expect(nku.eligibleCourseCodes.has('215202')).toBe(true)
    expect(ndu.eligibleCourseCodes.has('215202')).toBe(false)
    expect(ndu.eligibleCourseCodes.has('215300')).toBe(true)
    expect(nku.eligibleCourseCodes.has('215300')).toBe(false)
    expect(ndu.eligibleCourseCodes.has('215306')).toBe(true)
    expect(nku.eligibleCourseCodes.has('215306')).toBe(false)
  })

  it('全学共通科目を両専攻へ含める', () => {
    const curriculum = curriculumData as CurriculumCourse[]
    const commonOfferedCode = curriculum.find(
      (course) =>
        course.admissionYearFrom <= 2025 &&
        course.admissionYearTo >= 2025 &&
        course.courseScope === 'university_common' &&
        nku.eligibleCourseCodes.has(course.courseCode) &&
        ndu.eligibleCourseCodes.has(course.courseCode),
    )?.courseCode
    expect(commonOfferedCode).toBeTruthy()
  })

  it('未知の前提条件を削除せずconditionalで残す', () => {
    expect(nku.conditionalCourseCodes.size).toBeGreaterThan(0)
    expect(
      nku.decisions.some(
        (decision) =>
          decision.decision === 'conditional' &&
          decision.internalReasons.includes('学籍番号だけでは確定できない条件あり'),
      ),
    ).toBe(true)
  })

  it('先の年次を通常候補から除きrelated_futureへ保持する', () => {
    const firstYear = getEligibilityResult(profile('26001NKU'))
    expect(firstYear.relatedFutureCourseCodes.size).toBeGreaterThan(0)
    for (const courseCode of firstYear.relatedFutureCourseCodes) {
      expect(firstYear.eligibleCourseCodes.has(courseCode)).toBe(false)
    }
  })

  it('明示的な他専攻履修不可をhard excludeする', () => {
    const architecture = getEligibilityResult(profile('26001AAU'), { debug: true })
    expect(
      architecture.decisions.some(
        (decision) =>
          decision.sourceCourseCode === '274276' &&
          decision.decision === 'excluded' &&
          decision.internalReasons.includes('履修要覧の明示的な所属除外'),
      ),
    ).toBe(true)
  })

  it('旧カリキュラム科目を2026開講読替先へ解決する', () => {
    const olderProfiles = [profile('24001LJU'), profile('23001GMU'), profile('23001CKU')]
    const results = olderProfiles.map((studentProfile) =>
      getEligibilityResult(studentProfile, { debug: true }),
    )
    expect(
      results.some((result) =>
        result.decisions.some(
          (decision) => decision.decision !== 'excluded' && decision.replacementFrom !== undefined,
        ),
      ),
    ).toBe(true)
  })

  it('大学院M・Dと旧学科コードを判定できる', () => {
    expect(getEligibilityResult(profile('25001FPM')).eligibleCourseCodes.size).toBeGreaterThan(0)
    expect(getEligibilityResult(profile('25001FPD')).eligibleCourseCodes.size).toBeGreaterThan(0)
    expect(getEligibilityResult(profile('23001CKU')).eligibleCourseCodes.size).toBeGreaterThan(0)
  })

  it('正式一覧がない開放科目を推測で生成しない', () => {
    expect(openCourseData).toEqual([])
  })

  it('最終候補の全クラスが基本科目番号集合と一致する', () => {
    for (const offering of nku.eligibleOfferings) {
      expect(nku.eligibleCourseCodes.has(offering.baseCourseCode)).toBe(true)
      expect(offering.id).toMatch(/^2026_\d{6}-\d{2,}$/)
    }
  })

  it('課程未登録者から教職・学芸員・司書の登録者限定科目を除外する', () => {
    const withoutRegistration = getEligibilityResult(
      profileWithAttributes('25001NKU', { firstLanguage: 'ja' }),
      { debug: true },
    )
    expect(withoutRegistration.eligibleCourseCodes.has('127008')).toBe(false)
    expect(withoutRegistration.eligibleCourseCodes.has('025120')).toBe(false)
    expect(withoutRegistration.eligibleCourseCodes.has('026015')).toBe(false)
  })

  it('登録属性trueでも所属・入学年度・学年の通常条件を引き続き適用する', () => {
    const withRegistration = getEligibilityResult(
      profileWithAttributes('25001NKU', {
        firstLanguage: 'ja',
        teacherTrainingRegistered: true,
        curatorProgramRegistered: true,
        librarianProgramRegistered: true,
      }),
    )
    expect(withRegistration.eligibleCourseCodes.has('127008')).toBe(true)
    expect(withRegistration.eligibleCourseCodes.has('025120')).toBe(true)
    expect(withRegistration.eligibleCourseCodes.has('026015')).toBe(true)
    expect(withRegistration.relatedFutureCourseCodes.has('025124')).toBe(true)
    expect(withRegistration.eligibleCourseCodes.has('025124')).toBe(false)
  })

  it('子ども福祉専攻の教職科目には他学科免履修者条件も適用する', () => {
    const teacherOnly = getEligibilityResult(
      profileWithAttributes('25001FCU', {
        firstLanguage: 'ja',
        teacherTrainingRegistered: true,
        otherDepartmentTeachingLicenseApproved: false,
      }),
    )
    const approved = getEligibilityResult(
      profileWithAttributes('25001FCU', {
        firstLanguage: 'ja',
        teacherTrainingRegistered: true,
        otherDepartmentTeachingLicenseApproved: true,
      }),
    )
    expect(teacherOnly.eligibleCourseCodes.has('127008')).toBe(false)
    expect(approved.eligibleCourseCodes.has('127008')).toBe(true)
  })

  it('第一言語による明示的な履修不可・対象限定を適用する', () => {
    const chineseFirstLanguage = getEligibilityResult(
      profileWithAttributes('25001NKU', { firstLanguage: 'zh' }),
    )
    const japaneseFirstLanguage = getEligibilityResult(
      profileWithAttributes('25001NKU', { firstLanguage: 'ja' }),
    )
    expect(chineseFirstLanguage.eligibleCourseCodes.has('106007')).toBe(false)
    expect(japaneseFirstLanguage.eligibleCourseCodes.has('106007')).toBe(true)
    expect(japaneseFirstLanguage.eligibleCourseCodes.has('106012')).toBe(false)
    expect(chineseFirstLanguage.eligibleCourseCodes.has('106012')).toBe(true)
  })

  it('教育学部とGLOCOMのコース選択だけで他コース科目を除外しない', () => {
    const schoolEducation = getEligibilityResult(
      profileWithAttributes('25001KEU', {
        firstLanguage: 'ja',
        educationCourse: 'school_education',
      }),
    )
    const englishEducation = getEligibilityResult(
      profileWithAttributes('25001KEU', {
        firstLanguage: 'ja',
        educationCourse: 'english_education',
      }),
    )
    expect([...schoolEducation.eligibleCourseCodes].sort()).toEqual(
      [...englishEducation.eligibleCourseCodes].sort(),
    )

    const languageCommunication = getEligibilityResult(
      profileWithAttributes('25001EXU', {
        firstLanguage: 'ja',
        glocomCourse: 'language_communication',
      }),
    )
    const globalJapanStudies = getEligibilityResult(
      profileWithAttributes('25001EXU', {
        firstLanguage: 'ja',
        glocomCourse: 'global_japan_studies',
      }),
    )
    expect([...languageCommunication.eligibleCourseCodes].sort()).toEqual(
      [...globalJapanStudies.eligibleCourseCodes].sort(),
    )
  })
})
