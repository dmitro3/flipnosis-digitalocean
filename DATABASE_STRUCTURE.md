# DATABASE STRUCTURE - NFT Flip Game Platform

## Overview
This document provides a complete breakdown of the database structure for the NFT Flip Game Platform. The system uses SQLite as the primary database with comprehensive tables for managing listings, offers, games, user profiles, and platform statistics.

## Database Configuration
- **Database Type**: SQLite3
- **Primary Database File**: `server/flipz-clean.db`
- **Backup Files**: `server/games.db`, `server/games-v2.db`
- **Environment Variable**: `DATABASE_PATH` (defaults to `server/flipz-clean.db`)

---

## CORE TABLES

### 1. LISTINGS TABLE
**Purpose**: Stores NFT listings that are available for offers before becoming games.

```sql
CREATE TABLE listings (
  id TEXT PRIMARY KEY,                    -- Unique listing identifier
  game_id TEXT UNIQUE,                    -- Associated game ID (if created)
  creator TEXT NOT NULL,                  -- Wallet address of listing creator
  nft_contract TEXT NOT NULL,             -- NFT contract address
  nft_token_id TEXT NOT NULL,             -- NFT token ID
  nft_name TEXT,                          -- NFT name/display name
  nft_image TEXT,                         -- NFT image URL
  nft_collection TEXT,                    -- NFT collection name
  nft_chain TEXT DEFAULT 'base',          -- Blockchain network
  asking_price REAL NOT NULL,             -- Price in USD
  status TEXT DEFAULT 'open',             -- open, closed, completed, cancelled
  coin_data TEXT,                         -- JSON string of coin customization data
  listing_fee_paid BOOLEAN DEFAULT false, -- Whether listing fee was paid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
)
```

**Key Relationships**:
- `game_id` → `games.id` (one-to-one)
- `creator` → `profiles.address` (many-to-one)

**Status Values**:
- `open`: Accepting offers
- `closed`: Offer accepted, game created
- `completed`: Game finished
- `cancelled`: Listing cancelled

---

### 2. OFFERS TABLE
**Purpose**: Stores offers made on listings by potential challengers.

```sql
CREATE TABLE offers (
  id TEXT PRIMARY KEY,                    -- Unique offer identifier
  listing_id TEXT NOT NULL,               -- Reference to listing
  offerer_address TEXT NOT NULL,          -- Wallet address of offerer
  offer_price REAL NOT NULL,              -- Offered price in USD
  message TEXT,                           -- Optional message with offer
  status TEXT DEFAULT 'pending',          -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id)
)
```

**Key Relationships**:
- `listing_id` → `listings.id` (many-to-one)
- `offerer_address` → `profiles.address` (many-to-one)

**Status Values**:
- `pending`: Awaiting creator response
- `accepted`: Offer accepted, game created
- `rejected`: Offer rejected

---

### 3. GAMES TABLE
**Purpose**: Stores active games created from accepted offers.

```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY,                    -- Unique game identifier
  listing_id TEXT NOT NULL,               -- Reference to original listing
  offer_id TEXT,                          -- Reference to accepted offer
  blockchain_game_id TEXT UNIQUE,         -- Smart contract game ID
  creator TEXT NOT NULL,                  -- Game creator (NFT owner)
  challenger TEXT,                        -- Game challenger (crypto depositor)
  nft_contract TEXT NOT NULL,             -- NFT contract address
  nft_token_id TEXT NOT NULL,             -- NFT token ID
  nft_name TEXT,                          -- NFT name
  nft_image TEXT,                         -- NFT image URL
  nft_collection TEXT,                    -- NFT collection
  final_price REAL NOT NULL,              -- Final game price in USD
  coin_data TEXT,                         -- JSON string of coin customization
  status TEXT DEFAULT 'waiting_deposits', -- Game status
  creator_deposited BOOLEAN DEFAULT false, -- NFT deposited flag
  challenger_deposited BOOLEAN DEFAULT false, -- Crypto deposited flag
  deposit_deadline TIMESTAMP,             -- Deposit deadline
  winner TEXT,                            -- Winner wallet address
  game_data TEXT,                         -- Additional game metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (offer_id) REFERENCES offers(id)
)
```

