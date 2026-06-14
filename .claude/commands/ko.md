# /ko — ソースをナレッジ Markdown に整理

ソース（X投稿 / Web記事 / PDF / スライド / 音声入力 / 手元メモ。複数まとめての場合もある）を、
RAG / AI が後から参照しやすい構造化 Markdown に整理し、`knowledge-base/sources/_inbox/` に出力するコマンド。

## 実行手順

`.claude/skills/ko/SKILL.md` のスキルに従って処理する:

1. ソース本体を受け取る（貼り付け / URL / ファイルパス）。`$ARGUMENTS` に「まとめ観点」指定が
   あれば、その観点に絞って抽出・整理する。
2. **まずソースの本論を分析**し、本論に必要な情報だけを最小分量で構造化する。
3. 最小メタデータ frontmatter（title / source_type / source_url / captured_at / topic / tags）を付与。
4. `knowledge-base/sources/_inbox/YYYY-MM-DD_{source_type}_{タイトル}.md` に書き出す。
5. 作成内容（ファイル名・要約・タグ）を報告。
6. **AskUserQuestion で「続けて `/cat`（カテゴリ分け）を実行しますか？」を確認。**
   - はい → `/cat` を今作成したファイル対象で実行。
   - いいえ → `_inbox/` に残して終了。

$ARGUMENTS
