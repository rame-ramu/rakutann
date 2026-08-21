import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const generatedDirectory = path.join(projectRoot, 'data', 'generated')
const curriculum = JSON.parse(
  await readFile(path.join(generatedDirectory, 'curriculum_master.json'), 'utf8'),
)

const allUndergraduate = {
  studentLevel: 'undergraduate',
  admissionYearFrom: 1900,
  admissionYearTo: 2026,
  currentYearFrom: 1,
  currentYearTo: 4,
}

const sourceEvidence = (sourceFile, sourcePage, sourceRule) => ({
  sourceFile,
  sourcePage,
  sourceRule,
})

const attributeMaster = [
  {
    id: 'teacherTrainingRegistered',
    type: 'boolean',
    label: '教職課程に登録している',
    description: '教職課程登録者だけに認められる科目の判定に使用します。',
    required: false,
    appliesTo: [allUndergraduate],
    sourceEvidence: [
      sourceEvidence(
        'summary_2026.pdf',
        38,
        '教職課程科目を履修する場合は教職課程登録を行い、教職課程未登録者の対象科目登録は認めない。',
      ),
      sourceEvidence(
        'summary_2025.pdf',
        39,
        '教職課程科目を履修する場合は教職課程登録を行い、教職課程未登録者の対象科目登録は認めない。',
      ),
      sourceEvidence(
        'summary_2024.pdf',
        46,
        '教職課程科目を履修する場合は教職課程履修希望登録票を提出する。',
      ),
    ],
  },
  {
    id: 'otherDepartmentTeachingLicenseApproved',
    type: 'boolean',
    label: '他学科免履修者である',
    description: '教職課程を有しない所属から教職課程科目を履修する許可の判定に使用します。',
    required: false,
    appliesTo: [
      {
        ...allUndergraduate,
        admissionYearFrom: 2025,
        organizationCodes: ['FCU'],
      },
    ],
    visibleWhen: {
      attributeId: 'teacherTrainingRegistered',
      equals: true,
    },
    sourceEvidence: [
      sourceEvidence(
        'summary_2026.pdf',
        38,
        '子ども福祉専攻は指定3科目以外の教職課程科目を他学科免履修者のみ履修できる。',
      ),
      sourceEvidence(
        'summary_2025.pdf',
        39,
        '子ども福祉専攻は指定3科目以外の教職課程科目を他学科免履修者のみ履修できる。',
      ),
    ],
  },
  {
    id: 'curatorProgramRegistered',
    type: 'boolean',
    label: '学芸員課程に登録している',
    description: '課程未登録者の履修が認められない学芸員課程科目の判定に使用します。',
    required: false,
    appliesTo: [allUndergraduate],
    sourceEvidence: [
      sourceEvidence('summary_2026.pdf', 42, '学芸員課程未登録者の履修登録は認めない。'),
      sourceEvidence('summary_2025.pdf', 44, '学芸員課程未登録者の履修登録は認めない。'),
      sourceEvidence('summary_2024.pdf', 53, '学芸員課程未登録者の履修登録は認めない。'),
    ],
  },
  {
    id: 'librarianProgramRegistered',
    type: 'boolean',
    label: '司書課程に登録している',
    description: '課程未登録者の履修が認められない司書課程科目の判定に使用します。',
    required: false,
    appliesTo: [allUndergraduate],
    sourceEvidence: [
      sourceEvidence('summary_2026.pdf', 44, '司書課程未登録者の履修登録は認めない。'),
      sourceEvidence('summary_2025.pdf', 46, '司書課程未登録者の履修登録は認めない。'),
      sourceEvidence('summary_2024.pdf', 56, '司書課程未登録者の履修登録は認めない。'),
    ],
  },
  {
    id: 'firstLanguage',
    type: 'single_select',
    label: '第一言語',
    description: '履修要覧に第一言語による履修条件が明記された科目だけに使用します。',
    required: true,
    options: [
      { value: 'ja', label: '日本語' },
      { value: 'zh', label: '中国語' },
      { value: 'ko', label: '韓国・朝鮮語' },
      { value: 'pt', label: 'ポルトガル語' },
      { value: 'de', label: 'ドイツ語' },
      { value: 'fr', label: 'フランス語' },
      { value: 'ru', label: 'ロシア語' },
      { value: 'es', label: 'スペイン語' },
      { value: 'it', label: 'イタリア語' },
      { value: 'other', label: 'その他' },
    ],
    appliesTo: [allUndergraduate],
    sourceEvidence: [
      sourceEvidence('summary_2026.pdf', 37, '第一言語による履修不可・対象者限定の記載。'),
      sourceEvidence('summary_2025.pdf', 38, '第一言語による履修不可・対象者限定の記載。'),
      sourceEvidence('summary_2024.pdf', 43, '第一言語による履修不可・対象者限定の記載。'),
      sourceEvidence(
        'summary_change_2025_0325.pdf',
        1,
        '追加された日本語科目は日本語を第一言語としない者のみ履修可。',
      ),
    ],
  },
  {
    id: 'educationCourse',
    type: 'single_select',
    label: '所属コース',
    description: '2年次から登録する教育学部教育学科の所属コースです。',
    required: true,
    options: [
      { value: 'school_education', label: '学校教育コース' },
      { value: 'english_education', label: '英語教育コース' },
      { value: 'special_needs_education', label: '特別支援教育コース' },
    ],
    appliesTo: [
      {
        studentLevel: 'undergraduate',
        organizationCodes: ['KEU'],
        admissionYearFrom: 2025,
        admissionYearTo: 2026,
        currentYearFrom: 2,
        currentYearTo: 4,
      },
    ],
    sourceEvidence: [
      sourceEvidence(
        'summary_2026.pdf',
        78,
        '教育学部は2年次より3コースのいずれか1つに登録する。他コース科目も自由に履修できる。',
      ),
      sourceEvidence(
        'summary_2025.pdf',
        78,
        '教育学部は2年次より3コースのいずれか1つに登録する。他コース科目も自由に履修できる。',
      ),
    ],
  },
  {
    id: 'languageSpecialization',
    type: 'single_select',
    label: '所属専修',
    description: '交流文化学部ランゲージ専攻で2年次以降に所属する専修です。',
    required: true,
    options: [
      { value: 'english', label: '英語専修' },
      { value: 'chinese', label: '中国語専修' },
      { value: 'korean', label: '韓国・朝鮮語専修' },
    ],
    appliesTo: [
      {
        studentLevel: 'undergraduate',
        organizationCodes: ['GLU'],
        admissionYearFrom: 2026,
        admissionYearTo: 2026,
        currentYearFrom: 2,
        currentYearTo: 4,
      },
    ],
    sourceEvidence: [
      sourceEvidence(
        'summary_2026.pdf',
        274,
        'ランゲージ専攻は英語・中国語・韓国朝鮮語専修から1つを登録し、2年次以降に所属する。',
      ),
    ],
  },
  {
    id: 'glocomCourse',
    type: 'single_select',
    label: '所属コース',
    description: '2年次以降に選択するGLOCOMのCore Subjectsコースです。',
    required: true,
    options: [
      { value: 'language_communication', label: 'Language and Communication' },
      { value: 'global_japan_studies', label: 'Global Japan Studies' },
    ],
    appliesTo: [
      {
        studentLevel: 'undergraduate',
        organizationCodes: ['EXU'],
        admissionYearFrom: 2022,
        admissionYearTo: 2026,
        currentYearFrom: 2,
        currentYearTo: 4,
      },
    ],
    sourceEvidence: [
      sourceEvidence(
        'summary_2026.pdf',
        307,
        '1年次後期に申請し2年次以降はいずれかのコースを選択する。',
      ),
      sourceEvidence(
        'summary_2025.pdf',
        308,
        '1年次後期に申請し2年次以降はいずれかのコースを選択する。',
      ),
      sourceEvidence(
        'summary_2024.pdf',
        463,
        '2022年度以降入学者は2年次以降いずれかのコースを選択する。',
      ),
    ],
  },
]

