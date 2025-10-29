# Database Remodeling Session Summary

**Date**: October 29, 2025  
**Server**: Hetzner 159.69.242.154  
**Goal**: Consolidate multiple databases into a single master database and fix page-by-page functionality

---

## 🎯 Project Overview

We're remodeling the entire database system on the Hetzner server. The project started with consolidating 20+ scattered databases into a single master database, fixing the broken backup system, and ensuring all pages work correctly with the new database structure.

---

## ✅ Completed Tasks

### 1. Database Consolidation
- **Identified master database**: `/opt/flipnosis/app/server/flipz.db`
  - Contains: 236 Battle Royale games (all from Oct 17-18, 2025)
  - Schema: New schema with `battle_royale_games` table
  - Status: ✅ Active and working
- **Moved legacy databases**: All other databases moved to `/root/database-legacy/` for archival
- **Verified**: Current database has latest games (236 games)

### 2. Backup System Fix
- **Fixed backup script**: `/etc/cron.daily/flipnosis-backup`
  - Changed target from `/opt/flipnosis/app/flipz.db` (doesn't exist) 
  - To `/opt/flipnosis/app/server/flipz.db` (correct path)
- **Status**: ✅ Backup system now pointing to correct database

### 3. Server Process Consolidation
- **Consolidated processes**: Disabled systemd service, kept PM2 running
- **Current status**: Only PM2 process (`flipnosis`) is active

### 4. Home Page Fix
- **Issue**: Home page only showed 4 games instead of 236
- **Solution**: Verified database has all 236 games and routes are working correctly
- **Status**: ✅ Home page now displays all games correctly

### 5. Profile Page Fixes

#### Issue 1: Missing `/api/users/:address/winnings` Endpoint
- **Error**: `Failed to load user winnings: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- **Root Cause**: API endpoint was missing, causing Express to serve `index.html` instead of JSON
- **Fix**: Implemented endpoint in `server/routes/api.js` (lines 1255-1300)
  - Queries both `games` (legacy) and `battle_royale_games` tables
  - Returns unified JSON array of completed wins
- **Status**: ✅ Endpoint implemented and returning JSON

#### Issue 2: API Routes Returning HTML Instead of JSON
- **Root Cause**: Static file middleware and catch-all route were intercepting API requests
- **Fix**: Modified `server/server.js`:
  - Added middleware to skip static file serving for `/api/` routes (lines 67-68)
  - Modified catch-all route to call `next()` for API routes (allows Express to handle 404s)
- **Status**: ✅ API routes now properly processed before static files

#### Issue 3: Player Profile Data Migration
- **Data Found**: Lola's XP = 11650, Koda's profile data found in old database
- **Solution**: Copied profile data from legacy database to current database
- **Files Created**: 
  - `copy-all_profiles.sql` - SQL script to copy all profiles
  - `update_lola_xp.sql` - SQL script to update Lola's XP
- **Status**: ✅ Profile data copied to new database

### 6. Create Battle Page Fix (Partial - In Progress)

#### Issue: `SQLITE_ERROR: no such column: room_type`
- **Error**: When creating a Battle Royale game, database throws error about missing `room_type` column
- **Root Cause**: Code in `server/services/database.js` tries to insert `room_type` column, but database schema doesn't have it
- **Current Status**: ⚠️ **IN PROGRESS** - Attempting to add column to database
- **Code Location**: `server/services/database.js` line 776-798
  - Code expects `room_type` column in INSERT statement
  - Database schema doesn't have this column yet

#### Attempted Solution:
- Created `fix_database.sql` with: `ALTER TABLE battle_royale_games ADD COLUMN room_type TEXT DEFAULT 'potion';`
- Encountered PowerShell/SSH quoting issues when trying to execute SQL
- **Next Step**: Need to successfully add the `room_type` column to the database

---

## 🔧 Code Changes Made

### 1. `server/routes/api.js`
**Added new endpoint** (lines 1255-1300):
```javascript
router.get('/users/:address/winnings', async (req, res) => {
  // Queries both games and battle_royale_games tables
  // Returns unified JSON array of completed wins
})
```

### 2. `server/server.js`
**Modified static file middleware** (lines 66-68):
```javascript
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next() // Skip static file serving for API routes
  }
  // ... rest of static file serving
})
```

**Modified catch-all route** to handle API routes properly:
```javascript
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next() // Let Express handle 404 for API routes
  }
  // ... serve index.html
})
```

### 3. `server/services/database.js`
**Current state**: Code expects `room_type` column (line 776-798)
- INSERT statement includes `room_type` column
- Values array includes `gameData.room_type || 'potion'`
- **Database schema**: Missing `room_type` column ❌

---

## 📋 Current Database Schema

### Master Database: `/opt/flipnosis/app/server/flipz.db`
- **Location**: `/opt/flipnosis/app/server/flipz.db`
- **Games Count**: 236 Battle Royale games
- **Most Recent**: October 18, 2025

### Tables Verified:
- ✅ `battle_royale_games` - Main game table (236 games)
- ✅ `battle_royale_participants` - Player participants
- ✅ `battle_royale_rounds` - Game rounds
- ✅ `battle_royale_flips` - Flip results
- ✅ `battle_royale_chat` - Chat messages
- ✅ `profiles` - User profiles (Lola, Koda, etc.)
- ✅ `player_stats` - Player statistics
- ✅ `flip_collections` - FLIP token collections
- ✅ `flip_earnings` - FLIP earnings
- ✅ `coin_unlock_transactions` - Coin unlock history
- ✅ `listings` - NFT listings
- ✅ `offers` - Offers on listings

### Missing Column:
- ❌ `battle_royale_games.room_type` - **NEEDS TO BE ADDED**

---

## 🚨 Pending Issues

### 1. **CRITICAL**: Create Battle Page Not Working
- **Issue**: Cannot create new Battle Royale games
- **Error**: `SQLITE_ERROR: no such column: room_type`
- **Status**: ⚠️ Blocking game creation
- **Solution Needed**: Add `room_type` column to `battle_royale_games` table
- **SQL Command**: 
  ```sql
  ALTER TABLE battle_royale_games ADD COLUMN room_type TEXT DEFAULT 'potion';
  ```
- **How to Execute**:
  1. Copy SQL file to server: `scp fix_database.sql root@159.69.242.154:/tmp/`
  2. Run on server: `ssh root@159.69.242.154 "cd /opt/flipnosis/app/server && sqlite3 flipz.db < /tmp/fix_database.sql"`
  3. Verify: `ssh root@159.69.242.154 "cd /opt/flipnosis/app/server && sqlite3 flipz.db 'PRAGMA table_info(battle_royale_games);' | grep room_type"`
  4. Restart server: `ssh root@159.69.242.154 "pm2 restart flipnosis"`

### 2. Minor: Claimables Endpoint Schema Mismatch
- **Issue**: `/api/users/:address/claimables` references `br.creator_paid` column that may not exist in legacy schemas
- **Status**: ⚠️ Should make query tolerant of missing columns
- **Priority**: Low (not blocking)

---

## 📝 Files Created/Modified

### Created Files:
- `fix_database.sql` - SQL to add `room_type` column (needs to be executed)
- `copy_all_profiles.sql` - SQL to copy all profiles (already executed)
- `update_lola_xp.sql` - SQL to update Lola's XP (already executed)

### Modified Files:
- `server/routes/api.js` - Added `/users/:address/winnings` endpoint
- `server/server.js` - Fixed API route handling
- `server/services/database.js` - Code expects `room_type` column (database doesn't have it yet)

---

## 🔍 Next Steps for Next Chat

### Immediate Priority:
1. **Fix Create Battle Page**:
   - Execute `fix_database.sql` on server to add `room_type` column
   - Verify column was added successfully
   - Test creating a new Battle Royale game
   - Restart server if needed

### Testing Checklist:
- [ ] Home page shows all 236 games ✅ (already working)
- [ ] Profile page loads correctly ✅ (already working)
- [ ] Winnings endpoint returns JSON ✅ (already working)
- [ ] Create Battle page can create new games ❌ (blocked by missing column)

### Future Improvements:
- Make claimables endpoint tolerant of legacy schemas
- Verify all other pages work correctly (game detail, listings, etc.)
- Test all API endpoints return JSON correctly
- Monitor server logs for any errors

---

## 🛠️ Server Commands Reference

### Check Database Status:
```bash
ssh root@159.69.242.154 "cd /opt/flipnosis/app/server && sqlite3 flipz.db 'SELECT COUNT(*) FROM battle_royale_games;'"
```

### Check Database Schema:
```bash
ssh root@159.69.242.154 "cd /opt/flipnosis/app/server && sqlite3 flipz.db 'PRAGMA table_info(battle_royale_games);'"
```

### Restart Server:
```bash
ssh root@159.69.242.154 "pm2 restart flipnosis"
```

### Check Server Logs:
```bash
ssh root@159.69.242.154 "pm2 logs flipnosis --lines 50"
```

### Copy File to Server:
```bash
scp <local_file> root@159.69.242.154:/tmp/
```

### Execute SQL File:
```bash
ssh root@159.69.242.154 "cd /opt/flipnosis/app/server && sqlite3 flipz.db < /tmp/fix_database.sql"
```

---

## 📊 Current Server State

- **Server IP**: 159.69.242.154
- **Database Path**: `/opt/flipnosis/app/server/flipz.db`
- **Games Count**: 236 games (all from Oct 17-18)
- **Process Manager**: PM2 (`flipnosis` process)
- **Backup System**: ✅ Fixed and pointing to correct path
- **Home Page**: ✅ Working (shows all games)
- **Profile Page**: ✅ Working (data loaded, endpoints fixed)
- **Create Battle Page**: ❌ Not working (missing `room_type` column)

---

## 🎯 Summary

**Completed**: Database consolidation, backup system fix, server process consolidation, home page fix, profile page fixes (winnings endpoint, API routing, profile data migration)

**In Progress**: Create Battle page fix (need to add `room_type` column to database)

**Next**: Execute `fix_database.sql` on server to add missing column, then test game creation

---

**Ready to continue!** The main blocker is adding the `room_type` column to the database. Once that's done, everything should work.
