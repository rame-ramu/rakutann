import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import {
  CONTEXT_MARKERS,
  REFERENCE_ACADEMIC_YEAR,
  SOURCE_DIRECTORY,
  SOURCE_FILES,
  STUDENT_ORGANIZATIONS,
  UNDERGRADUATE_CODES,
} from './curriculum-config.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const sourceDirectory = path.join(projectRoot, SOURCE_DIRECTORY)
const generatedDirectory = path.join(projectRoot, 'data', 'generated')
const publicRuntimeDirectory = path.join(projectRoot, 'public', 'data', 'runtime')

const undergraduateSources = [
  {
    file: SOURCE_FILES.undergraduate2026,
    studentLevel: 'undergraduate',
    defaultAdmissionRange: [2026, 2026],
  },
  {
    file: SOURCE_FILES.undergraduate2025,
    studentLevel: 'undergraduate',
    defaultAdmissionRange: [2025, 2025],
  },
  {
    file: SOURCE_FILES.undergraduateBefore2025,
    studentLevel: 'undergraduate',
    defaultAdmissionRange: [1900, 2024],
  },
]

const graduateSources = [
  {
    file: SOURCE_FILES.graduate2026,
    studentLevel: 'graduate',
    defaultAdmissionRange: [2026, 2026],
  },
  {
    file: SOURCE_FILES.graduate2025,
    studentLevel: 'graduate',
    defaultAdmissionRange: [2025, 2025],
  },
  {
    file: SOURCE_FILES.graduateBefore2025,
    studentLevel: 'graduate',
    defaultAdmissionRange: [1900, 2024],
  },
]

const facultyNames = [
  'グローバル・コミュニケーション学部',
  '健康医療科学部',
  '食健康科学部',
  '福祉貢献学部',
  '人間情報学部',
  '創造表現学部',
  '交流文化学部',
  'ビジネス学部',
  '建築学部',
  '心理学部',
  '教育学部',
  '文学部',
]

const graduateSchoolNames = [
  'グローバルカルチャー・コミュニケーション研究科',
  '心理医療科学研究科',
  '健康栄養科学研究科',
  '文化創造研究科',
  '教育学研究科',
  'ビジネス研究科',
]

const generationIssues = []

const normalizeText = (value) =>
  [...String(value ?? '')]
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint === 9 || codePoint === 10 || codePoint === 13 || codePoint >= 32
    })
    .join('')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeCompact = (value) => normalizeText(value).replace(/\s/g, '')

const unique = (values) => [...new Set(values)]

const sha256 = async (filename) =>
  createHash('sha256')
    .update(await readFile(filename))
    .digest('hex')

const parseYears = (value) => {
  const normalized = normalizeText(value)
    .replace(/[~−–—〜～]/g, '-')
    .replace(/[・,、]/g, ',')
  const range = normalized.match(/([1-4])\s*-\s*([1-4])/)
  if (range) {
    const from = Number(range[1])
    const to = Number(range[2])
    if (from <= to) return Array.from({ length: to - from + 1 }, (_, index) => from + index)
  }
  return unique((normalized.match(/[1-4]/g) ?? []).map(Number)).sort((a, b) => a - b)
}

const parseAdmissionRange = (value, fallback, sourceAdmissionYearTo = REFERENCE_ACADEMIC_YEAR) => {
  const normalized = normalizeText(value).replace(/[~−–—〜～]/g, '-')
  let match = normalized.match(/(\d{4})年度?\s*-\s*(\d{4})年度入学者対象/)
  if (match) return [Number(match[1]), Number(match[2])]
  match = normalized.match(/(\d{4})\s*-\s*(\d{4})年度入学者対象/)
  if (match) return [Number(match[1]), Number(match[2])]
  match = normalized.match(/(\d{4})年度以前入学者対象/)
  if (match) return [1900, Number(match[1])]
  match = normalized.match(/(\d{4})年度以降入学者対象/)
  if (match) return [Number(match[1]), sourceAdmissionYearTo]
  match = normalized.match(/(\d{4})年度入学者対象/)
  if (match) return [Number(match[1]), Number(match[1])]
  return fallback
}

const valueFromCell = (cell) => {
  const value = cell?.value
  if (value === null || value === undefined) return null
  if (typeof value !== 'object') return value
  if ('result' in value && value.result !== undefined) return value.result
  if ('richText' in value) return value.richText.map((part) => part.text).join('')
  if ('text' in value) return value.text
  return null
}

const numberFromCell = (cell, fallback = 0) => {
  const value = valueFromCell(cell)
  const number = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(number) ? number : fallback
}

const codesForFaculty = (faculty) =>
  STUDENT_ORGANIZATIONS.filter(
    (organization) =>
      organization.studentLevel === 'undergraduate' && organization.faculty === faculty,
  ).map((organization) => organization.code)

const codesForGraduateSchool = (graduateSchool, studentType) =>
  STUDENT_ORGANIZATIONS.filter(
    (organization) =>
      organization.studentLevel === 'graduate' &&
      organization.graduateSchool === graduateSchool &&
      organization.studentType === studentType,
  ).map((organization) => organization.code)

const filterCodesForSource = (codes, studentLevel, studentType, currentFaculty) =>
  codes.filter((code) => {
    const organization = STUDENT_ORGANIZATIONS.find((candidate) => candidate.code === code)
    if (!organization || organization.studentLevel !== studentLevel) return false
    if (studentType && organization.studentType !== studentType) return false
    if (
      studentLevel === 'undergraduate' &&
      currentFaculty &&
      organization.faculty !== currentFaculty
    )
      return false
    return true
  })

const hierarchyForCodes = (codes) => {
  const organizations = codes
    .map((code) => STUDENT_ORGANIZATIONS.find((candidate) => candidate.code === code))
    .filter(Boolean)
  const common = (key) => {
    const values = unique(organizations.map((organization) => organization[key]).filter(Boolean))
    return values.length === 1 ? values[0] : null
  }
  return {
    faculty: common('faculty'),
    graduateSchool: common('graduateSchool'),
    department: common('department'),
    major: common('major'),
    course: common('course'),
    specialization: common('specialization'),
  }
}

