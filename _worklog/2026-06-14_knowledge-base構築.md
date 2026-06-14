# knowledge-base 構築（/ko・/cat スキル含む）

- 日付: 2026-06-14
- 関連: `knowledge-base/`, `.claude/skills/{ko,cat}/`, `.claude/commands/{ko,cat}.md`

## 目的
複数ソース（X投稿/Web記事/PDF/スライド/音声/メモ）を Markdown 化して蓄積し、後から AI/RAG が
検索・参照できる個人ナレッジベースを作る。元情報（sources）と統合考察（syntheses）を分離。

## 最終構成
- `knowledge-base/sources/<category>/` … 元情報。RAG 一次根拠。`_inbox/` は /ko 出力先（カテゴリ未確定の一時置き）。
- `knowledge-base/syntheses/` … 統合考察（ユーザー指示で都度作成）。
- `knowledge-base/indexes/<category>.md` … 目次。/cat が追記。
- カテゴリ初期値: publishing, reading-log, ai-tools, music, business, zatugaku, system-design, mix。
- `/ko`（整理スキル）→ 完了後 AskUserQuestion で `/cat`（カテゴリ分け）を呼ぶか確認。分割理由＝/cat 単体利用のため。

## 主要な意思決定
- **フォルダ名は `knowledge-base`**（例示は `knowledge/`）。macOS は大文字小文字を区別せず既存 `Knowledge/` と衝突するため。
- **メタデータは最小**（title/source_type/source_url/captured_at/topic/tags）。reliability・status は冗長として持たせない。
- **可変セクションは固定化しない。** 目的は「内容に応じて分かりやすく整理」すること。SKILL.md には項目リストを書かず目的だけ明示。
- **/cat はカテゴリ名をハードコードせず**、実行時に `sources/` の実フォルダを読んで判定（増減・改名に追従）。
- /ko は1ソース限定ではなく**複数ソースまとめ整理も可**。

## ハマり所 / 注意
- zsh は未クオートの変数を単語分割しない → for ループ用の文字列が1フォルダ名として作られた。空の不要フォルダ
  `sources/publishing reading-log ai-tools music business zatugaku system-design mix` が残存。**削除は権限ポリシーで
  Claude 側不可** → ユーザーが `rm -rf` する必要。
- 削除系コマンド（rm/rmdir）はこの環境の権限で弾かれる。

## フィードバック（恒久ルール化）
- 「既存 Knowledge とは別物で」という *作業スコープ指示* を成果物の恒久ルールへ焼き付けてしまい削除。
  → memory `feedback_task_scope_vs_artifact_rules.md` に再発防止を記録。

## 残タスク
1. 空フォルダ削除（ユーザー手動）。
2. syntheses 用スキル（/syn 的なもの）未定義。
3. indexes 再構築手段なし（/cat の逐次追記のみ）。
4. RAG/検索側の実装は未着手。
5. knowledge-base を git 追跡するか / `_inbox` 除外などの .gitignore 方針未確定。
