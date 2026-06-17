export interface Comment {
  id: number;
  author: string;
  content: string;
}

export interface Course {
  id: number;
  name: string;
  instructor: string;
  description: string;
  faculty: string;
  day: string;
  period: number;
  tags: string[];
  comments: Comment[];
}

export const courses: Course[] = [
  {
    id: 1,
    name: "心理学概論",
    instructor: "佐藤 教授",
    description: "人間の心の仕組みについて学びます。出席不要で楽に単位が取れます。",
    faculty: "文学部",
    day: "月",
    period: 2,
    tags: ["出席なし", "テストなし"],
    comments: [
      { id: 101, author: "2年生", content: "授業に出なくてもプリントを読めば大丈夫です。" },
      { id: 102, author: "3年生", content: "レポート1回だけで単位が来ました。" }
    ]
  },
  {
    id: 2,
    name: "経済学入門",
    instructor: "鈴木 准教授",
    description: "現代経済の基礎を学びます。オンライン併用で楽です。",
    faculty: "経済学部",
    day: "火",
    period: 3,
    tags: ["レポートのみ", "オンライン"],
    comments: [
      { id: 201, author: "2年生", content: "動画を自分のペースで見られるので楽です。" }
    ]
  },
  {
    id: 3,
    name: "情報リテラシー",
    instructor: "田中 講師",
    description: "PCの基本操作を学びます。実習中心ですが難易度は低いです。",
    faculty: "理学部",
    day: "水",
    period: 1,
    tags: ["テストなし", "出席重視"],
    comments: [
      { id: 301, author: "1年生", content: "毎回出席していれば確実にAが取れます。" }
    ]
  },
  {
    id: 4,
    name: "日本文学史",
    instructor: "高橋 教授",
    description: "日本の古典から現代文学までを概観します。",
    faculty: "文学部",
    day: "月",
    period: 2,
    tags: ["レポートのみ"],
    comments: [
      { id: 401, author: "4年生", content: "本を読むのが好きなら苦になりません。" }
    ]
  }
];