const detectStudentType = (text, previous) => {
  const compact = normalizeCompact(text)
  if (/博士後期課程|後期課程/.test(compact)) return 'D'
  if (/博士前期課程|前期課程|修士課程/.test(compact)) return 'M'
  return previous
}

const detectScopeAnchor = (value) => {
  const compact = normalizeCompact(value)
  if (compact.includes('全学共通履修科目')) return 'university_common'
  if (/学部共通(?:基礎|応用)?科目/.test(compact)) return 'faculty_common'
  if (/学科共通(?:基礎|応用)?科目/.test(compact)) return 'department_common'
  if (/共通基礎科目|共通応用科目/.test(compact)) return 'department_common'
  if (
    /専攻科目|専修科目|学部専門科目|専門基礎科目|専門中心科目|専門応用科目|専門発展科目|発展科目/.test(
      compact,
    )
  )
    return 'major'
  return null
}

const detectContextAnchor = ({ value, studentLevel, studentType, currentFaculty }) => {
  const compact = normalizeCompact(value)
  for (const [marker, codes] of CONTEXT_MARKERS) {
    const markerCompact = normalizeCompact(marker)
    if (!compact.includes(markerCompact)) continue
    const filtered = filterCodesForSource(codes, studentLevel, studentType, currentFaculty)
    if (filtered.length > 0) return filtered
  }

  if (studentLevel === 'undergraduate' && compact.includes('教育学科')) {
    if (currentFaculty === '文学部') return ['LAU']
    if (currentFaculty === '教育学部') return ['KEU']
  }
  return null
}

const tableColumns = (headerItems, mainCodeItems, anchorY) => {
  const structuralHeaderItems = headerItems.filter((item) => Math.abs(item.y - anchorY) <= 35)
  const findFirst = (patterns, minimumX = 0) =>
    structuralHeaderItems
      .filter(
        (item) =>
          item.x >= minimumX && patterns.some((pattern) => pattern.test(normalizeText(item.str))),
      )
      .sort((a, b) => Math.abs(a.y - anchorY) - Math.abs(b.y - anchorY))[0]

  const codeX = Math.min(...mainCodeItems.map((item) => item.x))
  const yearHeader = findFirst([/履修年次/, /^履修$/], codeX)
  const semesterHeader = findFirst([/開講学期/], yearHeader?.x ?? codeX)
  const creditHeaders = structuralHeaderItems.filter(
    (item) =>
      item.x > codeX &&
      item.x < (yearHeader?.x ?? Number.POSITIVE_INFINITY) &&
      /単位|^単$|^位$/.test(normalizeText(item.str)),
  )
  const creditX = creditHeaders.length > 0 ? Math.min(...creditHeaders.map((item) => item.x)) : null
  const minimumHeader = findFirst([/開講最少/, /履修者数/], semesterHeader?.x ?? codeX)
  const notesHeader = findFirst(
    [/^備考$/, /^備$/, /備考/],
    minimumHeader?.x ?? semesterHeader?.x ?? codeX,
  )
  const structuralHeaders = [yearHeader, semesterHeader, ...creditHeaders].filter(Boolean)
  const headerY = Math.max(...structuralHeaders.map((item) => item.y))
  const headerBottomY = Math.min(...structuralHeaders.map((item) => item.y))

  if (!yearHeader || !semesterHeader || !creditX || !Number.isFinite(headerY)) return null
  return {
    codeX,
    creditX,
    yearX: yearHeader.x,
    semesterX: semesterHeader.x,
    minimumX: minimumHeader?.x ?? null,
    notesX: notesHeader?.x ?? null,
    headerY,
    headerBottomY,
    headerItemIndexes: structuralHeaders.map((item) => item.index),
  }
}

const tableSegments = (items, mainCodeItems) => {
  const headerAnchors = items
    .filter((item) => /^履修年次$/.test(item.str) || /^履修$/.test(item.str))
    .sort((a, b) => b.y - a.y)
    .filter((item, index, values) => index === 0 || Math.abs(item.y - values[index - 1].y) > 4)

  return headerAnchors.flatMap((anchor, index) => {
    const nextAnchor = headerAnchors[index + 1]
    const lowerBoundary = nextAnchor ? nextAnchor.y + 32 : Number.NEGATIVE_INFINITY
    const segmentCodeItems = mainCodeItems.filter(
      (item) => item.y < anchor.y - 2 && item.y > lowerBoundary,
    )
    if (segmentCodeItems.length === 0) return []

    const headerItems = items.filter((item) => item.y >= anchor.y - 65 && item.y <= anchor.y + 65)
    const columns = tableColumns(headerItems, segmentCodeItems, anchor.y)
    if (!columns) return []
    const rowCodes = segmentCodeItems
      .sort((a, b) => b.y - a.y || a.index - b.index)
      .filter(
        (item, rowIndex, values) =>
          rowIndex === 0 ||
          Math.abs(item.y - values[rowIndex - 1].y) > 0.8 ||
          item.str !== values[rowIndex - 1].str,
      )
    const contentStartIndex = Math.max(...columns.headerItemIndexes) + 1
    return [{ columns, rowCodes, lowerBoundary, contentStartIndex, headerItems }]
  })
}

const itemsInBand = (items, upper, lower) =>
  items.filter((item) => item.y <= upper && item.y > lower)

const joinItems = (items) =>
  normalizeText(
    [...items]
      .sort((a, b) => b.y - a.y || a.x - b.x || a.index - b.index)
      .map((item) => item.str)
      .join(' '),
  )

const extractSemester = (value) => {
  const normalized = normalizeText(value)
  const semesters = []
  for (const label of ['前期', '後期', '通年', '集中']) {
    if (normalized.includes(label)) semesters.push(label)
  }
  return semesters.length > 0 ? semesters.join('・') : null
}

