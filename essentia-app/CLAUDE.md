# CLAUDE.md — essentia-app

Claude Code がこのプロジェクトで作業する際の指示書。

## プロジェクト概要

音声解析 Web アプリ。Essentia (TensorFlow モデル) で音声ファイルを分析し、結果を Web UI で表示する。

| レイヤー | 技術 |
|----------|------|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Backend  | FastAPI + Essentia (Python 3.10) |
| Database | Supabase (本番) / PostgreSQL (開発) |
| インフラ | Docker Compose |

---

## ディレクトリ構成

```
essentia-app/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI エントリポイント
│   │   ├── routers/health.py          # GET /health
│   │   ├── routers/essentia.py        # GET /essentia/status
│   │   └── services/essentia_service.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/app/page.tsx               # トップページ (Server Component)
│   └── src/app/layout.tsx
├── db/init.sql                        # ローカル Postgres 初期スキーマ
├── models/                            # Essentia .pb/.json モデルをここに配置
├── docker-compose.yml
├── .env / .env.example
└── CLAUDE.md                          # このファイル
```

---

## ローカル起動

```bash
# 1. 環境変数 (初回のみ)
cp .env.example .env

# 2. Docker Compose 起動
docker compose up --build

# 3. 疎通確認
curl http://localhost:8000/health
curl http://localhost:8000/essentia/status
```

| サービス | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API ドキュメント | http://localhost:8000/docs |

---

## 開発ルール

### Backend (Python / FastAPI)
- ルーターは `app/routers/` に追加し `main.py` で `include_router`
- ビジネスロジックは `app/services/` に分離
- 型ヒントを必ず付ける
- 環境変数は `os.environ.get()` で取得し、デフォルト値を設定する

### Frontend (Next.js / TypeScript)
- ページは基本的に Server Component で実装
- API 呼び出しはサーバー側では `INTERNAL_API_URL`（Docker 内部）、クライアント側では `NEXT_PUBLIC_API_URL` を使う
- `any` 型は使わない

### Essentia / モデル
- モデルファイルは `models/` に配置 (.pb または .json)
- モデルが未配置でも起動できること（`status: degraded` を返す）
- モデルロードは `app/services/essentia_service.py` に集約

### Docker
- ローカル開発は `docker compose up --build` で完結させる
- DB スキーマ変更は `db/init.sql` を更新し、ボリュームを削除して再起動

---

## MCP の使い方

### Supabase MCP
- DB スキーマ確認・マイグレーション・SQL 実行に使う
- `.env` の `SUPABASE_ACCESS_TOKEN` が必要（本番 Supabase 使用時）

### Playwright MCP
- フロントエンドの動作確認・E2E テストに使う
- `docker compose up` でフロントが起動している状態で使う

---

## 将来の本番デプロイ方針

| 項目 | 方針 |
|------|------|
| Frontend | Vercel |
| Backend  | Cloud Run または Railway |
| Database | Supabase 本番プロジェクト |
| モデル   | GCS/S3 に保存し起動時ダウンロード |

本番切り替えは `.env` の `DATABASE_URL` を Supabase 接続文字列に変更するだけ。