**Extended Fields** (from migration):
```sql
-- Additional columns added via migration
game_type TEXT DEFAULT 'nft-vs-crypto',           -- nft-vs-crypto, nft-vs-nft
challenger_nft_contract TEXT,                      -- For NFT vs NFT games
challenger_nft_token_id TEXT,                      -- For NFT vs NFT games
challenger_nft_name TEXT,                          -- For NFT vs NFT games
challenger_nft_image TEXT,                         -- For NFT vs NFT games
challenger_nft_collection TEXT,                    -- For NFT vs NFT games
contract_game_id INTEGER,                          -- Alternative contract ID
chain TEXT DEFAULT 'base',                         -- Blockchain network
payment_token TEXT DEFAULT 'ETH',                  -- ETH, USDC, etc.
payment_amount DECIMAL(20, 8),                     -- Payment amount
listing_fee_paid DECIMAL(20, 8),                   -- Listing fee amount
platform_fee_collected DECIMAL(20, 8),             -- Platform fee collected
creator_role TEXT DEFAULT 'FLIPPER',               -- FLIPPER, CHOOSER
joiner_role TEXT DEFAULT 'CHOOSER',                -- FLIPPER, CHOOSER
joiner_choice TEXT DEFAULT 'HEADS',                -- HEADS, TAILS
max_rounds INTEGER DEFAULT 5,                      -- Maximum rounds
current_round INTEGER DEFAULT 1,                   -- Current round
creator_wins INTEGER DEFAULT 0,                    -- Creator win count
joiner_wins INTEGER DEFAULT 0,                     -- Joiner win count
last_action_time TIMESTAMP,                        -- Last game action
countdown_end_time TIMESTAMP,                      -- Round countdown end
auth_info TEXT,                                    -- Authentication info
unclaimed_eth DECIMAL(20, 8) DEFAULT 0,            -- Unclaimed ETH rewards
unclaimed_usdc DECIMAL(20, 8) DEFAULT 0,           -- Unclaimed USDC rewards
unclaimed_nfts JSON                                -- Unclaimed NFTs
```

**Key Relationships**:
- `listing_id` → `listings.id` (many-to-one)
- `offer_id` → `offers.id` (one-to-one)
- `creator` → `profiles.address` (many-to-one)
- `challenger` → `profiles.address` (many-to-one)

**Status Values**:
- `waiting_deposits`: Waiting for both players to deposit
- `awaiting_challenger`: NFT deposited, waiting for challenger
- `waiting_challenger_deposit`: Offer accepted, waiting for crypto deposit
- `active`: Both assets deposited, game in progress
- `completed`: Game finished
- `cancelled`: Game cancelled
- `paused`: Game paused by admin

---

### 4. GAME_ROUNDS TABLE
**Purpose**: Stores individual round data for each game.

```sql
CREATE TABLE game_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  game_id TEXT NOT NULL,                  -- Reference to game
  round_number INTEGER NOT NULL,          -- Round number (1-5)
  creator_choice TEXT,                    -- Creator's choice (heads/tails)
  challenger_choice TEXT,                 -- Challenger's choice (heads/tails)
  flip_result TEXT,                       -- Actual flip result (heads/tails)
  round_winner TEXT,                      -- Winner of this round
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
)
```

**Key Relationships**:
- `game_id` → `games.id` (many-to-one)
- `round_winner` → `profiles.address` (many-to-one)

---

### 5. CHAT_MESSAGES TABLE
**Purpose**: Stores real-time chat messages for games.

