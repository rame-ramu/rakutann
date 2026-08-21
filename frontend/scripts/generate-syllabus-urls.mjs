import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOURCE_DIRECTORY, SUPPLEMENTAL_SOURCE_FILES } from './curriculum-config.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const generatedDirectory = path.join(projectRoot, 'data', 'generated')
const publicDataDirectory = path.join(projectRoot, 'public', 'data')
const runtimeOfferingsFile = path.join(
  publicDataDirectory,
  'runtime',
  'course_offerings_2026.json',
)
const sourceFile = SUPPLEMENTAL_SOURCE_FILES.syllabusUrls2026

const parseCsv = (text) => {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
      continue
    }
    if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }
  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }
  return rows
}

const normalizeText = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .replace(/^\uFEFF/, '')
    .replace(/\s+/g, ' ')
    .trim()

const csvBuffer = await readFile(path.join(projectRoot, SOURCE_DIRECTORY, sourceFile))
const csvText = csvBuffer.toString('utf8')
const rows = parseCsv(csvText)
const headers = rows[0]?.map(normalizeText) ?? []
const headerIndex = new Map(headers.map((header, index) => [header, index]))
const requiredHeaders = ['時間割コード', '科目名', '担当教員', 'シラバスURL']
const missingHeaders = requiredHeaders.filter((header) => !headerIndex.has(header))
if (missingHeaders.length > 0) {
  throw new Error(`授業一覧CSVの必須列が不足しています: ${missingHeaders.join(', ')}`)
}

const offerings = JSON.parse(
  await readFile(path.join(generatedDirectory, 'course_offerings_2026.json'), 'utf8'),
)
const offeringById = new Map(offerings.map((offering) => [offering.id, offering]))
const urlByCourseId = {}
const duplicateCourseIds = []
const invalidUrls = []
const csvRowsWithoutOffering = []
const nameMismatches = []

for (let index = 1; index < rows.length; index += 1) {
  const row = rows[index]
  if (row.every((value) => !normalizeText(value))) continue
  const sourceRow = index + 1
  const value = (header) => normalizeText(row[headerIndex.get(header)])
  const timetableCode = value('時間割コード')
  const courseId = `2026_${timetableCode}`
  const syllabusUrl = value('シラバスURL')
  const offering = offeringById.get(courseId)

  if (Object.hasOwn(urlByCourseId, courseId)) duplicateCourseIds.push({ courseId, sourceRow })
  if (!offering) {
    csvRowsWithoutOffering.push({ courseId, timetableCode, sourceRow })
    continue
  }

  let validUrl = false
  try {
    const parsedUrl = new URL(syllabusUrl)
    validUrl = parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'cssy.aasa.ac.jp'
  } catch {
    validUrl = false
  }
  if (!validUrl) {
    invalidUrls.push({ courseId, syllabusUrl, sourceRow })
    continue
  }

  const csvCourseName = value('科目名')
  if (normalizeText(offering.name) !== csvCourseName) {
    nameMismatches.push({
      courseId,
      offeringName: offering.name,
      csvCourseName,
      sourceRow,
    })
  }
  urlByCourseId[courseId] = syllabusUrl
}

const offeringsWithoutUrl = offerings
  .filter((offering) => !Object.hasOwn(urlByCourseId, offering.id))
  .map((offering) => ({ courseId: offering.id, courseName: offering.name }))

const summary = {
  sourceFile,
  sourceSha256: createHash('sha256').update(csvBuffer).digest('hex'),
  csvDataRows: rows.slice(1).filter((row) => row.some((value) => normalizeText(value))).length,
  offeringClasses: offerings.length,
  matchedUrls: Object.keys(urlByCourseId).length,
  offeringsWithoutUrl: offeringsWithoutUrl.length,
  csvRowsWithoutOffering: csvRowsWithoutOffering.length,
  duplicateCourseIds: duplicateCourseIds.length,
  invalidUrls: invalidUrls.length,
  nameMismatches: nameMismatches.length,
}

await mkdir(publicDataDirectory, { recursive: true })
const runtimeOfferings = JSON.parse(await readFile(runtimeOfferingsFile, 'utf8'))
const runtimeOfferingsWithUrls = runtimeOfferings.map((offering) => ({
  ...offering,
  syllabusUrl: urlByCourseId[offering.id],
}))
await writeFile(
  runtimeOfferingsFile,
  `${JSON.stringify(runtimeOfferingsWithUrls)}\n`,
  'utf8',
)
await writeFile(
  path.join(generatedDirectory, 'course_syllabus_urls_2026.json'),
  `${JSON.stringify(urlByCourseId, null, 2)}\n`,
  'utf8',
)
await writeFile(
  path.join(publicDataDirectory, 'course_syllabus_urls_2026.json'),
  `${JSON.stringify(urlByCourseId)}\n`,
  'utf8',
)
await writeFile(
  path.join(generatedDirectory, 'syllabus_url_generation_report.json'),
  `${JSON.stringify(
    {
      ...summary,
      issues: {
        offeringsWithoutUrl,
        csvRowsWithoutOffering,
        duplicateCourseIds,
        invalidUrls,
        nameMismatches,
      },
    },
    null,
    2,
  )}\n`,
  'utf8',
)

console.log(JSON.stringify(summary, null, 2))
if (
  offeringsWithoutUrl.length > 0 ||
  csvRowsWithoutOffering.length > 0 ||
  duplicateCourseIds.length > 0 ||
  invalidUrls.length > 0
) {
  process.exitCode = 1
}
