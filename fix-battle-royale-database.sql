-- Fix Battle Royale Database Schema
-- Add missing columns that the API expects

-- Check and add room_type column
ALTER TABLE battle_royale_games ADD COLUMN room_type TEXT DEFAULT 'potion';

-- Check and add creator_participates column  
ALTER TABLE battle_royale_games ADD COLUMN creator_participates BOOLEAN DEFAULT 0;

-- Check and add game_data column
ALTER TABLE battle_royale_games ADD COLUMN game_data TEXT;

-- Update any existing records to have default values
UPDATE battle_royale_games SET room_type = 'potion' WHERE room_type IS NULL;
UPDATE battle_royale_games SET creator_participates = 0 WHERE creator_participates IS NULL;