```sql
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  room_id TEXT NOT NULL,                  -- Game/room identifier
  sender_address TEXT NOT NULL,           -- Sender's wallet address
  message TEXT NOT NULL,                  -- Message content
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Key Relationships**:
- `sender_address` → `profiles.address` (many-to-one)
- `room_id` → `games.id` or `listings.id` (many-to-one)

---

### 6. PROFILES TABLE
**Purpose**: Stores user profile information and preferences.

```sql
CREATE TABLE profiles (
  address TEXT PRIMARY KEY,               -- Wallet address (primary key)
  name TEXT,                              -- Display name
  avatar TEXT,                            -- Avatar image URL
  headsImage TEXT,                        -- Custom heads image URL
  tailsImage TEXT                         -- Custom tails image URL
)
```

---

### 7. READY_NFTS TABLE
**Purpose**: Stores pre-loaded NFTs for instant game creation.

```sql
CREATE TABLE ready_nfts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  player_address TEXT NOT NULL,           -- NFT owner address
  nft_contract TEXT NOT NULL,             -- NFT contract address
  nft_token_id TEXT NOT NULL,             -- NFT token ID
  nft_name TEXT,                          -- NFT name
  nft_image TEXT,                         -- NFT image URL
  nft_collection TEXT,                    -- NFT collection
  deposited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'preload',          -- preload, timeout_retention
  UNIQUE(player_address, nft_contract, nft_token_id)
)
```

**Key Relationships**:
- `player_address` → `profiles.address` (many-to-one)

**Source Values**:
- `preload`: Manually pre-loaded by user
- `timeout_retention`: Retained after game timeout

---

## STATISTICS & ANALYTICS TABLES

### 8. PLATFORM_STATS TABLE
**Purpose**: Stores daily platform statistics for analytics.

```sql
CREATE TABLE platform_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chain TEXT NOT NULL,                    -- Blockchain network
  date DATE NOT NULL,                     -- Date of stats
  total_games INTEGER DEFAULT 0,          -- Total games created
  active_games INTEGER DEFAULT 0,         -- Currently active games
  completed_games INTEGER DEFAULT 0,      -- Completed games
  total_volume DECIMAL(20, 8) DEFAULT 0,  -- Total volume in USD
  platform_fees DECIMAL(20, 8) DEFAULT 0, -- Platform fees collected
  listing_fees DECIMAL(20, 8) DEFAULT 0,  -- Listing fees collected
  unique_players INTEGER DEFAULT 0,       -- Unique players
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chain, date)
)
```

---

### 9. PLAYER_STATS TABLE
**Purpose**: Stores individual player statistics and achievements.

```sql
CREATE TABLE player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_address TEXT NOT NULL,             -- Player wallet address
  chain TEXT NOT NULL,                    -- Blockchain network
  total_games INTEGER DEFAULT 0,          -- Total games played
  games_won INTEGER DEFAULT 0,            -- Games won
  games_lost INTEGER DEFAULT 0,           -- Games lost
  total_volume DECIMAL(20, 8) DEFAULT 0,  -- Total volume generated
  total_fees_paid DECIMAL(20, 8) DEFAULT 0, -- Total fees paid
  total_rewards_earned DECIMAL(20, 8) DEFAULT 0, -- Total rewards earned
  nfts_in_contract INTEGER DEFAULT 0,     -- NFTs currently in contract
  unclaimed_eth DECIMAL(20, 8) DEFAULT 0, -- Unclaimed ETH
  unclaimed_usdc DECIMAL(20, 8) DEFAULT 0, -- Unclaimed USDC
  unclaimed_nfts JSON,                    -- Unclaimed NFTs
  last_activity TIMESTAMP,                -- Last activity timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_address, chain)
)
```

**Key Relationships**:
- `user_address` → `profiles.address` (many-to-one)

---

### 10. UNCLAIMED_REWARDS TABLE
**Purpose**: Tracks unclaimed rewards for users.

```sql
CREATE TABLE unclaimed_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_address TEXT NOT NULL,             -- User wallet address
  chain TEXT NOT NULL,                    -- Blockchain network
  reward_type TEXT NOT NULL,              -- ETH, USDC, NFT
  amount DECIMAL(20, 8) DEFAULT 0,        -- Reward amount
  nft_contract TEXT,                      -- NFT contract (for NFT rewards)
  nft_token_id INTEGER,                   -- NFT token ID (for NFT rewards)
  game_id INTEGER,                        -- Associated game
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP,                   -- When reward was claimed
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
  UNIQUE(user_address, chain, reward_type, nft_contract, nft_token_id)
)
```

**Key Relationships**:
- `user_address` → `profiles.address` (many-to-one)
- `game_id` → `games.id` (many-to-one)

---

### 11. NFT_TRACKING TABLE
**Purpose**: Tracks NFT ownership and status across the platform.

```sql
CREATE TABLE nft_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nft_contract TEXT NOT NULL,             -- NFT contract address
  token_id INTEGER NOT NULL,              -- NFT token ID
  owner_address TEXT NOT NULL,            -- Current owner
  chain TEXT NOT NULL,                    -- Blockchain network
  game_id INTEGER,                        -- Associated game
  status TEXT NOT NULL,                   -- IN_CONTRACT, UNCLAIMED, WITHDRAWN
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL,
  UNIQUE(nft_contract, token_id, chain)
)
```

**Key Relationships**:
- `owner_address` → `profiles.address` (many-to-one)
- `game_id` → `games.id` (many-to-one)

**Status Values**:
- `IN_CONTRACT`: NFT currently in smart contract
- `UNCLAIMED`: NFT won but not claimed
- `WITHDRAWN`: NFT withdrawn by owner

---

### 12. ADMIN_ACTIONS TABLE
**Purpose**: Logs administrative actions for audit trail.

```sql
CREATE TABLE admin_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_address TEXT NOT NULL,            -- Admin wallet address
  action_type TEXT NOT NULL,              -- Action type
  target_address TEXT,                    -- Target user address
  amount DECIMAL(20, 8),                  -- Amount involved
  game_id INTEGER,                        -- Associated game
  chain TEXT NOT NULL,                    -- Blockchain network
  details JSON,                           -- Additional action details
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
)
```

**Key Relationships**:
- `admin_address` → `profiles.address` (many-to-one)
- `game_id` → `games.id` (many-to-one)

**Action Types**:
- `UPDATE_FEE`: Fee structure updated
- `EMERGENCY_WITHDRAW`: Emergency withdrawal performed
- `CANCEL_GAME`: Game cancelled by admin
- `PAUSE_PLATFORM`: Platform paused
- `RESUME_PLATFORM`: Platform resumed

---

## DATABASE VIEWS

### 1. ACTIVE_GAMES_VIEW
**Purpose**: Provides a clean view of all active games across chains.

```sql
CREATE VIEW active_games_view AS
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
```

### 2. PLATFORM_OVERVIEW
**Purpose**: Provides platform-wide statistics and metrics.

```sql
CREATE VIEW platform_overview AS
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
```

---

## DATABASE INDEXES

### Performance Indexes
```sql
-- Games table indexes
CREATE INDEX idx_games_chain ON games(chain);
CREATE INDEX idx_games_game_type ON games(game_type);
CREATE INDEX idx_games_contract_game_id ON games(contract_game_id);
CREATE INDEX idx_games_status_chain ON games(status, chain);
CREATE INDEX idx_games_creator_chain ON games(creator, chain);
CREATE INDEX idx_games_joiner_chain ON games(joiner, chain);
CREATE INDEX idx_games_created_at_chain ON games(created_at, chain);

