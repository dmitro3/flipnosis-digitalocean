-- Create the database schema for Flipnosis
-- This creates all necessary tables based on the existing SQLite structure

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    contract_address VARCHAR(255),
    player1_address VARCHAR(255),
    player2_address VARCHAR(255),
    player1_choice VARCHAR(50),
    player2_choice VARCHAR(50),
    player1_deposit DECIMAL(20,8),
    player2_deposit DECIMAL(20,8),
    total_pot DECIMAL(20,8),
    winner_address VARCHAR(255),
    status VARCHAR(50) DEFAULT 'waiting',
    chain VARCHAR(50) DEFAULT 'base',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deposit_deadline TIMESTAMP,
    game_start_time TIMESTAMP,
    game_end_time TIMESTAMP,
    platform_fee DECIMAL(20,8) DEFAULT 0,
    winner_amount DECIMAL(20,8),
    loser_amount DECIMAL(20,8),
    transaction_hash VARCHAR(255),
    block_number INTEGER,
    gas_used INTEGER,
    gas_price DECIMAL(20,8),
    eth_amount DECIMAL(20,8)
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_winnings DECIMAL(20,8) DEFAULT 0,
    total_deposits DECIMAL(20,8) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    xp_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP,
    theme VARCHAR(50) DEFAULT 'default',
    notifications_enabled BOOLEAN DEFAULT true,
    email VARCHAR(255),
    discord_id VARCHAR(255),
    twitter_handle VARCHAR(255)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    sender_address VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'chat',
    message_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User presence table
CREATE TABLE IF NOT EXISTS user_presence (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    room_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'online',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    socket_id VARCHAR(255)
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(255) NOT NULL,
    offerer_address VARCHAR(255) NOT NULL,
    offer_amount DECIMAL(20,8) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(255) UNIQUE NOT NULL,
    seller_address VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_data JSONB,
    price DECIMAL(20,8) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255),
    amount DECIMAL(20,8) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    block_number INTEGER,
    gas_used INTEGER,
    gas_price DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    game_id VARCHAR(255),
    contract_address VARCHAR(255)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_game_id ON games(game_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_chain ON games(chain);
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_address);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_address);
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_presence_address ON user_presence(address);
CREATE INDEX IF NOT EXISTS idx_user_presence_room_id ON user_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_offerer ON offers(offerer_address);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_notifications_address ON notifications(address);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Grant permissions to flipnosis_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flipnosis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flipnosis_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO flipnosis_user;
