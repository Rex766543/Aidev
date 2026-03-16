# /novel — SAO小説創作

SAO小説創作スキル（novel-writer）を起動し、フェーズ1から順に実行します。

## 実行手順

### Step 0: スキル読み込みとプロジェクト初期化

1. `.claude/skills/novel-writer/SKILL.md` を読み込む
2. ユーザーに作品タイトル（仮題可）を確認する
3. `sao-novel/novels/{タイトル}/` 配下にディレクトリを作成する

### Step 1: フェーズ1 — 企画・構想＋プロット設計

1. `.claude/skills/novel-writer/phases/01-concept.md` を読み込む
2. 指示に従い、世界観・設定資料を全て読み込んだ上で、核→プロット→キャラ→章構成の順に設計する
3. サブエージェント（`.claude/skills/novel-writer/agents/concept-reviewer.md`）でレビュー
4. 80点以上でユーザーに提示、承認を得て次へ

### Step 2: フェーズ2 — 執筆

1. `.claude/skills/novel-writer/phases/02-writing.md` を読み込む
2. 飛浩隆文体リファレンス（`sao-novel/references/tobi_style_guide.md`, `tobi_style_examples.md`）を読み込む
3. 執筆中、場面に応じて世界観・設定資料を参照する（`sao-novel/world/` 配下、`sao-novel/settings/` 配下）。
4. 章ごとに初稿→サブエージェントレビュー（`.claude/skills/novel-writer/agents/chapter-reviewer.md`）→改稿のサイクルを回す
4. 全章完了で次へ

### Step 3: フェーズ3 — 仕上げ

1. `.claude/skills/novel-writer/phases/03-finishing.md` を読み込む
2. 全章を通読レビュー（`.claude/skills/novel-writer/agents/full-review.md`）
3. 問題があれば修正
4. `03_finishing/final.md` に結合出力

$ARGUMENTS
