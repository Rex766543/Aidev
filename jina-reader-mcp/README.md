# jina-reader-mcp

Jina AI Reader/Search API を Claude Code / Claude Desktop / Cursor などから MCP ツールとして呼び出せるローカル MCP サーバー。

**責務：** URLまたは検索クエリをJinaに渡し、Claudeが扱いやすいJSON/テキストとして返すだけ。保存・整理・レポート化は別Skillで行う。

---

## セットアップ

```bash
cd jina-reader-mcp
uv sync
```

---

## JINA_API_KEY の設定

APIキーがなくても動作しますが、レート制限が厳しくなります。

```bash
cp .env.example .env
# .env を編集して JINA_API_KEY を設定
```

または環境変数として直接設定：

```bash
export JINA_API_KEY=jina_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

APIキーの取得： https://jina.ai/

---

## MCP 設定例

### Claude Code (`~/.claude/settings.json`)

```json
{
  "mcpServers": {
    "jina-reader": {
      "command": "uv",
      "args": [
        "--directory", "/path/to/jina-reader-mcp",
        "run", "jina-reader-mcp"
      ],
      "env": {
        "JINA_API_KEY": "jina_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "jina-reader": {
      "command": "uv",
      "args": [
        "--directory", "/path/to/jina-reader-mcp",
        "run", "jina-reader-mcp"
      ],
      "env": {
        "JINA_API_KEY": "jina_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

---

## MCPツールの使い方

### `jina_read_url` — 単一URLを読む

```
url: https://example.com
respond_with: markdown  # markdown / text / html / frontmatter
engine: auto            # auto / browser / curl
no_cache: false
target_selector: null   # 特定領域だけ読む場合に CSS selector を指定
timeout: 30
```

### `jina_read_urls` — 複数URLをまとめて読む

```
urls:
  - https://example.com
  - https://www.wikipedia.org/
dedupe: true     # 重複URLを除去
concurrency: 2   # 並列数（最大5）
```

### `jina_search_web` — Web検索して結果本文を取得

```
query: グリムコネクト 感想
site:
  - x.com        # 特定サイトに絞る場合（複数可）
engine: auto
no_cache: false
```

### `jina_healthcheck` — 疎通確認

```
test_url: https://example.com
```

---

## X/Twitter URL を読む場合の注意点

- **公開URLのみ対象。** ログインが必要なページは取得できません。
- Xの仕様変更や制限により、公開ポストでも取得できない場合があります。
- ログイン壁・X側のレート制限・Jina側のブロックは回避しません。エラーとして返します。
- エラー時は `error.message` に「X/Twitter URL may require login or be restricted.」のヒントが含まれます。

---

## 動作確認例

```
jina_read_url:
  url = "https://example.com"

jina_read_urls:
  urls = [
    "https://example.com",
    "https://www.wikipedia.org/"
  ]

jina_search_web:
  query = "グリムコネクト 感想"
  site = ["x.com"]
```

---

## テスト実行

```bash
uv run pytest
```

実APIを叩く統合テスト（任意）：

```bash
JINA_API_KEY=your_key uv run pytest tests/integration/ -v
```

---

## このMCPの責務外

- Markdownファイル保存
- SQLite / Vector DB 保存
- RAG検索 / Embeddings / Reranker
- X API連携・Xログイン・Xブックマーク取得
- Playwrightによるブラウザ操作
- 収集結果のレポート生成

これらは別Skillまたは別工程で行う。
