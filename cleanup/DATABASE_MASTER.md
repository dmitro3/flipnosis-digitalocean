# 🗄️ DATABASE MASTER - NFT Flip Game Platform

## Overview
This is the **MASTER DATABASE REFERENCE** for the NFT Flip Game Platform. This document contains the complete, up-to-date database structure that has been consolidated and implemented.

**Last Updated**: December 2024  
**Database Type**: SQLite3  
**Primary Database**: `/opt/flipnosis/app/server/flipz.db` (consolidated)  
**Status**: ✅ **IMPLEMENTED AND TESTED**

---

## 🎯 **DATABASE CONSOLIDATION STATUS**

### ✅ **COMPLETED ACTIONS:**
- **Database Analysis**: Analyzed all 4 database files
- **Schema Fixes**: Fixed all database schemas and added missing fields
- **Database Consolidation**: Merged all databases into one primary database
- **XP System Integration**: Complete XP system with memorable messages
- **Performance Optimization**: Added all necessary indexes

### 📊 **FINAL DATABASE STRUCTURE:**
- **18 Tables** with complete schema
- **All Missing Fields** added and standardized
- **Performance Indexes** implemented
- **XP System** fully integrated with sharing rewards
- **Data Migration** completed successfully

---

## 📋 **COMPLETE TABLE STRUCTURE**

