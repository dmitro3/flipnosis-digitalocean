-- Database Migration for NFT Flip Game Platform Enhancement
-- This script adds new columns to support NFT vs NFT games, multi-chain support, and enhanced features

-- Add new columns to the games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'nft-vs-crypto';
ALTER TABLE games ADD COLUMN IF NOT EXISTS challenger_nft_contract TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS challenger_nft_token_id TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS challenger_nft_name TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS challenger_nft_image TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS challenger_nft_collection TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS contract_game_id INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'base';
ALTER TABLE games ADD COLUMN IF NOT EXISTS payment_token TEXT DEFAULT 'ETH';
ALTER TABLE games ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(20, 8);
ALTER TABLE games ADD COLUMN IF NOT EXISTS listing_fee_paid DECIMAL(20, 8);
ALTER TABLE games ADD COLUMN IF NOT EXISTS platform_fee_collected DECIMAL(20, 8);
ALTER TABLE games ADD COLUMN IF NOT EXISTS creator_role TEXT DEFAULT 'FLIPPER';
ALTER TABLE games ADD COLUMN IF NOT EXISTS joiner_role TEXT DEFAULT 'CHOOSER';
ALTER TABLE games ADD COLUMN IF NOT EXISTS joiner_choice TEXT DEFAULT 'HEADS';
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_rounds INTEGER DEFAULT 5;
ALTER TABLE games ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1;
ALTER TABLE games ADD COLUMN IF NOT EXISTS creator_wins INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS joiner_wins INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS last_action_time TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS countdown_end_time TIMESTAMP;
ALTER TABLE games ADD COLUMN IF NOT EXISTS auth_info TEXT;

-- Add new columns to track unclaimed rewards
ALTER TABLE games ADD COLUMN IF NOT EXISTS unclaimed_eth DECIMAL(20, 8) DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS unclaimed_usdc DECIMAL(20, 8) DEFAULT 0;
ALTER TABLE games ADD COLUMN IF NOT EXISTS unclaimed_nfts JSON;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_chain ON games(chain);
CREATE INDEX IF NOT EXISTS idx_games_game_type ON games(game_type);
CREATE INDEX IF NOT EXISTS idx_games_contract_game_id ON games(contract_game_id);
CREATE INDEX IF NOT EXISTS idx_games_status_chain ON games(status, chain);
CREATE INDEX IF NOT EXISTS idx_games_creator_chain ON games(creator, chain);
CREATE INDEX IF NOT EXISTS idx_games_joiner_chain ON games(joiner, chain);
CREATE INDEX IF NOT EXISTS idx_games_created_at_chain ON games(created_at, chain);

-- Create a new table for game rounds
CREATE TABLE IF NOT EXISTS game_rounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    result TEXT NOT NULL, -- 'HEADS' or 'TAILS'
    power INTEGER NOT NULL,
    flipper TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE(game_id, round_number)
);

-- Create indexes for game rounds
CREATE INDEX IF NOT EXISTS idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_round_number ON game_rounds(round_number);

-- Create a new table for unclaimed rewards tracking
CREATE TABLE IF NOT EXISTS unclaimed_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    reward_type TEXT NOT NULL, -- 'ETH', 'USDC', 'NFT'
    amount DECIMAL(20, 8) DEFAULT 0,
    nft_contract TEXT,
    nft_token_id INTEGER,
    game_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
    UNIQUE(user_address, chain, reward_type, nft_contract, nft_token_id)
);

-- Create indexes for unclaimed rewards
CREATE INDEX IF NOT EXISTS idx_unclaimed_rewards_user ON unclaimed_rewards(user_address);
CREATE INDEX IF NOT EXISTS idx_unclaimed_rewards_chain ON unclaimed_rewards(chain);
CREATE INDEX IF NOT EXISTS idx_unclaimed_rewards_type ON unclaimed_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_unclaimed_rewards_claimed ON unclaimed_rewards(claimed_at);

