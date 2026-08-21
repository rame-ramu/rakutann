# 追加属性の根拠・判定記録

検証日: 2026-08-21

## 生成と利用

`scripts/audit-student-attributes.mjs` が正式な学部・大学院PDF 8冊を検索し、
`data/generated/student_attribute_source_audit.json` に根拠候補を残す。
`scripts/generate-student-attribute-data.mjs` は、確認済みの記載だけから次を生成する。

- `student_attribute_master.json`: 画面表示条件を含む追加属性8件
- `course_attribute_rule_master.json`: 科目と属性の対応602件
- `student_attribute_generation_issues.json`: 推測せず保留した抽出問題1件

Web実行時はPDFを読まず、生成済みJSONを使う。

## 採用した固定属性

| 属性 | 型 | 表示対象・用途 |
| --- | --- | --- |
| `teacherTrainingRegistered` | ON/OFF | 学部生。教職課程登録者限定ルール212件に使用 |
| `otherDepartmentTeachingLicenseApproved` | ON/OFF | 2025・2026年度入学のFCUで、教職課程登録時のみ表示。103件 |
| `curatorProgramRegistered` | ON/OFF | 学部生。学芸員課程未登録者の登録不可ルール27件に使用 |
| `librarianProgramRegistered` | ON/OFF | 学部生。司書課程未登録者の登録不可ルール52件に使用 |
| `firstLanguage` | 単一選択 | 学部生。第一言語による明示的な履修不可・対象限定46件にだけ使用 |
| `educationCourse` | 単一選択 | KEU・2025/2026入学・2年次以降。分類24件 |
| `languageSpecialization` | 単一選択 | GLU・2026入学・2年次以降。分類16件 |
| `glocomCourse` | 単一選択 | EXU・2022～2026入学・2年次以降。分類122件 |

教職・学芸員・司書は未選択を `false` とする。第一言語と、対象学生に表示される
コース・専修は必須選択とし、未選択のまま履修条件画面へ進ませない。

## 判定境界

- hard requirement 440件は、属性が明示条件を満たさない科目掲載だけを除外する。
- classification only 162件は内部分類・デバッグ理由に使うが、他コース科目を除外しない。
- 教育学部は他コース科目を自由に履修できるとの記載がある。
- GLOCOMとGLU専修は、今回の資料だけでは「他コース・他専修の科目は履修不可」と
  確定できないため、選択値だけを根拠にhard excludeしない。
- 第一言語が不明なエンジン呼び出しは科目を削除せず `conditional` とする。

## 採用しなかった属性

日本語教師資格課程、コンピュータ資格、会計教育、副専攻、星が丘キャンパスモデルは、
9ファイル内だけで固定属性から履修可能科目群まで完結して確定できないため追加していない。
TOEIC、GPA、取得単位、履修済み科目、前提科目、JLPT、選考・抽選等も対象外である。

## 記録した不明点

`summary_2024.pdf` の `106006 初めての外国語6（ポルトガル語）` は、PDF抽出時に
隣接する中国語行の条件が同じレコードへ混入した。科目名と一致するポルトガル語条件だけを
適用し、中国語条件は推測で適用せず問題記録へ残した。
