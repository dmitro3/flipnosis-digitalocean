-- Add XP tracking fields to prevent double-counting
ALTER TABLE profiles ADD COLUMN xp_name_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_avatar_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_twitter_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_telegram_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_heads_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_tails_earned BOOLEAN DEFAULT FALSE; 