-- Create a new table for platform statistics
CREATE TABLE IF NOT EXISTS platform_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chain TEXT NOT NULL,
    date DATE NOT NULL,
    total_games INTEGER DEFAULT 0,
    active_games INTEGER DEFAULT 0,
    completed_games INTEGER DEFAULT 0,
    total_volume DECIMAL(20, 8) DEFAULT 0,
    platform_fees DECIMAL(20, 8) DEFAULT 0,
    listing_fees DECIMAL(20, 8) DEFAULT 0,
    unique_players INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chain, date)
);

-- Create indexes for platform stats
CREATE INDEX IF NOT EXISTS idx_platform_stats_chain_date ON platform_stats(chain, date);
CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats(date);

-- Create a new table for player statistics
CREATE TABLE IF NOT EXISTS player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    total_games INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    total_volume DECIMAL(20, 8) DEFAULT 0,
    total_fees_paid DECIMAL(20, 8) DEFAULT 0,
    total_rewards_earned DECIMAL(20, 8) DEFAULT 0,
    nfts_in_contract INTEGER DEFAULT 0,
    unclaimed_eth DECIMAL(20, 8) DEFAULT 0,
    unclaimed_usdc DECIMAL(20, 8) DEFAULT 0,
    unclaimed_nfts JSON,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_address, chain)
);

-- Create indexes for player stats
CREATE INDEX IF NOT EXISTS idx_player_stats_user ON player_stats(user_address);
CREATE INDEX IF NOT EXISTS idx_player_stats_chain ON player_stats(chain);
CREATE INDEX IF NOT EXISTS idx_player_stats_volume ON player_stats(total_volume);

-- Create a new table for NFT tracking
CREATE TABLE IF NOT EXISTS nft_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nft_contract TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    owner_address TEXT NOT NULL,
    chain TEXT NOT NULL,
    game_id INTEGER,
    status TEXT NOT NULL, -- 'IN_CONTRACT', 'UNCLAIMED', 'WITHDRAWN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
    UNIQUE(nft_contract, token_id, chain)
);

-- Create indexes for NFT tracking
CREATE INDEX IF NOT EXISTS idx_nft_tracking_contract_token ON nft_tracking(nft_contract, token_id);
CREATE INDEX IF NOT EXISTS idx_nft_tracking_owner ON nft_tracking(owner_address);
CREATE INDEX IF NOT EXISTS idx_nft_tracking_chain ON nft_tracking(chain);
CREATE INDEX IF NOT EXISTS idx_nft_tracking_status ON nft_tracking(status);

-- Create a new table for admin actions logging
CREATE TABLE IF NOT EXISTS admin_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_address TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'UPDATE_FEE', 'EMERGENCY_WITHDRAW', 'CANCEL_GAME'
    target_address TEXT,
    amount DECIMAL(20, 8),
    game_id INTEGER,
    chain TEXT NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
);

-- Create indexes for admin actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_address);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_chain ON admin_actions(chain);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

-- Insert default platform settings
INSERT OR IGNORE INTO platform_stats (chain, date, total_games, active_games, completed_games, total_volume, platform_fees, listing_fees, unique_players)
VALUES 
    ('base', DATE('now'), 0, 0, 0, 0, 0, 0, 0),
    ('ethereum', DATE('now'), 0, 0, 0, 0, 0, 0, 0),
    ('bnb', DATE('now'), 0, 0, 0, 0, 0, 0, 0),
    ('avalanche', DATE('now'), 0, 0, 0, 0, 0, 0, 0),
    ('polygon', DATE('now'), 0, 0, 0, 0, 0, 0, 0);

-- Create triggers to update platform stats
CREATE TRIGGER IF NOT EXISTS update_platform_stats_on_game_insert
AFTER INSERT ON games
BEGIN
    INSERT OR REPLACE INTO platform_stats (chain, date, total_games, active_games, unique_players, updated_at)
    SELECT 
        NEW.chain,
        DATE(NEW.created_at),
        COUNT(*) as total_games,
        SUM(CASE WHEN status IN ('waiting', 'joined', 'active') THEN 1 ELSE 0 END) as active_games,
        COUNT(DISTINCT creator) + COUNT(DISTINCT joiner) as unique_players,
        CURRENT_TIMESTAMP
    FROM games 
    WHERE chain = NEW.chain AND DATE(created_at) = DATE(NEW.created_at);
