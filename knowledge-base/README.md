# knowledge-base

複数ソース（X投稿 / Web記事 / PDF / スライド / 音声入力 / 手元メモ）から得た知識を
Markdown 化して蓄積し、後から AI / RAG が検索・参照できるようにする個人ナレッジ蓄積プロジェクト。

## ディレクトリ構成

```
knowledge-base/
  sources/        元情報。1ソース1ファイル。RAGの根拠。
    _inbox/         /ko で生成され、まだカテゴリ未確定のファイルの一時置き場
    publishing/
    reading-log/
    ai-tools/
    music/
    business/
    zatugaku/
    system-design/
    mix/            迷ったらここ。タグで検索軸を補う
  syntheses/      複数ソースを統合した考察・アイデア出し。ユーザー指示で都度作成
  indexes/        どの知識がどこにあるかの目次。探索補助
```

## 設計思想

- **カテゴリは「収納場所」、タグは「検索軸」。** カテゴリは粗くてよい。迷ったら `mix/` + タグ。
- **元情報（sources）と統合考察（syntheses）を分ける。** sources は RAG の一次根拠、syntheses は二次的な解釈。
- **メタデータは最小限。** AI が relevance 判定に使う項目（title / topic / tags / source_type / captured_at / source_url）だけを持たせ、トークン消費を抑える。

## ワークフロー

| コマンド | 役割 |
|----------|------|
| `/ko`  | ソースを規則に沿って Markdown 整理し `sources/_inbox/` に出力。完了後 `/cat` を呼ぶか確認する |
| `/cat` | ファイルの内容・タグから最適なカテゴリフォルダへ振り分け、`indexes/` を更新。単体でも利用可 |

詳細な整理規則は `.claude/skills/ko/SKILL.md`、カテゴリ分け規則は `.claude/skills/cat/SKILL.md` を参照。
