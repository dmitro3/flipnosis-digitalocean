/**
 * Configuration and Constants
 * All game constants, dimensions, and configuration values
 */

// Game setup
export const NUM_TUBES = 4;

// Tube dimensions
export const TUBE_RADIUS = 80;
export const TUBE_HEIGHT = 350;
export const TUBE_CAP_HEIGHT = 15;
export const TUBE_RIM_THICKNESS = 3;
export const SPACING = 350;
export const TUBE_Y_POSITION = 200;

// Coin dimensions
export const COIN_RADIUS = 30;
export const COIN_THICKNESS = 3;

// Pearl/Particle settings
export const PEARL_RADIUS_MIN = 2;
export const PEARL_RADIUS_MAX = 5;
export const PEARL_COUNT = 25;

// Physics settings
export const GRAVITY = -980; // cm/s^2
export const PHYSICS_FPS = 60;
export const TIME_STEP = 1 / PHYSICS_FPS;

// Animation settings
export const FLIP_DURATION_MIN = 1500;
export const FLIP_DURATION_MAX = 2500;
export const LANDING_DURATION = 1200;
export const INITIAL_LANDING_SPEED = 0.15;

// Power settings
export const POWER_MAX = 100;
export const POWER_CHARGE_RATE = 0.6;
export const POWER_LEVELS = 5;

// Visual settings
export const CAMERA_HEIGHT = 150;
export const TUBE_SPACING = 200;

// Room types
export const ROOM_TYPES = {
  lab: 'lab',
  cyber: 'cyber',
  mech: 'mech',
  potion: 'potion'
};

// Calculate total width for tube positioning
export const TOTAL_WIDTH = SPACING * (NUM_TUBES - 1);
export const START_X = -TOTAL_WIDTH / 2;

// Export default config object
export const GAME_CONFIG = {
  numTubes: NUM_TUBES,
  tubeRadius: TUBE_RADIUS,
  tubeHeight: TUBE_HEIGHT,
  spacing: SPACING,
  coinRadius: COIN_RADIUS,
  physicsFPS: PHYSICS_FPS,
  powerMax: POWER_MAX,
  cameraHeight: CAMERA_HEIGHT,
  tubeYPosition: TUBE_Y_POSITION
};

