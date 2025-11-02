# API 404 Errors - Fix Summary

## Problem
API endpoints returning 404 errors:
- `/api/listings` → 404
- `/api/users/:address/games` → 404
- `/api/profile/:address` → 404

## Root Cause
Most likely issue: **Database path mismatch on Hetzner server**
- Local `.env` shows `DATABASE_PATH=./server/flipz.db`
- Hetzner has `database.sqlite` file (not `flipz.db`)
- If Hetzner `.env` points to wrong file, database connection fails
- Failed database connection prevents API routes from initializing

## Changes Made

### 1. Enhanced Error Handling (`server/routes/api.js`)
- Added validation to check if `dbService` and `dbService.db` exist before creating routes
- Better error messages if database connection is missing
- Added `/api/test` endpoint to verify routes are working

### 2. Enhanced Logging (`server/server.js`)
- Added detailed logging during API route initialization
- Shows status of dbService, blockchainService, and gameServer
- Logs specific routes available after registration

### 3. Database Path Fix Script (`fix-hetzner-database-path.ps1`)
- PowerShell script to update Hetzner `.env` file
- Changes `DATABASE_PATH` to `./server/database.sqlite`
- Script auto-deletes after use for security

## Action Required on Hetzner

### Step 1: Update Database Path
Run the PowerShell script:
```powershell
.\fix-hetzner-database-path.ps1
```

This will:
1. Connect to Hetzner server
2. Update `.env` file to use `DATABASE_PATH=./server/database.sqlite`
3. Auto-delete itself after completion

### Step 2: Restart PM2
After updating `.env`, restart the server:
```bash
ssh root@[SERVER_IP] 'pm2 restart all'
```

### Step 3: Verify Routes Are Working
Check server logs:
```bash
ssh root@[SERVER_IP] 'pm2 logs --lines 50'
```

Look for:
- ✅ "API routes configured and registered at /api"
- ✅ "Database service initialized"
- ✅ No errors about database connection

Test endpoints:
- `https://www.flipnosis.fun/api/test` - Should return JSON with route info
- `https://www.flipnosis.fun/api/health` - Should show database connection status
- `https://www.flipnosis.fun/api/listings` - Should return listings array (empty if none)

## Troubleshooting

If routes still return 404:

1. **Check Database Path**: Verify Hetzner has `database.sqlite` at correct location
   ```bash
   ssh root@[SERVER_IP] 'ls -la [PROJECT_PATH]/server/ | grep database'
   ```

2. **Check PM2 Logs**: Look for database connection errors
   ```bash
   ssh root@[SERVER_IP] 'pm2 logs --err --lines 100'
   ```

3. **Verify .env File**: Confirm DATABASE_PATH is correct
   ```bash
   ssh root@[SERVER_IP] 'cat [PROJECT_PATH]/.env | grep DATABASE_PATH'
   ```

4. **Test Database Connection**: Use debug endpoint
   ```bash
   curl https://www.flipnosis.fun/api/debug/db
   ```

## Files Modified
- `server/routes/api.js` - Added validation and test endpoint
- `server/server.js` - Enhanced logging for route registration
- `fix-hetzner-database-path.ps1` - Script to fix database path (temporary, auto-deletes)

## Files NOT Modified
- Database file itself (`database.sqlite` on Hetzner) - **NOT TOUCHED** as requested

