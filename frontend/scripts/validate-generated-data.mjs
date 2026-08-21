import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SELECTABLE_COURSE_TAGS, SOURCE_FILES } from './curriculum-config.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const generatedDirectory = path.join(projectRoot, 'data', 'generated')
const publicRuntimeDirectory = path.join(projectRoot, 'public', 'data', 'runtime')

const readJson = async (filename) =>
  JSON.parse(await readFile(path.join(generatedDirectory, filename), 'utf8'))
const readRuntimeJson = async (filename) =>
  JSON.parse(await readFile(path.join(publicRuntimeDirectory, filename), 'utf8'))

const unique = (values) => [...new Set(values)]
const countBy = (values, key) =>
  Object.entries(
    values.reduce((counts, value) => {
      const group = typeof key === 'function' ? key(value) : value[key]
      counts[group] = (counts[group] ?? 0) + 1
      return counts
    }, {}),
  ).sort((left, right) => right[1] - left[1])

const curriculum = await readJson('curriculum_master.json')
const replacements = await readJson('course_replacement_master.json')
const relations = await readJson('course_relation_master.json')
const organizations = await readJson('student_org_master.json')
const openCourses = await readJson('open_courses_master.json')
const offerings = await readJson('course_offerings_2026.json')
const issues = await readJson('generation_issues.json')
const metadata = await readJson('generation_metadata.json')
const changeApplications = await readJson('change_application_master.json')
const studentAttributes = await readJson('student_attribute_master.json')
const courseAttributeRules = await readJson('course_attribute_rule_master.json')
const studentAttributeIssues = await readJson('student_attribute_generation_issues.json')
const syllabusUrls = await readJson('course_syllabus_urls_2026.json')
const syllabusUrlReport = await readJson('syllabus_url_generation_report.json')
const runtimeCurriculum = await readRuntimeJson('curriculum_master.json')
const runtimeOfferings = await readRuntimeJson('course_offerings_2026.json')
const runtimeReplacements = await readRuntimeJson('course_replacement_master.json')
const runtimeRelations = await readRuntimeJson('course_relation_master.json')
const runtimeOpenCourses = await readRuntimeJson('open_courses_master.json')

const undergraduateCurriculum = curriculum.filter(
  (course) => course.studentLevel === 'undergraduate',
)
const graduateCurriculum = curriculum.filter((course) => course.studentLevel === 'graduate')
const undergraduateCodes = new Set(undergraduateCurriculum.map((course) => course.courseCode))
const graduateCodes = new Set(graduateCurriculum.map((course) => course.courseCode))
const curriculumCodes = new Set([...undergraduateCodes, ...graduateCodes])
const offeringCodes = new Set(offerings.map((course) => course.baseCourseCode))
const replacementTargetCodes = new Set(replacements.map((replacement) => replacement.toCourseCode))