const credentialPages = {
  teacherTrainingRegistered: {
    'summary_2026.pdf': { coursePages: [40, 41], rulePage: 38 },
    'summary_2025.pdf': { coursePages: [41, 42], rulePage: 39 },
    'summary_2024.pdf': { coursePages: [49, 50, 51, 52], rulePage: 46 },
  },
  curatorProgramRegistered: {
    'summary_2026.pdf': { coursePages: [43], rulePage: 42 },
    'summary_2025.pdf': { coursePages: [45], rulePage: 44 },
    'summary_2024.pdf': { coursePages: [54], rulePage: 53 },
  },
  librarianProgramRegistered: {
    'summary_2026.pdf': { coursePages: [45], rulePage: 44 },
    'summary_2025.pdf': { coursePages: [47], rulePage: 46 },
    'summary_2024.pdf': { coursePages: [57], rulePage: 56 },
  },
}

const languageValues = new Map([
  ['日本語', 'ja'],
  ['中国語', 'zh'],
  ['韓国・朝鮮語', 'ko'],
  ['ポルトガル語', 'pt'],
  ['ドイツ語', 'de'],
  ['フランス語', 'fr'],
  ['ロシア語', 'ru'],
  ['スペイン語', 'es'],
  ['イタリア語', 'it'],
])

