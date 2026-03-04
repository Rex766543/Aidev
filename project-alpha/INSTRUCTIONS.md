# project-alpha スキル実行ガイド

Claude Code のチャット欄にコマンドを入力するだけで各スキルが実行できます。
（ターミナルコマンドではなく、**チャットメッセージとして入力**してください）

作業ディレクトリ: `~/Desktop/aidev`

---

## スキル一覧

| コマンド | 用途 |
|---|---|
| `/meeting` | 会議後ワンストップ処理（議事録・メール自動生成） |
| `/pptx-proposal` | 提案資料パワポ作成 |
| `/pptx-report` | 定例報告資料パワポ作成 |
| `/pptx-adhoc` | アドホック課題資料パワポ作成 |

---

## /meeting — 会議後ワンストップ処理

### 手順

1. チャットに `/meeting` と入力して実行
2. 会議名を入力（例: `営業定例_2026-03-04`）
3. トランスクリプト・資料を以下に配置:
   ```
   project-alpha/meetings/{YYYY-MM-DD}_{会議名}/input/
   ```
4. 自動で以下が `output/` に生成される:
   - 議事録（Word形式 `.docx`）
   - メール下書き
5. レビューエージェントが内容を確認・修正

### 出力先
```
project-alpha/meetings/{date}_{name}/output/
```

---

## /pptx-proposal — 提案資料作成

### 手順

1. チャットに `/pptx-proposal` と入力
2. Claude が対話形式で以下を確認:
   - 提案の概要・目的
   - 対象顧客・ターゲット
   - 訴求ポイント
3. パワポファイル（`.pptx`）が自動生成される

### 出力先
```
project-alpha/presentations/proposals/
```

---

## /pptx-report — 定例報告資料作成

### 手順

1. チャットに `/pptx-report` と入力
2. Claude が対話形式で以下を確認:
   - 報告期間
   - KPI・数値データ
   - 課題・Next Steps
3. パワポファイルが自動生成される

### 出力先
```
project-alpha/presentations/reports/
```

---

## /pptx-adhoc — アドホック課題資料作成

### 手順

1. チャットに `/pptx-adhoc` と入力
2. Claude が対話形式で課題・背景・対応策を確認
3. パワポファイルが自動生成される

### 出力先
```
project-alpha/presentations/adhoc/
```

---

## ディレクトリ構造

```
project-alpha/
├── meetings/
│   └── {YYYY-MM-DD}_{会議名}/
│       ├── input/     ← トランスクリプト・資料を置く
│       └── output/    ← 議事録・メール下書きが生成される
├── presentations/
│   ├── proposals/     ← 提案資料
│   ├── reports/       ← 定例報告資料
│   └── adhoc/         ← アドホック資料
├── templates/         ← 参考パワポ・テンプレート置き場
├── logs/              ← ナレッジ蓄積
└── INSTRUCTIONS.md    ← このファイル
```

---

## フォーマット規約

- フォント: Meiryo（メイリオ）
- 詳細: `.claude/skills/pptx-generator/references/format-rules.md` を参照

## Python依存ライブラリ

```bash
pip install python-docx python-pptx
```
