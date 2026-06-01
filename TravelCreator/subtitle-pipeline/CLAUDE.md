# CLAUDE.md — subtitle-pipeline

## このプロジェクトについて

音声/動画から**日本語字幕(ASS)を生成し、動画に焼き込む**ための Node.js CLI パイプライン。
旅行動画などにナレーション字幕を付ける用途で使う。

実際の実行は `/videocreator` コマンド（`.claude/skills/videocreator/SKILL.md`）から行う。
このファイルは「何をするツールか」を理解するための概要。

## パイプラインの流れ

```
音声/動画
  │  ① 01-transcribe.mjs   Whisper(OpenAI)で文字起こし → words.json
  ▼
words.json
  │  ② 02-correct.mjs      Claudeで校正 → corrected-words.json + review.json
  ▼
review.json               ← 人手レビュー（approved: true/false を設定）
  │  ②b 02-apply-review.mjs レビュー反映 → final-words.json
  ▼
final-words.json
  │  ③ 03-layout.mjs       字幕チャンクにレイアウト → subtitles.json
  ▼
subtitles.json
  │  ④ 04-ass-gen.mjs      ASS字幕ファイル生成 → subtitle.ass
  ▼
subtitle.ass              → ffmpegで動画に焼き込み
```

`scripts/pipeline.mjs` が①〜④を統合実行するオーケストレーター。
出力は `<入力ファイル名>-work/` 以下に段階的に保存され、既存の出力があるステップはスキップされる。

## スクリプト

| ファイル | 役割 |
|----------|------|
| `scripts/pipeline.mjs` | 全ステップの統合実行・レビュー待ち制御 |
| `scripts/01-transcribe.mjs` | Whisperで文字起こし（要 `OPENAI_API_KEY`） |
| `scripts/02-correct.mjs` | Claudeで校正・レビュー項目生成（要 `ANTHROPIC_API_KEY`） |
| `scripts/02-apply-review.mjs` | レビュー結果を本文に反映 |
| `scripts/03-layout.mjs` | 字幕の改行・チャンク分割 |
| `scripts/04-ass-gen.mjs` | ASS字幕ファイル生成 |
| `scripts/lib/env.mjs` | `.env.local` / `.env` の読み込み |

## 環境変数

`subtitle-pipeline/.env.local` または `.env` に記載すると自動で読み込まれる。

- `OPENAI_API_KEY` — Whisper 文字起こし
- `ANTHROPIC_API_KEY` — Claude 校正

## 外部ツール

- `ffmpeg` — 字幕の焼き込み（必須）
- `aegisub` — タイミング微調整（任意）
