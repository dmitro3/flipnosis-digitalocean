# 🎮 Server-Side Game Engine Implementation

## 📋 Overview

The Flipnosis game has been successfully migrated from client-side to server-side game mechanics. This ensures fair play, prevents cheating, and provides a more reliable gaming experience.

## 🏗️ Architecture

### Core Components

1. **GameEngine** (`server/services/gameEngine.js`)
   - Central game logic controller
   - Manages game state, turns, and flow
   - Handles player actions and validation
   - Controls timers and timeouts

2. **CoinStreamService** (`server/services/coinStream.js`)
   - Server-side coin animation rendering
   - Streams animation frames to clients
   - Handles 3D coin physics and materials

3. **WebSocket Handlers** (`server/handlers/websocket.js`)
   - Updated to use GameEngine
   - Routes game actions to appropriate handlers
   - Manages real-time communication

4. **Client-Side Hooks** (Updated)
   - `useGameState.js` - Simplified to send actions to server
   - `useGameData.js` - Handles server responses
   - `useWebSocket.js` - Manages connection

## 🎯 Game Flow

### 1. Game Initialization
```javascript
// Server initializes game when first player joins
gameEngine.initializeGame(gameId, gameData)
```

### 2. Player Choice Phase
```javascript
// Client sends choice
webSocketService.send({
  type: 'GAME_ACTION',
  gameId,
  action: 'MAKE_CHOICE',
  choice: 'heads', // or 'tails'
  player: address
})

// Server validates and broadcasts
gameEngine.handlePlayerChoice(gameId, player, choice)
```

### 3. Power Charging Phase
```javascript
// Client starts charging
webSocketService.send({
  type: 'GAME_ACTION',
  gameId,
  action: 'POWER_CHARGE_START',
  player: address
})

// Client completes charging
webSocketService.send({
  type: 'GAME_ACTION',
  gameId,
  action: 'POWER_CHARGED',
  player: address,
  powerLevel: 7 // 1-10
})
```

### 4. Coin Flip
```javascript
// Server automatically triggers flip when both players charge
gameEngine.triggerFlip(gameId)
// - Generates random result
// - Starts server-side animation
// - Streams frames to clients
// - Updates database
```

### 5. Round Completion
```javascript
// Server handles round result
gameEngine.completeFlip(gameId)
// - Saves to database
// - Broadcasts result
// - Checks game completion
// - Starts next round or ends game
```

## 🔧 Key Features

### Server-Side Validation
- All game actions validated on server
- No client-side game state manipulation
- Prevents cheating and ensures fairness

### Automatic Timeouts
- Round timeout: 30 seconds
- Power charge timeout: 15 seconds
- Auto-assigns random choices/power if timeout

### Turn Management
- Creator always goes first
- Sequential power charging
- Automatic turn switching

### Database Integration
- All game actions saved to database
- Round history tracking
- Game completion status

### Real-Time Animation
- Server renders 3D coin animations
- Streams frames to all clients
- Consistent animation across devices

## 📡 WebSocket Message Types

### Client → Server
```javascript
// Player choice
{
  type: 'GAME_ACTION',
  gameId: 'game-123',
  action: 'MAKE_CHOICE',
  choice: 'heads',
  player: '0x1234...'
}

// Power charge start
{
  type: 'GAME_ACTION',
  gameId: 'game-123',
  action: 'POWER_CHARGE_START',
  player: '0x1234...'
}

// Power charge complete
{
  type: 'GAME_ACTION',
  gameId: 'game-123',
  action: 'POWER_CHARGED',
  player: '0x1234...',
  powerLevel: 7
}
```

### Server → Client
```javascript
// Player choice made
{
  type: 'player_choice_made',
  gameId: 'game-123',
  player: '0x1234...',
  choice: 'heads',
  timestamp: 1234567890
}

// Power phase started
{
  type: 'power_phase_started',
  gameId: 'game-123',
  currentTurn: '0x1234...',
  timestamp: 1234567890
}

// Power charged
{
  type: 'power_charged',
  gameId: 'game-123',
  player: '0x1234...',
  powerLevel: 7,
  timestamp: 1234567890
}

// Turn switched
{
  type: 'turn_switched',
  gameId: 'game-123',
  currentTurn: '0x5678...',
  timestamp: 1234567890
}

// Flip started
{
  type: 'FLIP_STARTED',
  gameId: 'game-123',
  result: 'heads',
  duration: 3000,
  timestamp: 1234567890
}

// Flip result
{
  type: 'FLIP_RESULT',
  gameId: 'game-123',
  result: 'heads',
  roundWinner: '0x1234...',
  roundNumber: 1,
  creatorChoice: 'heads',
  challengerChoice: 'tails',
  creatorWins: 1,
  challengerWins: 0
}

// New round started
{
  type: 'new_round_started',
  gameId: 'game-123',
  roundNumber: 2,
  creatorWins: 1,
  challengerWins: 0,
  timestamp: 1234567890
}

// Game completed
{
  type: 'GAME_COMPLETED',
  gameId: 'game-123',
  winner: '0x1234...',
  creatorWins: 3,
  challengerWins: 1,
  timestamp: 1234567890
}
```

## 🎮 Game Configuration

```javascript
const config = {
  roundTimeout: 30000,        // 30 seconds per round
  powerChargeTimeout: 15000,  // 15 seconds to charge power
  maxPowerLevel: 10,          // Maximum power level
  minPowerLevel: 1,           // Minimum power level
  flipDuration: 3000,         // 3 seconds for flip animation
  maxRounds: 5                // Maximum rounds per game
}
```

## 🧪 Testing

Run the test script to verify the server-side game engine:

```bash
node scripts/test-server-game-engine.js
```

This will:
1. Connect to the WebSocket server
2. Simulate a complete game flow
3. Test all game actions and responses
4. Verify server-side logic works correctly

## 🔄 Migration Benefits

### Before (Client-Side)
- ❌ Game logic on client (vulnerable to cheating)
- ❌ Inconsistent animations across devices
- ❌ No server validation
- ❌ Unreliable game state

### After (Server-Side)
- ✅ All game logic on server (secure)
- ✅ Consistent animations for all players
- ✅ Full server validation
- ✅ Reliable game state management
- ✅ Automatic timeout handling
- ✅ Database persistence
- ✅ Real-time synchronization

## 🚀 Deployment

The server-side game engine is now live on the DigitalOcean server at:
- **URL**: http://143.198.166.196
- **WebSocket**: ws://143.198.166.196:3001

### Files Updated
- ✅ `server/services/gameEngine.js` - New game engine
- ✅ `server/handlers/websocket.js` - Updated handlers
- ✅ `src/components/GamePage/hooks/useGameState.js` - Simplified client logic
- ✅ `src/components/GamePage/hooks/useGameData.js` - Updated message handling

### Files Unchanged
- ✅ `src/components/GamePage/GameCoin.jsx` - Still works with new system
- ✅ `src/components/GamePage/GameControls.jsx` - Still works with new system
- ✅ `server/services/coinStream.js` - Enhanced for server-side rendering

## 🎉 Success Criteria

- ✅ Game mechanics moved to server
- ✅ No mobile-specific coin version needed
- ✅ Fair and secure gameplay
- ✅ Real-time synchronization
- ✅ Automatic timeout handling
- ✅ Database persistence
- ✅ Consistent animations
- ✅ Reliable WebSocket communication

The Flipnosis game is now fully server-side with enhanced security, reliability, and user experience!