const makeCourseScope = ({ studentLevel, organizationCodes, currentScope, currentFaculty }) => {
  if (studentLevel === 'graduate') return 'graduate_program'
  if (!currentFaculty) return 'university_common'
  if (
    currentScope === 'faculty_common' ||
    currentScope === 'department_common' ||
    currentScope === 'major'
  )
    return currentScope
  if (organizationCodes.length === 1) {
    const organization = STUDENT_ORGANIZATIONS.find(
      (candidate) => candidate.code === organizationCodes[0],
    )
    return organization?.major ? 'major' : 'department_common'
  }
  const hierarchy = hierarchyForCodes(organizationCodes)
  if (organizationCodes.length > 1 && hierarchy.department) return 'department_common'
  if (organizationCodes.length > 1 && hierarchy.faculty) return 'faculty_common'
  return 'unknown'
}

const expandCodesForScope = ({ scope, organizationCodes, currentFaculty }) => {
  if (scope === 'university_common') return [...UNDERGRADUATE_CODES]
  if (scope === 'faculty_common') return codesForFaculty(currentFaculty)
  if (scope !== 'department_common') return organizationCodes
  const hierarchy = hierarchyForCodes(organizationCodes)
  if (!hierarchy.department) return organizationCodes
  return STUDENT_ORGANIZATIONS.filter(
    (organization) =>
      organization.studentLevel === 'undergraduate' &&
      organization.faculty === currentFaculty &&
      organization.department === hierarchy.department,
  ).map((organization) => organization.code)
}

const explicitOrganizationExcludes = (conditionText, organizationCodes) => {
  const excluded = new Set()
  const hasFixedAttributeGate =
    /教職課程登録者のみ|教員免許状取得希望者のみ|他学科免履修者のみ/.test(conditionText)
  const organizations = organizationCodes
    .map((code) => STUDENT_ORGANIZATIONS.find((organization) => organization.code === code))
    .filter(Boolean)
  for (const organization of organizations) {
    const labels = unique(
      [
        organization.major,
        organization.specialization,
        organization.course,
        organization.department,
      ].filter(Boolean),
    )
    for (const label of labels) {
      if (new RegExp(`${label}.{0,12}(?:は)?履修不可`).test(conditionText)) {
        excluded.add(organization.code)
      }
      if (
        !hasFixedAttributeGate &&
        new RegExp(`${label}.{0,12}のみ.{0,8}履修可`).test(conditionText)
      ) {
        for (const other of organizations)
          if (other.code !== organization.code) excluded.add(other.code)
      }
    }
  }
  return [...excluded]
}

