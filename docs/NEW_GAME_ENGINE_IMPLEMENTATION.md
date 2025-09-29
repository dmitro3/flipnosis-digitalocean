# New Game Engine Implementation (Option B)

## 🎯 **Problem Solved**

The original codebase had **multiple conflicting game state management systems**:
- Mixed WebSocket vs Socket.io services  
- Multiple components trying to manage same state
- Conflicting event listeners being registered/removed constantly
- Client-side game logic conflicting with server-side logic

## 🏗️ **Solution: Single Source of Truth Architecture**

Created a clean **Option B** implementation with:

### **1. Single Game Hook (`useGameEngine.js`)**
- **ONE hook** manages ALL game state
- Uses **Socket.io only** (matches your server)
- **Server handles ALL game logic** - client just renders state
- Clean event mapping to server Socket.io events
- Proper cleanup and error handling

### **2. Clean Game Component (`GameEngine.jsx`)**  
- Pure presentation component
- No local game logic - all from server
- Clean UI with proper state transitions
- Power charging, choice selection, coin flipping
- Responsive design for low-end devices

### **3. Safe Integration**
- **Legacy fallback** system in place
- Environment variable to toggle new/old system
- **Zero breaking changes** to existing code
- Can switch back instantly if issues occur

## 🔄 **Server-Side Communication**

### **Socket.io Events (Outgoing to Server)**
```javascript
// Join game room
socketService.emit('join_room', { roomId: `game_${gameId}`, address })

// Make choice (heads/tails)  
socketService.emit('player_choice', { gameId, choice, power })

// Request current state
socketService.emit('request_game_state', { gameId })
```

### **Socket.io Events (Incoming from Server)**
```javascript
// Game state updates
socket.on('game_state_update', handleGameStateUpdate)
socket.on('game_started', handleGameStarted) 
socket.on('game_ready', handleGameReady)
socket.on('round_result', handleRoundResult)
socket.on('deposit_confirmed', handleDepositConfirmed)
```

## 🎮 **Game Flow (Server-Side Logic)**

1. **Both players deposit** → Server emits `game_started`
2. **Client shows "Choose heads/tails"** → Player clicks choice
3. **Client sends `player_choice`** → Server processes both choices  
4. **Server runs coin flip logic** → Server emits `round_result`
5. **Client shows result animation** → Repeat for next round

**Key**: Client never makes game decisions - just sends player actions and renders server state.

## 🔧 **Usage**

### **Enable New System**
```bash
# In .env file or set environment variable
REACT_APP_USE_NEW_GAME_ENGINE=true
```

### **Disable (Use Legacy)**
```bash
REACT_APP_USE_NEW_GAME_ENGINE=false
```

### **In Component**
```jsx
// Automatically uses new system by default
<GameRoomTab 
  gameData={gameData}
  gameId={gameId}
  address={address}
  coinConfig={coinConfig}
  // ... other props
/>
```

## 🛡️ **Safety Features**

- **Error boundaries** prevent crashes
- **Fallback to legacy** if new system fails
- **Proper cleanup** of Socket.io listeners
- **State validation** before updates
- **Connection retry** logic
- **Comprehensive logging** for debugging

## 📊 **Benefits**

1. **No more conflicting listeners** - single connection per game
2. **Server authoritative** - no client-side cheating possible  
3. **Better performance** on low-end devices (server does heavy lifting)
4. **Consistent state** across all players
5. **Easier debugging** - single state source
6. **Scalable** - server handles multiple games simultaneously

## 🔍 **Testing**

1. Start with `REACT_APP_USE_NEW_GAME_ENGINE=true`
2. Create a game and accept offers normally
3. Both players should see game start automatically  
4. Choose heads/tails - should work smoothly
5. Power charging and coin flip should be server-controlled
6. If any issues, set to `false` to use legacy system

## 📝 **Files Changed**

- `src/hooks/useGameEngine.js` - NEW: Single game state hook
- `src/components/GameEngine/GameEngine.jsx` - NEW: Clean game component  
- `src/components/TabbedGame/tabs/GameRoomTab.jsx` - MODIFIED: Added new system with fallback

## 🎯 **Next Steps**

1. Test the new system thoroughly
2. If working well, remove legacy code
3. Can extend with more game features easily
4. Clean up old conflicting hooks/components

The new system should eliminate the multiple WebSocket listener conflicts and provide smooth server-side game logic!
