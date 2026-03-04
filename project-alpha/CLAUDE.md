# project-alpha — ビジネスタスク自動化

## 概要

会議後処理（議事録・メール）やパワポ資料作成を自動化するプロジェクト。
Claude Codeのスラッシュコマンドから各タスクを実行する。

## 使い方

### 会議後処理
1. `/meeting` を実行
2. 会議名を入力
3. `input/` フォルダにトランスクリプト・資料を配置
4. 議事録(Word)とメール下書きが `output/` に自動生成
5. レビューエージェントが内容を確認・修正

### パワポ資料作成
- `/pptx-proposal` — 提案資料
- `/pptx-report` — 定例報告資料
- `/pptx-adhoc` — アドホック課題資料

## ディレクトリ構造

```
project-alpha/
├── meetings/          ← 会議別フォルダ（自動生成: YYYY-MM-DD_会議名/）
│   └── {date}_{name}/
│       ├── input/     ← トランスクリプト・資料
│       └── output/    ← 議事録・メール下書き
├── presentations/     ← パワポ資料
│   ├── proposals/
│   ├── reports/
│   └── adhoc/
├── templates/         ← 参考パワポ・テンプレート配置場所
└── logs/              ← ナレッジ蓄積
```

## Python依存

- `python-docx`: Word文書生成
- `python-pptx`: PowerPoint生成

## フォーマット規約

- フォント: Meiryo（メイリオ）
- 詳細は `.claude/skills/pptx-generator/references/format-rules.md` を参照

## ナレッジ

`logs/project-knowledge.md` にプロジェクト固有の知識を蓄積する。
過去の会議パターン、よく使うフレーズ、宛先リストなどを記録。
