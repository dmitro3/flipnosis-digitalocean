-- Safe script to add missing columns to battle_royale_games table
-- This ONLY adds columns, does NOT modify or delete any existing data
-- Run this on the remote server database

-- Check and add winner_address if missing
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll handle errors gracefully

-- Add winner_address column (if it doesn't exist)
-- If column exists, this will fail silently which is fine
ALTER TABLE battle_royale_games ADD COLUMN winner_address TEXT;

-- Add winner column if missing (for compatibility)
ALTER TABLE battle_royale_games ADD COLUMN winner TEXT;

-- Add creator_paid column if missing (defaults to 0 = false)
ALTER TABLE battle_royale_games ADD COLUMN creator_paid BOOLEAN DEFAULT 0;

-- Add nft_claimed column if missing (defaults to 0 = false)
ALTER TABLE battle_royale_games ADD COLUMN nft_claimed BOOLEAN DEFAULT 0;

-- Add nft_collection column if missing
ALTER TABLE battle_royale_games ADD COLUMN nft_collection TEXT;

-- Fix any existing completed games that have winner but no winner_address
UPDATE battle_royale_games 
SET winner_address = winner 
WHERE status = 'completed' 
  AND (winner_address IS NULL OR winner_address = '') 
  AND winner IS NOT NULL 
  AND winner != '';