const invalidOfferingCourseCodes = offerings.filter(
  (course) => !/^\d{6}$/.test(course.baseCourseCode ?? ''),
)
const invalidCurriculumCourseCodes = curriculum.filter(
  (course) => !/^\d{6}$/.test(course.courseCode ?? ''),
)
const invalidClassIds = offerings.filter((course) => !/^2026_\d{6}-\d{2,}$/.test(course.id ?? ''))
const duplicateOfferingIds = offerings.length - new Set(offerings.map((course) => course.id)).size
const syllabusUrlEntries = Object.entries(syllabusUrls)
const offeringsWithoutSyllabusUrl = offerings.filter(
  (offering) => !Object.hasOwn(syllabusUrls, offering.id),
)
const offeringIds = new Set(offerings.map((offering) => offering.id))
const syllabusUrlsWithoutOffering = syllabusUrlEntries.filter(
  ([courseId]) => !offeringIds.has(courseId),
)
const invalidSyllabusUrls = syllabusUrlEntries.filter(([, url]) => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'cssy.aasa.ac.jp'
  } catch {
    return true
  }
})
const runtimeOfferingIds = new Set(runtimeOfferings.map((offering) => offering.id))
const runtimeOfferingsMissing = offerings.filter((offering) => !runtimeOfferingIds.has(offering.id))
const generatedOfferingIds = new Set(offerings.map((offering) => offering.id))
const runtimeOfferingsExtra = runtimeOfferings.filter(
  (offering) => !generatedOfferingIds.has(offering.id),
)
const projectionMatches = (runtimeRecord, generatedRecord, ignoredKeys = []) => {
  const runtimeProjection = Object.fromEntries(
    Object.entries(runtimeRecord).filter(([key]) => !ignoredKeys.includes(key)),
  )
  return (
    JSON.stringify(runtimeProjection) ===
    JSON.stringify(
      Object.fromEntries(
        Object.keys(runtimeProjection).map((key) => [key, generatedRecord?.[key]]),
      ),
    )
  )
}
const runtimeCurriculumMismatches = runtimeCurriculum.filter(
  (course, index) => !projectionMatches(course, curriculum[index]),
)
const offeringById = new Map(offerings.map((offering) => [offering.id, offering]))
const runtimeOfferingMismatches = runtimeOfferings.filter(
  (offering) => !projectionMatches(offering, offeringById.get(offering.id), ['syllabusUrl']),
)
const runtimeOfferingUrlMismatches = runtimeOfferings.filter(
  (offering) => offering.syllabusUrl !== syllabusUrls[offering.id],
)
const selectableTagCounts = Object.fromEntries(
  SELECTABLE_COURSE_TAGS.map((tag) => [
    tag,
    offerings.filter((offering) => offering.conditions.includes(tag)).length,
  ]),
)
const selectableTagsWithoutCourses = SELECTABLE_COURSE_TAGS.filter(
  (tag) => selectableTagCounts[tag] === 0,
)
const supportedDays = new Set(['月', '火', '水', '木', '金'])
const supportedPeriods = new Set([1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14])
const regularScheduleClasses = offerings.filter(
  (offering) =>
    supportedPeriods.has(offering.period) &&
    offering.day.split('・').every((day) => supportedDays.has(day)),
)
const unscheduledClasses = offerings.filter(
  (offering) => !regularScheduleClasses.includes(offering),
)
const multiDayClasses = regularScheduleClasses.filter((offering) => offering.day.includes('・'))
const extendedPeriodClasses = regularScheduleClasses.filter((offering) => offering.period > 5)
const directlyJoinedClasses = offerings.filter((offering) =>
  curriculumCodes.has(offering.baseCourseCode),
)
const replacementOnlyJoinedClasses = offerings.filter(
  (offering) =>
    !curriculumCodes.has(offering.baseCourseCode) &&
    replacementTargetCodes.has(offering.baseCourseCode),
)
const joinedClassIds = new Set(
  [...directlyJoinedClasses, ...replacementOnlyJoinedClasses].map((offering) => offering.id),
)
const joinFailedClasses = offerings.filter((offering) => !joinedClassIds.has(offering.id))
const joinedOfferingCodes = new Set(
  offerings
    .filter((offering) => joinedClassIds.has(offering.id))
    .map((offering) => offering.baseCourseCode),
)
const joinFailedCodes = unique(joinFailedClasses.map((offering) => offering.baseCourseCode)).sort()

const undergraduateMatchedOfferingCodes = [...offeringCodes].filter((courseCode) =>
  undergraduateCodes.has(courseCode),
)
const graduateMatchedOfferingCodes = [...offeringCodes].filter((courseCode) =>
  graduateCodes.has(courseCode),
)
const resolvedReplacementRecords = replacements.filter((replacement) =>
  offeringCodes.has(replacement.toCourseCode),
)
const unresolvedReplacementRecords = replacements.filter(
  (replacement) => !offeringCodes.has(replacement.toCourseCode),
)
const unresolvedReplacementTargets = unique(
  unresolvedReplacementRecords.map((replacement) => replacement.toCourseCode),
).sort()