const extractPdfCurriculum = async (source) => {
  const filename = path.join(sourceDirectory, source.file)
  const document = await getDocument({
    data: new Uint8Array(await readFile(filename)),
    verbosity: 0,
  }).promise
  const courses = []
  const replacements = []
  let admissionRange = source.defaultAdmissionRange
  let currentFaculty = null
  let currentGraduateSchool = null
  let currentStudentType = source.studentLevel === 'undergraduate' ? 'U' : null
  let currentOrganizationCodes = []
  let currentScope = null

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const width = page.getViewport({ scale: 1 }).width
    const items = content.items
      .map((item, index) => ({
        str: normalizeText(item.str),
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        index,
      }))
      .filter((item) => item.str)
    const pageText = normalizeText(items.map((item) => item.str).join(' '))
    const headingText = pageText.slice(0, 900)
    admissionRange = parseAdmissionRange(
      headingText,
      admissionRange,
      source.defaultAdmissionRange[1],
    )

    if (source.studentLevel === 'undergraduate') {
      const detectedFaculty = facultyNames.find((faculty) =>
        items.some((item) => item.str.includes(faculty) && item.x < 90 && item.y > 800),
      )
      if (detectedFaculty && detectedFaculty !== currentFaculty) {
        currentFaculty = detectedFaculty
        currentOrganizationCodes = codesForFaculty(currentFaculty)
        currentScope = null
      }
    }

    if (source.studentLevel === 'graduate') {
      const graduateHeading = headingText.slice(0, 240)
      const detectedGraduateSchool = graduateSchoolNames
        .map((school) => ({ school, index: graduateHeading.indexOf(school) }))
        .filter(({ index }) => index >= 0)
        .sort((a, b) => a.index - b.index)[0]?.school
      if (detectedGraduateSchool && detectedGraduateSchool !== currentGraduateSchool) {
        currentGraduateSchool = detectedGraduateSchool
        currentOrganizationCodes = []
        currentScope = 'graduate_program'
      }
      currentStudentType = detectStudentType(headingText, currentStudentType)
      if (currentGraduateSchool && currentStudentType && currentOrganizationCodes.length === 0) {
        currentOrganizationCodes = codesForGraduateSchool(currentGraduateSchool, currentStudentType)
      }
    }

    if (
      /カリキュラム表の見方/.test(headingText) ||
      !/科目\s*番号|科目番号/.test(pageText) ||
      !/履修\s*年次|履修年次/.test(pageText)
    )
      continue

    const allCodeItems = items.filter((item) => /(?<!\d)\d{6}(?!\d)/.test(item.str))
    const mainCodeItems = allCodeItems.filter((item) => item.x < width * 0.55)
    if (mainCodeItems.length === 0) continue
    const segments = tableSegments(items, mainCodeItems)
    if (segments.length === 0) {
      if (/カリキュラム表/.test(pageText)) {
        generationIssues.push({
          type: 'table_columns_unresolved',
          sourceFile: source.file,
          sourcePage: pageNumber,
        })
      }
      continue
    }

    for (const segment of segments) {
      if (!segment.columns) {
        generationIssues.push({
          type: 'table_columns_unresolved',
          sourceFile: source.file,
          sourcePage: pageNumber,
          headerY: segment.anchor.y,
        })
        continue
      }
      const { columns, rowCodes } = segment
      const headerContextCodes = unique(
        segment.headerItems.flatMap(
          (item) =>
            detectContextAnchor({
              value: item.str,
              studentLevel: source.studentLevel,
              studentType: currentStudentType,
              currentFaculty,
            }) ?? [],
        ),
      )
      if (headerContextCodes.length > 0) currentOrganizationCodes = headerContextCodes

      for (let rowIndex = 0; rowIndex < rowCodes.length; rowIndex += 1) {
        const codeItem = rowCodes[rowIndex]
        const previousCode = rowCodes[rowIndex - 1]
        const nextCode = rowCodes[rowIndex + 1]
        const upper = previousCode
          ? (previousCode.y + codeItem.y) / 2
          : (columns.headerBottomY + codeItem.y) / 2
        const lower = nextCode
          ? (codeItem.y + nextCode.y) / 2
          : Math.max(codeItem.y - 28, segment.lowerBoundary)
        const rowItems = itemsInBand(items, upper, lower)
        const previousItemIndex =
          rowIndex > 0 ? rowCodes[rowIndex - 1].index : segment.contentStartIndex
        const preambleStartIndex = Math.min(previousItemIndex, codeItem.index)
        const preambleEndIndex = Math.max(previousItemIndex, codeItem.index)
        const preambleItems = items.filter(
          (item) =>
            item.index >= preambleStartIndex &&
            item.index < preambleEndIndex &&
            item.x < width * 0.62,
        )

        for (const preambleItem of preambleItems) {
          const scopeAnchor = detectScopeAnchor(preambleItem.str)
          if (scopeAnchor) {
            currentScope = scopeAnchor
          }
          const contextAnchor = detectContextAnchor({
            value: preambleItem.str,
            studentLevel: source.studentLevel,
            studentType: currentStudentType,
            currentFaculty,
          })
          if (contextAnchor) {
            currentOrganizationCodes = contextAnchor
            if (source.studentLevel === 'graduate') currentScope = 'graduate_program'
          }
        }

        let organizationCodes =
          source.studentLevel === 'undergraduate'
            ? expandCodesForScope({
                scope: currentScope,
                organizationCodes: [...currentOrganizationCodes],
                currentFaculty,
              })
            : [...currentOrganizationCodes]
        let courseScope = makeCourseScope({
          studentLevel: source.studentLevel,
          organizationCodes,
          currentScope,
          currentFaculty,
        })
        if (source.studentLevel === 'undergraduate' && !currentFaculty) {
          organizationCodes = [...UNDERGRADUATE_CODES]
          courseScope = 'university_common'
        }
        if (courseScope === 'unknown') organizationCodes = []

        const courseCode = codeItem.str.match(/(?<!\d)(\d{6})(?!\d)/)?.[1]
        if (!courseCode) continue
        const numbering =
          joinItems(rowItems.filter((item) => item.x < codeItem.x - 1)).match(
            /(?:^|\s)(\d{4})(?=\s|$)/,
          )?.[1] ?? null
        const nameItems = rowItems.filter(
          (item) => item.x >= codeItem.x - 1 && item.x < columns.creditX - 2,
        )
        const courseName = joinItems(nameItems)
          .replace(new RegExp(`(^|\\s)${courseCode}(?=\\s|$)`), ' ')
          .replace(/^\d{4}\s+/, '')
          .replace(/^[*＊●○△▲◆◇\s]+/, '')
          .trim()
        const creditItems = rowItems.filter(
          (item) => item.x >= columns.creditX - 8 && item.x < columns.yearX - 2,
        )
        const creditCandidates =
          joinItems(creditItems).match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/g) ?? []
        const credits = creditCandidates.length > 0 ? Number(creditCandidates[0].trim()) : null
        const yearItems = rowItems.filter(
          (item) => item.x >= columns.yearX - 8 && item.x < columns.semesterX - 2,
        )
        const eligibleYears = parseYears(joinItems(yearItems))
        const semesterEnd = columns.minimumX ?? columns.notesX ?? width * 0.72
        const semesterItems = rowItems.filter(
          (item) => item.x >= columns.semesterX - 8 && item.x < semesterEnd,
        )
        const semester = extractSemester(joinItems(semesterItems))
        const notesStart = columns.minimumX
          ? columns.minimumX + 14
          : columns.notesX
            ? columns.notesX - 24
            : width * 0.69
        const conditionItems = rowItems.filter((item) => item.x >= notesStart)
        const conditionText = joinItems(conditionItems)
          .replace(/^\d+\s+/, '')
          .trim()
        const hierarchy = hierarchyForCodes(organizationCodes)
        const printedPage = Number.parseInt(pageText.match(/^\d{1,3}/)?.[0] ?? '', 10)
        const hardExcludeOtherMajor = /他(?:学科・)?専攻の学生は履修不可/.test(conditionText)
        const excludedOrganizationCodes = explicitOrganizationExcludes(
          conditionText,
          organizationCodes,
        )
        const hasUnknownCondition =
          /履修|修得|GPA|TOEIC|単位数|説明会|選考|資格|ガイダンス|抽選|スコア|成績/.test(
            conditionText,
          )

        if (!courseName || courseName.length < 2) {
          generationIssues.push({
            type: 'course_name_unresolved',
            sourceFile: source.file,
            sourcePage: pageNumber,
            courseCode,
          })
        }
        if (organizationCodes.length === 0) {
          generationIssues.push({
            type: 'organization_unresolved',
            sourceFile: source.file,
            sourcePage: pageNumber,
            courseCode,
            courseName,
            context: headingText.slice(0, 180),
          })
        }
        if (eligibleYears.length === 0) {
          generationIssues.push({
            type: 'eligible_years_unresolved',
            sourceFile: source.file,
            sourcePage: pageNumber,
            courseCode,
            courseName,
          })
        }

        courses.push({
          studentLevel: source.studentLevel,
          studentTypes:
            source.studentLevel === 'undergraduate'
              ? ['U']
              : currentStudentType
                ? [currentStudentType]
                : [],
          admissionYearFrom: admissionRange[0],
          admissionYearTo: admissionRange[1],
          ...hierarchy,
          organizationCodes,
          organizationResolution: organizationCodes.length > 0 ? 'resolved' : 'unknown',
          courseScope,
          courseCode,
          numbering,
          courseName,
          credits,
          eligibleYears,
          minYear: eligibleYears.length > 0 ? Math.min(...eligibleYears) : null,
          semester,
          conditionText,
          eligibilityStatus:
            hasUnknownCondition || eligibleYears.length === 0 ? 'conditional' : 'eligible',
          hardExcludes: hardExcludeOtherMajor ? ['other_major_students'] : [],
          excludedOrganizationCodes,
          sourceFile: source.file,
          sourcePage: pageNumber,
          sourcePrintedPage: Number.isFinite(printedPage) ? printedPage : null,
        })

        if (pageText.includes('読替科目')) {
          const replacementItems = rowItems.filter(
            (item) => item.x >= width * 0.55 && /(?<!\d)\d{6}(?!\d)/.test(item.str),
          )
          for (const replacementItem of replacementItems) {
            const replacementCode = replacementItem.str.match(/(?<!\d)(\d{6})(?!\d)/)?.[1]
            if (!replacementCode || replacementCode === courseCode) continue
            const replacementName = joinItems(
              rowItems.filter((item) => item.x >= replacementItem.x && item.x < width - 5),
            )
              .replace(new RegExp(`(^|\\s)${replacementCode}(?=\\s|$)`), ' ')
              .replace(/\b\d{4}年度.*$/, '')
              .trim()
            const effectiveYearMatch = conditionText.match(/(\d{4})年度以降は読替/)
            replacements.push({
              studentLevel: source.studentLevel,
              studentTypes:
                source.studentLevel === 'undergraduate'
                  ? ['U']
                  : currentStudentType
                    ? [currentStudentType]
                    : [],
              admissionYearFrom: admissionRange[0],
              admissionYearTo: admissionRange[1],
              organizationCodes,
              fromCourseCode: courseCode,
              fromCourseName: courseName,
              toCourseCode: replacementCode,
              toCourseName: replacementName || null,
              effectiveAcademicYear: effectiveYearMatch ? Number(effectiveYearMatch[1]) : null,
              sourceFile: source.file,
              sourcePage: pageNumber,
              sourcePrintedPage: Number.isFinite(printedPage) ? printedPage : null,
            })
          }
        }
      }
    }
  }

  return { courses, replacements, pageCount: document.numPages }
}

