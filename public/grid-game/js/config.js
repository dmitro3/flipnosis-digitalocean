/**
 * Grid Game Configuration
 * All constants and settings for the grid-based coin flip game
 */

// Grid Layout
export const GRID_CONFIG = {
  MAX_COLUMNS: 6,              // Maximum coins per row
  COIN_SPACING_X: 280,         // Horizontal spacing between coins
  COIN_SPACING_Y: 280,         // Vertical spacing between rows
  GRID_START_X: -500,          // Starting X position for grid
  GRID_START_Y: 200,           // Starting Y position for grid
  COIN_Y_POSITION: 0,          // Y position for all coins
};

// Coin Settings
export const COIN_CONFIG = {
  RADIUS: 80,                  // Coin radius (increased from 40 to 80)
  THICKNESS: 12,               // Coin thickness (increased from 8 to 12)
  SEGMENTS: 64,                // Geometry segments for smoothness
  EDGE_COLOR: 0xFFD700,        // Gold edge color
  FLIP_DURATION: 1500,         // Flip animation duration (ms)
  FLIP_ROTATIONS: 3,           // Number of rotations during flip
};

// Camera Settings
export const CAMERA_CONFIG = {
  FOV: 50,                     // Field of view
  NEAR: 0.1,                   // Near clipping plane
  FAR: 5000,                   // Far clipping plane
  POSITION_X: 0,               // Camera X position
  POSITION_Y: 400,             // Camera Y position
  POSITION_Z: 1200,            // Camera Z position (distance from grid)
  LOOK_AT_Y: 0,                // Camera look-at Y coordinate
};

// Game Settings
export const GAME_CONFIG = {
  ROUND_DURATION: 30,          // Round duration in seconds
  POWER_CYCLE_SPEED: 0.02,     // Power meter cycle speed
  SWEET_SPOT_MIN: 0.65,        // Sweet spot start (65%)
  SWEET_SPOT_MAX: 0.75,        // Sweet spot end (75%)
  MAX_LIVES: 3,                // Starting lives per player
};

// Player Modes (max players per mode)
export const PLAYER_MODES = {
  '1v1': 2,
  '6player': 6,
  '12player': 12,
  '18player': 18,
  '24player': 24,
};

// Colors
export const COLORS = {
  BACKGROUND: 0x0a0f23,        // Dark blue background
  COIN_EDGE: 0xFFD700,         // Gold
  NEON_CYAN: 0x00ffff,
  NEON_PINK: 0xff1493,
  NEON_GREEN: 0x00ff88,
  ELIMINATED: 0x666666,        // Gray for eliminated players
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Game Lifecycle
  JOIN_ROOM: 'grid_join_room',
  PLAYER_JOINED: 'grid_player_joined',
  PLAYER_LEFT: 'grid_player_left',
  GAME_START: 'grid_game_start',
  GAME_END: 'grid_game_end',

  // Round Events
  ROUND_START: 'grid_round_start',
  ROUND_END: 'grid_round_end',
  TARGET_ANNOUNCED: 'grid_target_announced',

  // Player Actions
  FLIP_COIN: 'grid_flip_coin',
  COIN_FLIPPED: 'grid_coin_flipped',
  PLAYER_ELIMINATED: 'grid_player_eliminated',

  // State Updates
  STATE_UPDATE: 'grid_state_update',
  POWER_UPDATE: 'grid_power_update',
};

// Audio Settings
export const AUDIO_CONFIG = {
  FLIP_SOUND: '/sounds/flipsound.mp3',
  WIN_SOUND: '/sounds/win.mp3',
  LOSE_SOUND: '/sounds/lose.mp3',
  VOLUME: 0.5,
};

// Calculate grid position for a given player slot
export function getGridPosition(slotNumber, totalPlayers) {
  const columns = Math.min(GRID_CONFIG.MAX_COLUMNS, totalPlayers);
  const rows = Math.ceil(totalPlayers / columns);

  const col = slotNumber % columns;
  const row = Math.floor(slotNumber / columns);

  // Center the grid
  const totalWidth = (columns - 1) * GRID_CONFIG.COIN_SPACING_X;
  const totalHeight = (rows - 1) * GRID_CONFIG.COIN_SPACING_Y;

  const x = col * GRID_CONFIG.COIN_SPACING_X - totalWidth / 2;
  const y = -row * GRID_CONFIG.COIN_SPACING_Y + totalHeight / 2; // Use Y for rows instead of Z
  const z = 0; // All coins at same depth - flat grid facing camera

  return { x, y, z };
}

// Get background color for player slot (for visual variety)
export function getPlayerBackgroundColor(slotNumber) {
  const colors = [
    0x1a1f3a, // Dark blue
    0x1a2a3a, // Blue-gray
    0x1a1f2a, // Purple-blue
    0x2a1f3a, // Purple
    0x1a2f2a, // Teal
    0x2a1f1a, // Brown-red
  ];
  return colors[slotNumber % colors.length];
}

export default {
  GRID_CONFIG,
  COIN_CONFIG,
  CAMERA_CONFIG,
  GAME_CONFIG,
  PLAYER_MODES,
  COLORS,
  SOCKET_EVENTS,
  AUDIO_CONFIG,
  getGridPosition,
  getPlayerBackgroundColor,
};
