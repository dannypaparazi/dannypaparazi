CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  brand TEXT,
  model_no TEXT NOT NULL,
  serial_no TEXT NOT NULL,
  raw_scan TEXT,
  scan_type TEXT NOT NULL DEFAULT 'unknown',
  device_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe to re-run: adds columns to a database created before they existed.
ALTER TABLE scans ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans (created_at DESC);
CREATE INDEX IF NOT EXISTS scans_device_id_idx ON scans (device_id);