const extractChangeApplications = async () => {
  const sourceFile = SOURCE_FILES.undergraduateChanges2025
  const filename = path.join(sourceDirectory, sourceFile)
  const document = await getDocument({
    data: new Uint8Array(await readFile(filename)),
    verbosity: 0,
  }).promise
  const additions = []
  const applications = []
  const undergraduatePageTexts = []
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = normalizeText(content.items.map((item) => item.str).join(' '))
    undergraduatePageTexts.push(pageText)
    const beforeOlderSection = pageText.split('履修要覧 学部[2024年度以前入学者用]')[0]
    const matches = beforeOlderSection.matchAll(
      /科目番号:(\d{6})\s+科目:(.+?)\s+備考:(.+?)\s+-\s*(?=\d{4}年|$)/g,
    )
    for (const match of matches) {
      const courseCode = match[1]
      if (additions.some((addition) => addition.courseCode === courseCode)) continue
      additions.push({
        studentLevel: 'undergraduate',
        studentTypes: ['U'],
        admissionYearFrom: 2025,
        admissionYearTo: 2025,
        faculty: null,
        graduateSchool: null,
        department: null,
        major: null,
        course: null,
        specialization: null,
        organizationCodes: [...UNDERGRADUATE_CODES],
        organizationResolution: 'resolved',
        courseScope: 'university_common',
        courseCode,
        courseName: normalizeText(match[2]),
        credits: null,
        eligibleYears: [],
        minYear: null,
        semester: null,
        conditionText: normalizeText(match[3]),
        eligibilityStatus: 'conditional',
        hardExcludes: [],
        sourceFile,
        sourcePage: pageNumber,
        sourcePrintedPage: 37,
        changeApplied: true,
      })
      applications.push({
        changeType: 'curriculum_course_addition',
        studentLevel: 'undergraduate',
        admissionYearFrom: 2025,
        admissionYearTo: 2025,
        courseCode,
        changedFields: ['courseName', 'conditionText'],
        status: 'applied_conditional',
        explanation: '変更後欄に単位数・履修年次・開講学期がないためconditionalで追加',
        sourceFile,
        sourcePage: pageNumber,
      })
      generationIssues.push({
        type: 'change_addition_years_unresolved',
        sourceFile,
        sourcePage: pageNumber,
        courseCode,
        explanation: '変更後欄に単位数・履修年次・開講学期が記載されていないためconditionalで保持',
      })
    }
  }

  const undergraduate2025Text = undergraduatePageTexts
    .join(' ')
    .split('履修要覧 学部[2024年度以前入学者用]')[0]
  const undergraduate2025Compact = normalizeCompact(undergraduate2025Text)
  if (/ナンバリング:2420[\s\S]{0,100}科目番号:291067/.test(undergraduate2025Text)) {
    applications.push({
      changeType: 'curriculum_field_override',
      studentLevel: 'undergraduate',
      admissionYearFrom: 2025,
      admissionYearTo: 2025,
      courseCode: '291067',
      changedFields: ['numbering'],
      after: { numbering: '2420' },
      status: 'applied',
      sourceFile,
      sourcePage: 2,
    })
  } else {
    generationIssues.push({
      type: 'change_application_unresolved',
      sourceFile,
      target: '291067 numbering 2420',
    })
  }
  if (
    ['日本語III', 'キャリア日本語II', '卒業に必要な単位数に算入しない'].every((text) =>
      undergraduate2025Compact.includes(text),
    )
  ) {
    applications.push({
      changeType: 'graduation_requirement_note',
      studentLevel: 'undergraduate',
      admissionYearFrom: 2025,
      admissionYearTo: 2025,
      courseCodes: ['106011', '106012', '106013', '106014'],
      status: 'recorded_no_eligibility_filter_change',
      sourceFile,
      sourcePage: 2,
    })
  }

  const graduateSourceFile = SOURCE_FILES.graduateChanges2025
  const graduateDocument = await getDocument({
    data: new Uint8Array(await readFile(path.join(sourceDirectory, graduateSourceFile))),
    verbosity: 0,
  }).promise
  const graduateContent = await (await graduateDocument.getPage(1)).getTextContent()
  const graduateText = normalizeText(graduateContent.items.map((item) => item.str).join(' '))
  if (/GPA制度/.test(graduateText) && /2006年度よりGPA/.test(graduateText)) {
    applications.push({
      changeType: 'academic_policy_override',
      studentLevel: 'graduate',
      admissionYearFrom: 2025,
      admissionYearTo: 2025,
      target: 'GPA制度',
      status: 'recorded_no_course_eligibility_filter_change',
      sourceFile: graduateSourceFile,
      sourcePage: 1,
    })
  } else {
    generationIssues.push({
      type: 'change_application_unresolved',
      sourceFile: graduateSourceFile,
      target: 'GPA制度',
    })
  }
  return { additions, applications }
}

