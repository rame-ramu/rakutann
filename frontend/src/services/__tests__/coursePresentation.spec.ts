import { beforeEach, describe, expect, it } from 'vitest'
import { compareCoursesByConditions, getConditionMatchCount } from '../recommendation'
import { store, type Course } from '../../store'
import {
  courseMatchesSelectedSchedule,
  coursesHaveScheduleConflict,
  getCourseScheduleSlots,
  isUnscheduledCourse,
} from '../../utils/courseSchedule'

const course = (overrides: Partial<Course> = {}): Course => ({
  id: '2026_215101-01',
  baseCourseCode: '215101',
  classNumber: '01',
  years: [1, 2],
  name: 'テスト授業',
  instructor: '担当教員',
  semester: '前期',
  day: '月',
  period: 1,
  credits: 2,
  classFormat: '対面',
  attendancePercent: 20,
  reportPercent: 40,
  examPercent: 40,
  onDemandPercent: 0,
  onDemandClasses: 0,
  onDemandLabel: 'オンデマンドなし',
  hasPrerequisite: false,
  prerequisiteLabel: 'なし',
  field: '情報・数理',
  conditions: ['試験あり', 'オンデマンドなし', '情報・数理'],
  tagReasons: [],
  description: 'テスト',
  evaluation: {
    attendance: 20,
    quiz: 0,
    midtermExam: 0,
    finalExam: 40,
    assignment: 40,
    midtermAssignment: 0,
    finalAssignment: 0,
  },
  ...overrides,
})

describe('course presentation and schedule rules', () => {
  beforeEach(() => store.resetSelections())

  it('希望タグ一致数を2件、1件、0件として比較できる', () => {
    const selected = ['試験あり', 'オンデマンドなし']
    const two = course({ id: '2026_215101-01' })
    const one = course({ id: '2026_215102-01', conditions: ['試験あり', '情報・数理'] })
    const zero = course({ id: '2026_215103-01', conditions: ['情報・数理'] })
    expect(getConditionMatchCount(two, selected)).toBe(2)
    expect(getConditionMatchCount(one, selected)).toBe(1)
    expect(getConditionMatchCount(zero, selected)).toBe(0)
    expect(
      [zero, one, two]
        .sort((first, second) => compareCoursesByConditions(first, second, selected))
        .map(({ id }) => id),
    ).toEqual([two.id, one.id, zero.id])
  })

  it('同じ評価軸の矛盾する希望タグを同時選択しない', () => {
    store.toggleCondition('試験あり')
    store.toggleCondition('試験なし')
    expect(store.selectedConditions).toEqual(['試験なし'])
    store.toggleCondition('オンデマンド多め')
    store.toggleCondition('オンデマンドなし')
    expect(store.selectedConditions).toEqual(['試験なし', 'オンデマンドなし'])
  })

  it('複数曜日授業は全曜日の時限を選んだ場合だけ一致する', () => {
    const multiDay = course({ day: '月・水・金', period: 6 })
    expect(getCourseScheduleSlots(multiDay)).toEqual([
      { day: '月', period: 6 },
      { day: '水', period: 6 },
      { day: '金', period: 6 },
    ])
    expect(
      courseMatchesSelectedSchedule(
        multiDay,
        [
          { day: '月', period: 6 },
          { day: '水', period: 6 },
        ],
        false,
      ),
    ).toBe(false)
    expect(
      courseMatchesSelectedSchedule(
        multiDay,
        [
          { day: '月', period: 6 },
          { day: '水', period: 6 },
          { day: '金', period: 6 },
        ],
        false,
      ),
    ).toBe(true)
  })

  it('集中・曜日時限未定授業は明示的に含めた場合だけ一致する', () => {
    const intensive = course({ day: '他', period: null })
    expect(isUnscheduledCourse(intensive)).toBe(true)
    expect(courseMatchesSelectedSchedule(intensive, [], false)).toBe(false)
    expect(courseMatchesSelectedSchedule(intensive, [], true)).toBe(true)
  })

  it('複数曜日を含む時間割競合を検出し、二重登録を防止する', () => {
    const registered = course({ id: '2026_215101-01', day: '月・水', period: 2 })
    const conflicting = course({ id: '2026_215102-01', day: '水', period: 2 })
    expect(coursesHaveScheduleConflict(registered, conflicting)).toBe(true)
    expect(store.addCandidateCourse(registered)).toBe(true)
    expect(store.addCandidateCourse(conflicting)).toBe(false)
    expect(store.candidateCourses.map(({ id }) => id)).toEqual(['2026_215101-01'])
  })
})
