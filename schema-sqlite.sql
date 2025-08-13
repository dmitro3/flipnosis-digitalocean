-- Flipnosis Database Schema for SQLite
-- Based on database-master.txt

-- ADMIN_ACTIONS TABLE
CREATE TABLE IF NOT EXISTS admin_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_address TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_address TEXT,
    amount DECIMAL(20, 8),
    game_id INTEGER,
    chain TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_address);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_chain ON admin_actions(chain);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

-- GAMES TABLE
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    creator TEXT NOT NULL,
    joiner TEXT,
    nft_contract TEXT NOT NULL,
    nft_token_id TEXT NOT NULL,
    nft_name TEXT,
    nft_image TEXT,
    nft_collection TEXT,
    nft_chain TEXT DEFAULT 'base',
    price_usd REAL NOT NULL,
    rounds INTEGER NOT NULL DEFAULT 5,
    status TEXT DEFAULT 'waiting',
    winner TEXT,
    creator_wins INTEGER DEFAULT 0,
    joiner_wins INTEGER DEFAULT 0,
    current_round INTEGER DEFAULT 1,
    listing_fee_eth REAL,
    listing_fee_hash TEXT,
    entry_fee_hash TEXT,
    listing_fee_usd REAL,
    contract_game_id TEXT,
    transaction_hash TEXT,
    blockchain_game_id TEXT UNIQUE,
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
    joiner_role TEXT DEFAULT 'CHOOSER',
    joiner_choice TEXT DEFAULT 'HEADS',
    max_rounds INTEGER DEFAULT 5,
    last_action_time TIMESTAMP,
    countdown_end_time TIMESTAMP,
    auth_info TEXT,
    unclaimed_eth DECIMAL(20, 8) DEFAULT 0,
    unclaimed_usdc DECIMAL(20, 8) DEFAULT 0,
    unclaimed_nfts TEXT,
    total_spectators INTEGER DEFAULT 0,
    coin TEXT,
    game_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deposit_deadline TIMESTAMP,
    listing_id TEXT,
    challenger TEXT,
    coin_data TEXT,
    creator_deposited BOOLEAN DEFAULT 0,
    challenger_deposited BOOLEAN DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_games_chain ON games(chain);
CREATE INDEX IF NOT EXISTS idx_games_game_type ON games(game_type);
CREATE INDEX IF NOT EXISTS idx_games_status_chain ON games(status, chain);
CREATE INDEX IF NOT EXISTS idx_games_creator_chain ON games(creator, chain);
CREATE INDEX IF NOT EXISTS idx_games_joiner_chain ON games(joiner, chain);
CREATE INDEX IF NOT EXISTS idx_games_created_at_chain ON games(created_at, chain);

-- OFFERS TABLE
CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    offerer_address TEXT NOT NULL,
    offerer_name TEXT,
    offer_price REAL NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    username TEXT,
    profile_picture TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_flips INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LISTINGS TABLE
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
    listing_fee_paid BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'chat',
    message_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GAME_ROUNDS TABLE
CREATE TABLE IF NOT EXISTS game_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    creator_choice TEXT,
    challenger_choice TEXT,
    flip_result TEXT,
    round_winner TEXT,
    flipper_address TEXT,
    power_used INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- READY_NFTS TABLE
CREATE TABLE IF NOT EXISTS ready_nfts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    name TEXT,
    image TEXT,
    collection TEXT,
    chain TEXT DEFAULT 'base',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GAME_SHARES TABLE
CREATE TABLE IF NOT EXISTS game_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_address TEXT NOT NULL,
    share_platform TEXT NOT NULL,
    xp_awarded BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
