# DATABASE FIELD COMPARISON ANALYSIS

## Overview
This document compares the database fields being used in the CreateFlip and UnifiedGamePage components against the actual database structure to identify any mismatches or missing fields.

---

## CREATE FLIP PAGE ANALYSIS

### Fields Being Written to Database

#### ✅ **CORRECT FIELDS** (Exist in Database Structure)

**Listings Table:**
- `id` ✅ (TEXT PRIMARY KEY)
- `game_id` ✅ (TEXT UNIQUE)
- `creator` ✅ (TEXT NOT NULL)
- `nft_contract` ✅ (TEXT NOT NULL)
- `nft_token_id` ✅ (TEXT NOT NULL)
- `nft_name` ✅ (TEXT)
- `nft_image` ✅ (TEXT)
- `nft_collection` ✅ (TEXT)
- `nft_chain` ✅ (TEXT DEFAULT 'base')
- `asking_price` ✅ (REAL NOT NULL)
- `coin_data` ✅ (TEXT - JSON string)
- `status` ✅ (TEXT DEFAULT 'open')

**Games Table:**
- `id` ✅ (TEXT PRIMARY KEY)
- `listing_id` ✅ (TEXT NOT NULL)
- `creator` ✅ (TEXT NOT NULL)
- `nft_contract` ✅ (TEXT NOT NULL)
- `nft_token_id` ✅ (TEXT NOT NULL)
- `nft_name` ✅ (TEXT)
- `nft_image` ✅ (TEXT)
- `nft_collection` ✅ (TEXT)
- `final_price` ✅ (REAL NOT NULL)
- `coin_data` ✅ (TEXT - JSON string)
- `status` ✅ (TEXT DEFAULT 'waiting_deposits')

#### ❌ **MISSING FIELDS** (Not in Database Structure)

**Listings Table:**
- `game_type` ❌ **MISSING** - This field is being written but doesn't exist in the database structure

**Games Table:**
- `game_type` ✅ (Exists in extended fields from migration)

---

## UNIFIED GAME PAGE ANALYSIS

### Fields Being Read from Database

#### ✅ **CORRECT FIELDS** (Exist in Database Structure)

