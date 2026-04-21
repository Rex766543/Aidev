# API Contract

essentia-app の HTTP API 仕様書。実装・フロントエンドの正本として使用する。

---

## Base URL

| 環境 | URL |
|------|-----|
| ローカル開発 | `http://localhost:8000` |
| 本番 (Railway) | 設定後に記入 |

---

## エンドポイント一覧

### 曲検索

#### `GET /api/tracks/search`

Spotify Web API 経由で曲を検索する（Backend が Client Credentials で代理検索）。

**Query Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `q` | string | ✅ | 検索クエリ（曲名・アーティスト名等） |
| `limit` | integer | ❌ | 取得件数（デフォルト 10、最大 20） |

**Response 200**
```json
{
  "items": [
    {
      "spotify_id": "4uLU6hMCjMI75M1A2tKUQC",
      "title": "One More Time",
      "artist": "Daft Punk",
      "album": "Discovery",
      "artwork_url": "https://i.scdn.co/image/..."
    }
  ]
}
```

---

#### `POST /api/tracks`

選択した曲を内部 DB に upsert する（analyses の track_id FK 取得のために使う）。

**Request Body (JSON)**
```json
{ "spotify_id": "4uLU6hMCjMI75M1A2tKUQC" }
```

**Response 200**
```json
{
  "id": "uuid",
  "spotify_track_id": "4uLU6hMCjMI75M1A2tKUQC",
  "title": "One More Time",
  "artist": "Daft Punk",
  "album": "Discovery",
  "artwork_url": "https://..."
}
```

---

### 解析

#### `POST /api/analyses`

録音音声を受け取り Essentia で推論する。**音声は推論後に即削除（永続保存しない）**。

**Request** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | ✅ | 録音ファイル（webm/opus or wav） |
| `track_id` | string (UUID) | ✅ | 内部 tracks テーブルの ID |
| `client_uid` | string | ✅ | localStorage の匿名ユーザ UUID |
| `duration_sec` | float | ❌ | 録音時間（秒） |

**Response 200**
```json
{
  "id": "analysis-uuid",
  "track_id": "track-uuid",
  "model_name": "discogs-effnet",
  "model_version": "bs64-1",
  "top1_style": "House",
  "top1_class": "Electronic",
  "top_styles": [
    { "rank": 1, "style": "House", "class": "Electronic", "score": 0.42 },
    { "rank": 2, "style": "Techno", "class": "Electronic", "score": 0.28 },
    { "rank": 3, "style": "Ambient", "class": "Electronic", "score": 0.15 }
  ],
  "created_at": "2026-04-12T12:00:00Z"
}
```

**Response 408** タイムアウト（推論 30 秒超過）
**Response 500** Essentia 推論エラー

---

#### `GET /api/analyses/{analysis_id}`

解析結果を取得する。

**Response 200** `POST /api/analyses` の Response と同じ形式。

---

#### `PUT /api/analyses/{analysis_id}/correction`

ユーザが推定結果を補正する。

**Request Body (JSON)**
```json
{
  "corrected_style": "Ambient",
  "corrected_class": "Electronic",
  "client_uid": "localStorage-uuid"
}
```

**Response 200**
```json
{
  "id": "correction-uuid",
  "analysis_id": "analysis-uuid",
  "corrected_style": "Ambient",
  "corrected_class": "Electronic",
  "created_at": "2026-04-12T12:01:00Z"
}
```

---

### 履歴

#### `GET /api/my/history`

匿名ユーザ自身の過去の解析試行履歴を返す。

**Query Parameters**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `client_uid` | string | ✅ | localStorage UUID |
| `limit` | integer | ❌ | 件数（デフォルト 20） |

**Response 200**
```json
{
  "items": [
    {
      "analysis_id": "uuid",
      "track": {
        "spotify_id": "...",
        "title": "One More Time",
        "artist": "Daft Punk",
        "artwork_url": "https://..."
      },
      "top1_style": "House",
      "top1_class": "Electronic",
      "corrected_style": null,
      "created_at": "2026-04-12T12:00:00Z"
    }
  ]
}
```

---

### システム

#### `GET /health`
```json
{ "status": "ok" }
```

#### `GET /essentia/status`
```json
{
  "essentia": "ok",
  "models": ["discogs-effnet-bs64-1.pb", "genre_discogs400-discogs-effnet-1.pb"]
}
```

---

## エラーレスポンス共通形式

```json
{
  "detail": "エラーメッセージ"
}
```

---

## レート制限

`POST /api/analyses`: **30 req/min/IP**（slowapi）
