-- Migration script to fix SQLITE_ERROR: table games has no column named listing_id
-- Run this script to update your database schema to match the application requirements

-- First, let's check if we're dealing with the old schema by checking existing columns
-- If you get errors about missing tables, that means you need to run the full schema.sql first

-- Drop existing games table if it exists with old schema
DROP TABLE IF EXISTS games CASCADE;

-- Drop existing offers table if it exists with old schema  
DROP TABLE IF EXISTS offers CASCADE;

-- Drop existing chat_messages table if it exists with old schema
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Create listings table (required for games table foreign key)
CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    game_id TEXT UNIQUE,
    creator TEXT NOT NULL,
    nft_contract TEXT NOT NULL,
    nft_token_id TEXT NOT NULL,
    nft_name TEXT,
    nft_image TEXT,
    nft_collection TEXT,
    nft_chain TEXT DEFAULT 'base',
    asking_price DECIMAL(20,8) NOT NULL,
    status TEXT DEFAULT 'open',
    coin_data TEXT,
    listing_fee_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create games table with correct schema including listing_id
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    offer_id TEXT,
    blockchain_game_id TEXT UNIQUE,
    creator TEXT NOT NULL,
    challenger TEXT,
    nft_contract TEXT NOT NULL,
    nft_token_id TEXT NOT NULL,
    nft_name TEXT,
    nft_image TEXT,
    nft_collection TEXT,
    final_price DECIMAL(20,8) NOT NULL,
    coin_data TEXT,
    status TEXT DEFAULT 'waiting_deposits',
    creator_deposited BOOLEAN DEFAULT false,
    challenger_deposited BOOLEAN DEFAULT false,
    deposit_deadline TIMESTAMP,
    winner TEXT,
    game_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create offers table with correct schema
CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    offerer_address TEXT NOT NULL,
    offer_price DECIMAL(20,8) NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id)
);

-- Create game_rounds table
CREATE TABLE IF NOT EXISTS game_rounds (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    creator_choice TEXT,
    challenger_choice TEXT,
    flip_result TEXT,
    round_winner TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Create chat_messages table with correct schema
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'chat',
    message_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    address TEXT PRIMARY KEY,
    name TEXT,
    avatar TEXT,
    headsImage TEXT,
    tailsImage TEXT,
    twitter TEXT,
    telegram TEXT,
    xp INTEGER DEFAULT 0,
    heads_image TEXT,
    tails_image TEXT,
    xp_name_earned BOOLEAN DEFAULT FALSE,
    xp_avatar_earned BOOLEAN DEFAULT FALSE,
    xp_twitter_earned BOOLEAN DEFAULT FALSE,
    xp_telegram_earned BOOLEAN DEFAULT FALSE,
    xp_heads_earned BOOLEAN DEFAULT FALSE,
    xp_tails_earned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Keep existing tables that are compatible
-- users and player_stats should be fine as they are

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_creator ON games(creator);
CREATE INDEX IF NOT EXISTS idx_games_challenger ON games(challenger);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_listing_id ON games(listing_id);
CREATE INDEX IF NOT EXISTS idx_listings_creator ON listings(creator);
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_offerer ON offers(offerer_address);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);

-- Show completion message
SELECT 'Database schema migration completed successfully! The listing_id column has been added to the games table.' as message;
