-- First-party usage counting for Filevra.
-- Aggregates only: no file names, no document data, no raw IP addresses.

CREATE TABLE IF NOT EXISTS day_visitors (
  day TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (day, visitor_hash)
);

CREATE TABLE IF NOT EXISTS day_stats (
  day TEXT PRIMARY KEY,
  page_views INTEGER NOT NULL DEFAULT 0,
  visitors INTEGER NOT NULL DEFAULT 0,
  tool_runs INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS page_stats (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE TABLE IF NOT EXISTS tool_stats (
  day TEXT NOT NULL,
  tool TEXT NOT NULL,
  runs INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, tool)
);

CREATE INDEX IF NOT EXISTS idx_page_stats_day ON page_stats (day);
CREATE INDEX IF NOT EXISTS idx_tool_stats_day ON tool_stats (day);
