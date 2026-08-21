# PHASE 0 既存リポジトリ調査

調査日: 2026-08-21

## 正式入力

正式な入力は `2026 初期データー　ベータ版/` 直下の9ファイルに限定する。依頼文の添付名に付いていた重複番号は、ワークスペース上の実ファイル名では外れている。

| 依頼記載名 | 実ファイル名 | 用途 |
| --- | --- | --- |
| `summary_2026(3).pdf` | `summary_2026.pdf` | 学部・2026年度入学者用 |
| `summary_2025(2).pdf` | `summary_2025.pdf` | 学部・2025年度入学者用 |
| `summary_change_2025_0325(1).pdf` | `summary_change_2025_0325.pdf` | 学部・2025年度変更表 |
| `summary_2024(2).pdf` | `summary_2024.pdf` | 学部・2024年度以前入学者用 |
| `summary_graduate_2026(2).pdf` | `summary_graduate_2026.pdf` | 大学院・2026年度入学者用 |
| `summary_graduate_2025(2).pdf` | `summary_graduate_2025.pdf` | 大学院・2025年度入学者用 |
| `summary_graduate_change_2025(1).pdf` | `summary_graduate_change_2025.pdf` | 大学院・2025年度変更表 |
| `summary_graduate_2024(2).pdf` | `summary_graduate_2024.pdf` | 大学院・2024年度以前入学者用 |
| `syllabus_analysis_2026(2).xlsx` | `syllabus_analysis_2026.xlsx` | 2026年度実授業 |

旧CSV、旧JSON、旧Excel、既存の `src/data/courses.ts` は正式な履修判定元にしない。

## 1. 現在の授業データ保存場所

- `src/data/courses.ts` に378クラスをTypeScript配列として直接格納。
- 生成元コメントは `data0_filled_appended_with_year.xlsx`。今回の正式入力ではない。
- `data0_filled*.xlsx` がプロジェクト直下に残っているが、今後の生成・判定から除外する。

## 2. 現在の授業データ型

- `src/store/index.ts` の `Course`。
- クラスID、対象学年、科目名、教員、学期、曜日時限、単位、授業形態、評価割合、オンデマンド、前提履修、系統、タグ、説明、評価内訳を保持。
- `faculty?` は型にあるが、現行378件では設定されていない。
- 正式Excel「授業分析」は6,298データ行、68列。既存UIに必要な評価・授業形態・教員・曜日時限情報を含む。

## 3–6. 学籍番号入力・学部・学科・専攻判定

- `StudentIdView.vue` から `store.setStudentId()` を呼ぶ。
- 現行は8文字以上なら先頭2文字と5–7文字目を読むだけで、形式検証を行わない。
- 小文字の所属コードだけは大文字化するが、空白正規化はない。
- 学部・学科・専攻は1つの表示文字列へ平坦化されており、大学院、U/M/D、未知コード、対象学年矛盾警告は未対応。
- NKU/NDUだけ `isHumanInfoStudent=true`。ルーターと条件画面が他所属を拒否する。
- 学年は実行日の学年度から算出し、UI上で手動変更できる。手動学年を優先できる既存構造は再利用する。

## 7. 推薦アルゴリズム

- `CourseListView.vue` 内で、希望タグ一致1件につき10点、曜日時限一致に3点。
- 学年、学期、選択曜日時限、時間割競合、避けたい先生でフィルタ後、スコア順に並べる。
- 評価割合、試験、レポート、態度、オンデマンド、前提履修、授業系統の既存タグと表示を再利用する。

## 8. 授業検索・絞り込み

- 授業名検索は選択学期・曜日時限を先に適用し、正規化、部分一致、部分列、編集距離でスコア化。
- 現行の通常一覧と授業名検索はいずれも全 `mockCourses` が起点で、所属カリキュラムによる絞り込みはない。
- PHASE 4では同じ検索・推薦処理の手前へ履修候補集合を挿入する。

## 9. 時間割生成

- `ScheduleView.vue` とstoreの `candidateCourses` / `selectedSchedule` が担当。
- 同一曜日時限の重複を防ぎ、曜日時限不明または「他」の授業は時間割候補に追加しない。
- 教室、個人メモ、当日授業、次授業、友達機能を維持する。

## 10. 授業詳細画面

- `CourseListView.vue` のモーダルでシラバス情報、評価割合、タグ根拠、内容を表示。
- `ScheduleView.vue` のモーダルで教室・メモ・共有メモを表示。
- 履修理由・判定理由のUIは追加しない。内部デバッグ情報だけ別モジュールで保持する。

## 11. Vercel build構成

- Vue 3 + Vite 8。`npm run build` は `vue-tsc --build` と `vite build` を並列実行。
- `vercel.json` は全パスを `/index.html` へrewriteするSPA構成。
- Vite PWAを使用し、通常はbase `/`、GitHub Actionsでは `/rakutann/`。
- 生成済みJSONはVite bundleから読み込み、Vercel実行時にPDF/XLSXを解析しない。

## 12. 既存テストとベースライン

- 既存テストは `tests/firestore.rules.test.mjs` だけ。
- 調査時点では `npm test` スクリプトがない。
- `npm run build`: 成功。
- `npx oxlint .`: 0 warnings / 0 errors。
- `npx eslint .`: 成功。

## PHASE 1以降の境界

再利用するもの:

- Excelに既に存在する評価・試験・レポート・態度・オンデマンド・グループワーク・教員・曜日時限・授業詳細情報。
- 既存推薦スコア、名前検索、時間割、詳細モーダル、保存、認証・友達機能。

置換・追加するもの:

- 旧378件配列を、正式Excelから生成した全2026クラスへ置換。
- 学籍番号解析を独立モジュール化し、所属を階層化。
- PDFから生成する履修マスター、変更表、読替、科目関係、公式開放、出典・不明事項。
- 履修候補判定を推薦処理の前段へ追加。

## PHASE 0判定

完了。正式9入力はすべて読取可能。PDFはテキスト抽出可能で、Excelは6,298データ行を確認した。次PHASEへ進行可能。
