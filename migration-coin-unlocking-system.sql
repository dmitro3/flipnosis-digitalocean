-- Migration: Add Coin Unlocking System to Profiles Table
-- This adds support for tracking unlocked coins and flip balance for coin purchases

-- Add new columns to profiles table for coin unlocking system
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- We'll handle this in the migration script with try-catch
ALTER TABLE profiles ADD COLUMN flip_balance INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN unlocked_coins TEXT DEFAULT '["plain"]';
ALTER TABLE profiles ADD COLUMN custom_coin_heads TEXT;
ALTER TABLE profiles ADD COLUMN custom_coin_tails TEXT;

-- Create index for flip_balance for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_flip_balance ON profiles(flip_balance);

-- Update existing profiles to have the default coin (plain) unlocked
UPDATE profiles SET unlocked_coins = '["plain"]' WHERE unlocked_coins IS NULL OR unlocked_coins = '';

-- Create a table to track coin unlock transactions for audit purposes
CREATE TABLE IF NOT EXISTS coin_unlock_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_address TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  flip_cost INTEGER NOT NULL,
  flip_balance_before INTEGER NOT NULL,
  flip_balance_after INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_address) REFERENCES profiles(address)
);

-- Create indexes for coin unlock transactions
CREATE INDEX IF NOT EXISTS idx_coin_unlock_player ON coin_unlock_transactions(player_address);
CREATE INDEX IF NOT EXISTS idx_coin_unlock_coin ON coin_unlock_transactions(coin_id);
CREATE INDEX IF NOT EXISTS idx_coin_unlock_date ON coin_unlock_transactions(unlocked_at);

-- Add comments for documentation
-- flip_balance: Total FLIP tokens available for spending on coin unlocks
-- unlocked_coins: JSON array of coin IDs that the player has unlocked (e.g., ["plain", "skull", "trump"])
-- custom_coin_heads: URL to custom coin heads image uploaded by user
-- custom_coin_tails: URL to custom coin tails image uploaded by user
