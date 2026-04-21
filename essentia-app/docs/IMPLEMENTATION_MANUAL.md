# Implementation Manual

essentia-app MVP の実装進捗管理ファイル。
完了したタスクは `[ ]` → `[x]` に変更する。

---

## Phase 0: 環境構築ギャップ解消

- [x] `.env.example` を拡充（Spotify/CORS/Essentia/APP_ENV）
- [ ] `.env` にローカル用の Spotify credentials を記入 ← **ユーザ手動作業**（Spotify Developer Dashboard で取得）
- [x] `docker-compose.yml` の backend env 追加、db マウントを `migrations/` に変更
- [x] `.gitignore` を更新（model_manifest.json/README.md を追跡対象に）
- [x] `db/migrations/001_init.sql` を作成（新スキーマで全テーブル定義済み）
- [x] `scripts/download_models.sh` + `scripts/_download_models_helper.py` を作成
- [x] `models/README.md` を作成（音声非保存方針も明記）
- [x] `models/model_manifest.json` を作成（Discogs-EffNet 2-stage pipeline、URL 付き）
- [x] Frontend: tailwindcss/postcss/autoprefixer/clsx を `package.json` に追加
- [x] `tailwind.config.ts` / `postcss.config.mjs` / `globals.css` を作成
- [x] `frontend/src/app/layout.tsx` に `globals.css` の import 追加
- [x] `backend/requirements.txt` に `slowapi==0.1.9` 追加
- [x] `backend/tests/` `frontend/tests/` `frontend/e2e/` を作成
- [x] `docs/REQUIREMENTS.md` `docs/API_CONTRACT.md` `docs/IMPLEMENTATION_MANUAL.md` を作成
- [ ] `bash scripts/download_models.sh` を実行してモデルファイルを `models/` に配置
- [ ] `docker compose up --build` で `/health` と `/essentia/status` が動くことを確認

---

## Phase 1: DB スキーマ + Backend 基盤

- [x] `db/migrations/001_init.sql` が新スキーマに書き換わっていることを確認（Phase 0 で完了済み）
- [x] `backend/app/config.py` を作成（pydantic-settings、全 env 集約）
- [x] `backend/app/db.py` を作成（SQLAlchemy engine/session factory）
- [x] `backend/app/dependencies.py` を作成（`get_db`, `get_or_create_anon_user` 等 FastAPI Depends）
- [x] `backend/app/models/base.py`（Declarative Base）
- [x] `backend/app/models/track.py`
- [x] `backend/app/models/analysis.py`（Analysis + AnalysisStyle + TrackStyleCount）
- [x] `backend/app/models/correction.py`（UserCorrection）
- [x] `backend/app/models/anonymous_user.py`
- [x] `backend/app/models/__init__.py` で ORM クラスを re-export
- [x] `backend/app/schemas/track.py` / `analysis.py` / `correction.py`
- [x] docker volume 削除 → `docker compose up --build` → `\dt` で新テーブル確認

---

## Phase 2: Backend サービス層

- [ ] `scripts/download_models.sh` を実行してモデルを `models/` に配置
- [x] `backend/app/services/audio_preprocess.py`
- [x] `backend/app/services/label_mapper.py`
- [x] `backend/app/services/genre_taxonomy.py`
- [x] `backend/app/services/spotify_service.py`
- [x] `backend/app/services/essentia_inference.py`

---

## Phase 3: Backend ルーター層

- [x] `backend/app/routers/tracks.py`（GET /api/tracks/search, POST /api/tracks）
- [x] `backend/app/routers/analyses.py`（POST /api/analyses, GET /api/analyses/{id}, PUT /api/analyses/{id}/correction）
- [x] `backend/app/routers/trial_history.py`（GET /api/my/history）
- [x] `backend/app/main.py` に include_router を 3 本追加 + CORS 設定
- [x] slowapi でレート制限（POST /api/analyses: 30/min/ip）
- [x] curl で 4 エンドポイントを叩いて 200 確認（全 8 ルート OpenAPI 登録確認済み）

---

## Phase 4: Frontend 基盤

- [x] `src/lib/api/client.ts`
- [x] `src/lib/api/tracks.ts`
- [x] `src/lib/api/analyses.ts`
- [x] `src/lib/api/history.ts`
- [x] `src/lib/anonId.ts`
- [x] `src/lib/recorder.ts`（MediaRecorder ラッパ、5-20 秒）
- [x] `src/components/TrackSearch.tsx`
- [x] `src/components/Recorder.tsx`（録音 UI + カウントダウン）
- [x] `src/components/StyleResultCard.tsx`
- [x] `src/components/CorrectionPicker.tsx`

---

## Phase 5: Frontend ページ結合

- [x] `src/app/page.tsx`（検索ページ）
- [x] `src/app/record/page.tsx`（録音ページ）
- [x] `src/app/result/[analysisId]/page.tsx`（結果 + 補正）
- [x] `src/app/history/page.tsx`（試行履歴）
- [x] `src/app/layout.tsx`（ヘッダ追加）

---

## Phase 6: 結合動作確認

- [x] `docker compose up --build` 起動
- [x] `/essentia/status` が ok を返す（inference_ready: true 確認済み）
- [x] 検索 → 録音 → 結果（Top3）の golden path が通る
- [x] 補正 → `user_corrections` に行が追加される
- [x] 履歴ページに結果が表示される
- [x] `track_style_counts` がインクリメントされている（model×3 + user×1 確認）
- [x] 音声ファイルが `/tmp` に残っていない
- [x] Playwright E2E（10/10 PASSED — `frontend/e2e/test_golden_path.py`）

### その他完了済み（Phase 6外）
- [x] モデルDL（SSL証明書問題を curl 利用で解決、正しいURL: `classification-heads/genre_discogs400/`）
- [x] `backend/tests/` 整備 — 8 tests passed
- [x] TypeScript 型チェック通過
- [x] 履歴ページを Client Component に変更（SSR+localStorage 問題解決）
- [x] `/essentia/status` に `inference_ready` フラグ追加

---

## Phase 7: 本番準備（MVP 後）

- [ ] Supabase プロジェクト作成、migrations/*.sql を流す
- [ ] Railway にバックエンドデプロイ
- [ ] Vercel にフロントエンドデプロイ
- [ ] 初回起動で download_models.sh を実行
