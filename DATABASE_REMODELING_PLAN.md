# Database Remodeling Plan

## 🎯 Project Goal
Create a **single master database** that is the only active database on the server. All other databases will be moved to a legacy folder for archival purposes.

---

## 📊 Current Situation

### Problem Identified
- **Multiple databases** scattered across the server with inconsistent data
- **Backup system broken** - stopped working on Oct 26 because database path changed
- **Data loss** - Recent games/work from Oct 19-29 is missing
- **Oldest data** - Most recent games in any database are from Oct 17-18, 2025
- **Schema issues** - Some databases have old schema (`games` table), others have new schema (`battle_royale_games` table)

---

## 📁 Current Database Locations

### Active/Candidate Databases
1. **`/opt/flipnosis/app/server/flipz.db`** (244K, Oct 29 13:27)
   - Current active database
   - Contains: 236 games from Oct 17-18
   - Schema: New (`battle_royale_games` table exists)
   - Status: ✅ This is what the server is currently using

### Backup Databases (Daily Backups - Oct 19-26)
2. **`/opt/flipnosis/app/database-backups/flipz_backup_20251019_062501.db`** (524K)
3. **`/opt/flipnosis/app/database-backups/flipz_backup_20251020_062501.db`** (524K)
4. **`/opt/flipnosis/app/database-backups/flipz_backup_20251021_062501.db`** (524K)
5. **`/opt/flipnosis/app/database-backups/flipz_backup_20251022_062501.db`** (524K)
6. **`/opt/flipnosis/app/database-backups/flipz_backup_20251023_062501.db`** (524K)
7. **`/opt/flipnosis/app/database-backups/flipz_backup_20251024_062501.db`** (524K)
8. **`/opt/flipnosis/app/database-backups/flipz_backup_20251025_062501.db`** (524K)
9. **`/opt/flipnosis/app/database-backups/flipz_backup_20251026_062501.db`** (524K)
   - All have old schema (`games` table, not `battle_royale_games`)
   - Most recent backup before system broke

### Legacy Databases (Already Archived)
10. **`/root/database-legacy/digitalocean-flipz.db`** (1.3M, Oct 18 14:15)
    - Contains: 236 games from Oct 17-18
    - Schema: New (`battle_royale_games` table exists)
    - This is the one that was copied over the current database

11. **`/root/database-legacy/shared-flipz-clean.db`** (292K, Aug 12)
12. **`/root/database-legacy/app-database.db`** (116K, Sep 4)
13. **`/root/database-legacy/app-flipz.db`** (524K, Sep 10)
14. **`/root/database-legacy/digitalocean-local-dev.db`** (264K, Sep 22)
15. **`/root/database-legacy/digitalocean-games-v2.db`** (240K, Sep 22)
16. **`/root/database-legacy/digitalocean-games.db`** (236K, Sep 22)
17. **`/root/database-legacy/deploy-package-flipz.db`** (244K, Oct 24)

### Temporary/Deploy Databases
18. **`/root/deploy-package/server/flipz.db`** (244K, Oct 29 11:58)
    - Contains: 4 games from Oct 17
    - Schema: New
    
19. **`/root/flipnosis-digitalocean/server/flipz.db`** (148K, Oct 29 12:17)
    - Contains: 0 games (empty)
    - Schema: New

20. **`/tmp/flipz_backup.db`** (244K, Oct 26 14:25)
    - Contains: 4 games from Oct 17
    - Schema: New

---

## 🗺️ Server Structure

### Current Server Configuration
- **Server IP**: `159.69.242.154`
- **SSH User**: `root`
- **Main App Directory**: `/opt/flipnosis/app/`
- **Server File**: `/opt/flipnosis/app/server/server.js`
- **Current Database Path** (in server.js): `path.join(__dirname, 'flipz.db')` = `/opt/flipnosis/app/server/flipz.db`

