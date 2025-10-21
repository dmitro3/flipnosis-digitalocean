-- Battle Royale Database Schema Extension
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
  nft_chain TEXT DEFAULT 'base',
  entry_fee DECIMAL(20,8) NOT NULL, -- $5.00
  service_fee DECIMAL(20,8) NOT NULL, -- $0.50
  max_players INTEGER DEFAULT 8,
  current_players INTEGER DEFAULT 0,
  status TEXT DEFAULT 'filling', -- filling, active, complete, cancelled
  current_round INTEGER DEFAULT 1,
  target_result TEXT, -- Current round's target (heads/tails)
  round_deadline TIMESTAMP,
  winner_address TEXT,
  creator_payout DECIMAL(20,8) DEFAULT 0, -- Total entry fees minus platform fee
  platform_fee DECIMAL(20,8) DEFAULT 0,
  nft_deposited BOOLEAN DEFAULT FALSE,
  nft_deposit_time TIMESTAMP,
  nft_deposit_hash TEXT,
  room_type TEXT DEFAULT 'potion',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track all participants in battle royale
CREATE TABLE IF NOT EXISTS battle_royale_participants (
  game_id TEXT NOT NULL,
  player_address TEXT NOT NULL,
  slot_number INTEGER NOT NULL, -- 1-8, for UI positioning
  entry_paid BOOLEAN DEFAULT FALSE,
  entry_amount DECIMAL(20,8),
  entry_payment_hash TEXT,
  eliminated_round INTEGER, -- NULL if still active
  final_choice TEXT, -- heads/tails for current round
  coin_result TEXT, -- what their coin landed on
  coin_power INTEGER DEFAULT 0, -- power used for flip
  status TEXT DEFAULT 'active', -- active, eliminated, winner
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  eliminated_at TIMESTAMP,
  PRIMARY KEY (game_id, player_address),
  FOREIGN KEY (game_id) REFERENCES battle_royale_games(id)
);

-- Track each round's results
CREATE TABLE IF NOT EXISTS battle_royale_rounds (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  target_result TEXT NOT NULL, -- heads or tails
  players_before INTEGER NOT NULL,
  players_eliminated INTEGER NOT NULL,
  eliminated_players TEXT, -- JSON array of addresses
  surviving_players TEXT, -- JSON array of addresses
  round_duration INTEGER DEFAULT 20, -- seconds
  round_start_time TIMESTAMP,
  round_end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES battle_royale_games(id)
);

-- Track individual player flips within each round
CREATE TABLE IF NOT EXISTS battle_royale_flips (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  player_address TEXT NOT NULL,
  choice TEXT NOT NULL, -- heads or tails
  power INTEGER DEFAULT 0, -- 0-10
  result TEXT, -- heads or tails (actual flip result)
  flip_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES battle_royale_games(id),
  FOREIGN KEY (round_id) REFERENCES battle_royale_rounds(id)
);

-- Battle Royale chat messages (separate from regular game chat)
CREATE TABLE IF NOT EXISTS battle_royale_chat (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES battle_royale_games(id)
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

-- Add game_type to existing tables to distinguish between modes
-- This is safe as it only adds a column with a default value
ALTER TABLE listings ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'nft-vs-crypto';
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'nft-vs-crypto';

-- Create indexes on the new game_type columns
CREATE INDEX IF NOT EXISTS idx_listings_game_type ON listings(game_type);
CREATE INDEX IF NOT EXISTS idx_games_game_type ON games(game_type);
