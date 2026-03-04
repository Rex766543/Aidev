# /meeting — 会議後ワンストップ処理

会議後の議事録作成からメール下書きまでを一括処理するコマンドです。

## 実行手順

### Step 1: 会議フォルダ作成
ユーザーに会議名を確認し、`project-alpha/meetings/` に以下のフォルダを作成してください:

```
project-alpha/meetings/YYYY-MM-DD_{会議名}/
├── input/
│   ├── transcript.txt
│   ├── todo.md
│   └── materials/
└── output/
```

日付は本日の日付を使用してください。

### Step 2: インプット素材の確認
ユーザーに以下を確認してください:
- トランスクリプト（`input/transcript.txt` に配置）
- 簡易Todoメモ（`input/todo.md` に配置、任意）
- 会議資料（`input/materials/` に配置、任意）

AskUserQuestion ツールで「インプット素材を input/ フォルダに配置してください。準備ができたら教えてください。」と確認する。

### Step 3: 議事録生成
`.claude/skills/meeting-minutes/SKILL.md` のスキルに従って:
1. `input/` フォルダの素材を読み込む
2. 内容を分析・構造化
3. 不明点があればユーザーに確認（参加者名、日時など）
4. python-docx で `output/minutes.docx` を生成

### Step 4: メール下書き生成
`.claude/skills/meeting-email/SKILL.md` のスキルに従って:
1. 議事録の内容からメール本文を生成
2. `output/email_draft.txt` に保存
3. ユーザーに宛先を確認

### Step 5: レビュー
Agent ツールで reviewer エージェント（`.claude/agents/reviewer.md`）を起動し、議事録とメールをレビュー:
- レビュー結果をユーザーに提示
- 修正が必要な場合は修正版を再生成
- ユーザーの承認を得て最終版を確定

### Step 6: 最終確認
- 生成ファイルの一覧を表示
- Outlookドラフト作成を希望するか確認
- 希望する場合は AppleScript でドラフトを作成（議事録を添付）

## 出力ファイル
- `output/minutes.docx` — 議事録Word文書
- `output/email_draft.txt` — メール下書き

$ARGUMENTS