**Games Table:**
- `id` ✅ (TEXT PRIMARY KEY)
- `creator` ✅ (TEXT NOT NULL)
- `challenger` ✅ (TEXT)
- `nft_contract` ✅ (TEXT NOT NULL)
- `nft_token_id` ✅ (TEXT NOT NULL)
- `nft_name` ✅ (TEXT)
- `nft_image` ✅ (TEXT)
- `nft_collection` ✅ (TEXT)
- `final_price` ✅ (REAL NOT NULL)
- `coin_data` ✅ (TEXT - JSON string)
- `status` ✅ (TEXT DEFAULT 'waiting_deposits')
- `creator_deposited` ✅ (BOOLEAN DEFAULT false)
- `challenger_deposited` ✅ (BOOLEAN DEFAULT false)
- `winner` ✅ (TEXT)
- `created_at` ✅ (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` ✅ (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Extended Fields (from migration):**
- `game_type` ✅ (TEXT DEFAULT 'nft-vs-crypto')
- `chain` ✅ (TEXT DEFAULT 'base')
- `payment_token` ✅ (TEXT DEFAULT 'ETH')
- `payment_amount` ✅ (DECIMAL(20, 8))
- `listing_fee_paid` ✅ (DECIMAL(20, 8))
- `platform_fee_collected` ✅ (DECIMAL(20, 8))
- `creator_role` ✅ (TEXT DEFAULT 'FLIPPER')
- `joiner_role` ✅ (TEXT DEFAULT 'CHOOSER')
- `joiner_choice` ✅ (TEXT DEFAULT 'HEADS')
- `max_rounds` ✅ (INTEGER DEFAULT 5)
- `current_round` ✅ (INTEGER DEFAULT 1)
- `creator_wins` ✅ (INTEGER DEFAULT 0)
- `joiner_wins` ✅ (INTEGER DEFAULT 0)
- `last_action_time` ✅ (TIMESTAMP)
- `countdown_end_time` ✅ (TIMESTAMP)

#### ⚠️ **POTENTIAL ISSUES** (Field Access Patterns)

**Coin Data Access:**
The UnifiedGamePage tries multiple field names for coin data:
1. `gameData.coinData` ✅ (Correct field name)
2. `gameData.coin_data` ✅ (Alternative field name)
3. `gameData.coin` ❌ **MISSING** - This field doesn't exist in database

**NFT Data Access:**
The UnifiedGamePage tries multiple field patterns:
1. `gameData.nft_image` ✅ (Correct field name)
2. `gameData.nft?.image` ❌ **MISSING** - No nested `nft` object in database
3. `gameData.nftImage` ❌ **MISSING** - Field doesn't exist

---

## SERVER API ANALYSIS

### Fields Being Written by Server

#### ✅ **CORRECT FIELDS** (Exist in Database Structure)

**Listings Table:**
- All fields being written exist ✅

**Games Table:**
- All fields being written exist ✅

**Offers Table:**
- `id` ✅ (TEXT PRIMARY KEY)
- `listing_id` ✅ (TEXT NOT NULL)
- `offerer_address` ✅ (TEXT NOT NULL)
- `offer_price` ✅ (REAL NOT NULL)
- `message` ✅ (TEXT)
- `status` ✅ (TEXT DEFAULT 'pending')
- `created_at` ✅ (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` ✅ (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

**Profiles Table:**
- `address` ✅ (TEXT PRIMARY KEY)
- `name` ✅ (TEXT)
- `avatar` ✅ (TEXT)
- `headsImage` ✅ (TEXT)
- `tailsImage` ✅ (TEXT)

**Ready NFTs Table:**
- `player_address` ✅ (TEXT NOT NULL)
- `nft_contract` ✅ (TEXT NOT NULL)
- `nft_token_id` ✅ (TEXT NOT NULL)
- `nft_name` ✅ (TEXT)
- `nft_image` ✅ (TEXT)
- `nft_collection` ✅ (TEXT)
- `source` ✅ (TEXT DEFAULT 'preload')

---

## CRITICAL ISSUES FOUND

### 1. **MISSING FIELD: `game_type` in Listings Table**

**Problem:**
- CreateFlip is writing `game_type` to the listings table
- This field doesn't exist in the database structure
- This will cause database errors

**Solution:**
Add the missing field to the listings table:
```sql
ALTER TABLE listings ADD COLUMN game_type TEXT DEFAULT 'nft-vs-crypto';
```

### 2. **INCONSISTENT FIELD ACCESS PATTERNS**

**Problem:**
- UnifiedGamePage tries to access `gameData.coin` which doesn't exist
- UnifiedGamePage tries to access `gameData.nft?.image` but there's no nested `nft` object
- UnifiedGamePage tries to access `gameData.nftImage` which doesn't exist

**Solution:**
Update the field access patterns to use the correct field names:
- Use `gameData.coin_data` or `gameData.coinData` instead of `gameData.coin`
- Use `gameData.nft_image` instead of `gameData.nft?.image` or `gameData.nftImage`

### 3. **POTENTIAL DATA TYPE MISMATCHES**

**Problem:**
- CreateFlip sends `coin_data` as a JSON string
- UnifiedGamePage expects it as a parsed object
- This could cause parsing errors

**Solution:**
Ensure consistent JSON handling:
- Always stringify when writing to database
- Always parse when reading from database

---

## RECOMMENDED FIXES

### 1. **Add Missing Database Field**

```sql
-- Add missing game_type field to listings table
ALTER TABLE listings ADD COLUMN game_type TEXT DEFAULT 'nft-vs-crypto';
```

### 2. **Update UnifiedGamePage Field Access**

```javascript
// Replace these incorrect field accesses:
gameData.coin
gameData.nft?.image
gameData.nftImage

// With these correct field accesses:
gameData.coin_data || gameData.coinData
gameData.nft_image
gameData.nft_name
```

### 3. **Standardize Coin Data Handling**

```javascript
// In CreateFlip - ensure consistent JSON stringification
coin_data: JSON.stringify({
  type: selectedCoin.type,
  headsImage: selectedCoin.headsImage,
  tailsImage: selectedCoin.tailsImage,
  isCustom: selectedCoin.isCustom
})

// In UnifiedGamePage - ensure consistent JSON parsing
let coinData = null
if (gameData?.coinData) {
  coinData = typeof gameData.coinData === 'string' ? 
    JSON.parse(gameData.coinData) : gameData.coinData
} else if (gameData?.coin_data) {
  coinData = typeof gameData.coin_data === 'string' ? 
    JSON.parse(gameData.coin_data) : gameData.coin_data
}
```

---

## SUMMARY

### ✅ **Working Correctly:**
- Most database fields exist and are being used correctly
- Server API is writing to correct fields
- Basic game functionality should work

### ❌ **Critical Issues:**
1. **Missing `game_type` field in listings table** - Will cause database errors
2. **Incorrect field access patterns** - Will cause undefined values
3. **Inconsistent JSON handling** - May cause parsing errors

### 🔧 **Priority Fixes:**
1. Add the missing `game_type` field to the listings table
2. Update UnifiedGamePage to use correct field names
3. Standardize JSON handling for coin data

These fixes will resolve the communication issues and ensure proper data flow between the frontend and database. 