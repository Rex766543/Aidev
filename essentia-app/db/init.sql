-- essentia-app initial schema
-- Run this to initialize the local Postgres database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Example table for audio analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
