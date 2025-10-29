-- Add columns to track blockchain completion
ALTER TABLE battle_royale_games ADD COLUMN completion_tx VARCHAR(66);
ALTER TABLE battle_royale_games ADD COLUMN completion_block INTEGER;
ALTER TABLE battle_royale_games ADD COLUMN completion_error TEXT;
ALTER TABLE battle_royale_games ADD COLUMN completed_at TIMESTAMP;

-- Add index for faster queries
CREATE INDEX idx_battle_royale_completion ON battle_royale_games(status, completed_at);
