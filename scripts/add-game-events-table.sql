-- Add game_events table for event-driven architecture
-- This table tracks all game events for debugging, auditing, and potential replay

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

-- Add event tracking fields to games table
ALTER TABLE games ADD COLUMN last_event_id INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN event_version INTEGER DEFAULT 0;

-- Update database master documentation
-- This table will be used for the new event-driven architecture
