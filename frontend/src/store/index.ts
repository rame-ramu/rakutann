import { reactive } from 'vue'

export interface Course {
  id: string
  name: string
  day: string
  period: number
  conditions: string[]
  description: string
  faculty?: string[] // Compatible faculties
}

export const store = reactive({
  studentId: '',
  grade: null as number | null,
  department: null as string | null,
  selectedConditions: [] as string[],
  selectedSchedule: [] as { day: string; period: number }[],
  selectedCourse: null as Course | null,

  setStudentId(id: string) {
    this.studentId = id
    // New parsing logic:
    // 1st two digits: Year (e.g., 25 -> 2025)
    // 3rd-5th digits: Personal number
    // 6th-8th characters: Faculty/Department code (e.g., NKU)
    if (id.length >= 8) {
      const yearStr = id.substring(0, 2)
      const year = parseInt(yearStr)
      const currentYear = new Date().getFullYear() % 100
      this.grade = currentYear - year + 1
      
      const facultyCode = id.substring(5, 8).toUpperCase()
      const facultyMap: Record<string, string> = {
        'LJU': '文学部 国文学科',
        'LAU': '文学部 総合英語学科',
        'KEU': '教育学部 教育学科',
        'NKU': '人間情報学部 感性工学専攻',
        'NDU': '人間情報学部 データサイエンス専攻',
        'PFU': '心理学部 心理学科',
        'CSU': '創造表現学部 創作表現専攻',
        'CMU': '創造表現学部 メディアプロデュース専攻',
        'CKU': '創造表現学部 建築・インテリアデザイン専攻',
        'AAU': '建築学部 建築・まちづくり専攻',
        'ARU': '建築学部 住居・インテリアデザイン専攻',
        'HCU': '健康医療科学部 言語聴覚学専攻',
        'HVU': '健康医療科学部 視覚科学専攻',
        'HPU': '健康医療科学部 理学療法学専攻',
        'HMU': '健康医療科学部 臨床検査学専攻',
        'HHU': '健康医療科学部 スポーツ・健康科学専攻',
        'HAU': '健康医療科学部 救急救命学専攻',
        'SEU': '健康医療科学部 健康栄養学科',
        'HEU': '健康医療科学部 健康栄養学科',
        'SFU': '食健康科学部 食創造科学科',
        'FSU': '福祉貢献学部 社会福祉専攻',
        'FCU': '福祉貢献学部 子ども福祉専攻',
        'GLU': '交流文化学部 ランゲージ専攻',
        'GMU': '交流文化学部 国際交流・観光専攻',
        'VBU': 'ビジネス学部 ビジネス学科',
        'VMU': 'ビジネス学部 現代ビジネス専攻',
        'VGU': 'ビジネス学部 グローバルビジネス専攻',
        'EXU': 'グローバル・コミュニケーション学部'
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
    const index = this.selectedSchedule.findIndex(s => s.day === day && s.period === period)
    if (index === -1) {
      this.selectedSchedule.push({ day, period })
    } else {
      this.selectedSchedule.splice(index, 1)
    }
  },

  setSelectedCourse(course: Course | null) {
    this.selectedCourse = course
  }
})

export const mockCourses: Course[] = [
  {
    id: '1',
    name: '入門文化人類学',
    day: '月',
    period: 2,
    conditions: ['らくたん', '面白い'],
    description: '11:10〜12:40。世界の文化の多様性を学びます。出席とリアクションペーパーが中心。全学部開放科目で、他学部生からも高い評価を得ています。',
    faculty: ['LJU', 'NKU', 'PFU', 'GLU', 'VBU', 'CSU'].map(code => getFacultyName(code))
  },
  {
    id: '2',
    name: '色彩学',
    day: '火',
    period: 3,
    conditions: ['らくたん', '実用的'],
    description: '13:30〜15:00。色の仕組みと心理効果を学びます。実生活や将来のデザインに役立つ知識が得られます。テスト対策もしやすく安心です。',
    faculty: ['NKU', 'CKU', 'AAU', 'CMU', 'VBU'].map(code => getFacultyName(code))
  },
  {
    id: '3',
    name: '現代のマナー',
    day: '木',
    period: 4,
    conditions: ['実用的', 'らくたん'],
    description: '15:10〜16:40。就職活動や社会生活で必須の礼儀を学びます。難易度が低く、実務的な内容で満足度が高い講義です。',
    faculty: ['LJU', 'KEU', 'VMU', 'PFU', 'HCU'].map(code => getFacultyName(code))
  },
  {
    id: '4',
    name: '韓国・朝鮮語入門',
    day: '金',
    period: 1,
    conditions: ['らくたん', '友達ができる'],
    description: '09:30〜11:00。ハングルの読み書きから基礎会話まで。語学科目の中でも特に雰囲気が良く、単位が取りやすいことで有名です。',
    faculty: ['GLU', 'LAU', 'CSU', 'EXU'].map(code => getFacultyName(code))
  },
  {
    id: '5',
    name: '感性工学概論',
    day: '月',
    period: 4,
    conditions: ['面白い', '実用的'],
    description: '15:10〜16:40。人の「心地よさ」を計測し、モノづくりに活かす手法を学びます。NKU専攻の学生には特におすすめの基幹科目です。',
    faculty: ['人間情報学部 感性工学専攻']
  },
  {
    id: '6',
    name: 'メディアプロデュース論',
    day: '水',
    period: 2,
    conditions: ['面白い', 'オンライン'],
    description: '11:10〜12:40。最新のネットメディアや広告戦略を分析します。トレンドに敏感な学生に人気で、一部オンライン形式も導入されています。',
    faculty: ['創造表現学部 メディアプロデュース専攻', '創造表現学部 創作表現専攻', 'VBU']
  },
  {
    id: '7',
    name: '心理学概論',
    day: '火',
    period: 1,
    conditions: ['面白い', '実用的'],
    description: '09:30〜11:00。人間の心の仕組みを科学的に探求します。心理学部の専門科目ですが、他学部からも多くの学生が受講する人気講義です。',
    faculty: ['心理学部 心理学科', 'NKU', 'KEU', 'LJU'].map(code => getFacultyName(code))
  },
  {
    id: '8',
    name: 'キャリアデザイン',
    day: '水',
    period: 5,
    conditions: ['実用的', '友達ができる'],
    description: '16:50〜18:20。自分の将来と向き合うワークショップ。グループワークが多く、他学部の友達を作りやすい環境です。',
    faculty: ['LJU', 'LAU', 'KEU', 'NKU', 'NDU', 'PFU', 'CSU', 'CMU', 'CKU', 'AAU', 'ARU', 'HCU', 'HVU', 'HPU', 'HMU', 'HHU', 'HAU', 'SEU', 'SFU', 'FSU', 'FCU', 'GLU', 'GMU', 'VBU', 'VMU', 'VGU', 'EXU'].map(code => getFacultyName(code))
  }
]

function getFacultyName(code: string): string {
  const map: Record<string, string> = {
    'LJU': '文学部 国文学科',
    'LAU': '文学部 総合英語学科',
    'KEU': '教育学部 教育学科',
    'NKU': '人間情報学部 感性工学専攻',
    'NDU': '人間情報学部 データサイエンス専攻',
    'PFU': '心理学部 心理学科',
    'CSU': '創造表現学部 創作表現専攻',
    'CMU': '創造表現学部 メディアプロデュース専攻',
    'CKU': '創造表現学部 建築・インテリアデザイン専攻',
    'AAU': '建築学部 建築・まちづくり専攻',
    'ARU': '建築学部 住居・インテリアデザイン専攻',
    'HCU': '健康医療科学部 言語聴覚学専攻',
    'HVU': '健康医療科学部 視覚科学専攻',
    'HPU': '健康医療科学部 理学療法学専攻',
    'HMU': '健康医療科学部 臨床検査学専攻',
    'HHU': '健康医療科学部 スポーツ・健康科学専攻',
    'HAU': '健康医療科学部 救急救命学専攻',
    'SEU': '健康医療科学部 健康栄養学科',
    'SFU': '食健康科学部 食創造科学科',
    'FSU': '福祉貢献学部 社会福祉専攻',
    'FCU': '福祉貢献学部 子ども福祉専攻',
    'GLU': '交流文化学部 ランゲージ専攻',
    'GMU': '交流文化学部 国際交流・観光専攻',
    'VBU': 'ビジネス学部 ビジネス学科',
    'VMU': 'ビジネス学部 現代ビジネス専攻',
    'VGU': 'ビジネス学部 グローバルビジネス専攻',
    'EXU': 'グローバル・コミュニケーション学部'
  }
  return map[code] || code
}
