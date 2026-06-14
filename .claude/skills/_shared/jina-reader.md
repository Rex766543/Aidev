# Jina Reader MCP — 共有能力定義

スキルやコマンドからURL取得する際の「どの手段を使うか」と「Jinaの能力・制約」の共有定義。
各スキルの SKILL.md はこのファイルを参照し、ここを再定義しない。

MCP サーバー: `jina-reader`（`~/.claude/settings.json` 登録済み、`JINA_API_KEY` 設定済み）

---

## URL取得の手段選択（最重要）

通常URLにJinaは不要。Jinaの無料トークンはXなど本当に必要な場面に温存する。

| 入力 | 使う手段 | 理由 |
|------|---------|------|
| **x.com / twitter.com URL** | **Jina** (`jina_read_url`) | WebFetchはXにブロックされやすい。Jina+APIキーの方が取得率が高い |
| JS必須・無限スクロール等の重いページ、WebFetchが失敗したページ | **Jina** (`jina_read_url`) | 全文をクリーンなMarkdownで取得できる |
| **その他の通常URL**（ニュース・ブログ・ドキュメント等） | **WebFetch**（Claude Code標準） | 無料。Jinaトークンを消費しない |
| URLでない（テキスト/PDF/音声/メモ） | Jina不使用 | そのまま整理（音声はWhisper前処理） |

### 判定フロー

```
入力を受け取る
  ↓
URLか？ （http:// / https:// で始まる）
  ├─ x.com / twitter.com を含む → Jina (jina_read_url)
  ├─ その他のURL              → WebFetch（標準ツール）
  │                              └ WebFetchが失敗 → Jina にフォールバック
  └─ URLでない                → Jina不使用（テキスト/音声フローへ）
```

- URL判定: `http://` / `https://` で始まる文字列
- 複数URLが混在 → X系はJina、通常URLはWebFetchに振り分け。Jina側で複数あれば `jina_read_urls`（dedupe=true）

---

## Jinaで使えるツール

| ツール | 用途 |
|--------|------|
| `jina_read_url` | 単一URLを取得 → Markdown/テキストで返す |
| `jina_read_urls` | 複数URLを並列取得（dedupe対応） |
| `jina_search_web` | Web検索して上位ページの本文を返す（`site=["x.com"]` で絞り込み可） |
| `jina_healthcheck` | 疎通確認 |

---

## X/Twitter URL の扱い（Jina使用時の制約）

### できること
- **公開ポスト**の URL を `jina_read_url` に渡して本文テキストを取得できる場合がある
- APIキーありの場合、匿名アクセスより取得成功率が上がる
- `jina_search_web` で `site=["x.com"]` 絞り込みにより、X投稿を検索結果として得られる

### できないこと・エラーになる場合
| 状況 | エラー内容 |
|------|-----------|
| ログイン必須のページ | `forbidden` / `http_error 451` |
| X側がJinaのIPをブロック中 | `http_error 451` (Anonymous access blocked) |
| 削除・非公開ポスト | `not_found` / `http_error` |
| ブックマーク・いいね一覧など認証ページ | 取得不可 |

### エラー時の対処方針
- `result.ok === false` → エラー内容（`error.type` / `error.message`）をそのままユーザーに報告
- 「X側の制限やログイン壁により取得できませんでした。投稿テキストを直接貼り付けてください。」と案内
- **無理に回避・リトライしない**（ログインバイパス・Playwright不使用）
