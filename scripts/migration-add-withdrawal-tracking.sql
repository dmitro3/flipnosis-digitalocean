-- Migration: Add withdrawal tracking fields to battle_royale_games table
-- This allows us to track when NFTs and funds have been withdrawn

-- Add nft_withdrawn field to track if creator has reclaimed NFT (for cancelled games) or if winner has claimed NFT
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS nft_withdrawn BOOLEAN DEFAULT FALSE;

-- Add creator_funds_withdrawn field to track if creator has withdrawn their earnings
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS creator_funds_withdrawn BOOLEAN DEFAULT FALSE;

-- Add nft_withdrawn_at timestamp
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS nft_withdrawn_at TIMESTAMP;

-- Add creator_funds_withdrawn_at timestamp  
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS creator_funds_withdrawn_at TIMESTAMP;

-- Add nft_withdrawn_tx_hash to track the blockchain transaction
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS nft_withdrawn_tx_hash TEXT;

-- Add creator_funds_withdrawn_tx_hash to track the blockchain transaction
ALTER TABLE battle_royale_games ADD COLUMN IF NOT EXISTS creator_funds_withdrawn_tx_hash TEXT;

-- Create index on nft_withdrawn for faster queries
CREATE INDEX IF NOT EXISTS idx_br_games_nft_withdrawn ON battle_royale_games(nft_withdrawn);

-- Create index on creator_funds_withdrawn for faster queries
CREATE INDEX IF NOT EXISTS idx_br_games_funds_withdrawn ON battle_royale_games(creator_funds_withdrawn);

