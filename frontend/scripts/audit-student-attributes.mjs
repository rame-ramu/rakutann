import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { SOURCE_DIRECTORY, SOURCE_FILES } from './curriculum-config.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const sourceDirectory = path.join(projectRoot, SOURCE_DIRECTORY)
const outputFile = path.join(
  projectRoot,
  'data',
  'generated',
  'student_attribute_source_audit.json',
)

const pdfFiles = [
  SOURCE_FILES.undergraduate2026,
  SOURCE_FILES.undergraduate2025,
  SOURCE_FILES.undergraduateChanges2025,
  SOURCE_FILES.undergraduateBefore2025,
  SOURCE_FILES.graduate2026,
  SOURCE_FILES.graduate2025,
  SOURCE_FILES.graduateChanges2025,
  SOURCE_FILES.graduateBefore2025,
]

const keywords = [
  '教職課程',
  '教職課程登録',
  '他学科免履修',
  '免履修',
  '学芸員課程',
  '未登録者',
  '司書課程',
  '第一言語',
  '母語',
  '学校教育コース',
  '英語教育コース',
  '特別支援教育コース',
  'ランゲージ専攻',
  '英語コース',
  '中国語コース',
  '韓国・朝鮮語コース',
  '英語専修',
  '中国語専修',
  '韓国・朝鮮語専修',
  '専修登録',
  '他専修',
  '他の専修',
  'コース登録',
  '他コース',
  '他のコース',
  'Language and Communication',
  'Global Japan Studies',
  'Language',
  'Global',
  'GLOCOM',
  '取得できる教員免許状',
  '取得できる教育職員免許状',
  '教員免許状の種類',
  '取得できる免許状',
  '教員免許',
  '日本語教師資格課程',
  'コンピュータ資格',
  '会計教育',
  '副専攻',
  '星が丘キャンパスモデル',
]

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

const snippetsForKeyword = (pageText, keyword) => {
  const snippets = []
  let fromIndex = 0
  while (fromIndex < pageText.length) {
    const matchIndex = pageText.indexOf(keyword, fromIndex)
    if (matchIndex < 0) break
    snippets.push(
      pageText.slice(Math.max(0, matchIndex - 220), Math.min(pageText.length, matchIndex + 320)),
    )
    fromIndex = matchIndex + keyword.length
  }
  return [...new Set(snippets)]
}

const audit = []
for (const sourceFile of pdfFiles) {
  const document = await getDocument({
    data: new Uint8Array(await readFile(path.join(sourceDirectory, sourceFile))),
    verbosity: 0,
  }).promise
  for (let sourcePage = 1; sourcePage <= document.numPages; sourcePage += 1) {
    const page = await document.getPage(sourcePage)
    const content = await page.getTextContent()
    const pageText = normalizeText(content.items.map((item) => item.str).join(' '))
    for (const keyword of keywords) {
      const snippets = snippetsForKeyword(pageText, keyword)
      if (snippets.length === 0) continue
      audit.push({ sourceFile, sourcePage, keyword, snippets })
    }
  }
}

await mkdir(path.dirname(outputFile), { recursive: true })
await writeFile(outputFile, `${JSON.stringify(audit, null, 2)}\n`, 'utf8')
console.log(
  JSON.stringify(
    {
      outputFile: path.relative(projectRoot, outputFile),
      sourceFiles: pdfFiles.length,
      matchingEntries: audit.length,
      matchingPages: new Set(audit.map((entry) => `${entry.sourceFile}:${entry.sourcePage}`)).size,
    },
    null,
    2,
  ),
)
