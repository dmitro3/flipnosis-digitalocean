-- Create flip_collections table to track FLIP token collections
CREATE TABLE IF NOT EXISTS flip_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  player_address TEXT NOT NULL,
  total_flip_earned INTEGER NOT NULL DEFAULT 0,
  flip_collected INTEGER NOT NULL DEFAULT 0,
  collection_status TEXT DEFAULT 'pending', -- 'pending', 'collected', 'expired'
  game_result TEXT, -- 'won', 'lost'
  nft_claimed BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL,
  collected_at TEXT,
  expires_at TEXT
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_flip_collections_game_id ON flip_collections(game_id);
CREATE INDEX IF NOT EXISTS idx_flip_collections_player_address ON flip_collections(player_address);
CREATE INDEX IF NOT EXISTS idx_flip_collections_status ON flip_collections(collection_status);

-- Create flip_earnings table to track individual FLIP earnings during gameplay
CREATE TABLE IF NOT EXISTS flip_earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  player_address TEXT NOT NULL,
  flip_amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'coin_flip_reward', 'game_completion', 'win_bonus', etc.
  collection_id INTEGER,
  earned_at TEXT NOT NULL,
  FOREIGN KEY (collection_id) REFERENCES flip_collections(id)
);

-- Create indexes for flip_earnings
CREATE INDEX IF NOT EXISTS idx_flip_earnings_game_id ON flip_earnings(game_id);
CREATE INDEX IF NOT EXISTS idx_flip_earnings_player_address ON flip_earnings(player_address);
CREATE INDEX IF NOT EXISTS idx_flip_earnings_collection_id ON flip_earnings(collection_id);
