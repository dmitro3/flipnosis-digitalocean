-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  heads_image TEXT,
  tails_image TEXT,
  twitter TEXT,
  telegram TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address);

-- Create offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  game_id TEXT,
  nft_contract TEXT,
  nft_token_id TEXT,
  nft_name TEXT,
  nft_image TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for offers table
CREATE INDEX IF NOT EXISTS idx_offers_from_address ON offers(from_address);
CREATE INDEX IF NOT EXISTS idx_offers_to_address ON offers(to_address);
CREATE INDEX IF NOT EXISTS idx_offers_game_id ON offers(game_id); 