-- Game rounds indexes
CREATE INDEX idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number);

-- Unclaimed rewards indexes
CREATE INDEX idx_unclaimed_rewards_user ON unclaimed_rewards(user_address);
CREATE INDEX idx_unclaimed_rewards_chain ON unclaimed_rewards(chain);
CREATE INDEX idx_unclaimed_rewards_type ON unclaimed_rewards(reward_type);
CREATE INDEX idx_unclaimed_rewards_claimed ON unclaimed_rewards(claimed_at);

-- Platform stats indexes
CREATE INDEX idx_platform_stats_chain_date ON platform_stats(chain, date);
CREATE INDEX idx_platform_stats_date ON platform_stats(date);

-- Player stats indexes
CREATE INDEX idx_player_stats_user ON player_stats(user_address);
CREATE INDEX idx_player_stats_chain ON player_stats(chain);
CREATE INDEX idx_player_stats_volume ON player_stats(total_volume);

-- NFT tracking indexes
CREATE INDEX idx_nft_tracking_contract_token ON nft_tracking(nft_contract, token_id);
CREATE INDEX idx_nft_tracking_owner ON nft_tracking(owner_address);
CREATE INDEX idx_nft_tracking_chain ON nft_tracking(chain);
CREATE INDEX idx_nft_tracking_status ON nft_tracking(status);

