import { reactive } from 'vue'
import { courses } from '../data/courses'

export interface Course {
  id: string
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
}

export const store = reactive({
  studentId: '',
  grade: null as number | null,
  department: null as string | null,
  selectedConditions: [] as string[],
  selectedSchedule: [] as { day: string; period: number }[],
  candidateCourses: [] as Course[],
  classrooms: {} as Record<string, string>,
  avoidedTeachersText: '',
  selectedCourse: null as Course | null,

  setStudentId(id: string) {
    this.studentId = id
    if (id.length >= 8) {
      const yearStr = id.substring(0, 2)
      const year = parseInt(yearStr)
      const currentYear = new Date().getFullYear() % 100
      this.grade = currentYear - year + 1

      const facultyCode = id.substring(5, 8).toUpperCase()
      const facultyMap: Record<string, string> = {
        LJU: '文学部 国文学科',
        LAU: '文学部 総合英語学科',
        KEU: '教育学部 教育学科',
        NKU: '人間情報学部 感性工学専攻',
        NDU: '人間情報学部 データサイエンス専攻',
        PFU: '心理学部 心理学科',
        CSU: '創造表現学部 創作表現専攻',
        CMU: '創造表現学部 メディアプロデュース専攻',
        CKU: '創造表現学部 建築・インテリアデザイン専攻',
        AAU: '建築学部 建築・まちづくり専攻',
        ARU: '建築学部 住居・インテリアデザイン専攻',
        HCU: '健康医療科学部 言語聴覚学専攻',
        HVU: '健康医療科学部 視覚科学専攻',
        HPU: '健康医療科学部 理学療法学専攻',
        HMU: '健康医療科学部 臨床検査学専攻',
        HHU: '健康医療科学部 スポーツ・健康科学専攻',
        HAU: '健康医療科学部 救急救命学専攻',
        SEU: '健康医療科学部 健康栄養学科',
        HEU: '健康医療科学部 健康栄養学科',
        SFU: '食健康科学部 食創造科学科',
        FSU: '福祉貢献学部 社会福祉専攻',
        FCU: '福祉貢献学部 子ども福祉専攻',
        GLU: '交流文化学部 ランゲージ専攻',
        GMU: '交流文化学部 国際交流・観光専攻',
        VBU: 'ビジネス学部 ビジネス学科',
        VMU: 'ビジネス学部 現代ビジネス専攻',
        VGU: 'ビジネス学部 グローバルビジネス専攻',
        EXU: 'グローバル・コミュニケーション学部',
      }
      this.department = facultyMap[facultyCode] || '不明な学部'
    } else {
      this.grade = null
      this.department = null
    }
  },

  toggleCondition(condition: string) {
    const index = this.selectedConditions.indexOf(condition)
    if (index === -1) {
      this.selectedConditions.push(condition)
    } else {
      this.selectedConditions.splice(index, 1)
    }
  },

  toggleSchedule(day: string, period: number) {
    const hasCandidate = this.candidateCourses.some(
      (course) => course.day === day && course.period === period,
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
    if (course.period === null || course.day === '他') return

    const hasSchedule = this.selectedSchedule.some(
      (slot) => slot.day === course.day && slot.period === course.period,
    )
    if (!hasSchedule) {
      this.selectedSchedule.push({ day: course.day, period: course.period })
    }

    const hasCourse = this.candidateCourses.some((candidate) => candidate.id === course.id)
    if (!hasCourse) {
      this.candidateCourses.push(course)
    }
  },

  removeCandidateCourse(courseId: string) {
    this.candidateCourses = this.candidateCourses.filter((course) => course.id !== courseId)
    delete this.classrooms[courseId]
  },

  setClassroom(courseId: string, classroom: string) {
    const value = classroom.trim()
    if (value) {
      this.classrooms[courseId] = value
    } else {
      delete this.classrooms[courseId]
    }
  },

  setAvoidedTeachers(value: string) {
    this.avoidedTeachersText = value
  },

  setSelectedCourse(course: Course | null) {
    this.selectedCourse = course
  },
})

export const mockCourses: Course[] = courses