const normalizeConditionTag = (tag) =>
  normalizeText(tag)
    .replace(/^出席点/, '態度点')
    .replace(/^出席・参加点/, '態度点')

const tagReason = (tag, course) => {
  if (tag.includes('レポート・課題')) return `レポート・課題割合が${course.reportPercent}%`
  if (tag.includes('試験')) return `試験割合が${course.examPercent}%`
  if (tag.includes('態度点')) return `出席・参加点割合が${course.attendancePercent}%`
  if (tag.includes('オンデマンド'))
    return `授業計画${course.planClasses}回中オンデマンド${course.onDemandClasses}回`
  if (tag.includes('前提履修')) return course.prerequisiteReason || course.prerequisiteLabel
  if (tag.includes('グループワーク')) return course.groupWorkReason || course.groupWorkLabel
  if (tag === course.field) return `2026年度正式Excelの授業系統「${course.sourceField}」から分類`
  return '2026年度正式Excelの分析タグ'
}

const extractOfferings = async () => {
  const sourceFile = SOURCE_FILES.offerings2026
  const filename = path.join(sourceDirectory, sourceFile)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filename)
  const worksheet = workbook.getWorksheet('授業分析')
  if (!worksheet) throw new Error('正式Excelに「授業分析」シートがありません。')

  const headers = new Map()
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headers.set(normalizeText(valueFromCell(cell)), columnNumber)
  })
  const requiredHeaders = [
    'course_id',
    '授業名',
    'キャンパス',
    '担当教員',
    '開講学期',
    '曜日',
    '時限',
    '単位数',
    '対象年次',
    '授業形態',
    '簡単な要約',
    '出席・参加点割合',
    '試験割合',
    'レポート・課題割合',
    'オンデマンド回数',
    '授業計画回数',
    '前提履修',
    'グループワーク',
    '授業系統',
    'タグ',
  ]
  const missingHeaders = requiredHeaders.filter((header) => !headers.has(header))
  if (missingHeaders.length > 0) {
    throw new Error(`正式Excelの必須列が不足しています: ${missingHeaders.join(', ')}`)
  }

  const getCell = (row, header) => row.getCell(headers.get(header))
  const getText = (row, header) => normalizeText(valueFromCell(getCell(row, header)))
  const offerings = []
  const idCounts = new Map()

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const id = getText(row, 'course_id')
    if (!id) {
      generationIssues.push({ type: 'offering_id_missing', sourceFile, sourceRow: rowNumber })
      continue
    }
    idCounts.set(id, (idCounts.get(id) ?? 0) + 1)
    const idMatch = id.match(/^2026_(\d{6})(?:-(.+))?$/)
    const baseCourseCode = idMatch?.[1] ?? null
    const classNumber = idMatch?.[2] ?? ''
    if (!baseCourseCode) {
      generationIssues.push({
        type: 'base_course_code_unresolved',
        sourceFile,
        sourceRow: rowNumber,
        id,
      })
    }
    const onDemandClasses = numberFromCell(getCell(row, 'オンデマンド回数'))
    const planClasses = numberFromCell(getCell(row, '授業計画回数'))
    const onDemandPercent = planClasses > 0 ? Math.round((onDemandClasses / planClasses) * 100) : 0
    const sourceField = getText(row, '授業系統') || getText(row, '授業系統タグ') || 'その他'
    const field = sourceField
    const attendancePercent = numberFromCell(getCell(row, '出席・参加点割合'))
    const examPercent = numberFromCell(getCell(row, '試験割合'))
    const reportPercent = numberFromCell(getCell(row, 'レポート・課題割合'))
    const prerequisiteLabel = getText(row, '前提履修') || '不明'
    const prerequisiteReason = getText(row, '前提履修根拠')
    const groupWorkLabel = getText(row, 'グループワーク') || '不明'
    const groupWorkReason = getText(row, 'グループワーク根拠')
    const sourceTags = getText(row, 'タグ')
      .split(/\s*\/\s*/)
      .map(normalizeConditionTag)
      .filter(Boolean)
    const conditions = unique([
      ...sourceTags,
      prerequisiteLabel === 'あり' ? '前提履修あり' : '前提履修なし',
      groupWorkLabel === 'あり' ? 'グループワークあり' : 'グループワークなし',
      field,
    ])
    const course = {
      id,
      baseCourseCode,
      classNumber,
      years: parseYears(getText(row, '対象年次')),
      name: getText(row, '授業名'),
      campus: getText(row, 'キャンパス'),
      instructor: getText(row, '担当教員'),
      instructors: getText(row, '担当教員一覧'),
      semester: getText(row, '開講学期'),
      day: getText(row, '曜日') || '他',
      period: (() => {
        const period = Number.parseInt(getText(row, '時限'), 10)
        return Number.isFinite(period) ? period : null
      })(),
      credits: numberFromCell(getCell(row, '単位数')),
      classFormat: getText(row, '授業実施形態') || getText(row, '授業形態'),
      attendancePercent,
      reportPercent,
      examPercent,
      presentationPercent: numberFromCell(getCell(row, '発表評価割合')),
      groupWorkPercent: numberFromCell(getCell(row, 'グループワーク評価割合')),
      productionPercent: numberFromCell(getCell(row, '制作・成果物評価割合')),
      otherEvaluationPercent: numberFromCell(getCell(row, 'その他評価割合')),
      onDemandPercent,
      onDemandClasses,
      planClasses,
      onDemandLabel: getText(row, 'オンデマンド区分') || '不明',
      hasPrerequisite: prerequisiteLabel === 'あり',
      prerequisiteLabel,
      prerequisiteReason,
      hasGroupWork: groupWorkLabel === 'あり',
      groupWorkLabel,
      groupWorkReason,
      sourceField,
      field,
      conditions,
      tagReasons: [],
      description: getText(row, '簡単な要約'),
      evaluation: {
        attendance: attendancePercent,
        quiz: 0,
        midtermExam: 0,
        finalExam: examPercent,
        assignment: reportPercent,
        midtermAssignment: 0,
        finalAssignment: 0,
      },
      sourceFile,
      sourceRow: rowNumber,
    }
    course.tagReasons = conditions.map((tag) => ({ tag, reason: tagReason(tag, course) }))
    offerings.push(course)
  }

  for (const [id, count] of idCounts) {
    if (count > 1) generationIssues.push({ type: 'duplicate_offering_id', sourceFile, id, count })
  }
  return {
    offerings,
    worksheetRowCount: worksheet.rowCount,
    worksheetColumnCount: worksheet.columnCount,
  }
}