const rules = []
const generationIssues = []
const addRule = (rule) => rules.push(rule)

for (const course of curriculum) {
  for (const [attributeId, sources] of Object.entries(credentialPages)) {
    const source = sources[course.sourceFile]
    if (!source?.coursePages.includes(course.sourcePage)) continue
    addRule({
      id: `${attributeId}:${course.sourceFile}:${course.sourcePage}:${course.courseCode}`,
      attributeId,
      effect: 'hard_requirement',
      operator: 'equals',
      expectedValue: true,
      courseCode: course.courseCode,
      studentLevel: course.studentLevel,
      organizationCodes: course.organizationCodes,
      admissionYearFrom: course.admissionYearFrom,
      admissionYearTo: course.admissionYearTo,
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
      ruleSourcePage: source.rulePage,
      sourceRule: `${attributeMaster.find((attribute) => attribute.id === attributeId).label}ことが必要`,
    })
  }

  if (
    course.studentLevel === 'undergraduate' &&
    /教職課程登録者のみ|教員免許状取得希望者のみ履修可/.test(course.conditionText)
  ) {
    addRule({
      id: `teacherTrainingRegistered:explicit:${course.sourceFile}:${course.sourcePage}:${course.courseCode}`,
      attributeId: 'teacherTrainingRegistered',
      effect: 'hard_requirement',
      operator: 'equals',
      expectedValue: true,
      courseCode: course.courseCode,
      studentLevel: course.studentLevel,
      organizationCodes: course.organizationCodes,
      admissionYearFrom: course.admissionYearFrom,
      admissionYearTo: course.admissionYearTo,
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
      ruleSourcePage: course.sourcePage,
      sourceRule: course.conditionText,
    })
  }

  if (/日本語を第一言語としない/.test(course.conditionText)) {
    addRule({
      id: `firstLanguage:not-ja:${course.sourceFile}:${course.sourcePage}:${course.courseCode}`,
      attributeId: 'firstLanguage',
      effect: 'hard_requirement',
      operator: 'not_equals',
      expectedValue: 'ja',
      courseCode: course.courseCode,
      studentLevel: course.studentLevel,
      organizationCodes: course.organizationCodes,
      admissionYearFrom: course.admissionYearFrom,
      admissionYearTo: course.admissionYearTo,
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
      ruleSourcePage: course.sourcePage,
      sourceRule: '日本語を第一言語としない者のみ履修可',
    })
  }

  const excludedLanguages = [
    ...course.conditionText.matchAll(/([^\s「」()]{2,10})を第一言語とする者は履修不可/g),
  ]
    .map((match) => match[1])
    .filter((language) => languageValues.has(language))
  const languagesToApply =
    excludedLanguages.length <= 1
      ? excludedLanguages
      : excludedLanguages.filter((language) => course.courseName.includes(language))
  if (excludedLanguages.length > languagesToApply.length) {
    generationIssues.push({
      type: 'adjacent_first_language_rule_not_applied',
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
      courseCode: course.courseCode,
      courseName: course.courseName,
      excludedLanguages,
      appliedLanguages: languagesToApply,
    })
  }
  for (const language of languagesToApply) {
    addRule({
      id: `firstLanguage:not-${languageValues.get(language)}:${course.sourceFile}:${course.sourcePage}:${course.courseCode}`,
      attributeId: 'firstLanguage',
      effect: 'hard_requirement',
      operator: 'not_equals',
      expectedValue: languageValues.get(language),
      courseCode: course.courseCode,
      studentLevel: course.studentLevel,
      organizationCodes: course.organizationCodes,
      admissionYearFrom: course.admissionYearFrom,
      admissionYearTo: course.admissionYearTo,
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
      ruleSourcePage: course.sourcePage,
      sourceRule: `${language}を第一言語とする者は履修不可`,
    })
  }

  const educationCourse = [
    ['学校教育コース必修科目', 'school_education'],
    ['英語教育コース必修科目', 'english_education'],
    ['特別支援教育コース必修科目', 'special_needs_education'],
  ].find(([label]) => course.conditionText.includes(label))
  if (educationCourse) {
    addRule({
      id: `educationCourse:${educationCourse[1]}:${course.sourceFile}:${course.sourcePage}:${course.courseCode}`,
      attributeId: 'educationCourse',
      effect: 'classification_only',
      operator: 'equals',
      expectedValue: educationCourse[1],
      courseCode: course.courseCode,
      studentLevel: course.studentLevel,
      organizationCodes: ['KEU'],
      admissionYearFrom: course.admissionYearFrom,
      admissionYearTo: course.admissionYearTo,
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
      ruleSourcePage: course.sourcePage,
      sourceRule: educationCourse[0],
    })
  }
}

