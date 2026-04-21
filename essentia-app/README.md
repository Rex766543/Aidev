# essentia-app

音声解析 Web アプリケーション。Essentia を使って音声ファイルを分析し、結果を Web UI で表示する。

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| Frontend | Next.js 15 (App Router) |
| Backend  | FastAPI + Essentia |
| Database | Supabase (本番) / PostgreSQL (開発) |
| インフラ | Docker Compose |

---

## ローカル起動方法

### 1. 前提条件

- Docker / Docker Compose がインストールされていること
- `models/` にモデルファイルが配置されていること（下記参照）

### 2. 環境変数を設定

```bash
cp .env.example .env
# .env を編集して必要な値を埋める
```

### 3. Docker Compose で起動

```bash
docker compose up --build
```

| サービス | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API ドキュメント | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

### 4. Essentia 疎通確認

```bash
curl http://localhost:8000/essentia/status
```

レスポンス例（正常時）:
```json
{
  "status": "ok",
  "essentia": { "available": true, "version": "2.1b6" },
  "models": { "found": true, "files": ["model.pb"] }
}
```

---

## Essentia モデルの置き場所

`models/` ディレクトリに `.pb` または `.json` 形式のモデルファイルを配置してください。

```
essentia-app/
└── models/
    ├── your-model.pb     ← ここに置く
    └── your-model.json   ← または JSON 形式
```

> **TODO**: 使用するモデルの URL・ダウンロード方法をここに記載する
>
> 参考: https://essentia.upf.edu/models.html

モデルが未配置の場合、`/essentia/status` が `"status": "degraded"` を返し、
配置場所と対処法を含むエラーメッセージを表示します。

---

## Supabase MCP の接続方法

Codex エージェントから Supabase MCP を使う場合:

1. Supabase の Personal Access Token を取得:
   https://app.supabase.com/account/tokens

2. `.env` に設定:
   ```
   SUPABASE_ACCESS_TOKEN=your_token_here
   ```

3. `.codex/config.toml` に設定済み。Codex 起動時に自動で MCP サーバーが立ち上がる。

Claude Code から使う場合は、Claude Code の MCP 設定 (`~/.claude/settings.json`) に
Supabase MCP サーバーを追加してください。

---

## Playwright MCP の接続方法

1. `.codex/config.toml` に設定済み（`@playwright/mcp@latest` を使用）。

2. E2E テスト実行時は Codex エージェントがブラウザを自動制御する。

Claude Code から使う場合は、Claude Code の MCP 設定に Playwright MCP を追加してください。

---

## 将来の本番デプロイ方針

| 項目 | 方針 |
|------|------|
| Frontend | Vercel にデプロイ (`next build` → `output: standalone`) |
| Backend  | Cloud Run または Railway にデプロイ |
| Database | Supabase 本番プロジェクトを使用 |
| モデル   | Cloud Storage (GCS / S3) に保存し、起動時にダウンロード |

本番切り替え手順:
1. `.env` の `DATABASE_URL` を Supabase の接続文字列に変更
2. `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
3. Backend の Dockerfile を本番用 CMD に変更 (`--reload` を外す)

---

## ディレクトリ構成

```
essentia-app/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI エントリポイント
│   │   ├── routers/
│   │   │   ├── health.py              # GET /health
│   │   │   └── essentia.py            # GET /essentia/status
│   │   └── services/
│   │       └── essentia_service.py    # Essentia ロジック
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx                   # トップページ
│   │   └── layout.tsx
│   ├── package.json
│   ├── next.config.ts
│   └── Dockerfile
├── db/
│   └── init.sql                       # 初期スキーマ
├── models/                            # .pb / .json モデルをここに配置
├── .codex/
│   └── config.toml                    # Codex MCP 設定
├── docker-compose.yml
├── .env.example
└── README.md
```
