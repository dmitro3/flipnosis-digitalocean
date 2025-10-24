# Coin Unlock System Fix - Complete

## Problem Identified

The coin picker element had multiple issues preventing users from unlocking coins:

1. **Dual FLIP Balance Fields**: The database had two fields for FLIP tokens:
   - `xp` field (old, 2300 FLIP)
   - `flip_balance` field (new, 2500 FLIP)
   
   The server code was reading from/writing to the `xp` field, but there was also a separate `flip_balance` field with different values, causing discrepancies.

2. **Inconsistent Field Usage**: Different parts of the server were using different fields:
   - `unlock_coin` handler used `xp`
   - `award_flip_tokens_final` handler used `xp`
   - `FlipCollectionService.collectFlipTokens` used `xp`
   - Client expected `flip_balance`

## Solution Implemented

### 1. Updated Server Code to Use `flip_balance` Field

**Files Modified:**
- `server/handlers/server-socketio.js`
  - `get_player_profile` handler: Now reads from `flip_balance` (with fallback to `xp`)
  - `unlock_coin` handler: Now updates both `flip_balance` and `xp` fields
  - Master Field tracking: Now uses `flip_balance` (with fallback to `xp`)
  - `award_flip_tokens_final` handler: Now updates both `flip_balance` and `xp` fields

- `server/services/FlipCollectionService.js`
  - `collectFlipTokens` method: Now updates both `flip_balance` and `xp` fields

### 2. Synced Existing Data

Created and ran migration script to sync existing `xp` values to `flip_balance` field for profiles that didn't have it set.

**Result:**
- 1 profile synced (Master Field)
- Total FLIP in system: 2700
  - In circulation: 2500 FLIP
  - In Master Field: 200 FLIP

### 3. Verified System Integrity

Ran comprehensive verification showing:
- ✅ `coin_unlock_transactions` table exists and working (1 transaction recorded)
- ✅ `unlocked_coins` field exists in profiles
- ✅ `flip_balance` field exists in profiles
- ✅ Master Field profile tracking correctly (200 FLIP from 1 unlock)
- ✅ User profiles have correct balances and unlocked coins

## How It Works Now

1. **User Opens Coin Picker**:
   - Client sends `get_player_profile` with user's address
   - Server reads `flip_balance` field (falls back to `xp` for old profiles)
   - Returns FLIP balance and list of unlocked coins

2. **User Clicks to Unlock Coin**:
   - Client sends `unlock_coin` with address, coinId, and cost
   - Server verifies:
     - Profile exists
     - Coin not already unlocked
     - Sufficient FLIP balance
   - Server deducts FLIP and unlocks coin:
     - Updates both `flip_balance` and `xp` fields (for backward compatibility)
     - Updates `unlocked_coins` JSON array
   - Server adds FLIP to Master Field:
     - Master address: `0x0000000000000000000000000000000000000000`
     - Tracks total FLIP spent on unlocks
   - Server records transaction in `coin_unlock_transactions` table
   - Server sends success response to client

3. **Client Updates UI**:
   - Shows new balance
   - Marks coin as unlocked
   - Allows coin selection

4. **Persistence**:
   - Unlocked coins stored in `profiles.unlocked_coins` as JSON array
   - User's unlocks persist across sessions
   - Unlocks are permanent (lifetime access)

## Database Schema

```sql
profiles:
  - address (TEXT, PRIMARY KEY)
  - flip_balance (INTEGER, DEFAULT 0)  -- Primary FLIP balance field
  - xp (INTEGER, DEFAULT 0)            -- Also updated for backward compatibility
  - unlocked_coins (TEXT, DEFAULT '["plain"]')  -- JSON array of unlocked coin IDs
  - ... other fields ...

coin_unlock_transactions:
  - id (INTEGER, PRIMARY KEY)
  - player_address (TEXT)
  - coin_id (TEXT)
  - flip_cost (INTEGER)
  - flip_balance_before (INTEGER)
  - flip_balance_after (INTEGER)
  - unlocked_at (TIMESTAMP)

Master Field Profile:
  - address: 0x0000000000000000000000000000000000000000
  - flip_balance: Total FLIP collected from all unlocks
  - Provides transparency for FLIP economy
```

## Testing the Fix

The system has been tested and verified:
- Database schema is correct
- Server handlers are working
- Master Field tracking is functional
- Existing data has been migrated

To test live:
1. Start the server: `npm start` or `pm2 restart all`
2. Open game with wallet address parameter
3. Open coin picker (click coin icon on player card)
4. Try unlocking a coin (user needs sufficient FLIP balance)
5. Verify unlock persists on page reload

## Master Field Balance Check

Run this command to check Master Field balance at any time:
```bash
node check-master-field.js
```

This will show:
- Master Field current balance
- Total coin unlock transactions
- Recent unlock history

## Notes

- Both `flip_balance` and `xp` are updated for backward compatibility
- Old profiles will automatically use `xp` value when first accessed
- New FLIP earnings will update both fields
- Master Field provides economy-wide transparency
- All coin unlocks are permanent and stored per-profile