const deduplicateCurriculum = (courses) => {
  const seen = new Map()
  for (const course of courses) {
    const key = [
      course.studentLevel,
      course.studentTypes.join(','),
      course.admissionYearFrom,
      course.admissionYearTo,
      course.organizationCodes.join(','),
      course.courseScope,
      course.courseCode,
    ].join('|')
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, course)
      continue
    }
    existing.additionalSources ??= []
    existing.additionalSources.push({
      sourceFile: course.sourceFile,
      sourcePage: course.sourcePage,
    })
    generationIssues.push({
      type: 'duplicate_curriculum_record',
      key,
      keptSource: `${existing.sourceFile}:${existing.sourcePage}`,
      duplicateSource: `${course.sourceFile}:${course.sourcePage}`,
    })
  }
  return [...seen.values()]
}

const deduplicateReplacements = (replacements) => {
  const seen = new Map()
  for (const replacement of replacements) {
    const key = [
      replacement.studentLevel,
      replacement.admissionYearFrom,
      replacement.admissionYearTo,
      replacement.organizationCodes.join(','),
      replacement.fromCourseCode,
      replacement.toCourseCode,
    ].join('|')
    if (!seen.has(key)) seen.set(key, replacement)
  }
  return [...seen.values()]
}

const buildCourseRelations = (curriculum) => {
  const nameIndex = new Map()
  for (const course of curriculum) {
    const key = normalizeCompact(course.courseName)
    if (!key) continue
    const codes = nameIndex.get(key) ?? new Set()
    codes.add(course.courseCode)
    nameIndex.set(key, codes)
  }
  const relations = []
  const seen = new Set()
  for (const course of curriculum) {
    if (!course.conditionText) continue
    for (const match of course.conditionText.matchAll(/「([^」]{2,100})」/g)) {
      const referencedName = normalizeText(match[1])
      const candidates = [...(nameIndex.get(normalizeCompact(referencedName)) ?? [])]
      const relationType = /望ましい|推奨/.test(course.conditionText)
        ? 'recommended_prerequisite'
        : /履修|修得|単位/.test(course.conditionText)
          ? 'conditional_prerequisite'
          : 'related'
      if (candidates.length === 0) {
        generationIssues.push({
          type: 'relation_target_unresolved',
          courseCode: course.courseCode,
          referencedName,
          sourceFile: course.sourceFile,
          sourcePage: course.sourcePage,
        })
        continue
      }
      for (const toCourseCode of candidates) {
        if (toCourseCode === course.courseCode) continue
        const key = `${course.courseCode}|${toCourseCode}|${relationType}|${course.sourceFile}|${course.sourcePage}`
        if (seen.has(key)) continue
        seen.add(key)
        relations.push({
          fromCourseCode: toCourseCode,
          toCourseCode: course.courseCode,
          relationType,
          status: 'conditional',
          conditionText: course.conditionText,
          sourceFile: course.sourceFile,
          sourcePage: course.sourcePage,
        })
      }
    }
  }

  relations.push(
    {
      relationType: 'explicit_cross_specialization',
      organizationCodes: ['AJM', 'ALM', 'ADM', 'ASM', 'AMM', 'AKM'],
      conditionText:
        '学生は所属する専修の開設科目を中心に履修しつつも、自由に他専修の開設科目を履修することができる。',
      sourceFile: SOURCE_FILES.graduate2026,
      sourcePage: 28,
    },
    {
      relationType: 'explicit_cross_course',
      organizationCodes: ['JLM', 'JGM'],
      conditionText: '修了要件単位には他コースの開設科目を含むことができる。',
      sourceFile: SOURCE_FILES.graduate2026,
      sourcePage: 101,
    },
  )
  return relations
}

const writeJson = async (filename, data) => {
  await writeFile(
    path.join(generatedDirectory, filename),
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8',
  )
}

const writeRuntimeJson = async (filename, data) => {
  await writeFile(path.join(publicRuntimeDirectory, filename), `${JSON.stringify(data)}\n`, 'utf8')
}

const toRuntimeCurriculumCourse = (course) => ({
  studentLevel: course.studentLevel,
  studentTypes: course.studentTypes,
  admissionYearFrom: course.admissionYearFrom,
  admissionYearTo: course.admissionYearTo,
  faculty: course.faculty,
  graduateSchool: course.graduateSchool,
  department: course.department,
  major: course.major,
  course: course.course,
  specialization: course.specialization,
  organizationCodes: course.organizationCodes,
  organizationResolution: course.organizationResolution,
  courseScope: course.courseScope,
  courseCode: course.courseCode,
  numbering: course.numbering,
  courseName: course.courseName,
  credits: course.credits,
  eligibleYears: course.eligibleYears,
  minYear: course.minYear,
  semester: course.semester,
  conditionText: course.conditionText,
  eligibilityStatus: course.eligibilityStatus,
  hardExcludes: course.hardExcludes,
  excludedOrganizationCodes: course.excludedOrganizationCodes,
  sourceFile: course.sourceFile,
  sourcePage: course.sourcePage,
  sourcePrintedPage: course.sourcePrintedPage,
  changeApplied: course.changeApplied,
})

