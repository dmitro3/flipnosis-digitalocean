-- Verification script for Battle Royale database fields
-- Run this on Hetzner 159 database to ensure all fields exist

-- Check battle_royale_games table fields
SELECT 
  'battle_royale_games' as table_name,
  name as column_name,
  type as data_type
FROM pragma_table_info('battle_royale_games')
ORDER BY cid;

-- Check battle_royale_participants table fields
SELECT 
  'battle_royale_participants' as table_name,
  name as column_name,
  type as data_type
FROM pragma_table_info('battle_royale_participants')
ORDER BY cid;

-- Add missing columns if they don't exist (safe - only adds if missing)
-- These columns are needed for the new first-to-3-wins system

-- Add winner field to battle_royale_games if missing (alias for winner_address)
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS winner TEXT;

-- Add creator_participates field if missing
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS creator_participates BOOLEAN DEFAULT 0;

-- Add creator_paid field if missing (for tracking if creator was paid)
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS creator_paid BOOLEAN DEFAULT 0;

-- Add nft_claimed field if missing (for tracking if NFT was claimed)
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS nft_claimed BOOLEAN DEFAULT 0;

-- Add completion tracking fields if missing
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS completion_tx TEXT;
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS completion_block INTEGER;
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS completion_error TEXT;

-- Add game_data field for storing serialized game state (for recovery)
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS game_data TEXT;

-- Verify the additions
SELECT 
  'Verification Complete' as status,
  COUNT(*) as total_columns
FROM pragma_table_info('battle_royale_games');

