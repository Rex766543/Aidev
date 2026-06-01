# 字幕生成 進捗 — Petra（Blue Entrance Kitchen）

- 字幕ソース（文字起こし元）:
  - `Petra/voice/Blue Entrance Kitchen.m4a` … 110.0秒（**音声は1本に確定**）
- 焼き込み先動画: `Petra/Video/801666917.005985_57001779974122.MP4` … 578.6秒
  - **MP4の音声はそのまま**（`-c:a copy`、置き換えなし）
- 言語: `ja`
- 最終ゴール: 動画へ焼き込み（output.mp4）
- 作業ディレクトリ（ソースごとに自動生成）:
  - `Petra/voice/Blue Entrance Kitchen-work/`
- 更新: 2026-05-30

## 方針
- 文字起こし(工程1)は **OpenAI Whisper API**（`01-transcribe.mjs`）を使う。`OPENAI_API_KEY` は `.env.local` に設定済み。
  - ※ ローカルWhisper(`transcribe_local.py`)も用意済みだが、モデルDLが必要なので今回はAPIを使う。
- 校正(工程2)は `02-correct.mjs`（Anthropicキー）を使わず、**Claude Code が手作業**で行う
  （words.json を読んでフィラー削除・誤認識修正 → final-words.json を直接生成）。
- `pipeline.mjs` は使わず、個別スクリプト（01-transcribe → 03-layout → 04-ass-gen）を直接実行する。

## ⚠ 未決事項
- **[要決定] タイミング配置** — 音声(110秒)とMP4(578.6秒)で尺が異なる。
  字幕をMP4タイムラインのどこから出すか（開始オフセット）を焼き込み前に確定する。既定は 0秒開始。

## 0. 事前準備
- [x] 入力ファイルのパスを確認した（音声1本に確定）
- [x] 言語を確認した（ja）
- [x] `OPENAI_API_KEY` が `.env.local` にある
- [x] `ANTHROPIC_API_KEY` は不要（校正はClaude Codeが手作業）
- [x] `ffmpeg` が使える（/usr/local/bin/ffmpeg）

## 1. 文字起こし（01-transcribe）
- [ ] `Blue Entrance Kitchen-work/words.json` を生成した

## 2. 校正（Claude Codeが手作業）
- [ ] `final-words.json` を生成した（フィラー削除・誤認識修正）

## 3. レビュー
- [ ] 校正結果をユーザーが確認した（任意）

## 4. レイアウト＆ASS生成（03-layout / 04-ass-gen）
- [ ] `subtitles.json` を生成した
- [ ] `subtitle.ass` を生成した

## 5. タイミング微調整（任意）
- [ ] 開始オフセットを確定・反映した（aegisub または ASS側で調整）

## 6. 動画へ焼き込み
- [ ] `output.mp4` を生成した
