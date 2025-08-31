-- Migration script to add event-driven system tables
-- Run this on the production database: 159.69.242.154

-- Add game_events table for event-driven architecture
CREATE TABLE IF NOT EXISTS game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,  -- JSON data for the event
    target_users TEXT, -- JSON array of user addresses to notify
    processed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_processed ON game_events(processed);
CREATE INDEX IF NOT EXISTS idx_game_events_created ON game_events(created_at);

-- Add event tracking fields to games table (if they don't exist)
ALTER TABLE games ADD COLUMN last_event_id INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN event_version INTEGER DEFAULT 0;

-- Verify the changes
SELECT 'game_events table created' as status WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='game_events');
SELECT 'game_events indexes created' as status WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_game_events_game_id');

-- Show current database schema
PRAGMA table_info(games);
PRAGMA table_info(game_events);

-- Migration complete
SELECT 'Event system migration completed successfully' as result;
