/**
 * Grid Manager
 * Handles grid layout, positioning, and reorganization
 */

import { getGridPosition, GRID_CONFIG } from '../config.js';

/**
 * Calculate grid layout for given number of players
 */
export function calculateGridLayout(totalPlayers) {
  const columns = Math.min(GRID_CONFIG.MAX_COLUMNS, totalPlayers);
  const rows = Math.ceil(totalPlayers / columns);

  const layout = {
    columns,
    rows,
    positions: [],
    totalWidth: (columns - 1) * GRID_CONFIG.COIN_SPACING_X,
    totalHeight: (rows - 1) * GRID_CONFIG.COIN_SPACING_Y,
  };

  // Calculate position for each slot
  for (let i = 0; i < totalPlayers; i++) {
    layout.positions.push(getGridPosition(i, totalPlayers));
  }

  return layout;
}

/**
 * Get compact grid layout (after eliminations)
 * Rearranges active players to top rows
 */
export function getCompactGridLayout(players) {
  const activePlayers = players.filter(p => p.isActive && !p.isEliminated);
  const totalActive = activePlayers.length;

  if (totalActive === 0) return null;

  const layout = calculateGridLayout(totalActive);

  // Map original slot numbers to new positions
  const repositioning = [];
  let newIndex = 0;

  players.forEach((player, originalSlot) => {
    if (player.isActive && !player.isEliminated) {
      repositioning.push({
        originalSlot,
        newPosition: layout.positions[newIndex],
        player,
      });
      newIndex++;
    }
  });

  return {
    layout,
    repositioning,
    activeCount: totalActive,
  };
}

/**
 * Get row and column for a slot number
 */
export function getRowCol(slotNumber, totalPlayers) {
  const columns = Math.min(GRID_CONFIG.MAX_COLUMNS, totalPlayers);
  const col = slotNumber % columns;
  const row = Math.floor(slotNumber / columns);

  return { row, col };
}

/**
 * Check if two positions are adjacent
 */
export function arePositionsAdjacent(slot1, slot2, totalPlayers) {
  const { row: row1, col: col1 } = getRowCol(slot1, totalPlayers);
  const { row: row2, col: col2 } = getRowCol(slot2, totalPlayers);

  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);

  // Adjacent if within 1 row and 1 column
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Get center position of grid
 */
export function getGridCenter(totalPlayers) {
  const layout = calculateGridLayout(totalPlayers);
  return {
    x: 0,
    y: GRID_CONFIG.COIN_Y_POSITION,
    z: 0,
  };
}

/**
 * Calculate camera distance needed to frame grid
 */
export function calculateCameraDistance(totalPlayers) {
  const layout = calculateGridLayout(totalPlayers);

  // Calculate bounding box dimensions
  const width = layout.totalWidth + 200; // Add padding
  const height = layout.totalHeight + 200;

  // Use the larger dimension to determine distance
  const maxDimension = Math.max(width, height);

  // FOV of 50 degrees
  const fov = 50;
  const fovRadians = (fov * Math.PI) / 180;

  // Calculate distance based on FOV
  const distance = maxDimension / (2 * Math.tan(fovRadians / 2));

  return Math.max(800, distance); // Minimum distance
}

/**
 * Get grid bounds (for camera framing)
 */
export function getGridBounds(totalPlayers) {
  const layout = calculateGridLayout(totalPlayers);

  return {
    minX: -layout.totalWidth / 2 - 100,
    maxX: layout.totalWidth / 2 + 100,
    minY: GRID_CONFIG.COIN_Y_POSITION - 100,
    maxY: GRID_CONFIG.COIN_Y_POSITION + 100,
    minZ: -layout.totalHeight / 2 - 100,
    maxZ: layout.totalHeight / 2 + 100,
  };
}

export default {
  calculateGridLayout,
  getCompactGridLayout,
  getRowCol,
  arePositionsAdjacent,
  getGridCenter,
  calculateCameraDistance,
  getGridBounds,
};
