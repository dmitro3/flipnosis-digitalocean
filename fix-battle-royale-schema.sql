-- Fix Battle Royale database schema
-- Add missing creator_participates field to battle_royale_games table

-- Add the creator_participates field to battle_royale_games table
ALTER TABLE battle_royale_games ADD COLUMN creator_participates BOOLEAN DEFAULT 0;

-- Update max_players to 6 instead of 8
UPDATE battle_royale_games SET max_players = 6 WHERE max_players = 8;

-- Verify the changes
SELECT sql FROM sqlite_master WHERE type='table' AND name='battle_royale_games';
