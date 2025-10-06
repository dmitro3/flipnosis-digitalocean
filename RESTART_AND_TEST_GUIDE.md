# Quick Restart and Test Guide

## Restart Server to Apply Fixes

Since we've updated server-side files, you need to restart your server for the changes to take effect.

### Option 1: If using PM2 (Recommended)
```bash
pm2 restart all
```

Or restart specific process:
```bash
pm2 restart ecosystem.config.js
```

Check status:
```bash
pm2 status
pm2 logs
```

### Option 2: If running server directly
Press `Ctrl+C` to stop the server, then restart:
```bash
node server/server.js
```

Or if using npm:
```bash
npm run server
```

### Option 3: If using development mode
```bash
npm run dev
```

---

## Quick Test Steps

### 1. Create a New Game (2 minutes)
1. Open browser and navigate to your app
2. Connect wallet
3. Click "Create Battle Royale"
4. Fill in game details (use a low entry fee for testing like $1)
5. Submit transaction
6. **✅ CHECK:** You should see the game load without "Game not found" error

### 2. Test Coin Changes (1 minute)
1. In the lobby, click on your coin
2. Select a different coin from the selector
3. **✅ CHECK:** The coin should update immediately without needing to refresh
4. Try changing it a few more times
5. **✅ CHECK:** Each change should appear instantly

### 3. Test Player 2 Joining (3 minutes)
1. Open a second browser window (or incognito mode)
2. Connect a different wallet
3. Join the game you created
4. **✅ CHECK:** In window 1, you should see Player 2 appear in their slot
5. **✅ CHECK:** In window 2, you should see both Player 1 and Player 2
6. Have Player 2 change their coin
7. **✅ CHECK:** Both players should see the coin change

---

## Console Logs to Monitor

Open browser DevTools (F12) and watch the Console tab.

### Expected Logs When Creating Game:
```
🔌 Initializing Battle Royale socket...
📤 Emitted: join_battle_royale_room
📤 Emitted: request_battle_royale_state
✅ Socket initialized successfully
📊 Game state update received: { gameId: "br_...", phase: "filling", currentPlayers: 1 }
  👤 Player 0x... in slot 0, coin: Classic
```

### Expected Logs When Changing Coin:
```
🪙 Updating coin to: [CoinName] for address: 0x...
🪙 Coin update request sent to server
📊 Game state update received: { ... }
  👤 Player 0x... in slot 0, coin: [CoinName]
```

### Expected Logs When Player Joins:
```
📊 Game state update received: { currentPlayers: 2 }
  👤 Player 0x... in slot 0, coin: Classic
  👤 Player 0x... in slot 1, coin: Classic
```

---

## If You See Errors

### "Game not found" Error
**Check:**
- Server is running
- Database connection is active
- Game exists in database: `SELECT * FROM battle_royale_games WHERE game_id = 'br_...'`

**Server Console Should Show:**
```
🏠 [address] joining room: br_[gameId]
📊 Requesting state for: br_[gameId]
🔄 Loading game from database: br_[gameId]
✅ Sending state for br_[gameId] - Phase: filling, Players: 1
```

### Coin Not Updating
**Check:**
- Socket connection is active (look for "✅ Socket initialized successfully")
- Browser console shows the update request being sent
- No errors in server console

**Server Console Should Show:**
```
🪙 [address] updating coin in game br_[gameId]
📊 Updated coin for [address] to [CoinName]
📡 Broadcasting coin update to room game_br_[gameId]
✅ Coin update broadcasted successfully
```

### Player 2 Not Showing
**Check:**
- Both browsers have socket connections
- Payment transaction succeeded
- Player 2 called `join_battle_royale` after payment

**Server Console Should Show:**
```
🎮 [player2_address] joining game: br_[gameId]
🎮 Adding player [player2_address] to slot 1
✅ Player joined: [player2_address] in slot 1 (2/6)
📡 Broadcasting updated state to ALL players in room
```

---

## Helpful Commands

### Check server logs (if using PM2):
```bash
pm2 logs --lines 100
```

### Check database for game:
```bash
# If using PostgreSQL
psql -U your_username -d your_database -c "SELECT game_id, status, current_players, creator FROM battle_royale_games ORDER BY created_at DESC LIMIT 5;"

# If using SQLite
sqlite3 server/flipz.db "SELECT game_id, status, current_players, creator FROM battle_royale_games ORDER BY created_at DESC LIMIT 5;"
```

### Clear old games (optional, for testing):
```bash
# Only do this on development/test environment!
# PostgreSQL
psql -U your_username -d your_database -c "DELETE FROM battle_royale_games WHERE status = 'filling' AND created_at < NOW() - INTERVAL '1 hour';"

# SQLite
sqlite3 server/flipz.db "DELETE FROM battle_royale_games WHERE status = 'filling' AND created_at < datetime('now', '-1 hour');"
```

---

## Success Indicators

You'll know everything is working when:
- ✅ No "Game not found" errors when creating a game
- ✅ Coin changes appear instantly for all players
- ✅ New players appear in their slots immediately
- ✅ Player count updates in real-time
- ✅ All players see the same game state
- ✅ Console logs show successful broadcasts
- ✅ No errors in browser or server console

---

## Next Steps After Testing

Once you confirm all three issues are fixed:
1. Test with 3+ players if possible
2. Test starting a game early
3. Test the actual gameplay (if you want to verify that still works)
4. Deploy to production if everything works

If you encounter any issues, share the console logs from both the browser and server, and I'll help you debug!

