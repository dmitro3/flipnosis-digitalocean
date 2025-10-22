-- Fix Battle Royale Schema - Add Missing Columns
-- This adds the missing columns that the API expects

-- Add missing columns to battle_royale_games table
ALTER TABLE battle_royale_games ADD COLUMN creator_participates BOOLEAN DEFAULT 0;
ALTER TABLE battle_royale_games ADD COLUMN game_data TEXT;
ALTER TABLE battle_royale_games ADD COLUMN room_type TEXT DEFAULT 'potion';

-- Update any existing records to have default values
UPDATE battle_royale_games SET creator_participates = 0 WHERE creator_participates IS NULL;
UPDATE battle_royale_games SET room_type = 'potion' WHERE room_type IS NULL;