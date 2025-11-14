/**
 * Game State Management
 * Handles state persistence, save/load, and game state tracking
 */

// Game state constants
export const COLORS = {
  cyan: 0x00ffff,
  neonGreen: 0x00ff00,
  brightGreen: 0x39ff14,
  pink: 0xff1493,
  gold: 0xFFD700,
  glass: 0x88ccff
};

// Coin options data
export const coinOptions = [
  { id: 'plain', name: 'Classic', headsImage: '/coins/plainh.png', tailsImage: '/coins/plaint.png', cost: 0, category: 'free' },
  { id: 'skull', name: 'Skull', headsImage: '/coins/skullh.png', tailsImage: '/coins/skullt.png', cost: 200, category: 'premium' },
  { id: 'trump', name: 'Trump', headsImage: '/coins/trumpheads.webp', tailsImage: '/coins/trumptails.webp', cost: 300, category: 'premium' },
  { id: 'mario', name: 'Mario', headsImage: '/coins/mario.png', tailsImage: '/coins/luigi.png', cost: 300, category: 'premium' },
  { id: 'stinger', name: 'Stinger', headsImage: '/coins/stingerh.png', tailsImage: '/coins/stingert.png', cost: 300, category: 'premium' },
  { id: 'dragon', name: '龍', headsImage: '/coins/dragonh.png', tailsImage: '/coins/dragont.png', cost: 300, category: 'premium' },
  { id: 'jestress', name: 'Jestress', headsImage: '/coins/jestressh.png', tailsImage: '/coins/jestresst.png', cost: 500, category: 'epic' },
  { id: 'manga', name: 'Heroine', headsImage: '/coins/mangah.png', tailsImage: '/coins/mangat.png', cost: 500, category: 'epic' },
  { id: 'pharaoh', name: 'Pharaoh', headsImage: '/coins/pharaohh.png', tailsImage: '/coins/pharaoht.png', cost: 1000, category: 'legendary' },
  { id: 'calavera', name: 'Calavera', headsImage: '/coins/calaverah.png', tailsImage: '/coins/calaverat.png', cost: 1000, category: 'legendary' }
];

// Coin materials data
export const coinMaterials = [
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Ultra-Light & Swift',
    edgeColor: '#1a1a1a',
    speedMultiplier: 2.0,
    durationMultiplier: 0.5,
    characteristics: 'Ultra-fast flips, chaotic motion'
  },
  {
    id: 'penny',
    name: 'Penny',
    description: 'Lightweight & Fast',
    edgeColor: '#CD7F32',
    speedMultiplier: 1.5,
    durationMultiplier: 0.7,
    characteristics: 'Fast flips, unpredictable'
  },
  {
    id: 'glass',
    name: 'Glass',
    description: 'Crystal Clear & Elegant',
    edgeColor: '#87CEEB',
    speedMultiplier: 1.3,
    durationMultiplier: 0.8,
    characteristics: 'Smooth, elegant flips'
  },
  {
    id: 'silver-dollar',
    name: 'Silver Dollar',
    description: 'Heavy & Controlled',
    edgeColor: '#C0C0C0',
    speedMultiplier: 0.7,
    durationMultiplier: 1.3,
    characteristics: 'Slow, controlled, predictable'
  },
  {
    id: 'titanium',
    name: 'Titanium',
    description: 'Ultra-Heavy & Precise',
    edgeColor: '#2D1B69',
    speedMultiplier: 0.5,
    durationMultiplier: 1.6,
    characteristics: 'Very slow, precise flips'
  }
];

/**
 * Initialize game state
 */
export function initializeGameState() {
  return {
    players: [
      { id: 1, name: 'Empty', wins: 0, address: '', choice: null, avatar: '', isEmpty: true, totalFlipEarned: 0 },
      { id: 2, name: 'Empty', wins: 0, address: '', choice: null, avatar: '', isEmpty: true, totalFlipEarned: 0 },
      { id: 3, name: 'Empty', wins: 0, address: '', choice: null, avatar: '', isEmpty: true, totalFlipEarned: 0 },
      { id: 4, name: 'Empty', wins: 0, address: '', choice: null, avatar: '', isEmpty: true, totalFlipEarned: 0 }
    ],
    currentRound: 1,
    gameOver: false,
    roundStartWins: [],
    gameState: null,
    playerSlot: -1
  };
}

/**
 * Save game state to localStorage
 */
export function saveGameState(gameIdParam, walletParam, playerSlot, currentRound, players, tubes) {
  if (!gameIdParam || !walletParam) return;
  
  const gameState = {
    gameId: gameIdParam,
    playerSlot: playerSlot,
    currentRound: currentRound,
    playerWins: players[playerSlot]?.wins || 0,
    playerChoice: players[playerSlot]?.choice || null,
    selectedCoin: tubes[playerSlot]?.selectedCoin?.id || 'plain',
    selectedMaterial: tubes[playerSlot]?.selectedMaterial?.id || 'graphite',
    timestamp: Date.now(),
    expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
  };
  
  const storageKey = `game_${gameIdParam}_${walletParam}`;
  localStorage.setItem(storageKey, JSON.stringify(gameState));
  console.log('💾 Game state saved to localStorage:', gameState);
}

/**
 * Load game state from localStorage
 */
export function loadGameState(gameIdParam, walletParam) {
  if (!gameIdParam || !walletParam) return null;
  
  const storageKey = `game_${gameIdParam}_${walletParam}`;
  const savedData = localStorage.getItem(storageKey);
  
  if (!savedData) {
    console.log('📂 No saved game state found');
    return null;
  }
  
  try {
    const gameState = JSON.parse(savedData);
    
    if (Date.now() > gameState.expiresAt) {
      console.log('⏰ Saved game state expired, clearing...');
      localStorage.removeItem(storageKey);
      return null;
    }
    
    console.log('✅ Loaded game state from localStorage:', gameState);
    return gameState;
  } catch (err) {
    console.error('❌ Failed to parse saved game state:', err);
    localStorage.removeItem(storageKey);
    return null;
  }
}

