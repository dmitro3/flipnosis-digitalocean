-- Complete Database Schema Update for Flipnosis
-- This script adds all missing fields to match the master database

-- Add missing fields to games table
ALTER TABLE games ADD COLUMN challenger_wins INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN creator_choice TEXT;
ALTER TABLE games ADD COLUMN challenger_choice TEXT;
ALTER TABLE games ADD COLUMN creator_power INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN challenger_power INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN flip_result TEXT;
ALTER TABLE games ADD COLUMN round_winner TEXT;
ALTER TABLE games ADD COLUMN game_winner TEXT;
ALTER TABLE games ADD COLUMN phase TEXT DEFAULT 'waiting';
ALTER TABLE games ADD COLUMN current_turn TEXT;
ALTER TABLE games ADD COLUMN challenger_role TEXT DEFAULT 'CHOOSER';
ALTER TABLE games ADD COLUMN nft_deposited BOOLEAN DEFAULT false;
ALTER TABLE games ADD COLUMN nft_deposit_time TIMESTAMP;
ALTER TABLE games ADD COLUMN nft_deposit_hash TEXT;
ALTER TABLE games ADD COLUMN nft_deposit_verified BOOLEAN DEFAULT false;
ALTER TABLE games ADD COLUMN last_nft_check_time TIMESTAMP;
ALTER TABLE games ADD COLUMN last_event_id INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN event_version INTEGER DEFAULT 0;

-- Add missing fields to offers table
ALTER TABLE offers ADD COLUMN challenger_name TEXT;
ALTER TABLE offers ADD COLUMN challenger_image TEXT;

-- Add missing fields to listings table
ALTER TABLE listings ADD COLUMN creator_online BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN min_offer_price REAL DEFAULT 0;

-- Add missing fields to profiles table
ALTER TABLE profiles ADD COLUMN name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN avatar TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN headsImage TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN tailsImage TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN twitter TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN telegram TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN xp_name_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_avatar_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_twitter_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_telegram_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_heads_earned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN xp_tails_earned BOOLEAN DEFAULT FALSE;

-- Add missing fields to game_rounds table
ALTER TABLE game_rounds ADD COLUMN creator_choice TEXT;
ALTER TABLE game_rounds ADD COLUMN challenger_choice TEXT;
ALTER TABLE game_rounds ADD COLUMN round_winner TEXT;

-- Create game_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    target_users TEXT,
    processed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_challenger ON games(challenger);
CREATE INDEX IF NOT EXISTS idx_games_phase ON games(phase);
CREATE INDEX IF NOT EXISTS idx_games_current_turn ON games(current_turn);
CREATE INDEX IF NOT EXISTS idx_games_round_winner ON games(round_winner);
CREATE INDEX IF NOT EXISTS idx_games_game_winner ON games(game_winner);
CREATE INDEX IF NOT EXISTS idx_games_challenger_role ON games(challenger_role);
CREATE INDEX IF NOT EXISTS idx_games_challenger_wins ON games(challenger_wins);
CREATE INDEX IF NOT EXISTS idx_games_nft_deposit_status ON games(nft_deposited, created_at);
CREATE INDEX IF NOT EXISTS idx_games_cleanup_candidates ON games(status, nft_deposit_verified, created_at);
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_processed ON game_events(processed);
CREATE INDEX IF NOT EXISTS idx_game_events_created ON game_events(created_at);
CREATE INDEX IF NOT EXISTS idx_game_rounds_creator_choice ON game_rounds(creator_choice);
CREATE INDEX IF NOT EXISTS idx_game_rounds_challenger_choice ON game_rounds(challenger_choice);
CREATE INDEX IF NOT EXISTS idx_game_rounds_round_winner ON game_rounds(round_winner);

-- Show updated schema
.schema games