const organizationUnresolved = curriculum.filter(
  (course) => course.organizationResolution !== 'resolved' || course.organizationCodes.length === 0,
)
const yearUnresolved = curriculum.filter((course) => course.eligibleYears.length === 0)
const majorUnresolved = curriculum.filter(
  (course) => course.courseScope === 'major' && course.organizationCodes.length === 0,
)
const emptyCourseNames = curriculum.filter((course) => !course.courseName)
const duplicateCurriculumRecords = issues.filter(
  (issue) => issue.type === 'duplicate_curriculum_record',
)
const unresolvedRelations = issues.filter((issue) => issue.type === 'relation_target_unresolved')
const issueTypeCounts = countBy(issues, 'type')
const studentAttributeIds = new Set(studentAttributes.map((attribute) => attribute.id))
const duplicateStudentAttributeIds = studentAttributes.length - studentAttributeIds.size
const hardAttributeRules = courseAttributeRules.filter((rule) => rule.effect === 'hard_requirement')
const classificationAttributeRules = courseAttributeRules.filter(
  (rule) => rule.effect === 'classification_only',
)
const unknownAttributeRuleReferences = courseAttributeRules.filter(
  (rule) => !studentAttributeIds.has(rule.attributeId),
)
const unmatchedAttributeRules = courseAttributeRules.filter(
  (rule) =>
    !curriculum.some(
      (course) =>
        course.courseCode === rule.courseCode &&
        course.sourceFile === rule.sourceFile &&
        course.sourcePage === rule.sourcePage &&
        course.admissionYearFrom <= rule.admissionYearTo &&
        course.admissionYearTo >= rule.admissionYearFrom,
    ),
)

const expectedSourceFiles = new Set(Object.values(SOURCE_FILES))
const manifestFiles = new Set(metadata.sourceManifest.map((source) => source.file))
const unexpectedManifestFiles = [...manifestFiles].filter((file) => !expectedSourceFiles.has(file))
const missingManifestFiles = [...expectedSourceFiles].filter((file) => !manifestFiles.has(file))
const generatedSourceFiles = new Set(
  [...curriculum, ...replacements, ...relations, ...offerings]
    .map((record) => record.sourceFile)
    .filter(Boolean),
)
const unauthorizedGeneratedSources = [...generatedSourceFiles].filter(
  (file) => !expectedSourceFiles.has(file),
)
const unauthorizedAttributeSources = unique(
  [
    ...studentAttributes.flatMap((attribute) =>
      attribute.sourceEvidence.map((evidence) => evidence.sourceFile),
    ),
    ...courseAttributeRules.map((rule) => rule.sourceFile),
  ].filter((file) => !expectedSourceFiles.has(file)),
)

const criticalProblems = []
if (offerings.length === 0) criticalProblems.push('2026年度授業クラスが0件')
if (invalidOfferingCourseCodes.length > 0)
  criticalProblems.push(`Excel基本科目番号取得失敗 ${invalidOfferingCourseCodes.length}件`)
if (invalidCurriculumCourseCodes.length > 0)
  criticalProblems.push(`履修要覧科目番号取得失敗 ${invalidCurriculumCourseCodes.length}件`)
if (invalidClassIds.length > 0)
  criticalProblems.push(`クラスID形式不正 ${invalidClassIds.length}件`)
if (duplicateOfferingIds > 0) criticalProblems.push(`クラスID重複 ${duplicateOfferingIds}件`)
if (joinFailedClasses.length > 0)
  criticalProblems.push(`科目番号JOIN失敗 ${joinFailedClasses.length}件`)
if (organizationUnresolved.length > 0)
  criticalProblems.push(`履修マスター所属未判定 ${organizationUnresolved.length}件`)
if (majorUnresolved.length > 0)
  criticalProblems.push(`専攻科目所属未判定 ${majorUnresolved.length}件`)
if (emptyCourseNames.length > 0) criticalProblems.push(`科目名未取得 ${emptyCourseNames.length}件`)
if (missingManifestFiles.length > 0)
  criticalProblems.push(`正式入力マニフェスト不足: ${missingManifestFiles.join(', ')}`)
if (unexpectedManifestFiles.length > 0 || unauthorizedGeneratedSources.length > 0)
  criticalProblems.push('正式9ファイル以外の生成元を検出')
if (yearUnresolved.some((course) => course.eligibilityStatus !== 'conditional'))
  criticalProblems.push('年次未判定なのにconditionalでない科目を検出')
if (duplicateStudentAttributeIds > 0)
  criticalProblems.push(`追加属性ID重複 ${duplicateStudentAttributeIds}件`)
if (unknownAttributeRuleReferences.length > 0)
  criticalProblems.push(`未定義追加属性への科目ルール ${unknownAttributeRuleReferences.length}件`)
if (unmatchedAttributeRules.length > 0)
  criticalProblems.push(
    `履修マスターに対応しない追加属性ルール ${unmatchedAttributeRules.length}件`,
  )
if (unauthorizedAttributeSources.length > 0)
  criticalProblems.push('正式9ファイル以外の追加属性根拠を検出')
