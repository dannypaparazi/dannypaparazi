CREATE TABLE IF NOT EXISTS scans (
  id SERIAL PRIMARY KEY,
  model_no TEXT NOT NULL,
  serial_no TEXT NOT NULL,
  raw_scan TEXT,
  scan_type TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans (created_at DESC);