const teacherExceptionsForChildWelfare = new Set(['023001', '023003', '023004'])
for (const rule of rules.filter(
  (candidate) => candidate.attributeId === 'teacherTrainingRegistered',
)) {
  if (teacherExceptionsForChildWelfare.has(rule.courseCode)) continue
  if (!['summary_2025.pdf', 'summary_2026.pdf'].includes(rule.sourceFile)) continue
  if (
    !credentialPages.teacherTrainingRegistered[rule.sourceFile]?.coursePages.includes(
      rule.sourcePage,
    )
  )
    continue
  addRule({
    ...rule,
    id: `otherDepartmentTeachingLicenseApproved:${rule.sourceFile}:${rule.sourcePage}:${rule.courseCode}`,
    attributeId: 'otherDepartmentTeachingLicenseApproved',
    organizationCodes: ['FCU'],
    sourceRule: '子ども福祉専攻は指定3科目以外、他学科免履修者のみ履修可',
  })
}

const languageSpecializationCourses = {
  english: ['267249', '267250', '267251', '267252', '267253', '267254'],
  chinese: ['262201', '262202', '267090', '267098'],
  korean: ['267010', '267101', '267255', '267257', '267124', '267125'],
}
for (const [specialization, courseCodes] of Object.entries(languageSpecializationCourses)) {
  for (const courseCode of courseCodes) {
    for (const course of curriculum.filter(
      (candidate) =>
        candidate.sourceFile === 'summary_2026.pdf' &&
        candidate.courseCode === courseCode &&
        candidate.organizationCodes.includes('GLU'),
    )) {
      addRule({
        id: `languageSpecialization:${specialization}:${course.sourcePage}:${course.courseCode}`,
        attributeId: 'languageSpecialization',
        effect: 'classification_only',
        operator: 'equals',
        expectedValue: specialization,
        courseCode: course.courseCode,
        studentLevel: 'undergraduate',
        organizationCodes: ['GLU'],
        admissionYearFrom: 2026,
        admissionYearTo: 2026,
        sourceFile: course.sourceFile,
        sourcePage: course.sourcePage,
        ruleSourcePage: 274,
        sourceRule: '専修必修または専修選択必修として明記',
      })
    }
  }
}

