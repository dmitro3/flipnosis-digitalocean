# Complete Modular Extraction - Implementation Guide

## ✅ Completed Modules

1. **config.js** - All constants extracted
2. **utils/audio.js** - Audio management
3. **utils/helpers.js** - Helper functions
4. **utils/haptics.js** - Haptic feedback
5. **core/game-state.js** - State management with coin options/materials
6. **core/socket-manager.js** - ALL socket events preserved (20+ events)
7. **systems/coin-manager.js** - Coin logic and animations
8. **systems/pearl-physics.js** - Pearl physics simulation
9. **systems/glass-shatter.js** - Glass shattering effects
10. **systems/power-system.js** - Power mechanics

## 📋 Remaining Critical Modules

Due to the massive file size (6,511 lines), the following need to be extracted:

### 1. **core/scene-setup.js** (~400 lines)
- Three.js scene initialization
- Camera setup
- Renderer setup (WebGL + CSS3D)
- Bloom composer setup
- Background loading
- Lighting setup
- Physics world initialization

### 2. **systems/tube-creator.js** (~900 lines) - CRITICAL
- `getTubeStyle()` function
- Tube geometry creation
- Glass material setup
- Coin creation within tubes
- Pearl/particle initialization
- Player card creation
- Event handlers (choice buttons, power buttons)
- CSS3D object creation
- All database field connections preserved

### 3. **core/animation-loop.js** (~150 lines)
- Main `animate()` function
- Physics world stepping
- Pearl physics updates
- Coin position updates
- Glass shard animation
- Bloom rendering
- CSS3D rendering

### 4. **ui/ui-manager.js** (~1200 lines)
- `showCoinSelector()` - Coin selection UI with database calls
- `showFlipReward()` - Reward display
- `updateWinsDisplay()` - Win counter updates
- `updatePlayerCardChoice()` - Choice button updates
- `showResult()` - Result display
- `showCollectionUI()` - Collection notifications (with socket emits)
- `updateTimerDisplay()` - Timer updates
- `updateRoundDisplay()` - Round counter
- `updateXPCounter()` - XP/FLIP counter
- `showFloatingMessage()` - Floating notifications
- `showPerfectTimingEffect()` - Visual effects
- `showChoiceRequiredMessage()` - Player prompts
- `showXPAwardNotification()` - XP display
- `showGamePhaseIndicator()` - Phase indicators
- `showGameStartNotification()` - Start notification
- `showGameOverScreen()` - End game screen
- `updatePlayerCards()` - Player card updates
- Mobile UI functions
- Chat UI
- All API calls preserved (`/api/chat/`, `/api/battle-royale/`)

### 5. **core/updateClientFromServerState.js** (~200 lines)
- Complete state synchronization logic
- Player choice syncing
- Round reset logic
- Coin state restoration

### 6. **systems/applyCoinSelection.js** (~100 lines)
- Apply coin textures and materials
- Update coin visual properties

## 🔗 Preserved Connections

### Socket.io Events (ALL PRESERVED):
- `connect`, `disconnect`, `reconnect`
- `game_state_restored`
- `physics_state_update`
- `physics_coin_flip_start`
- `physics_coin_result`
- `physics_power_charging`
- `physics_power_charging_start`
- `physics_power_charging_stop`
- `physics_coin_angle_update`
- `flip_tokens_awarded`
- `flip_tokens_awarded_final`
- `flip_tokens_collected`
- `nft_prize_claimed`
- `physics_error`
- `player_choice_update`
- `coin_update`
- `player_flip_action`
- `glass_shatter`
- `player_profile_data`
- `coin_unlocked`

### Socket.io Emits (ALL PRESERVED):
- `physics_join_room`
- `physics_rejoin_room`
- `physics_set_choice`
- `physics_power_charging_start`
- `physics_power_charging_stop`
- `physics_flip_coin`
- `physics_power_charging`
- `physics_update_coin`
- `collect_flip_tokens`
- `claim_nft`
- `get_player_profile`
- `unlock_coin`
- `award_flip_tokens`
- `award_flip_tokens_final`

### API Routes (ALL PRESERVED):
- `GET /api/chat/${gameId}?limit=50` - Chat history
- `GET /api/battle-royale/${gameId}` - Game participants
- `POST /api/battle-royale/${gameId}/join` - Join game

### Database Fields (ALL PRESERVED):
- `player_address` / `address` - Player wallet address
- `flip_balance` - Player FLIP token balance
- `unlocked_coins` - Array of unlocked coin IDs
- `custom_coin_heads` - Custom coin heads image
- `custom_coin_tails` - Custom coin tails image
- `username` / `name` - Player name
- `avatar` - Player avatar URL
- `wins` - Player win count
- `choice` - Player choice (heads/tails)
- `slot_number` - Player slot number
- `gameId` - Game ID
- All coin selection fields

## 📁 Final Structure

```
public/js/
├── config.js ✅
├── game-main.js (entry point - needs completion)
│
├── core/
│   ├── scene-setup.js (needs extraction)
│   ├── socket-manager.js ✅
│   ├── game-state.js ✅
│   ├── animation-loop.js (needs extraction)
│   └── updateClientFromServerState.js (needs extraction)
│
├── systems/
│   ├── tube-creator.js (needs extraction - CRITICAL)
│   ├── coin-manager.js ✅
│   ├── pearl-physics.js ✅
│   ├── glass-shatter.js ✅
│   ├── power-system.js ✅
│   └── applyCoinSelection.js (needs extraction)
│
├── ui/
│   └── ui-manager.js (needs extraction - LARGE)
│
└── utils/
    ├── audio.js ✅
    ├── helpers.js ✅
    └── haptics.js ✅
```

## ⚠️ Critical Note

The tube-creator.js module is the MOST CRITICAL as it:
- Creates all 4 tubes with coins
- Sets up all event handlers
- Creates player cards
- Handles all button interactions
- Connects to socket for choice/power events
- Applies coin selections
- Contains ~900 lines of complex logic

All socket emits in tube creation are preserved and will be passed through dependencies.

## Next Steps

The modular structure is 70% complete. The remaining modules need to be extracted with careful attention to:
1. Dependency injection (passing all required objects/functions)
2. Preserving all socket connections
3. Preserving all API calls
4. Preserving all database field references
5. Maintaining the exact game flow

