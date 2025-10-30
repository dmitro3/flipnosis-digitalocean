# Claims Panel Fix Summary

## Issue
Users were not seeing their claims (NFT or creator funds) in the profile claims panel after completing games in test-tubes.html.

## Root Causes Identified

1. **Missing `winner_address` field**: When games completed, the `winner_address` column was not being set in the database, only `winner` was set. The API query looks for `winner_address`.

2. **Database update not called**: The `updateGameInDatabase` function (which sets `winner_address`) was defined but never called when games completed.

3. **Old database handler**: The `handleBattleRoyaleCompletion` function didn't set `winner_address` when updating the database after blockchain completion.

## Fixes Applied

### 1. `server/PhysicsGameManager.js`
- Made `endRound` async
- Added call to `updateGameInDatabase` when game completes (before blockchain completion)
- This ensures `winner_address`, `creator_paid`, and `nft_claimed` are set correctly

### 2. `server/handlers/battleRoyaleHandler.js`
- Updated `handleBattleRoyaleCompletion` to accept address directly and set `winner_address` when updating database
- Added logic to handle both address strings and player IDs
- Now sets both `winner` and `winner_address` when updating completion status

## Scripts Created

### `scripts/diagnose-claims-issue.js`
Diagnostic script to check:
- All required columns exist
- Completed games have `winner_address` set
- Test the actual claimables queries

### `scripts/fix-battle-royale-claims-columns.js`
Migration script that:
- Adds any missing columns (winner_address, creator_paid, nft_claimed, etc.)
- Fixes existing completed games that have `winner` but no `winner_address`

## How to Fix Remote Database

Since you mentioned the database is on Hetzner 159 and you have no local database, you need to:

1. **SSH into Hetzner server** and navigate to the server directory
2. **Backup the database first**:
   ```bash
   cp database.sqlite database.sqlite.backup
   ```

3. **Run the fix script** (you'll need to transfer it to the server or run it remotely):
   ```bash
   node scripts/fix-battle-royale-claims-columns.js
   ```

   Or if the script is on your local machine, copy it to the server first.

4. **Alternatively, run the diagnostic first** to see what needs fixing:
   ```bash
   node scripts/diagnose-claims-issue.js
   ```

## Testing

After deploying the fixes:

1. Complete a new game in test-tubes.html
2. Check that the database has `winner_address` set correctly
3. Go to profile → Claims tab
4. Verify that:
   - Winners see NFT claims
   - Creators see creator fund withdrawals

## Database Fields Required for Claims

The API endpoint `/api/users/:address/claimables` queries:
- **Winner claims**: `WHERE winner_address = ? AND status = 'completed' AND (nft_claimed IS NULL OR nft_claimed = 0)`
- **Creator claims**: `WHERE creator = ? AND status = 'completed' AND (creator_paid IS NULL OR creator_paid = 0)`

Required columns:
- `winner_address` (TEXT) - Critical!
- `winner` (TEXT) - Also set for compatibility
- `status` (TEXT) - Must be 'completed'
- `creator_paid` (BOOLEAN) - Defaults to 0
- `nft_claimed` (BOOLEAN) - Defaults to 0
- `nft_collection` (TEXT) - For display

## Notes

- The code now ensures `winner_address` is set both:
  1. Immediately when game ends (via `updateGameInDatabase`)
  2. After blockchain completion (via `handleBattleRoyaleCompletion`)

- The fix script can be run safely on the remote database - it only adds missing columns and fixes existing data, it doesn't overwrite anything.

