-- Add unlocked_coins field to profiles table and coin_unlock_transactions table
-- This migration adds the unlocked_coins field to existing profiles tables

-- For PostgreSQL
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_coins TEXT DEFAULT '["plain"]';

-- Create coin_unlock_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS coin_unlock_transactions (
    id SERIAL PRIMARY KEY,
    player_address TEXT NOT NULL,
    coin_id TEXT NOT NULL,
    flip_cost INTEGER NOT NULL,
    flip_balance_before INTEGER NOT NULL,
    flip_balance_after INTEGER NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coin_unlock_transactions_player ON coin_unlock_transactions(player_address);

-- For SQLite (if using SQLite)
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS
-- You may need to recreate the table or use a different approach
-- This is a fallback for SQLite databases

-- Update existing profiles to have the default unlocked coins
UPDATE profiles SET unlocked_coins = '["plain"]' WHERE unlocked_coins IS NULL;
