# essentia-app 開発タスク管理

## プロジェクト概要
Essentia を使った音声解析 Web アプリ。
- Frontend: Next.js
- Backend: FastAPI + Essentia
- Database: Supabase (本番) / ローカル Postgres (開発)
- インフラ: Docker Compose

---

## タスク一覧

| # | タスク | ステータス | 備考 |
|---|--------|----------|------|
| 1 | プロジェクトディレクトリ構成を作成 | ✅ 完了 | |
| 2 | .codex/config.toml 作成（MCP設定） | ✅ 完了 | |
| 3 | docker-compose 環境を作成 | ✅ 完了 | |
| 4 | backend FastAPI 雛形を作成 | ✅ 完了 | |
| 5 | frontend Next.js 雛形を作成 | ✅ 完了 | |
| 6 | Essentia 疎通確認コード + モデル未配置エラー実装 | ✅ 完了 | |
| 7 | .env.example と README 作成 | ✅ 完了 | |

---

## 次のステップ（実機能実装フェーズ）

- [ ] Essentia モデルファイルを models/ に配置
- [ ] 音声アップロード API の実装
- [ ] 解析結果の DB 保存
- [ ] フロントエンド UI の実装
- [ ] Supabase 本番環境へのデプロイ

---

## ディレクトリ構成

```
essentia-app/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   └── essentia.py
│   │   └── services/
│   │       └── essentia_service.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── package.json
│   ├── next.config.ts
│   └── Dockerfile
├── db/
│   └── init.sql
├── models/              # .pb / .json モデルファイルをここに配置
├── .codex/
│   └── config.toml
├── docker-compose.yml
├── .env.example
└── README.md
```
