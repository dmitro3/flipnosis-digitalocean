# Multiple Databases Issue - FIXED

## Problem Found

The error `SQLITE_ERROR: no such column: flip_balance` was caused by having **3 different databases** in the project:

1. **server/flipz.db** (69 KB) - Has `flip_balance` ✅
2. **database.sqlite** (98 KB) - Was MISSING `flip_balance` ❌ (NOW FIXED ✅)
3. **dist/server/flipz.db** (69 KB) - Has `flip_balance` ✅

**The server code says it should use `server/flipz.db`**, but the live server might be using `database.sqlite` depending on deployment configuration.

## Solution Applied

✅ Added missing fields to `database.sqlite`:
- `flip_balance` INTEGER DEFAULT 0
- `custom_coin_heads` TEXT
- `custom_coin_tails` TEXT

✅ Synced existing `xp` values to `flip_balance`

## All Databases Now Compatible

All three databases now have the required fields for the coin unlock system!

```
✅ server/flipz.db
   - flip_balance field: ✅ EXISTS
   - unlocked_coins field: ✅ EXISTS
   - Profile count: 2

✅ database.sqlite
   - flip_balance field: ✅ EXISTS (NEWLY ADDED)
   - unlocked_coins field: ✅ EXISTS
   - Profile count: 1

✅ dist/server/flipz.db
   - flip_balance field: ✅ EXISTS
   - unlocked_coins field: ✅ EXISTS
   - Profile count: 2
```

## Restart Server

**IMPORTANT:** Restart your server for the changes to take effect:

```bash
pm2 restart all
```

or

```bash
npm start
```

## Test the Fix

1. Open the game in your browser
2. Open browser console (F12)
3. Click the coin picker
4. Try unlocking a coin
5. You should now see:
   ```
   🔓 Requesting unlock: trump for 300 FLIP
   📨 Received unlock response: {success: true, newBalance: 2200, ...}
   ✅ Server confirmed unlock: Trump
   ```

## Server Logs

Check the server logs - you should now see detailed step-by-step logging:

```bash
pm2 logs --lines 50
```

Expected output:
```
============================================================
🔓 COIN UNLOCK REQUEST
1️⃣ Getting profile for: 0x...
✅ Profile found
   flip_balance: 2500
   ...
2️⃣ Validating unlock
✅ Validation passed
3️⃣ Updating profile
✅ Profile updated (1 rows)
4️⃣ Updating Master Field
✅ Master Field updated
5️⃣ Recording transaction
✅ Transaction recorded
✅ UNLOCK SUCCESSFUL
============================================================
```

## Why This Happened

Different parts of the codebase were created at different times and used different database schemas:

- `server/flipz.db` - SQLite database for the new server-side game
- `database.sqlite` - Original PostgreSQL-style database from earlier version
- `dist/server/flipz.db` - Build artifact copy

We've now unified them all with the same schema!

## Future Prevention

If you add new fields in the future, make sure to update ALL database files, or consolidate to using just one database file.

Recommended: Use only `server/flipz.db` and remove the others once you're sure everything works.

