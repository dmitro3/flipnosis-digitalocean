-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN flip_balance INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN unlocked_coins TEXT DEFAULT '["plain"]';
ALTER TABLE profiles ADD COLUMN custom_coin_heads TEXT;
ALTER TABLE profiles ADD COLUMN custom_coin_tails TEXT;
