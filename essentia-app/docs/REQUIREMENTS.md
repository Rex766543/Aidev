# Requirements

essentia-app の要件定義書。実装の「なぜ」の正本として使用する。

---

## サービスの目的

ユーザが曲の一部（断片）を音声入力し、その断片がどのジャンル/スタイルに属するかを
Essentia の学習済みモデルで推定して返す Web サービス。

### 解決する課題
- 特定の曲がどのジャンルに属するか分からず調べたい
- 曲の一部分の音的特徴を言語化したい（KPop に見えるが実際は Electronic 系など）
- DJ がジャンル横断で曲を繋ぐために音の共通項を知りたい

---

## 決定事項

| 論点 | 決定 |
|------|------|
| ユーザ認証 | なし |
| 匿名利用 | あり（localStorage UUID で識別のみ確保） |
| 曲検索 | Spotify Web API（Client Credentials flow） |
| 表示 Top N | 3 件 |
| ジャンル粒度 | Essentia Discogs400（400 styles）を全量 DB 保持。表示は上位のみ |
| 補正の重み | 回数カウントのみ（`track_style_counts.source='user'`） |
| モデル差替時の過去データ | `model_name`/`model_version` で識別、過去データは改変しない |
| 音声保存 | **一切しない**（推論後に tempfile 即削除） |
| 収益化 | MVP には含めない。将来追加可能な設計 |

---「


## MVP スコープ（実装する機能）

- 曲検索（Spotify）→ 曲選択
- ブラウザ録音（5〜20 秒）→ POST で送信
- Essentia 推論（Discogs-EffNet 400 styles）→ Top3 Style 返却
- 上位3件の Style をランク表示（Top1 大、Top2/3 小）
- ユーザ補正（Top3 からの選択 or 同 Class 内の他 Style）
- 匿名ユーザ識別（localStorage UUID）
- 解析履歴ページ（自分の過去の試行）
- モデルバージョン管理カラム

---

## Want（MVP では UI 不要、拡張性のみ確保）

- 曲ごとのジャンル分布ページ（`track_style_counts` テーブルは MVP から用意）
- ユーザプロファイル / コメント / プレイリスト
- スコア割合グラフ
- A メロ/サビ構造ラベル（解析結果 JSONB に `segment` 枠だけ確保）
- 集計バッチ処理

---

## Drop（個人開発・低コスト方針により除外）

| 要件 | 代替 |
|------|------|
| 管理画面 UI | Supabase Studio / psql で直接操作 |
| dev/stg/prod の 3 環境分離 | dev（docker compose）+ prod（Railway + Supabase）の 2 面のみ |
| Grafana 監視 | FastAPI ログ + Railway ログ確認 |
| OAuth ログイン | localStorage UUID |
| 推論キュー（Celery 等） | FastAPI 同期 + 30 秒タイムアウト |
| GPU 推論 | CPU 推論（Discogs-EffNet は ~7 秒） |
| リアルタイムストリーミング推論 | 録音完了後の POST |

---

## データ保持方針

- **音声ファイルは永続保存しない**: `tempfile.NamedTemporaryFile` → 推論 → `try/finally` で即削除
- DB に `audio_blob` カラムを作らない
- 保存対象: `analyses.top_styles`, `analysis_styles`, `user_corrections`, `tracks` メタ
- 匿名 UUID は `anonymous_users` テーブルで管理（将来のログイン化に備えて分離）

---

## 非機能要件（MVP 向け）

| 項目 | 目標 |
|------|------|
| 録音完了〜結果表示 | 10 秒以内（推論 ~7 秒 + ネットワーク） |
| 同時接続想定 | 小規模（1〜数人の個人利用） |
| 可用性 | ベストエフォート（個人開発） |
| 音声保存 | なし |
| レート制限 | POST /api/analyses: 30 req/min/IP |

---

## 採用モデル

**Discogs-EffNet（400 styles, bs64-1）**

- 出力: Discogs の 400 styles（`Genre---Style` 形式、例: `"Electronic---House"`）
- 入力: 16kHz mono WAV/audio
- パイプライン: TensorflowPredictEffnetDiscogs（Embedding）→ TensorflowPredict2D（Classification）
- 性能: ROC-AUC 0.954
- CPU 推論時間: ~7 秒
- モデルサイズ: ~18 MB

将来のモデル差替: `models/model_manifest.json` の `active_model` を変更し `download_models.sh` を再実行。

---

## デプロイ方針

| 層 | MVP | 本番 |
|----|-----|------|
| Frontend | localhost:3000 (docker) | Vercel（無料） |
| Backend | localhost:8000 (docker) | Railway（~$5/月） |
| Database | Postgres 16 (docker) | Supabase（無料枠） |
| ML モデル | `models/` ディレクトリ | Railway マウント or 起動時 DL |
