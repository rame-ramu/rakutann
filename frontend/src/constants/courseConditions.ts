export interface ConditionGroup {
  title: string
  tags: string[]
}

export const CONDITION_GROUPS: ConditionGroup[] = [
  {
    title: '成績評価',
    tags: [
      'レポート・課題重視',
      'レポート・課題あり',
      '試験あり',
      '試験重視',
      '試験なし',
      '態度点なし',
      '態度点低め',
      '態度点高め',
    ],
  },
  {
    title: '授業形態',
    tags: [
      'オンデマンド多め',
      'オンデマンド少なめ',
      'オンデマンドなし',
      '全てオンデマンド',
      '前提履修なし',
      '前提履修あり',
      'グループワークなし',
      'グループワークあり',
    ],
  },
  {
    title: '受けたい系統',
    tags: [
      '情報・数理',
      'プログラミング・システム',
      'AI・データ',
      '心理・認知',
      '社会・ビジネス',
      '語学・コミュニケーション',
      'メディア・デザイン',
      '健康・スポーツ',
      'キャリア・教養',
      'その他',
    ],
  },
]

export const SELECTABLE_CONDITIONS = CONDITION_GROUPS.flatMap((group) => group.tags)

const EXCLUSIVE_CONDITION_GROUPS = [
  ['レポート・課題重視', 'レポート・課題あり'],
  ['試験あり', '試験重視', '試験なし'],
  ['態度点なし', '態度点低め', '態度点高め'],
  ['オンデマンド多め', 'オンデマンド少なめ', 'オンデマンドなし', '全てオンデマンド'],
  ['前提履修なし', '前提履修あり'],
  ['グループワークなし', 'グループワークあり'],
]

export const getExclusiveConditionSiblings = (condition: string) =>
  EXCLUSIVE_CONDITION_GROUPS.find((group) => group.includes(condition))?.filter(
    (candidate) => candidate !== condition,
  ) ?? []