END;

-- Create trigger to update player stats
CREATE TRIGGER IF NOT EXISTS update_player_stats_on_game_insert
AFTER INSERT ON games
BEGIN
    -- Update creator stats
    INSERT OR REPLACE INTO player_stats (user_address, chain, total_games, last_activity, updated_at)
    SELECT 
        NEW.creator,
        NEW.chain,
        COUNT(*) as total_games,
        MAX(created_at) as last_activity,
        CURRENT_TIMESTAMP
    FROM games 
    WHERE creator = NEW.creator AND chain = NEW.chain;
    
    -- Update joiner stats if exists
    INSERT OR REPLACE INTO player_stats (user_address, chain, total_games, last_activity, updated_at)
    SELECT 
        NEW.joiner,
        NEW.chain,
        COUNT(*) as total_games,
        MAX(created_at) as last_activity,
        CURRENT_TIMESTAMP
    FROM games 
    WHERE joiner = NEW.joiner AND chain = NEW.chain;
END;

-- Create trigger to update NFT tracking
CREATE TRIGGER IF NOT EXISTS update_nft_tracking_on_game_insert
AFTER INSERT ON games
BEGIN
    -- Track creator's NFT
    INSERT OR REPLACE INTO nft_tracking (nft_contract, token_id, owner_address, chain, game_id, status, updated_at)
    VALUES (NEW.nft_contract, NEW.nft_token_id, NEW.creator, NEW.chain, NEW.id, 'IN_CONTRACT', CURRENT_TIMESTAMP);
    
    -- Track challenger's NFT if NFT vs NFT game
    INSERT OR REPLACE INTO nft_tracking (nft_contract, token_id, owner_address, chain, game_id, status, updated_at)
    VALUES (NEW.challenger_nft_contract, NEW.challenger_nft_token_id, NEW.joiner, NEW.chain, NEW.id, 'IN_CONTRACT', CURRENT_TIMESTAMP);
END;

-- Update existing games to have default values for new columns
UPDATE games SET 
    game_type = 'nft-vs-crypto',
    chain = 'base',
    payment_token = 'ETH',
    creator_role = 'FLIPPER',
    joiner_role = 'CHOOSER',
    joiner_choice = 'HEADS',
    max_rounds = 5,
    current_round = 1,
    creator_wins = 0,
    joiner_wins = 0
WHERE game_type IS NULL;

-- Create a view for active games across all chains
CREATE VIEW IF NOT EXISTS active_games_view AS
SELECT 
    g.*,
    CASE 
        WHEN g.status = 'waiting' THEN 'Waiting for Player'
        WHEN g.status = 'joined' THEN 'Player Joined'
        WHEN g.status = 'active' THEN 'In Progress'
        WHEN g.status = 'completed' THEN 'Completed'
        WHEN g.status = 'cancelled' THEN 'Cancelled'
        ELSE g.status
    END as status_display,
    CASE 
        WHEN g.game_type = 'nft-vs-nft' THEN 'NFT vs NFT'
        ELSE 'NFT vs Crypto'
    END as game_type_display
FROM games g
WHERE g.status IN ('waiting', 'joined', 'active')
ORDER BY g.created_at DESC;

-- Create a view for platform overview
CREATE VIEW IF NOT EXISTS platform_overview AS
SELECT 
    chain,
    COUNT(*) as total_games,
    SUM(CASE WHEN status IN ('waiting', 'joined', 'active') THEN 1 ELSE 0 END) as active_games,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_games,
    SUM(price_usd) as total_volume,
    SUM(platform_fee_collected) as total_platform_fees,
    SUM(listing_fee_paid) as total_listing_fees,
    COUNT(DISTINCT creator) + COUNT(DISTINCT joiner) as unique_players
FROM games
GROUP BY chain;

-- Print migration summary
SELECT 'Migration completed successfully!' as status;

-- Show summary of changes
SELECT 
    'Games table enhanced with new columns' as change,
    COUNT(*) as affected_rows
FROM games;

SELECT 
    'New tables created' as change,
    'game_rounds, unclaimed_rewards, platform_stats, player_stats, nft_tracking, admin_actions' as tables; 