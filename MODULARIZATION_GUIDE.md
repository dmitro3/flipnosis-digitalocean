# Modularization Implementation Guide

## Overview

This guide explains how to convert the monolithic `test-tubes.html` file into a modular structure.

## Folder Structure

```
public/
├── test-tubes.html              (Main HTML - simplified to ~500 lines)
│
├── js/                          (JavaScript modules folder)
│   ├── config.js               ✅ Created - Constants & configuration
│   ├── game-main.js            ✅ Created - Entry point
│   │
│   ├── systems/                (Game system modules)
│   │   ├── tube-creator.js     (Tube creation & styling)
│   │   ├── coin-manager.js     (Coin logic & animations)
│   │   ├── pearl-physics.js    (Pearl physics simulation)
│   │   ├── glass-shatter.js    (Glass shattering effects)
│   │   └── power-system.js     (Power charging & mechanics)
│   │
│   ├── ui/                     (UI/UX modules)
│   │   ├── ui-manager.js       (Main UI updates)
│   │   ├── notifications.js    (Notifications & messages)
│   │   └── mobile-ui.js        (Mobile-specific UI)
│   │
│   ├── core/                   (Core game logic)
│   │   ├── scene-setup.js      (Three.js initialization)
│   │   ├── socket-manager.js   (Socket.io communication)
│   │   ├── game-state.js       (State management)
│   │   └── animation-loop.js   (Main render loop)
│   │
│   └── utils/                  (Utility functions)
│       ├── audio.js            (Sound management)
│       ├── haptics.js          (Haptic feedback)
│       └── helpers.js           (Helper functions)
│
└── styles/                     (Optional - CSS extraction)
    └── tubes-game.css          (If CSS is extracted)
```

## How It Works

### 1. **Main HTML File** (`test-tubes.html`)

The HTML file becomes much simpler - just structure and module imports:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Glass Tube Game</title>
  <!-- CSS (can be external or inline) -->
  <link rel="stylesheet" href="styles/tubes-game.css">
</head>
<body>
  <!-- HTML structure -->
  <div id="game-container"></div>
  
  <!-- External libraries -->
  <script src="/socket.io/socket.io.js"></script>
  
  <!-- Game modules -->
  <script type="module">
    import { initGame } from './js/game-main.js';
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      initGame().catch(console.error);
    });
  </script>
</body>
</html>
```

### 2. **Module Communication**

#### **Export Pattern** (in module file):
```javascript
// systems/coin-manager.js
export function updateCoinRotations(tubes, players, coins) {
  // Implementation
}

export function animateCoinFlip(playerSlot, power, duration) {
  // Implementation  
}

// Or export as a class
export class CoinManager {
  constructor(scene, tubes) {
    // Initialize
  }
  
  update() {
    // Update logic
  }
}
```

#### **Import Pattern** (in other modules):
```javascript
// game-main.js
import { updateCoinRotations, animateCoinFlip } from './systems/coin-manager.js';

// Or import everything
import * as CoinManager from './systems/coin-manager.js';
```

### 3. **Shared State**

Instead of global variables, pass state between modules:

```javascript
// Option 1: Pass as parameters
function updateCoins(tubes, coins, players, gameState) {
  // Use passed state
}

// Option 2: Create a shared state object
const gameState = {
  tubes: [],
  coins: [],
  players: [],
  scene: null,
  // ... other shared data
};

// Pass to modules
coinManager.init(gameState);
tubeCreator.init(gameState);
```

### 4. **Dependency Injection**

Modules receive their dependencies:

```javascript
// systems/coin-manager.js
export function initCoinSystem(dependencies) {
  const { scene, tubes, coins, players, socket } = dependencies;
  
  return {
    updateRotations: () => {
      // Use scene, tubes, coins, players
    },
    animateFlip: (playerSlot, power) => {
      // Use socket, scene, etc.
    }
  };
}
```

## Migration Steps

### Phase 1: Setup Structure ✅
- [x] Create `js/` folder
- [x] Create `config.js` with constants
- [x] Create `game-main.js` entry point
- [ ] Create folder structure (systems/, ui/, core/, utils/)

### Phase 2: Extract Smallest Module (Low Risk)
- [ ] Extract `glass-shatter.js` (~120 lines)
- [ ] Test that glass shattering still works
- [ ] Update main file to import module

### Phase 3: Extract Utilities (Low Risk)
- [ ] Extract `utils/audio.js`
- [ ] Extract `utils/haptics.js`
- [ ] Extract `utils/helpers.js`
- [ ] Test audio and haptics

### Phase 4: Extract Pearl Physics (Medium Risk)
- [ ] Extract `pearl-physics.js`
- [ ] Test pearl visual updates
- [ ] Test pearl physics simulation

### Phase 5: Extract Coin System (Medium Risk)
- [ ] Extract `coin-manager.js`
- [ ] Test coin rotations
- [ ] Test coin flip animations
- [ ] Test coin landing

### Phase 6: Extract Tube Creation (High Risk)
- [ ] Extract `tube-creator.js`
- [ ] Test tube creation
- [ ] Test different room types
- [ ] Test coin creation within tubes

### Phase 7: Extract Scene Setup (High Risk)
- [ ] Extract `scene-setup.js`
- [ ] Extract `socket-manager.js`
- [ ] Test full initialization

### Phase 8: Extract UI Systems (Medium Risk)
- [ ] Extract `ui-manager.js`
- [ ] Extract `notifications.js`
- [ ] Extract `mobile-ui.js`
- [ ] Test all UI interactions

### Phase 9: Extract Core Systems (High Risk)
- [ ] Extract `animation-loop.js`
- [ ] Extract `game-state.js`
- [ ] Extract `power-system.js`
- [ ] Test complete game flow

### Phase 10: Finalize (Polish)
- [ ] Extract CSS to external file (optional)
- [ ] Add error handling
- [ ] Add module documentation
- [ ] Performance testing

## Benefits

✅ **Easier Debugging**: Find issues in specific modules  
✅ **Better Organization**: Logical code separation  
✅ **Reusability**: Modules can be used elsewhere  
✅ **Maintainability**: Update one module without affecting others  
✅ **Testing**: Write unit tests for each module  
✅ **Collaboration**: Multiple developers can work simultaneously  
✅ **Performance**: Can lazy-load modules if needed  

## Example: Converting a Function

### Before (in test-tubes.html):
```javascript
function shatterGlass(tubeIndex, powerLevel) {
  const tube = tubes[tubeIndex];
  // ... implementation uses global 'tubes' array
}
```

### After (in systems/glass-shatter.js):
```javascript
export function shatterGlass(tubeIndex, powerLevel, tubes, scene, physicsWorld) {
  const tube = tubes[tubeIndex];
  // ... same implementation, but receives dependencies
}

// Or as a class:
export class GlassShatterSystem {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
  }
  
  shatter(tubeIndex, powerLevel, tubes) {
    // Implementation
  }
}
```

## Next Steps

1. Review this structure
2. Choose which module to extract first (recommend `glass-shatter.js`)
3. I'll extract it and show you how it connects
4. Test it together
5. Continue with other modules

Ready to start?

