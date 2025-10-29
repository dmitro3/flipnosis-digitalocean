-- Add missing tables to database.sqlite without overwriting existing data
-- This script adds only the missing tables and columns

-- Create profiles table with all columns including flip_balance and unlocked_coins
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username TEXT,
    profile_picture TEXT,
    level INTEGER DEFAULT 1,
    total_flips INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    flip_balance INTEGER DEFAULT 0,
    unlocked_coins TEXT DEFAULT '["plain"]'
);

-- Create games table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joiner TEXT,
    nft_chain TEXT DEFAULT 'base',
    price_usd REAL,
    rounds INTEGER DEFAULT 5,
    creator_wins INTEGER DEFAULT 0,
    joiner_wins INTEGER DEFAULT 0,
    challenger_wins INTEGER DEFAULT 0,
    current_round INTEGER DEFAULT 1,
    creator_choice TEXT,
    challenger_choice TEXT,
    creator_power INTEGER DEFAULT 0,
    challenger_power INTEGER DEFAULT 0,
    flip_result TEXT,
    round_winner TEXT,
    game_winner TEXT,
    phase TEXT DEFAULT 'waiting',
    current_turn TEXT,
    joiner_role TEXT DEFAULT 'CHOOSER',
    challenger_role TEXT DEFAULT 'CHOOSER',
    joiner_choice TEXT DEFAULT 'HEADS',
    listing_fee_eth REAL,
    listing_fee_hash TEXT,
    entry_fee_hash TEXT,
    listing_fee_usd REAL,
    contract_game_id TEXT,
    transaction_hash TEXT,
    challenger_nft_name TEXT,
    challenger_nft_image TEXT,
    challenger_nft_collection TEXT,
    challenger_nft_contract TEXT,
    challenger_nft_token_id TEXT,
    game_type TEXT DEFAULT 'nft-vs-crypto',
    chain TEXT DEFAULT 'base',
    payment_token TEXT DEFAULT 'ETH',
    payment_amount DECIMAL(20, 8),
    listing_fee_paid DECIMAL(20, 8),
    platform_fee_collected DECIMAL(20, 8),
    creator_role TEXT DEFAULT 'FLIPPER',
    max_rounds INTEGER DEFAULT 5,
    last_action_time TIMESTAMP,
    countdown_end_time TIMESTAMP,
    auth_info TEXT,
    unclaimed_eth DECIMAL(20, 8) DEFAULT 0,
    unclaimed_usdc DECIMAL(20, 8) DEFAULT 0,
    unclaimed_nfts TEXT,
    total_spectators INTEGER DEFAULT 0,
    coin TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    nft_deposited BOOLEAN DEFAULT false,
    nft_deposit_time TIMESTAMP,
    nft_deposit_hash TEXT,
    nft_deposit_verified BOOLEAN DEFAULT false,
    last_nft_check_time TIMESTAMP,
    last_event_id INTEGER DEFAULT 0,
    event_version INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_games_challenger ON games(challenger);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_listing_id ON games(listing_id);
CREATE INDEX IF NOT EXISTS idx_games_phase ON games(phase);
CREATE INDEX IF NOT EXISTS idx_games_current_turn ON games(current_turn);
CREATE INDEX IF NOT EXISTS idx_games_round_winner ON games(round_winner);
CREATE INDEX IF NOT EXISTS idx_games_game_winner ON games(game_winner);
CREATE INDEX IF NOT EXISTS idx_games_challenger_role ON games(challenger_role);
CREATE INDEX IF NOT EXISTS idx_games_challenger_wins ON games(challenger_wins);
CREATE INDEX IF NOT EXISTS idx_games_nft_deposit_status ON games(nft_deposited, created_at);

-- Create listings table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creator_online BOOLEAN DEFAULT false,
    min_offer_price REAL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_listings_creator ON listings(creator);
CREATE INDEX IF NOT EXISTS idx_listings_creator_online ON listings(creator_online);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    offerer_address TEXT NOT NULL,
    offer_price DECIMAL(20,8) NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    offerer_name TEXT,
    challenger_name TEXT,
    challenger_image TEXT,
    FOREIGN KEY (listing_id) REFERENCES listings(id)
);

CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_offerer ON offers(offerer_address);
CREATE INDEX IF NOT EXISTS idx_offers_offerer_name ON offers(offerer_address);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'chat',
    message_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_address);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_address TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
    id TEXT PRIMARY KEY,
    address TEXT UNIQUE NOT NULL,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    total_amount_wagered DECIMAL(20,8) DEFAULT 0,
    total_amount_won DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ready_nfts table
CREATE TABLE IF NOT EXISTS ready_nfts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_address TEXT NOT NULL,
    nft_contract TEXT NOT NULL,
    nft_token_id TEXT NOT NULL,
    nft_name TEXT,
    nft_image TEXT,
    nft_collection TEXT,
    source TEXT DEFAULT 'manual',
    deposited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ready_nfts_player ON ready_nfts(player_address);
CREATE INDEX IF NOT EXISTS idx_ready_nfts_contract ON ready_nfts(nft_contract);
CREATE INDEX IF NOT EXISTS idx_ready_nfts_deposited ON ready_nfts(deposited_at);

-- Create game_events table
CREATE TABLE IF NOT EXISTS game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    target_users TEXT,
    processed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_processed ON game_events(processed);
CREATE INDEX IF NOT EXISTS idx_game_events_created ON game_events(created_at);

-- Create game_rounds table
CREATE TABLE IF NOT EXISTS game_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    creator_choice TEXT,
    challenger_choice TEXT,
    flip_result TEXT,
    round_winner TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    flipper_address TEXT,
    power_used REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Create game_shares table
CREATE TABLE IF NOT EXISTS game_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_address TEXT NOT NULL,
    share_platform TEXT NOT NULL,
    xp_awarded BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_shares_game ON game_shares(game_id);
CREATE INDEX IF NOT EXISTS idx_game_shares_player ON game_shares(player_address);
CREATE INDEX IF NOT EXISTS idx_game_shares_platform ON game_shares(share_platform);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'chat',
    message_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);

-- Create admin_actions table
CREATE TABLE IF NOT EXISTS admin_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_address TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_address TEXT,
    amount DECIMAL(20, 8),
    game_id INTEGER,
    chain TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_address);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_chain ON admin_actions(chain);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

