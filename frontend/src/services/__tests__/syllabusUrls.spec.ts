import { describe, expect, it } from 'vitest'
import { getSyllabusUrlResult } from '../syllabusUrls'

describe('syllabus URL display data', () => {
  it('授業データに埋め込まれた公式URLを表示用に返す', async () => {
    const url = 'https://cssy.aasa.ac.jp/syllabusHtml/2026/00/00_023001-01_ja_JP.html'
    await expect(getSyllabusUrlResult('2026_023001-01', url)).resolves.toEqual({
      status: 'success',
      url,
    })
  })

  it('旧保存データでも時間割コードから公式URL表を参照できる', async () => {
    await expect(getSyllabusUrlResult('2026_023001-01')).resolves.toEqual({
      status: 'success',
      url: 'https://cssy.aasa.ac.jp/syllabusHtml/2026/00/00_023001-01_ja_JP.html',
    })
  })

  it('現行URL表にないクラスだけを情報なしとして返す', async () => {
    await expect(getSyllabusUrlResult('2026_211031-18')).resolves.toEqual({
      status: 'not_found',
      url: null,
    })
  })
})