const glocomCoursePages = [
  {
    sourceFile: 'summary_2026.pdf',
    sourcePage: 308,
    value: 'language_communication',
    admissionYearFrom: 2026,
    admissionYearTo: 2026,
  },
  {
    sourceFile: 'summary_2026.pdf',
    sourcePage: 309,
    value: 'global_japan_studies',
    admissionYearFrom: 2026,
    admissionYearTo: 2026,
  },
  {
    sourceFile: 'summary_2025.pdf',
    sourcePage: 309,
    value: 'language_communication',
    admissionYearFrom: 2025,
    admissionYearTo: 2025,
  },
  {
    sourceFile: 'summary_2025.pdf',
    sourcePage: 310,
    value: 'global_japan_studies',
    admissionYearFrom: 2025,
    admissionYearTo: 2025,
  },
  {
    sourceFile: 'summary_2024.pdf',
    sourcePage: 464,
    value: 'language_communication',
    admissionYearFrom: 2022,
    admissionYearTo: 2024,
  },
  {
    sourceFile: 'summary_2024.pdf',
    sourcePage: 465,
    value: 'global_japan_studies',
    admissionYearFrom: 2022,
    admissionYearTo: 2024,
  },
]
for (const group of glocomCoursePages) {
  for (const course of curriculum.filter(
    (candidate) =>
      candidate.sourceFile === group.sourceFile &&
      candidate.sourcePage === group.sourcePage &&
      candidate.organizationCodes.includes('EXU'),
  )) {
    addRule({
      id: `glocomCourse:${group.value}:${course.sourceFile}:${course.sourcePage}:${course.courseCode}`,
      attributeId: 'glocomCourse',
      effect: 'classification_only',
      operator: 'equals',
      expectedValue: group.value,
      courseCode: course.courseCode,
      studentLevel: 'undergraduate',
      organizationCodes: ['EXU'],
      admissionYearFrom: group.admissionYearFrom,
      admissionYearTo: group.admissionYearTo,
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
      ruleSourcePage:
        course.sourceFile === 'summary_2024.pdf'
          ? 463
          : course.sourceFile === 'summary_2025.pdf'
            ? 308
            : 307,
      sourceRule: '選択したGLOCOMコースの選択必修科目群として分類',
    })
  }
}

const deduplicatedRules = [...new Map(rules.map((rule) => [rule.id, rule])).values()].sort((a, b) =>
  a.id.localeCompare(b.id),
)

await writeFile(
  path.join(generatedDirectory, 'student_attribute_master.json'),
  `${JSON.stringify(attributeMaster, null, 2)}\n`,
  'utf8',
)
await writeFile(
  path.join(generatedDirectory, 'course_attribute_rule_master.json'),
  `${JSON.stringify(deduplicatedRules, null, 2)}\n`,
  'utf8',
)
await writeFile(
  path.join(generatedDirectory, 'student_attribute_generation_issues.json'),
  `${JSON.stringify(generationIssues, null, 2)}\n`,
  'utf8',
)

console.log(
  JSON.stringify(
    {
      attributes: attributeMaster.length,
      courseRules: deduplicatedRules.length,
      hardRequirements: deduplicatedRules.filter((rule) => rule.effect === 'hard_requirement')
        .length,
      classificationRules: deduplicatedRules.filter((rule) => rule.effect === 'classification_only')
        .length,
      generationIssues: generationIssues.length,
    },
    null,
    2,
  ),
)
