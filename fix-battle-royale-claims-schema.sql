-- Fix Battle Royale Claims Schema
-- Add missing creator_paid and nft_claimed fields to battle_royale_games table

-- Add creator_paid field (tracks if creator has withdrawn their funds)
ALTER TABLE battle_royale_games ADD COLUMN creator_paid BOOLEAN DEFAULT 0;

-- Add nft_claimed field (tracks if winner has claimed the NFT)
ALTER TABLE battle_royale_games ADD COLUMN nft_claimed BOOLEAN DEFAULT 0;

-- Add winner field (tracks who won the game)
ALTER TABLE battle_royale_games ADD COLUMN winner TEXT;

-- Update existing completed games to have proper default values
UPDATE battle_royale_games 
SET creator_paid = 0, nft_claimed = 0 
WHERE status = 'completed' AND (creator_paid IS NULL OR nft_claimed IS NULL);

-- Verify the changes
SELECT id, status, winner, creator_paid, nft_claimed 
FROM battle_royale_games 
WHERE status = 'completed' 
LIMIT 5;