-- Admin actions indexes
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_address);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_chain ON admin_actions(chain);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at);
```

---

## DATABASE TRIGGERS

### 1. Platform Stats Update Trigger
```sql
CREATE TRIGGER update_platform_stats_on_game_insert
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
```

### 2. Player Stats Update Trigger
```sql
CREATE TRIGGER update_player_stats_on_game_insert
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
```

### 3. NFT Tracking Update Trigger
```sql
CREATE TRIGGER update_nft_tracking_on_game_insert
AFTER INSERT ON games
BEGIN
    -- Track creator's NFT
    INSERT OR REPLACE INTO nft_tracking (nft_contract, token_id, owner_address, chain, game_id, status, updated_at)
    VALUES (NEW.nft_contract, NEW.nft_token_id, NEW.creator, NEW.chain, NEW.id, 'IN_CONTRACT', CURRENT_TIMESTAMP);
    
    -- Track challenger's NFT if NFT vs NFT game
    INSERT OR REPLACE INTO nft_tracking (nft_contract, token_id, owner_address, chain, game_id, status, updated_at)
    VALUES (NEW.challenger_nft_contract, NEW.challenger_nft_token_id, NEW.joiner, NEW.chain, NEW.id, 'IN_CONTRACT', CURRENT_TIMESTAMP);
END;
```

---

## DATA TYPES & CONSTRAINTS

### Text Fields
- **Addresses**: Ethereum addresses (42 characters, 0x prefix)
- **Contract IDs**: Smart contract addresses or generated IDs
- **Status**: Enumerated values (see status values for each table)
- **JSON Fields**: Stored as TEXT, parsed as JSON in application

### Numeric Fields
- **Prices**: REAL (floating point) for USD amounts
- **Token IDs**: TEXT (to handle large numbers)
- **Counts**: INTEGER for game counts, wins, etc.
- **Decimals**: DECIMAL(20, 8) for precise financial calculations

### Timestamp Fields
- **Created/Updated**: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **Deadlines**: TIMESTAMP for deposit deadlines, countdowns
- **Activity**: TIMESTAMP for last activity tracking

---

## RELATIONSHIP DIAGRAM

```
PROFILES (1) ←→ (N) LISTINGS
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) OFFERS
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (1) GAMES
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) GAME_ROUNDS
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) CHAT_MESSAGES
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) READY_NFTS
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) PLAYER_STATS
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) UNCLAIMED_REWARDS
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) NFT_TRACKING
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) ADMIN_ACTIONS
    ↑              ↓
    ↑              ↓
    ↑          (1) ←→ (N) PLATFORM_STATS
```

---

## MIGRATION HISTORY

### Version 1.0 (Initial Schema)
- Basic tables: listings, offers, games, game_rounds, chat_messages, profiles, ready_nfts

### Version 2.0 (Enhanced Schema)
- Added statistics tables: platform_stats, player_stats, unclaimed_rewards
- Added tracking tables: nft_tracking, admin_actions
- Added extended fields to games table for multi-chain support
- Added database views and triggers for automatic statistics updates

### Migration Script
- Location: `scripts/database-migration.sql`
- Handles all schema updates and data migrations
- Creates indexes and triggers for performance optimization

---

## BACKUP & MAINTENANCE

### Database Files
- **Primary**: `server/flipz-clean.db`
- **Backup 1**: `server/games.db`
- **Backup 2**: `server/games-v2.db`

### Maintenance Scripts
- **Clear Database**: `scripts/clearDatabase.js`
- **Check Consistency**: `scripts/checkGameConsistency.js`
- **Cleanup Invalid**: `scripts/cleanupInvalidGames.js`
- **Diagnostic Check**: `scripts/diagnostic-check.js`

### Backup Strategy
- Regular backups before major updates
- Version control for schema changes
- Migration scripts for safe updates

---

## SECURITY CONSIDERATIONS

### Data Protection
- Wallet addresses stored as plain text (required for blockchain interaction)
- No sensitive personal data stored
- All financial data stored as decimals for precision

### Access Control
- Database access restricted to server processes
- Admin actions logged for audit trail
- No direct user access to database

### Validation
- Foreign key constraints ensure data integrity
- Unique constraints prevent duplicate entries
- Check constraints validate status values

---

## PERFORMANCE OPTIMIZATION

### Indexing Strategy
- Primary keys on all tables
- Composite indexes for common queries
- Chain-specific indexes for multi-chain support

### Query Optimization
- Views for complex aggregations
- Triggers for automatic statistics updates
- Efficient joins using indexed foreign keys

### Storage Optimization
- TEXT fields for variable-length data
- INTEGER for counts and IDs
- DECIMAL for financial precision
- JSON for flexible metadata storage

---

This database structure supports a comprehensive NFT flipping game platform with multi-chain capabilities, real-time features, and extensive analytics tracking. 