### 1. **GAMES TABLE** (Core Game Data)
```sql
CREATE TABLE games (
  -- Core Game Data
  id TEXT PRIMARY KEY,                    -- Unique game identifier
  creator TEXT NOT NULL,                  -- Game creator (NFT owner)
  joiner TEXT,                            -- Game joiner/challenger
  nft_contract TEXT NOT NULL,             -- NFT contract address
  nft_token_id TEXT NOT NULL,             -- NFT token ID
  nft_name TEXT,                          -- NFT name
  nft_image TEXT,                         -- NFT image URL
  nft_collection TEXT,                    -- NFT collection
  nft_chain TEXT DEFAULT 'base',          -- Blockchain network
  price_usd REAL NOT NULL,                -- Game price in USD
  rounds INTEGER NOT NULL DEFAULT 5,      -- Number of rounds
  status TEXT DEFAULT 'waiting',          -- Game status
  winner TEXT,                            -- Winner wallet address
  
  -- Game Progress
  creator_wins INTEGER DEFAULT 0,         -- Creator win count
  joiner_wins INTEGER DEFAULT 0,          -- Joiner win count
  current_round INTEGER DEFAULT 1,        -- Current round number
  
  -- Financial Data
  listing_fee_eth REAL,                   -- Listing fee in ETH
  listing_fee_hash TEXT,                  -- Listing fee transaction hash
  entry_fee_hash TEXT,                    -- Entry fee transaction hash
  listing_fee_usd REAL,                   -- Listing fee in USD
  
  -- Blockchain Data
  contract_game_id TEXT,                  -- Smart contract game ID
  transaction_hash TEXT,                  -- Main transaction hash
  blockchain_game_id TEXT UNIQUE,         -- Alternative blockchain ID
  
  -- NFT vs NFT Game Support
  challenger_nft_name TEXT,               -- Challenger NFT name
  challenger_nft_image TEXT,              -- Challenger NFT image
  challenger_nft_collection TEXT,         -- Challenger NFT collection
  challenger_nft_contract TEXT,           -- Challenger NFT contract
  challenger_nft_token_id TEXT,           -- Challenger NFT token ID
  
  -- Enhanced Features
  game_type TEXT DEFAULT 'nft-vs-crypto', -- Game type
  chain TEXT DEFAULT 'base',              -- Blockchain network
  payment_token TEXT DEFAULT 'ETH',       -- Payment token
  payment_amount DECIMAL(20, 8),          -- Payment amount
  listing_fee_paid DECIMAL(20, 8),        -- Listing fee amount
  platform_fee_collected DECIMAL(20, 8),  -- Platform fee collected
  creator_role TEXT DEFAULT 'FLIPPER',    -- Creator role
  joiner_role TEXT DEFAULT 'CHOOSER',     -- Joiner role
  joiner_choice TEXT DEFAULT 'HEADS',     -- Joiner choice
  max_rounds INTEGER DEFAULT 5,           -- Maximum rounds
  last_action_time TIMESTAMP,             -- Last game action
  countdown_end_time TIMESTAMP,           -- Round countdown end
  auth_info TEXT,                         -- Authentication info
  unclaimed_eth DECIMAL(20, 8) DEFAULT 0, -- Unclaimed ETH rewards
  unclaimed_usdc DECIMAL(20, 8) DEFAULT 0, -- Unclaimed USDC rewards
  unclaimed_nfts TEXT,                    -- Unclaimed NFTs
  
  -- Metadata
  total_spectators INTEGER DEFAULT 0,     -- Total spectators
  coin TEXT,                              -- Coin customization data
  game_data TEXT,                         -- Additional game metadata
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,                    -- When game started
  completed_at DATETIME,                  -- When game completed
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 2. **PROFILES TABLE** (User Profiles with XP System)
```sql
CREATE TABLE profiles (
  address TEXT PRIMARY KEY,               -- Wallet address (primary key)
  name TEXT,                              -- Display name
  avatar TEXT,                            -- Avatar image URL
  headsImage TEXT,                        -- Custom heads image URL
  tailsImage TEXT,                        -- Custom tails image URL
  
  -- Social Media
  twitter TEXT,                           -- Twitter handle
  telegram TEXT,                          -- Telegram handle
  
  -- XP System
  xp INTEGER DEFAULT 0,                   -- Experience points
  heads_image TEXT,                       -- Alternative heads image field
  tails_image TEXT,                       -- Alternative tails image field
  
  -- XP Achievement Tracking (Boolean flags)
  xp_name_earned BOOLEAN DEFAULT FALSE,   -- XP earned for setting name
  xp_avatar_earned BOOLEAN DEFAULT FALSE, -- XP earned for setting avatar
  xp_twitter_earned BOOLEAN DEFAULT FALSE, -- XP earned for setting twitter
  xp_telegram_earned BOOLEAN DEFAULT FALSE, -- XP earned for setting telegram
  xp_heads_earned BOOLEAN DEFAULT FALSE,  -- XP earned for setting heads image
  xp_tails_earned BOOLEAN DEFAULT FALSE,  -- XP earned for setting tails image
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 3. **LISTINGS TABLE** (NFT Listings)
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

### 4. **OFFERS TABLE** (Game Offers)
```sql
CREATE TABLE offers (
  id TEXT PRIMARY KEY,                    -- Unique offer identifier
  listing_id TEXT NOT NULL,               -- Reference to listing
  offerer_address TEXT NOT NULL,          -- Wallet address of offerer
  offerer_name TEXT,                      -- Offerer display name
  offer_price REAL NOT NULL,              -- Offered price in USD
  message TEXT,                           -- Optional message with offer
  status TEXT DEFAULT 'pending',          -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id)
)
```

### 5. **GAME_ROUNDS TABLE** (Round Data)
```sql
CREATE TABLE game_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  game_id TEXT NOT NULL,                  -- Reference to game
  round_number INTEGER NOT NULL,          -- Round number (1-5)
  creator_choice TEXT,                    -- Creator's choice (heads/tails)
  challenger_choice TEXT,                 -- Challenger's choice (heads/tails)
  flip_result TEXT,                       -- Actual flip result (heads/tails)
  round_winner TEXT,                      -- Winner of this round
  flipper_address TEXT NOT NULL,          -- Address of the flipper
  power_used REAL,                        -- Power used in flip
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
)
```

### 6. **CHAT_MESSAGES TABLE** (Chat History)
```sql
CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  room_id TEXT NOT NULL,                  -- Game/room identifier
  sender_address TEXT NOT NULL,           -- Sender's wallet address
  message TEXT NOT NULL,                  -- Message content
  message_type TEXT DEFAULT 'chat',       -- Message type (chat, system, etc.)
  message_data TEXT,                      -- Additional message data (JSON)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 7. **READY_NFTS TABLE** (Pre-loaded NFTs)
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

### 8. **TRANSACTIONS TABLE** (Transaction Tracking)
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  game_id TEXT,                           -- Associated game
  player_address TEXT NOT NULL,           -- Player wallet address
  transaction_type TEXT NOT NULL,         -- Type of transaction
  amount_usd REAL NOT NULL,               -- Amount in USD
  amount_eth REAL NOT NULL,               -- Amount in ETH
  tx_hash TEXT NOT NULL,                  -- Transaction hash
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
)
```

### 9. **NFT_METADATA_CACHE TABLE** (NFT Metadata Cache)
```sql
CREATE TABLE nft_metadata_cache (
  contract_address TEXT NOT NULL,         -- NFT contract address
  token_id TEXT NOT NULL,                 -- NFT token ID
  chain TEXT NOT NULL,                    -- Blockchain network
  name TEXT,                              -- NFT name
  image_url TEXT,                         -- NFT image URL
  collection_name TEXT,                   -- Collection name
  description TEXT,                       -- NFT description
  attributes TEXT,                        -- NFT attributes (JSON)
  token_type TEXT,                        -- Token type (ERC721, ERC1155)
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contract_address, token_id, chain)
)
```

### 10. **GAME_LISTINGS TABLE** (Alternative Listings)
```sql
CREATE TABLE game_listings (
  id TEXT PRIMARY KEY,                    -- Unique listing identifier
  creator TEXT NOT NULL,                  -- Wallet address of listing creator
  nft_contract TEXT NOT NULL,             -- NFT contract address
  nft_token_id TEXT NOT NULL,             -- NFT token ID
  nft_name TEXT,                          -- NFT name
  nft_image TEXT,                         -- NFT image URL
  nft_collection TEXT,                    -- NFT collection
  nft_chain TEXT,                         -- Blockchain network
  asking_price REAL NOT NULL,             -- Price in USD
  accepts_offers BOOLEAN,                 -- Whether accepts offers
  min_offer_price REAL,                   -- Minimum offer price
  coin TEXT,                              -- Coin customization
  status TEXT,                            -- Listing status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contract_game_id TEXT,                  -- Associated contract game ID
  transaction_hash TEXT                   -- Transaction hash
)
```

### 11. **NOTIFICATIONS TABLE** (User Notifications)
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,                    -- Unique notification ID
  user_address TEXT NOT NULL,             -- User wallet address
  type TEXT NOT NULL,                     -- Notification type
  title TEXT NOT NULL,                    -- Notification title
  message TEXT NOT NULL,                  -- Notification message
  data TEXT,                              -- Additional data (JSON)
  read BOOLEAN DEFAULT FALSE,             -- Whether notification is read
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 12. **USER_PRESENCE TABLE** (Online Presence)
```sql
CREATE TABLE user_presence (
  address TEXT PRIMARY KEY,               -- User wallet address
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Last activity
  is_online BOOLEAN DEFAULT FALSE,        -- Online status
  socket_id TEXT                          -- WebSocket connection ID
)
```

### 13. **PLAYER_STATS TABLE** (Player Statistics)
```sql
CREATE TABLE player_stats (
  address TEXT PRIMARY KEY,               -- Player wallet address
  total_games INTEGER DEFAULT 0,          -- Total games played
  games_won INTEGER DEFAULT 0,            -- Games won
  games_lost INTEGER DEFAULT 0,           -- Games lost
  total_winnings_usd REAL DEFAULT 0,      -- Total winnings in USD
  total_spent_usd REAL DEFAULT 0,         -- Total spent in USD
  favorite_chain TEXT,                    -- Favorite blockchain
  first_game_date DATETIME,               -- First game date
  last_game_date DATETIME                 -- Last game date
)
```

### 14. **PLATFORM_STATS TABLE** (Platform Analytics)
```sql
CREATE TABLE platform_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
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

### 15. **UNCLAIMED_REWARDS TABLE** (Reward Tracking)
```sql
CREATE TABLE unclaimed_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
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

### 16. **NFT_TRACKING TABLE** (NFT Ownership Tracking)
```sql
CREATE TABLE nft_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
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

### 17. **GAME_SHARES TABLE** (Game Sharing XP Tracking)
```sql
CREATE TABLE game_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  game_id TEXT NOT NULL,                  -- Game being shared
  player_address TEXT NOT NULL,           -- Player who shared
  share_platform TEXT NOT NULL,           -- Platform (twitter, telegram)
  xp_awarded BOOLEAN DEFAULT FALSE,       -- Whether XP was awarded
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, player_address, share_platform)
)
```

### 18. **ADMIN_ACTIONS TABLE** (Admin Audit Trail)
```sql
CREATE TABLE admin_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Auto-incrementing ID
  admin_address TEXT NOT NULL,            -- Admin wallet address
  action_type TEXT NOT NULL,              -- Action type
  target_address TEXT,                    -- Target user address
  amount DECIMAL(20, 8),                  -- Amount involved
  game_id INTEGER,                        -- Associated game
  chain TEXT NOT NULL,                    -- Blockchain network
  details TEXT,                           -- Additional action details (JSON)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
)
```

---

## 🎮 **XP SYSTEM INTEGRATION**

### **XP Award Structure:**
- **Profile Completion**: 250 XP each (name, avatar, twitter, telegram, custom heads, custom tails)
- **Game Outcomes**: 750 XP for winning, 250 XP for losing
- **Game Sharing**: 100 XP per game shared (Twitter/Telegram only, once per game per platform)
- **Special Achievements**: 250 XP each (first game, winning streak, etc.)

### **XP Award Messages:**
```
Profile Completion:
+250 XP! You've claimed your identity!
+250 XP! Your avatar is now loaded!
+250 XP! Tweet tweet!
+250 XP! Telegram connected!
+250 XP! Custom heads loaded!
+250 XP! Custom tails loaded!

