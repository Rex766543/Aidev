# knowledge-base Project Guide

このフォルダは、複数ソースから得た知識を Markdown 化して蓄積し、後から AI / RAG が
検索・参照できるようにする個人ナレッジベースです。

## 役割の分離

- `sources/` … 元情報。1ソース1ファイル。RAG の一次根拠。AI が事実を引くときの参照先。
- `syntheses/` … 複数ソースを統合した自分 / AI の考察・アイデア。ユーザーが都度指示して作成するもの。
- `indexes/` … カテゴリごとの目次。どの知識がどこにあるかの探索補助。

## メタデータ規約（最小構成）

ナレッジファイル冒頭の YAML frontmatter は、AI が relevance 判定と引用に使う項目のみに絞る:

```yaml
---
title: "<ファイル名と一致する簡易タイトル>"
source_type: "x" | "article" | "pdf" | "slide" | "audio" | "memo"
source_url: "<URL。無ければ省略>"
captured_at: "YYYY-MM-DD"
topic:            # = 収納カテゴリ（フォルダ名と対応）
  - <category>
tags:             # = 検索軸。具体的な固有名詞・概念を複数
  - <tag>
---
```

`reliability` / `status` 等の項目は原則持たせない（フォルダで sources/syntheses を分けており冗長なため）。
必要なソースでだけ、判断して項目を足す。

## ファイル命名

`YYYY-MM-DD_{source_type}_{短いタイトル}.md`（例: `2026-06-13_x_委託制度と過剰流通.md`）。
本文 H1 タイトル・frontmatter の `title`・ファイル名（拡張子除く）は一致させる。

## カテゴリ

`sources/` 直下のフォルダ名が現在のカテゴリ。固定ではなく増減し得る。
ハードコードせず、振り分け時は実際のフォルダ一覧を読み取って判断する。迷ったら `mix/`。

## コマンド

- `/ko` … 1ソースを規則通り Markdown 整理 → `sources/_inbox/` に出力 → `/cat` 実行確認。
- `/cat` … ファイルを最適なカテゴリへ振り分け、`indexes/` 更新。単体でも利用可。

整理規則の実体は `.claude/skills/ko/SKILL.md`、カテゴリ分けは `.claude/skills/cat/SKILL.md`。
（コマンド / スキル定義はリポジトリルートの `.claude/` 配下にあります — そこがスラッシュコマンドの探索場所のため）
