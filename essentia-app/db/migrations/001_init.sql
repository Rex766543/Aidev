-- essentia-app initial schema
-- Migration 001: initial tables
-- NOTE: このファイルが db/migrations/ の正本。
--       docker-compose は db/migrations/ を /docker-entrypoint-initdb.d にマウントするため
--       Postgres は番号順（001_*.sql, 002_*.sql …）に自動実行する（初回起動時のみ）。

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- 匿名ユーザ識別（将来のログイン機能に備えて分離）
-- ─────────────────────────────────────────
CREATE TABLE anonymous_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_uid TEXT UNIQUE NOT NULL,   -- localStorage で発番した UUID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 曲メタ（Spotify から取得して upsert）
-- ─────────────────────────────────────────
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spotify_track_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    artwork_url TEXT,
    raw_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tracks_spotify ON tracks(spotify_track_id);

-- ─────────────────────────────────────────
-- 解析 1 回分
-- ─────────────────────────────────────────
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    anonymous_user_id UUID REFERENCES anonymous_users(id),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    -- topN 全候補を JSONB で保持: [{"rank":1,"style":"House","class":"Electronic","score":0.42}, ...]
    top_styles JSONB NOT NULL,
    top1_style TEXT NOT NULL,
    top1_class TEXT NOT NULL,
    duration_sec REAL,
    segment_label TEXT,    -- want: 'intro'|'verse'|'chorus' など。MVP は NULL
    flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analyses_track ON analyses(track_id);
CREATE INDEX idx_analyses_user ON analyses(anonymous_user_id);
CREATE INDEX idx_analyses_created ON analyses(created_at DESC);

-- ─────────────────────────────────────────
-- 解析 1 件 × 上位 N スタイルの行明細（集計クエリ用）
-- ─────────────────────────────────────────
CREATE TABLE analysis_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    style TEXT NOT NULL,
    style_class TEXT NOT NULL,
    score REAL NOT NULL
);
CREATE INDEX idx_analysis_styles_analysis ON analysis_styles(analysis_id);

-- ─────────────────────────────────────────
-- ユーザ補正（ユーザが「正しいのはコレ」と選択）
-- ─────────────────────────────────────────
CREATE TABLE user_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    anonymous_user_id UUID REFERENCES anonymous_users(id),
    corrected_style TEXT NOT NULL,
    corrected_class TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 曲ごとのジャンル分布（want: 将来の曲ページ用）
-- MVP でも解析・補正ごとに count を即更新するので、テーブルだけ作っておく
-- ─────────────────────────────────────────
CREATE TABLE track_style_counts (
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    style TEXT NOT NULL,
    style_class TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('model', 'user')),
    count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (track_id, style, source)
);
