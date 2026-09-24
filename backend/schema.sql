CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  brand TEXT,
  model_no TEXT NOT NULL,
  serial_no TEXT NOT NULL,
  raw_scan TEXT,
  scan_type TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe to re-run: adds the column to a database created before "brand" existed.
ALTER TABLE scans ADD COLUMN IF NOT EXISTS brand TEXT;

CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans (created_at DESC);