if (offeringsWithoutSyllabusUrl.length > 0)
  criticalProblems.push(`シラバスURL未対応クラス ${offeringsWithoutSyllabusUrl.length}件`)
if (syllabusUrlsWithoutOffering.length > 0)
  criticalProblems.push(`実授業に対応しないシラバスURL ${syllabusUrlsWithoutOffering.length}件`)
if (invalidSyllabusUrls.length > 0)
  criticalProblems.push(`シラバスURL形式・ホスト不正 ${invalidSyllabusUrls.length}件`)
if (syllabusUrlReport.duplicateCourseIds > 0 || syllabusUrlReport.csvRowsWithoutOffering > 0)
  criticalProblems.push('授業一覧CSVのクラスID対応に重複または未対応あり')
if (
  runtimeCurriculum.length !== curriculum.length ||
  runtimeOfferings.length !== offerings.length ||
  runtimeReplacements.length !== replacements.length ||
  runtimeRelations.length !== relations.length ||
  runtimeOpenCourses.length !== openCourses.length ||
  runtimeOfferingsMissing.length > 0 ||
  runtimeOfferingsExtra.length > 0
)
  criticalProblems.push('Web配信用軽量データと検証済み生成データの件数・IDが不一致')
if (runtimeCurriculumMismatches.length > 0 || runtimeOfferingMismatches.length > 0)
  criticalProblems.push('Web配信用軽量データと検証済み生成データの内容が不一致')
if (runtimeOfferingUrlMismatches.length > 0)
  criticalProblems.push(
    `Web配信用実授業の埋め込みシラバスURL不一致 ${runtimeOfferingUrlMismatches.length}件`,
  )
if (selectableTagsWithoutCourses.length > 0)
  criticalProblems.push(`対応授業が0件の希望タグ: ${selectableTagsWithoutCourses.join(', ')}`)

const validationSummary = {
  validationStatus: criticalProblems.length === 0 ? 'passed_with_recorded_limitations' : 'failed',
  criticalProblems,
  excelTotalClasses: offerings.length,
  uniqueOfferingCourseCodes: offeringCodes.size,
  undergraduateCurriculumRecords: undergraduateCurriculum.length,
  undergraduateCurriculumUniqueCodes: undergraduateCodes.size,
  graduateCurriculumRecords: graduateCurriculum.length,
  graduateCurriculumUniqueCodes: graduateCodes.size,
  undergraduateMatchedOfferingCodes: undergraduateMatchedOfferingCodes.length,
  graduateMatchedOfferingCodes: graduateMatchedOfferingCodes.length,
  joinedClasses: joinedClassIds.size,
  joinFailedClasses: joinFailedClasses.length,
  joinedUniqueCourseCodes: joinedOfferingCodes.size,
  joinFailedUniqueCourseCodes: joinFailedCodes.length,
  directlyJoinedClasses: directlyJoinedClasses.length,
  replacementOnlyJoinedClasses: replacementOnlyJoinedClasses.length,
  replacementRecords: replacements.length,
  resolvedReplacementRecords: resolvedReplacementRecords.length,
  unresolvedReplacementRecords: unresolvedReplacementRecords.length,
  organizationUnresolved: organizationUnresolved.length,
  yearUnresolved: yearUnresolved.length,
  majorUnresolved: majorUnresolved.length,
  curriculumDuplicateOccurrences: duplicateCurriculumRecords.length,
  offeringDuplicateIds: duplicateOfferingIds,
  offeringCourseCodeExtractionFailures: invalidOfferingCourseCodes.length,
  curriculumCourseCodeExtractionFailures: invalidCurriculumCourseCodes.length,
  studentOrganizations: organizations.length,
  undergraduateStudentOrganizations: organizations.filter(
    (organization) => organization.studentLevel === 'undergraduate',
  ).length,
  graduateStudentOrganizations: organizations.filter(
    (organization) => organization.studentLevel === 'graduate',
  ).length,
  openCourseRecords: openCourses.length,
  changeApplicationRecords: changeApplications.length,
  unresolvedRelationReferences: unresolvedRelations.length,
  studentAttributeDefinitions: studentAttributes.length,
  courseAttributeRules: courseAttributeRules.length,
  hardAttributeRules: hardAttributeRules.length,
  classificationAttributeRules: classificationAttributeRules.length,
  studentAttributeGenerationIssues: studentAttributeIssues.length,
  duplicateStudentAttributeIds,
  unknownAttributeRuleReferences: unknownAttributeRuleReferences.length,
  unmatchedAttributeRules: unmatchedAttributeRules.length,
  syllabusUrls: syllabusUrlEntries.length,
  offeringsWithoutSyllabusUrl: offeringsWithoutSyllabusUrl.length,
  syllabusUrlsWithoutOffering: syllabusUrlsWithoutOffering.length,
  invalidSyllabusUrls: invalidSyllabusUrls.length,
  syllabusUrlNameMismatches: syllabusUrlReport.nameMismatches,
  runtimeCurriculumRecords: runtimeCurriculum.length,
  runtimeOfferingClasses: runtimeOfferings.length,
  runtimeOfferingsMissing: runtimeOfferingsMissing.length,
  runtimeOfferingsExtra: runtimeOfferingsExtra.length,
  runtimeCurriculumMismatches: runtimeCurriculumMismatches.length,
  runtimeOfferingMismatches: runtimeOfferingMismatches.length,
  runtimeOfferingUrlMismatches: runtimeOfferingUrlMismatches.length,
  selectableTagCounts,
  selectableTagsWithoutCourses,
  regularScheduleClasses: regularScheduleClasses.length,
  unscheduledClasses: unscheduledClasses.length,
  multiDayClasses: multiDayClasses.length,
  extendedPeriodClasses: extendedPeriodClasses.length,
}

