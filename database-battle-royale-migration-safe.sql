-- Battle Royale Database Migration - Safe for older SQLite versions
-- This adds Battle Royale functionality without modifying existing tables

-- Battle Royale games (separate from regular games)
CREATE TABLE IF NOT EXISTS battle_royale_games (
  id TEXT PRIMARY KEY,
  creator TEXT NOT NULL,
  nft_contract TEXT NOT NULL,
  nft_token_id TEXT NOT NULL,
  nft_name TEXT,
  nft_image TEXT,
  nft_collection TEXT,
  entry_fee DECIMAL(20,8) NOT NULL,
  service_fee DECIMAL(20,8) NOT NULL,
  max_players INTEGER DEFAULT 8,
  current_players INTEGER DEFAULT 0,
  status TEXT DEFAULT 'filling',
  current_round INTEGER DEFAULT 1,
  target_result TEXT,
  round_deadline TIMESTAMP,
  winner_address TEXT,
  creator_payout DECIMAL(20,8) DEFAULT 0,
  platform_fee DECIMAL(20,8) DEFAULT 0,
  nft_deposited BOOLEAN DEFAULT 0,
  nft_deposit_time TIMESTAMP,
  nft_deposit_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track all participants in battle royale
CREATE TABLE IF NOT EXISTS battle_royale_participants (
  game_id TEXT NOT NULL,
  player_address TEXT NOT NULL,
  slot_number INTEGER NOT NULL,
  entry_paid BOOLEAN DEFAULT 0,
  entry_amount DECIMAL(20,8),
  entry_payment_hash TEXT,
  eliminated_round INTEGER,
  final_choice TEXT,
  coin_result TEXT,
  coin_power INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eliminated_at TIMESTAMP,
  PRIMARY KEY (game_id, player_address)
);

-- Track each round's results
CREATE TABLE IF NOT EXISTS battle_royale_rounds (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  target_result TEXT NOT NULL,
  players_before INTEGER NOT NULL,
  players_eliminated INTEGER NOT NULL,
  eliminated_players TEXT,
  surviving_players TEXT,
  round_duration INTEGER DEFAULT 20,
  round_start_time TIMESTAMP,
  round_end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track individual player flips within each round
CREATE TABLE IF NOT EXISTS battle_royale_flips (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  player_address TEXT NOT NULL,
  choice TEXT NOT NULL,
  power INTEGER DEFAULT 0,
  result TEXT,
  flip_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Battle Royale chat messages (separate from regular game chat)
CREATE TABLE IF NOT EXISTS battle_royale_chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_br_games_creator ON battle_royale_games(creator);
CREATE INDEX IF NOT EXISTS idx_br_games_status ON battle_royale_games(status);
CREATE INDEX IF NOT EXISTS idx_br_games_created ON battle_royale_games(created_at);
CREATE INDEX IF NOT EXISTS idx_br_participants_game ON battle_royale_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_br_participants_player ON battle_royale_participants(player_address);
CREATE INDEX IF NOT EXISTS idx_br_participants_status ON battle_royale_participants(status);
CREATE INDEX IF NOT EXISTS idx_br_rounds_game ON battle_royale_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_br_flips_game ON battle_royale_flips(game_id);
CREATE INDEX IF NOT EXISTS idx_br_flips_round ON battle_royale_flips(round_id);
CREATE INDEX IF NOT EXISTS idx_br_chat_game ON battle_royale_chat(game_id);

-- Check if game_type column exists before adding it
-- We'll do this safely by creating a backup and recreating tables if needed

-- For listings table
PRAGMA table_info(listings);

-- For games table  
PRAGMA table_info(games);

-- If the above shows no game_type column, we'll add it in a separate script
-- For now, Battle Royale will work without the game_type column distinction
