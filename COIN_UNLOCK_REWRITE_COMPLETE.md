# Coin Unlock System - Complete Rewrite

## Problem Identified

The original error "❌ Failed to unlock Pharaoh: Failed to update profile" was caused by:

1. **Using `socket.once()` instead of `socket.on()`** - This meant the listener only worked ONCE and then stopped working for subsequent unlocks
2. **Complex error handling** - The abstraction layer was hiding the real errors
3. **Poor logging** - Hard to debug what was actually failing

## Solution: Complete Rewrite

### Server Side (`server/handlers/server-socketio.js`)

**New Implementation:**
- ✅ **Direct SQL queries** instead of abstraction layer for reliability
- ✅ **Step-by-step logging** to identify exactly where any issue occurs
- ✅ **Clear error messages** that tell you exactly what went wrong
- ✅ **Simplified flow** - easier to understand and debug

**What it does:**
1. Validates input (address, coinId, cost)
2. Gets user profile from database
3. Validates unlock (not already unlocked, sufficient balance)
4. Updates profile with new balance and unlocked coins using **direct SQL**
5. Updates Master Field balance
6. Records transaction in coin_unlock_transactions table
7. Sends success response to client

**Logging:**
Every step now has detailed logging:
```
============================================================
🔓 COIN UNLOCK REQUEST
Socket: abc123
Data: { address: "0x...", coinId: "pharaoh", cost: 500 }

1️⃣ Getting profile for: 0x...
✅ Profile found
   flip_balance: 2500
   xp: 2300
   unlocked_coins: ["plain","skull"]

2️⃣ Validating unlock
   Current balance: 2500 FLIP
   Cost: 500 FLIP
   Already unlocked: plain, skull
✅ Validation passed

3️⃣ Updating profile
   New balance: 2000 FLIP
   New unlocked coins: plain, skull, pharaoh
✅ Profile updated (1 rows)

4️⃣ Updating Master Field
   Master balance: 200 → 700
✅ Master Field updated

5️⃣ Recording transaction
✅ Transaction recorded

✅ UNLOCK SUCCESSFUL
============================================================
```

### Client Side (`public/test-tubes.html`)

**Changes:**
- ✅ Changed `socket.once()` to `socket.on()` - now works for multiple unlocks
- ✅ Added `socket.off()` before `socket.on()` to prevent duplicate listeners
- ✅ Set up listener BEFORE sending request (prevents race conditions)
- ✅ Better error messages shown to user
- ✅ More detailed console logging

**Flow:**
1. User clicks locked coin
2. Client shows loading state
3. Client removes old listener and sets up new one
4. Client sends unlock request
5. Client waits for response
6. On success: Updates balance, shows unlocked coins, alerts user
7. On failure: Shows error message, restores UI

## How to Test

1. **Restart your server:**
   ```bash
   pm2 restart all
   # or
   npm start
   ```

2. **Open the game** with your wallet address

3. **Open browser console** (F12) to see detailed logs

4. **Click coin picker** and try to unlock a coin

5. **Check server logs** to see the detailed step-by-step process

## Expected Behavior

**Success:**
- Browser shows: "🎉 Pharaoh unlocked for 500 FLIP! New balance: 2000 FLIP"
- Coin appears unlocked in picker
- Balance updates immediately
- Persists on page reload

**Failure (insufficient balance):**
- Browser shows: "❌ Failed to unlock Pharaoh: Insufficient FLIP balance. Have: 100, Need: 500"
- No changes made to database

**Failure (already unlocked):**
- Browser shows: "❌ Failed to unlock Pharaoh: Coin already unlocked"
- No deduction occurs

## Debug Commands

Check server logs in real-time:
```bash
pm2 logs --lines 100
```

Check Master Field balance:
```bash
node check-master-field.js
```

Check recent transactions:
```sql
sqlite3 server/flipz.db "SELECT * FROM coin_unlock_transactions ORDER BY unlocked_at DESC LIMIT 10;"
```

## Key Improvements

1. **Reliability**: Direct SQL ensures it works
2. **Debugging**: Detailed logs at every step
3. **User Experience**: Clear error messages
4. **Persistence**: Uses socket.on() instead of socket.once()
5. **Maintainability**: Simple, clear code flow

## If It Still Fails

Check the server logs for the detailed error output. The new implementation will show you EXACTLY which step fails and why.

The error messages are now specific:
- "Missing required fields: address"
- "Profile not found"
- "Coin already unlocked"
- "Insufficient FLIP balance. Have: 100, Need: 500"
- "Server error: [actual error message]"