Game Outcomes:
+750 XP! VICTORY!
+250 XP! Courage rewarded! Keep flipping!

Game Sharing:
+100 XP! Game shared! Spreading the Flipnosis love!
```

### **XP System Features:**
- **Boolean Tracking**: XP only awarded once per achievement
- **Level System**: `level = floor(sqrt(xp/100)) + 1`
- **Leaderboards**: Global rankings by XP
- **Achievement Tracking**: Visual progress indicators
- **Memorable Messages**: Custom notifications for each achievement

---

## 📊 **PERFORMANCE INDEXES**

### **Core Indexes:**
```sql
-- Games table indexes
CREATE INDEX idx_games_chain ON games(chain);
CREATE INDEX idx_games_game_type ON games(game_type);
CREATE INDEX idx_games_status_chain ON games(status, chain);
CREATE INDEX idx_games_creator_chain ON games(creator, chain);
CREATE INDEX idx_games_joiner_chain ON games(joiner, chain);
CREATE INDEX idx_games_created_at_chain ON games(created_at, chain);

-- Game rounds indexes
CREATE INDEX idx_game_rounds_game_id ON game_rounds(game_id);
CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number);

-- Profile indexes
CREATE INDEX idx_profiles_xp ON profiles(xp);
CREATE INDEX idx_profiles_address ON profiles(address);

