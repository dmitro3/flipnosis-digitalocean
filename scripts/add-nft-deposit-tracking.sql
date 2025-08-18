-- Add NFT deposit tracking fields to games table
-- This migration adds fields to track NFT deposit status and timing

-- Add new columns for NFT deposit tracking
ALTER TABLE games ADD COLUMN IF NOT EXISTS nft_deposited BOOLEAN DEFAULT false;
ALTER TABLE games ADD COLUMN IF NOT EXISTS nft_deposit_time TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS nft_deposit_hash TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS nft_deposit_verified BOOLEAN DEFAULT false;
ALTER TABLE games ADD COLUMN IF NOT EXISTS last_nft_check_time TIMESTAMP;

-- Add index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_games_nft_deposit_status ON games(nft_deposited, created_at);
CREATE INDEX IF NOT EXISTS idx_games_cleanup_candidates ON games(status, nft_deposited, created_at);

-- Update existing games to check their NFT deposit status
-- This will be handled by the cleanup script
