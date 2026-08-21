# PHASE 5: 最終検証

検証日: 2026-08-21

| 検証 | 結果 |
| --- | --- |
| `npm run generate:data` | 成功（正式9ファイル、想定外入力0） |
| `npm run validate:data` | 成功（制約事項は記録、重大エラー0） |
| `npm test` | 学籍番号・追加属性・履修判定・画面ロジック40件＋Firestoreルール6件、計46テスト成功 |
| `npm run lint` | 49ファイル、警告0、エラー0 |
| `npm run build` | 型検査・Vite本番build・PWA生成成功 |
| `npm audit --omit=dev` | 本番依存の脆弱性0件 |

シラバスURLは `授業一覧.csv` 6,298行と実授業6,298クラスを時間割コードで完全一致させた。URL未対応、余剰CSV行、重複、URL形式不正、科目名不一致はいずれも0件。本番成果物にも静的URL対応表6,298件が含まれることを確認した。

大容量マスターを初期JavaScriptから静的JSONへ分離した。初期JavaScriptは
約15.5 MBから約1.06 MB、PWA事前キャッシュは約23.9 MiBから約1.14 MiBへ削減した。
静的JSONは結果画面でのみ読み込み、Network FirstのPWAキャッシュでオフライン再利用する。

開発依存を含む監査ではmoderate 7件（生成用`exceljs`およびテスト用
`firebase-tools`の推移依存）が報告されるが、本番依存だけの監査は0件である。
自動修正候補は主要ツールのダウングレードを伴うため適用していない。
