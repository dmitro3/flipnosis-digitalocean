# Module Structure Documentation

## Folder Organization

```
public/
├── test-tubes.html          (Main HTML file - ~500 lines)
│
├── js/                      (All JavaScript modules)
│   ├── config.js           (Constants & configuration)
│   ├── scene-setup.js      (Three.js scene initialization)
│   ├── socket-manager.js   (Socket.io communication)
│   │
│   ├── systems/            (Game system modules)
│   │   ├── tube-creator.js    (~900 lines)
│   │   ├── coin-manager.js    (~700 lines)
│   │   ├── pearl-physics.js   (~200 lines)
│   │   ├── glass-shatter.js   (~120 lines)
│   │   └── power-system.js    (~300 lines)
│   │
│   ├── ui/                 (UI/UX modules)
│   │   ├── ui-manager.js      (~800 lines)
│   │   ├── notifications.js   (~400 lines)
│   │   └── mobile-ui.js       (~300 lines)
│   │
│   ├── core/               (Core game logic)
│   │   ├── game-state.js      (~400 lines)
│   │   ├── animation-loop.js  (~150 lines)
│   │   └── game-renderer.js   (~200 lines)
│   │
│   └── utils/              (Utility functions)
│       ├── audio.js            (~100 lines)
│       ├── haptics.js         (~50 lines)
│       └── helpers.js         (~200 lines)
│
└── styles/                 (CSS - if extracted)
    └── tubes-game.css       (~1,100 lines)
```

## How Modules Connect

### 1. Main HTML File (`test-tubes.html`)
- Contains HTML structure only
- Imports main game module
- Minimal inline JavaScript

### 2. Module Dependencies Flow
```
test-tubes.html
    └──> js/game-main.js (entry point)
            ├──> config.js
            ├──> scene-setup.js
            ├──> socket-manager.js
            ├──> systems/tube-creator.js
            ├──> systems/coin-manager.js
            ├──> systems/pearl-physics.js
            ├──> systems/glass-shatter.js
            ├──> systems/power-system.js
            ├──> ui/ui-manager.js
            ├──> core/game-state.js
            ├──> core/animation-loop.js
            └──> utils/*.js
```

### 3. Shared State Management
- Global variables become shared state object
- Passed between modules as needed
- Some modules can be pure functions (no shared state)

## Example Module Export/Import Pattern

### Export from module (coin-manager.js):
```javascript
// Export functions
export function updateCoinRotationsFromPlayerChoices(tubes, players, coins) {
  // ... implementation
}

export function animateCoinFlip(playerSlot, power, duration, tubes, coins) {
  // ... implementation
}

// Export class if needed
export class CoinSystem {
  constructor(scene, tubes, coins) {
    // ...
  }
}
```

### Import in main file:
```javascript
import { 
  updateCoinRotationsFromPlayerChoices, 
  animateCoinFlip 
} from './systems/coin-manager.js';

// Or import everything
import * as CoinManager from './systems/coin-manager.js';
```

