CREATE TABLE IF NOT EXISTS boards (
  share_key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_boards_updated_at ON boards(updated_at);