### Backup System
- **Backup Script**: `/etc/cron.daily/flipnosis-backup`
- **Backup Directory**: `/opt/flipnosis/app/database-backups/`
- **Backup Target**: `/opt/flipnosis/app/flipz.db` (doesn't exist!)
- **Status**: ❌ Broken - looking for wrong path

### Process Management
- **PM2**: Process name `flipnosis` (ID: 0)
- **Systemd**: Service `flipnosis-app.service`
- **Both processes running**: Need to consolidate to one

---

## 🎯 Remodeling Plan

### Step 1: Create New Master Database
- **Location**: `/opt/flipnosis/app/server/flipz.db` (keep current location)
- **Schema**: Current new schema with all necessary tables
- **Data**: Start fresh or merge best data from existing databases

### Step 2: Move All Other Databases to Legacy
- **Create**: `/opt/flipnosis/app/database-legacy/` folder
- **Move**: All backup databases from `/opt/flipnosis/app/database-backups/`
- **Move**: All deploy/temporary databases
- **Keep**: `/root/database-legacy/` as is (already archived)

### Step 3: Fix Backup System
- **Update**: `/etc/cron.daily/flipnosis-backup` script
- **Fix Path**: Change from `/opt/flipnosis/app/flipz.db` to `/opt/flipnosis/app/server/flipz.db`
- **Test**: Verify backups work correctly

### Step 4: Update Server Configuration
- **Ensure**: Server only uses `/opt/flipnosis/app/server/flipz.db`
- **Remove**: Any references to other database paths
- **Consolidate**: Ensure only one server process runs (PM2 or systemd, not both)

### Step 5: Verify Database Schema
- **Check**: All required tables exist
- **Validate**: Battle Royale games table structure
- **Ensure**: Profiles, XP, coins, FLIP rewards tables exist and are correct

---

## 📋 Database Schema Checklist

### Required Tables (New Schema)
- ✅ `battle_royale_games` - Main game table
- ✅ `battle_royale_participants` - Player participants
- ✅ `battle_royale_rounds` - Game rounds
- ✅ `battle_royale_flips` - Flip results
- ✅ `battle_royale_chat` - Chat messages
- ✅ `profiles` - User profiles
- ✅ `player_stats` - Player statistics
- ✅ `flip_collections` - FLIP token collections
- ✅ `flip_earnings` - FLIP earnings
- ✅ `coin_unlock_transactions` - Coin unlock history
- ✅ `listings` - NFT listings
- ✅ `offers` - Offers on listings
- ✅ `game_rounds` - Game rounds (legacy)
- ✅ `chat_messages` - Chat messages (legacy)

---

## 🔧 Commands to Run

### Check Current Database
```bash
ssh root@159.69.242.154 "cd /opt/flipnosis/app/server && sqlite3 flipz.db 'SELECT COUNT(*) FROM battle_royale_games;'"
```

### Check All Tables
```bash
ssh root@159.69.242.154 "cd /opt/flipnosis/app/server && sqlite3 flipz.db '.tables'"
```

### Check Backup Script
```bash
ssh root@159.69.242.154 "cat /etc/cron.daily/flipnosis-backup"
```

### Check Server Process
```bash
ssh root@159.69.242.154 "pm2 list"
ssh root@159.69.242.154 "systemctl status flipnosis-app"
```

---

## 📝 Next Steps (For New Chat)

1. **Review this document** - Understand current state
2. **Create new master database** - Fresh start or merge best data
3. **Move all databases to legacy** - Organize and archive
4. **Fix backup system** - Update path and test
5. **Update server configuration** - Ensure single database path
6. **Test everything** - Verify all systems work
7. **Document new structure** - Update this document with final state

---

## 🚨 Important Notes

- **Data Loss**: Accept that data from Oct 19-29 is likely lost
- **Backup First**: Always backup before making changes
- **Test Changes**: Test on staging/dev before production
- **Monitor Logs**: Watch server logs during changes
- **Single Source**: Only one database should be active

---

## 📞 Key Information

- **Server**: `159.69.242.154`
- **Main Database**: `/opt/flipnosis/app/server/flipz.db`
- **Current Games**: 236 games (all from Oct 17-18)
- **Most Recent Entry**: October 18, 2025
- **Backup Status**: Broken since Oct 26
- **Process Status**: Both PM2 and systemd running (needs consolidation)

---

**Ready to start fresh!** This is a clean slate opportunity to build a proper, single-source-of-truth database system.

























