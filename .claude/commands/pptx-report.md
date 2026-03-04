# /pptx-report — 定例報告資料作成

定例会議向けの報告資料パワポを作成するコマンドです。

## 引数

```
/pptx-report 20250612
```

日付（YYYYMMDD形式）を引数として受け取る。引数が省略された場合は今日の日付を使用。

## 実行手順

### Step 1: インプットファイルを読み込む

引数の日付を `{DATE}` として、以下のパスのインプットファイルを読み込む:

```
project-alpha/presentations/reports/{DATE}/_input.md
```

- ファイルが存在しない場合: そのフォルダとテンプレート `_input.md` を作成し、ユーザーに記入を促して停止する
- ファイルが存在する場合: 内容をそのまま資料作成のベースにする
- **質問は原則しない**。不明な項目はClaudeが合理的に補完して進める

### Step 2: クライアント参照フォルダを読み込む

`_input.md` の「クライアント/サービス名」欄を確認し、対応するフォルダを参照する:

```
project-alpha/clients/{クライアント名}/references/   ← 参考資料・過去資料
project-alpha/clients/{クライアント名}/logs/         ← 過去ログ・議事録
```

- フォルダが存在する場合: 内容を確認し、資料作成の参考にする
- フォルダが存在しない場合: スキップして続行

### Step 3: 構成設計 → 即コンテンツ作成

インプット内容と参照資料をもとに、`.claude/skills/pptx-generator/SKILL.md` の「定例報告資料 (report)」構成テンプレートに従いスライドを設計し、即座にコンテンツを作成する。

**標準構成（内容に応じて省略・追加可）:**
1. タイトルスライド（報告タイトル、期間）
2. サマリー（主要トピック一覧）
3. 進捗報告（各トピック1-2枚）
4. 課題・リスク
5. 次回までのアクション
6. Appendix（必要に応じて）

`.claude/skills/pptx-generator/references/format-rules.md` のフォーマット規約を適用する。

### Step 4: パワポ生成

python-pptx でパワポファイルを生成:
- 保存先: `project-alpha/presentations/reports/{DATE}/{タイトル}.pptx`
- フォント: Meiryo
- カラー: format-rules.md 準拠

### Step 5: レビュー

Agent ツール（subagent_type: general-purpose）を使って以下のプロンプトでレビューエージェントを起動する:

```
.claude/agents/reviewer.md の「パワポ資料」レビュー観点に従い、以下のファイルをレビューしてください。

レビュー対象: project-alpha/presentations/reports/{DATE}/{タイトル}.pptx

レビュー手順:
1. python3 で pptx ファイルを読み込み、全スライドのテキストを抽出する
2. .claude/agents/reviewer.md のパワポ観点（メッセージの一貫性・論理構成・1スライド1メッセージ・フォーマット・スライド枚数・文末統一）でチェックする
3. .claude/skills/pptx-generator/references/format-rules.md のフォーマット規約と照合する
4. reviewer.md の出力フォーマット（総合評価A/B/C・良い点・改善提案）で結果を返す
```

レビュー結果を受け取り:
- **A（優良）**: そのまま確定
- **B（軽微な修正あり）**: 指摘に基づきスクリプトを修正して再生成
- **C（要修正）**: 指摘に基づきスクリプトを修正して再生成し、再度レビューを実施

### Step 6: 完了報告

- 生成ファイルのパスを表示
- スライド構成の概要を表示

$ARGUMENTS
