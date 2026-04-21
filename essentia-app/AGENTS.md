# AGENTS.md — essentia-app

## プロジェクト概要

音声解析 Web アプリ。Essentia (TensorFlow) で音声ファイルを解析し、結果を Web UI で表示する。

| レイヤー | 技術 |
|----------|------|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Backend  | FastAPI + Essentia (Python 3.10) |
| Database | PostgreSQL (開発) / Supabase (本番) |
| インフラ | Docker Compose |

## ディレクトリ構成

```
essentia-app/
├── backend/app/
│   ├── main.py                  # FastAPI エントリポイント
│   ├── routers/                 # ルーター (health.py, essentia.py)
│   └── services/                # ビジネスロジック
├── frontend/src/app/            # Next.js ページ
├── db/init.sql                  # DB 初期スキーマ
├── models/                      # Essentia モデル (.pb/.json)
└── docker-compose.yml
```

## コーディング規約

### Backend (Python)
- 型ヒントを必ず付ける
- ルーターは `app/routers/` に追加し `main.py` で `include_router`
- ビジネスロジックは `app/services/` に分離

### Frontend (TypeScript)
- `any` 型を使わない
- ページは基本 Server Component
- SSR の API URL は `INTERNAL_API_URL`、クライアントは `NEXT_PUBLIC_API_URL`

## 動作確認

```bash
docker compose up --build
curl http://localhost:8000/health
curl http://localhost:8000/essentia/status
```
