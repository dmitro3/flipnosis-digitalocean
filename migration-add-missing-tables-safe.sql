-- SAFE MIGRATION: Add Missing Tables to Server Database
-- This script only adds missing tables without modifying existing data
-- Run on server: 159.69.242.154
-- Database: /opt/flipnosis/app/server/flipz.db

-- ============================================================================
-- 1. GAME_EVENTS TABLE (Event-driven system)
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,  -- JSON data for the event
    target_users TEXT, -- JSON array of user addresses to notify
    processed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_processed ON game_events(processed);
CREATE INDEX IF NOT EXISTS idx_game_events_created ON game_events(created_at);

-- ============================================================================
-- 2. ADMIN_ACTIONS TABLE (XP and admin tracking)
-- ============================================================================
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_address);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_chain ON admin_actions(chain);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

-- ============================================================================
-- 3. READY_NFTS TABLE (NFT pre-loading system)
-- ============================================================================
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ready_nfts_player ON ready_nfts(player_address);
CREATE INDEX IF NOT EXISTS idx_ready_nfts_contract ON ready_nfts(nft_contract);
CREATE INDEX IF NOT EXISTS idx_ready_nfts_deposited ON ready_nfts(deposited_at);

-- ============================================================================
-- 4. GAME_SHARES TABLE (Social sharing XP system)
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    player_address TEXT NOT NULL,
    share_platform TEXT NOT NULL,
    xp_awarded BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_shares_game ON game_shares(game_id);
CREATE INDEX IF NOT EXISTS idx_game_shares_player ON game_shares(player_address);
CREATE INDEX IF NOT EXISTS idx_game_shares_platform ON game_shares(share_platform);

-- ============================================================================
-- 5. NOTIFICATIONS TABLE (User notification system)
-- ============================================================================
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================================================
-- 6. MESSAGES TABLE (General messaging system)
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'chat',
    message_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_address);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which tables were created
SELECT 'Migration completed successfully' as status;

-- Show all tables in database
SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Show table counts
SELECT 
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='game_events') as game_events_exists,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='admin_actions') as admin_actions_exists,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='ready_nfts') as ready_nfts_exists,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='game_shares') as game_shares_exists,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='notifications') as notifications_exists,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='messages') as messages_exists;

-- Show indexes created
SELECT name as index_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;
