import type { Course } from '../types/course'

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'プログラミング基礎',
    professor: '田中 太郎',
    credits: 2,
    category: '情報科学',
    description: 'JavaScriptを使ってプログラミングの基礎を学びます。初心者歓迎です。',
    comments: [
      {
        id: 'c1',
        content: '課題は少し大変ですが、とても身につきます。',
        rating: 5,
        createdAt: '2024-04-10',
      },
      {
        id: 'c2',
        content: '先生が優しく、質問しやすい雰囲気です。',
        rating: 4,
        createdAt: '2024-05-15',
      },
    ],
  },
  {
    id: '2',
    title: '心理学概論',
    professor: '佐藤 花子',
    credits: 2,
    category: '人文科学',
    description: '人間の心の仕組みについて、基本的な理論を学びます。',
    comments: [
      {
        id: 'c3',
        content: 'テストが記述式なので、しっかり勉強が必要です。',
        rating: 3,
        createdAt: '2024-06-01',
      },
    ],
  },
  {
    id: '3',
    title: 'アカデミック英語',
    professor: 'Smith John',
    credits: 1,
    category: '語学',
    description: '大学での学習に必要な、英語のリーディングとライティングを強化します。',
    comments: [],
  },
]
