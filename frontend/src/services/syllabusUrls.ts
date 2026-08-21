type SyllabusUrlMap = Record<string, string>

let syllabusUrlMapPromise: Promise<SyllabusUrlMap> | null = null

const isOfficialSyllabusUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'cssy.aasa.ac.jp'
  } catch {
    return false
  }
}

const loadSyllabusUrlMap = () => {
  if (syllabusUrlMapPromise) return syllabusUrlMapPromise

  syllabusUrlMapPromise = import('../../data/generated/course_syllabus_urls_2026.json').then(
    (module) => module.default as SyllabusUrlMap,
  )

  return syllabusUrlMapPromise
}

export const getSyllabusUrl = async (courseId: string): Promise<string | null> => {
  const result = await getSyllabusUrlResult(courseId)
  return result.status === 'success' ? result.url : null
}

export type SyllabusUrlResult =
  | { status: 'success'; url: string }
  | { status: 'not_found'; url: null }
  | { status: 'error'; url: null }

export const getSyllabusUrlResult = async (
  courseId: string,
  embeddedUrl?: string,
): Promise<SyllabusUrlResult> => {
  if (isOfficialSyllabusUrl(embeddedUrl)) {
    return { status: 'success', url: embeddedUrl }
  }

  try {
    const normalizedCourseId = courseId.normalize('NFKC').trim()
    const syllabusUrl = (await loadSyllabusUrlMap())[normalizedCourseId]
    return isOfficialSyllabusUrl(syllabusUrl)
      ? { status: 'success', url: syllabusUrl }
      : { status: 'not_found', url: null }
  } catch (error) {
    syllabusUrlMapPromise = null
    console.warn('シラバスURLの読み込みに失敗しました。', error)
    return { status: 'error', url: null }
  }
}
