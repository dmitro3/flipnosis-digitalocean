-- Add missing columns to battle_royale_games table
-- Run with: sqlite3 /opt/flipnosis/app/server/database.sqlite < add-columns-direct.sql

-- These commands will fail silently if columns already exist, which is fine

-- Add winner_address if missing
ALTER TABLE battle_royale_games ADD COLUMN winner_address TEXT;

-- Add winner if missing (for compatibility)
ALTER TABLE battle_royale_games ADD COLUMN winner TEXT;

-- Add creator_paid if missing
ALTER TABLE battle_royale_games ADD COLUMN creator_paid BOOLEAN DEFAULT 0;

-- Add nft_claimed if missing
ALTER TABLE battle_royale_games ADD COLUMN nft_claimed BOOLEAN DEFAULT 0;

-- Add nft_collection if missing
ALTER TABLE battle_royale_games ADD COLUMN nft_collection TEXT;

-- Fix existing completed games: copy winner to winner_address if winner_address is empty
UPDATE battle_royale_games 
SET winner_address = winner 
WHERE status = 'completed' 
  AND (winner_address IS NULL OR winner_address = '') 
  AND winner IS NOT NULL 
  AND winner != '';

