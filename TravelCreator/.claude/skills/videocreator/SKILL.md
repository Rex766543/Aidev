---
name: videocreator
description: 音声/動画から日本語字幕(ASS)を生成し、動画に焼き込むパイプライン。Whisper文字起こし→Claude校正→人手レビュー→レイアウト→ASS生成→ffmpegで焼き込み。ユーザーが「字幕を作って」「字幕を焼き込んで」「videocreator」と言ったとき、または音声・動画ファイルから字幕付き動画を作りたいときに使う。
---

# videocreator — 字幕生成＆動画焼き込みパイプライン

`subtitle-pipeline/` の Node スクリプト群を使って、音声から日本語字幕(ASS)を生成し、動画に焼き込む。

## 前提

- 実行ディレクトリ: `TravelCreator/subtitle-pipeline/`
- 必要な環境変数（`subtitle-pipeline/.env.local` または `.env` に記載 → スクリプトが自動読込）:
  - `OPENAI_API_KEY` — Whisper 文字起こし用
  - `ANTHROPIC_API_KEY` — Claude 校正用
- 焼き込みに `ffmpeg`、タイミング微調整に `aegisub`（任意）

## 進捗マニュアル（最初に必ず作る）

このスキルが発動したら、**他の作業を始める前に**作業ディレクトリ直下に進捗マニュアル
`<ファイル名>-work/PROGRESS.md` を作成する（`<ファイル名>-work/` がまだ無ければ先に作る）。

- 下記テンプレートをそのままコピーして書き出す。`<...>` は確認できた値に置き換える。
- **各工程が終わるたびに**該当チェックボックスを `[ ]` → `[x]` に更新し、`更新` 欄に日付を書く。
- 工程をスキップ／失敗した場合は、その項目に `(skip: 理由)` や `(失敗: 内容)` を併記する。
- ユーザーから進捗を聞かれたら、このファイルを読んで現状を答える。

### PROGRESS.md テンプレート

```markdown
# 字幕生成 進捗 — <入力ファイル名>

- 入力ファイル: `<音声/動画ファイルのパス>`
- 言語: `<ja など>`
- 作業ディレクトリ: `<ファイル名>-work/`
- 更新: <YYYY-MM-DD>

## 0. 事前準備
- [ ] 入力ファイルのパスを確認した
- [ ] 言語を確認した（既定 ja）
- [ ] `OPENAI_API_KEY` が `.env.local`/`.env` にある
- [ ] `ANTHROPIC_API_KEY` が `.env.local`/`.env` にある
- [ ] `ffmpeg` が使える（焼き込みする場合）

## 1. 文字起こし（01-transcribe）
- [ ] `words.json` を生成した

## 2. Claude校正（02-correct）
- [ ] `corrected-words.json` を生成した
- [ ] `review.json` を生成した

## 3. レビュー
- [ ] `review.json` の全項目に `approved: true/false` を設定した

## 4. レイアウト＆ASS生成（03-layout / 04-ass-gen）
- [ ] `final-words.json` を生成した
- [ ] `subtitles.json` を生成した
- [ ] `subtitle.ass` を生成した

## 5. タイミング微調整（任意）
- [ ] aegisub で確認・調整した（不要ならskip）

## 6. 動画へ焼き込み
- [ ] `output.mp4` を生成した
```

## 手順

### 1. ユーザーから入力ファイルを確認
- 字幕の元になる**音声/動画ファイルのパス**
- 言語（既定: 日本語 `ja`）
- 確認できたら PROGRESS.md の「0. 事前準備」をチェックする。

### 2. パイプライン実行（前半: 文字起こし→校正→レビュー待ち）
```bash
cd TravelCreator/subtitle-pipeline
node scripts/pipeline.mjs --audio <音声/動画ファイル> --language ja
```
出力は `<ファイル名>-work/` 以下に段階的に生成される:
- `words.json` … 文字起こし結果
- `corrected-words.json` + `review.json` … Claude 校正結果とレビュー項目

`review.json` に未承認項目（`"approved": null`）があると、ここで停止する。
→ 生成できたら PROGRESS.md の「1. 文字起こし」「2. Claude校正」をチェックする。

### 3. レビュー（人手 or Claude が代行）
`review.json` の各項目に `"approved": true / false` を設定する。
ユーザーが内容確認を任せてきた場合は、各修正候補の妥当性を判断して埋める。
→ 全項目を埋めたら PROGRESS.md の「3. レビュー」をチェックする。

### 4. パイプライン再開（後半: レイアウト→ASS生成）
```bash
node scripts/pipeline.mjs --audio <音声/動画ファイル> --continue
```
出力:
- `final-words.json` … レビュー反映後の確定テキスト
- `subtitles.json` … 字幕チャンクのレイアウト
- `subtitle.ass` … 最終 ASS 字幕ファイル

フォント指定が必要なら `--font <名前> --font-size <px>` を渡す。
→ 生成できたら PROGRESS.md の「4. レイアウト＆ASS生成」をチェックする。

### 5. （任意）タイミング微調整
```bash
aegisub <ファイル名>-work/subtitle.ass
```
→ 実施した／不要でskipしたを PROGRESS.md の「5.」に反映する。

### 6. 動画へ焼き込み
```bash
ffmpeg -i <動画.mp4> -vf "ass=<ファイル名>-work/subtitle.ass" -c:a copy output.mp4
```
→ `output.mp4` ができたら PROGRESS.md の「6. 動画へ焼き込み」をチェックして完了を報告する。

## 補足

- 各ステップは出力ファイルが既にあればスキップされる。**やり直したいステップは出力ファイルを削除**してから再実行する。
- 詳しいパイプラインの設計思想・各スクリプトの役割は `subtitle-pipeline/CLAUDE.md` を参照。