-- Transaction indexes
CREATE INDEX idx_transactions_game_id ON transactions(game_id);
CREATE INDEX idx_transactions_player ON transactions(player_address);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_address);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);

-- User presence indexes
CREATE INDEX idx_user_presence_online ON user_presence(is_online);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);

-- Player stats indexes
CREATE INDEX idx_player_stats_user ON player_stats(address);
CREATE INDEX idx_player_stats_chain ON player_stats(favorite_chain);

-- Platform stats indexes
CREATE INDEX idx_platform_stats_chain_date ON platform_stats(chain, date);
CREATE INDEX idx_platform_stats_date ON platform_stats(date);

-- Unclaimed rewards indexes
CREATE INDEX idx_unclaimed_rewards_user ON unclaimed_rewards(user_address);
CREATE INDEX idx_unclaimed_rewards_chain ON unclaimed_rewards(chain);
CREATE INDEX idx_unclaimed_rewards_type ON unclaimed_rewards(reward_type);

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

## 🚀 **API ENDPOINTS**

### **XP Management:**
- `POST /api/users/:address/award-xp` - Award special XP
- `POST /api/users/:address/game-xp` - Award game outcome XP
- `POST /api/games/:gameId/share` - Award XP for sharing game
- `GET /api/users/:address/xp` - Get user XP and level
- `GET /api/leaderboard/xp` - Get XP leaderboard
- `GET /api/users/:address/achievements` - Get user achievements

### **Enhanced Profile:**
- `PUT /api/profile/:address` - Updated with XP awards
- `GET /api/profile/:address` - Enhanced with XP data

---

## 📋 **IMPLEMENTATION STATUS**

### ✅ **COMPLETED:**
- [x] Database consolidation into single source of truth
- [x] Complete XP system with memorable messages
- [x] All missing fields added to existing tables
- [x] All missing tables created
- [x] Performance indexes implemented
- [x] API integration completed
- [x] Frontend notification system
- [x] Testing and verification

### 🎯 **READY FOR PRODUCTION:**
- **Primary Database**: `/opt/flipnosis/app/server/flipz.db`
- **XP System**: Fully functional with award messages
- **API Integration**: Complete with all endpoints
- **Performance**: Optimized with indexes
- **Data Migration**: All data consolidated

---

## 🔧 **USAGE INSTRUCTIONS**

### **For Developers:**
```javascript
// Use the consolidated database
const dbPath = '/opt/flipnosis/app/server/flipz.db';

// XP Service usage
const { XPService } = require('./server/services/xpService');
const xpService = new XPService(dbPath);
await xpService.initialize();

// Award profile XP
const result = await xpService.awardProfileXP(address, 'name', 'PlayerName');

// Award game XP
const result = await xpService.awardGameXP(address, 'won', gameId);
```

### **For Frontend:**
```javascript
import { XPNotificationManager, useXPNotifications } from './src/components/XPNotification';

// Add to your app
<XPNotificationManager />

// Use in components
const { showNotification } = useXPNotifications();
showNotification("**+250 XP!** You've claimed your identity!");
```

---

## 🎉 **SUMMARY**

This **DATABASE_MASTER.md** file serves as the single source of truth for all database-related information in the NFT Flip Game Platform. It contains:

✅ **Complete Database Structure** - All 17 tables with full schema  
✅ **XP System Integration** - Complete with memorable messages  
✅ **Performance Optimization** - All necessary indexes  
✅ **API Documentation** - All endpoints and usage  
✅ **Implementation Status** - Current state and readiness  
✅ **Usage Instructions** - For developers and frontend integration  

**This file should be referenced by all future development work and other chat sessions for database-related questions and implementations.** 