const toRuntimeOffering = (course) => ({
  id: course.id,
  baseCourseCode: course.baseCourseCode,
  classNumber: course.classNumber,
  years: course.years,
  name: course.name,
  instructor: course.instructor,
  semester: course.semester,
  day: course.day,
  period: course.period,
  credits: course.credits,
  classFormat: course.classFormat,
  attendancePercent: course.attendancePercent,
  reportPercent: course.reportPercent,
  examPercent: course.examPercent,
  onDemandPercent: course.onDemandPercent,
  onDemandClasses: course.onDemandClasses,
  onDemandLabel: course.onDemandLabel,
  hasPrerequisite: course.hasPrerequisite,
  prerequisiteLabel: course.prerequisiteLabel,
  prerequisiteReason: course.prerequisiteReason,
  groupWorkLabel: course.groupWorkLabel,
  groupWorkReason: course.groupWorkReason,
  field: course.field,
  sourceField: course.sourceField,
  conditions: course.conditions,
  tagReasons: course.tagReasons,
  description: course.description,
  evaluation: course.evaluation,
  sourceFile: course.sourceFile,
  sourceRow: course.sourceRow,
  campus: course.campus,
})

const main = async () => {
  await mkdir(generatedDirectory, { recursive: true })
  await mkdir(publicRuntimeDirectory, { recursive: true })
  const expectedFiles = Object.values(SOURCE_FILES)
  const sourceManifest = []
  for (const file of expectedFiles) {
    const filename = path.join(sourceDirectory, file)
    sourceManifest.push({ file, sha256: await sha256(filename) })
  }

  const pdfResults = []
  for (const source of [...undergraduateSources, ...graduateSources]) {
    pdfResults.push({ source, result: await extractPdfCurriculum(source) })
  }
  const changeResult = await extractChangeApplications()
  const curriculumBeforeChanges = [
    ...pdfResults.flatMap(({ result }) => result.courses),
    ...changeResult.additions,
  ]
  for (const application of changeResult.applications) {
    if (application.changeType !== 'curriculum_field_override') continue
    for (const course of curriculumBeforeChanges) {
      if (
        course.studentLevel !== application.studentLevel ||
        course.courseCode !== application.courseCode ||
        course.admissionYearFrom !== application.admissionYearFrom ||
        course.admissionYearTo !== application.admissionYearTo
      )
        continue
      Object.assign(course, application.after)
      course.changeApplied = true
      course.changeSourceFile = application.sourceFile
      course.changeSourcePage = application.sourcePage
    }
  }
  const curriculum = deduplicateCurriculum(curriculumBeforeChanges)
  const replacements = deduplicateReplacements(
    pdfResults.flatMap(({ result }) => result.replacements),
  )
  const relations = buildCourseRelations(curriculum)
  const offeringsResult = await extractOfferings()

  generationIssues.push({
    type: 'official_open_course_list_missing',
    sourceFile: SOURCE_FILES.undergraduate2026,
    sourcePage: 54,
    explanation:
      '履修要覧は他学部・他学科開放科目一覧をCampusSquareへ別途掲載すると記載しており、正式9ファイル内に科目番号一覧がない。推測で開放科目を作成しない。',
  })
  generationIssues.push({
    type: 'student_organization_hierarchy_unresolved',
    organizationCode: 'CLD',
    explanation:
      '指定された「図書館情報学領域」の正式な研究科階層を、正式な大学院履修要覧3冊の本文から一意に確認できない。',
  })

  await writeJson('student_org_master.json', STUDENT_ORGANIZATIONS)
  await writeJson('curriculum_master.json', curriculum)
  await writeJson('course_replacement_master.json', replacements)
  await writeJson('course_relation_master.json', relations)
  await writeJson('change_application_master.json', changeResult.applications)
  await writeJson('open_courses_master.json', [])
  await writeJson('course_offerings_2026.json', offeringsResult.offerings)
  await writeJson('generation_issues.json', generationIssues)
  await writeJson('generation_metadata.json', {
    referenceAcademicYear: REFERENCE_ACADEMIC_YEAR,
    sourceDirectory: SOURCE_DIRECTORY,
    sourceManifest,
    pdfPageCounts: Object.fromEntries(
      pdfResults.map(({ source, result }) => [source.file, result.pageCount]),
    ),
    counts: {
      studentOrganizations: STUDENT_ORGANIZATIONS.length,
      curriculumRecords: curriculum.length,
      replacementRecords: replacements.length,
      relationRecords: relations.length,
      changeApplicationRecords: changeResult.applications.length,
      openCourseRecords: 0,
      offeringClasses: offeringsResult.offerings.length,
      offeringWorksheetRowsIncludingHeader: offeringsResult.worksheetRowCount,
      offeringWorksheetColumns: offeringsResult.worksheetColumnCount,
      generationIssues: generationIssues.length,
    },
  })
  await writeRuntimeJson('curriculum_master.json', curriculum.map(toRuntimeCurriculumCourse))
  await writeRuntimeJson(
    'course_offerings_2026.json',
    offeringsResult.offerings.map(toRuntimeOffering),
  )
  await writeRuntimeJson('course_replacement_master.json', replacements)
  await writeRuntimeJson('course_relation_master.json', relations)
  await writeRuntimeJson('open_courses_master.json', [])

  console.log(
    JSON.stringify(
      {
        curriculumRecords: curriculum.length,
        replacementRecords: replacements.length,
        relationRecords: relations.length,
        offeringClasses: offeringsResult.offerings.length,
        studentOrganizations: STUDENT_ORGANIZATIONS.length,
        generationIssues: generationIssues.length,
      },
      null,
      2,
    ),
  )
}

await main()