await writeFile(
  path.join(generatedDirectory, 'data_validation_summary.json'),
  `${JSON.stringify(validationSummary, null, 2)}\n`,
  'utf8',
)

const formatCodes = (codes) => (codes.length > 0 ? codes.join(', ') : 'なし')
const issueRows = issueTypeCounts.map(([type, count]) => `| ${type} | ${count} |`).join('\n')
const report = `# DATA VALIDATION REPORT

生成日時: ${new Date().toISOString()}

検証結果: **${validationSummary.validationStatus}**

## 完全性集計

| 項目 | 件数 |
| --- | ---: |
| Excel総授業クラス数 | ${offerings.length} |
| Excelユニーク基本科目番号数 | ${offeringCodes.size} |
| 学部マスターレコード数 | ${undergraduateCurriculum.length} |
| 学部マスターユニーク科目番号数 | ${undergraduateCodes.size} |
| 大学院マスターレコード数 | ${graduateCurriculum.length} |
| 大学院マスターユニーク科目番号数 | ${graduateCodes.size} |
| 学部履修要覧対応・2026開講ユニーク科目数 | ${undergraduateMatchedOfferingCodes.length} |
| 大学院履修要覧対応・2026開講ユニーク科目数 | ${graduateMatchedOfferingCodes.length} |
| JOIN成功クラス数 | ${joinedClassIds.size} |
| JOIN失敗クラス数 | ${joinFailedClasses.length} |
| JOIN成功ユニーク科目番号数 | ${joinedOfferingCodes.size} |
| JOIN失敗ユニーク科目番号数 | ${joinFailedCodes.length} |
| 直接JOINクラス数 | ${directlyJoinedClasses.length} |
| 読替のみでJOINしたクラス数 | ${replacementOnlyJoinedClasses.length} |
| 読替総レコード数 | ${replacements.length} |
| 2026開講先へ解決した読替レコード数 | ${resolvedReplacementRecords.length} |
| 2026非開講先の読替レコード数 | ${unresolvedReplacementRecords.length} |
| 所属未判定 | ${organizationUnresolved.length} |
| 年次未判定（conditional保持） | ${yearUnresolved.length} |
| 専攻未判定 | ${majorUnresolved.length} |
| 履修マスター重複掲載（正規化済み） | ${duplicateCurriculumRecords.length} |
| クラスID重複 | ${duplicateOfferingIds} |
| Excel科目番号取得失敗 | ${invalidOfferingCourseCodes.length} |
| 履修要覧科目番号取得失敗 | ${invalidCurriculumCourseCodes.length} |
| 学籍番号所属コード | ${organizations.length} |
| 正式開放科目レコード | ${openCourses.length} |
| 2025変更適用記録 | ${changeApplications.length} |
| 追加属性定義 | ${studentAttributes.length} |
| 追加属性によるhard requirement | ${hardAttributeRules.length} |
| コース・専修の分類ルール（除外には不使用） | ${classificationAttributeRules.length} |
| 追加属性生成時の記録事項 | ${studentAttributeIssues.length} |
| シラバスURL対応クラス | ${syllabusUrlEntries.length} |
| シラバスURL未対応クラス | ${offeringsWithoutSyllabusUrl.length} |
| 実授業に対応しないURL | ${syllabusUrlsWithoutOffering.length} |
| 時間割コード一致・科目名不一致 | ${syllabusUrlReport.nameMismatches} |
| Web配信用履修マスターレコード | ${runtimeCurriculum.length} |
| Web配信用実授業クラス | ${runtimeOfferings.length} |
| Web配信用実授業ID不足 | ${runtimeOfferingsMissing.length} |
| Web配信用実授業ID余剰 | ${runtimeOfferingsExtra.length} |
| Web配信用履修マスター内容不一致 | ${runtimeCurriculumMismatches.length} |
| Web配信用実授業内容不一致 | ${runtimeOfferingMismatches.length} |
| Web配信用実授業URL不一致 | ${runtimeOfferingUrlMismatches.length} |
| 対応授業0件の希望タグ | ${selectableTagsWithoutCourses.length} |
| 通常時間割として選択可能なクラス | ${regularScheduleClasses.length} |
| 集中・曜日時限未定として選択可能なクラス | ${unscheduledClasses.length} |
| 複数曜日クラス | ${multiDayClasses.length} |
| 6限以降クラス | ${extendedPeriodClasses.length} |

JOINは科目名を使用せず、Excelの \`course_id\` から得た6桁基本科目番号だけで実施した。
シラバスURLは、追加指定された \`授業一覧.csv\` の時間割コードをExcelのクラスIDへ完全一致させた。履修可否の判定元には使用しない。

## 未解決・既知制約

- JOIN失敗科目番号: ${formatCodes(joinFailedCodes)}
- 2026年度に読替先クラスがない科目番号: ${formatCodes(unresolvedReplacementTargets)}
- 年次未判定は、変更表に年次がない4追加科目と、廃止済み読替元 \`110009 Central Japan\` の2掲載である。すべて \`conditional\` として保持した。
- 正式9ファイルにはCampusSquareへ別掲される「他学部・他学科開放科目一覧」の科目番号がないため、正式開放科目は0件である。推測による追加はしていない。
- \`CLD\` の図書館情報学領域は、正式資料から研究科階層を一意に確定できないため、研究科・専攻を未設定で保持した。
- 前提条件等で引用された科目名を科目番号へ一意に解決できない関係参照は ${unresolvedRelations.length}件である。候補科目自体は削除していない。詳細は \`data/generated/generation_issues.json\` に保持する。
- 第一言語条件のPDF抽出で隣接行が混入した可能性 ${studentAttributeIssues.length}件は、科目名と一致する言語だけを適用し、\`data/generated/student_attribute_generation_issues.json\` に保持した。
- 教育学部・交流文化学部・GLOCOMのコース／専修情報は分類として保持する。今回の正式資料に「他コースは履修不可」という明記がない区分はhard excludeに使用していない。
- 日本語教師資格課程、コンピュータ資格、会計教育、副専攻、星が丘キャンパスモデルは、今回の9ファイルだけで固定属性から履修範囲まで完結して確定できないため追加属性化していない。

## 生成時問題内訳

| 種別 | 件数 |
| --- | ---: |
${issueRows}

## 正式入力確認

- マニフェストファイル数: ${metadata.sourceManifest.length}
- 不足ファイル: ${formatCodes(missingManifestFiles)}
- 想定外マニフェスト: ${formatCodes(unexpectedManifestFiles)}
- 想定外生成元: ${formatCodes(unauthorizedGeneratedSources)}
- 想定外追加属性根拠: ${formatCodes(unauthorizedAttributeSources)}
- 各入力のSHA-256は \`data/generated/generation_metadata.json\` に記録した。

## 重大エラー

${criticalProblems.length > 0 ? criticalProblems.map((problem) => `- ${problem}`).join('\n') : '- なし'}
`

await writeFile(path.join(projectRoot, 'DATA_VALIDATION_REPORT.md'), report, 'utf8')

console.log(JSON.stringify(validationSummary, null, 2))
if (criticalProblems.length > 0) process.exitCode = 1
