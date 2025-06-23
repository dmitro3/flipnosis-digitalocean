# Coin Selection System Implementation

## Overview
We've successfully implemented a new coin selection system that allows game creators to choose which coin design will be used for the entire game. Both players will see the same coin (the creator's choice) instead of their own personal coins.

## What's New

### 1. CoinSelector Component (`src/components/CoinSelector.jsx`)
- **Default Coin Options**: 4 built-in coin designs:
  - Classic Gold (`plainh.png` / `plaint.png`)
  - Skull Coin (`skullh.png` / `skullt.png`) 
  - Trump Coin (`trumpheads.webp` / `trumptails.webp`)
  - Mario Bros (`mario.png` / `luigi.png`)
- **Custom Coin Option**: Users can use their personal uploaded coin
- **Live Preview**: Shows both heads and tails sides of selected coin
- **Visual Feedback**: Clear selection states and descriptions

### 2. Updated CreateFlip Page (`src/pages/CreateFlip.jsx`)
- **New Coin Selection Section**: Integrated into game creation flow
- **Validation**: Ensures a coin is selected before creating the game
- **Confirmation Display**: Shows selected coin name and type
- **Game Data**: Coin selection is saved to the game data

### 3. Enhanced Server (`server/server.js`)
- **Database Schema**: Added `coin` column to `games` table
- **Game Storage**: Coin data is stored as JSON in the database
- **Game State Broadcasting**: Coin information is sent to all players
- **Backward Compatibility**: Handles games without coin data

### 4. Updated FlipGame Component (`src/components/FlipGame.jsx`)
- **Creator's Choice Priority**: Uses the game creator's selected coin for all players
- **Fallback Support**: Falls back to personal coins for older games
- **Real-time Updates**: Coin images update when game state is received

## How It Works

### Game Creation Flow
1. Creator selects game type (NFT vs Crypto / NFT vs NFT)
2. Creator selects NFT to flip
3. **NEW**: Creator chooses coin design from 4 defaults or their custom coin
4. Creator sets price (if NFT vs Crypto)
5. Game is created with selected coin data stored

### Game Playing Flow
1. Players join the game
2. **NEW**: Both players see the creator's selected coin design
3. Players make their heads/tails choices
4. Players charge power and flip using the unified coin design
5. Results are displayed with the consistent coin design

### Database Storage
```sql
-- Coin data is stored as JSON in the games table
coin TEXT -- Example: {"id":"skull","type":"default","name":"Skull Coin","headsImage":"/Images/Coins/skullh.png","tailsImage":"/Images/Coins/skullt.png"}
```

### WebSocket Data
```javascript
// Game state now includes coin information
{
  type: 'game_state',
  gameId: '...',
  creator: '...',
  joiner: '...',
  // ... other game data
  coin: {
    id: 'skull',
    type: 'default', // or 'custom'
    name: 'Skull Coin',
    headsImage: '/Images/Coins/skullh.png',
    tailsImage: '/Images/Coins/skullt.png',
    description: 'Spooky skull design'
  }
}
```

## Available Coin Designs

### 1. Classic Gold
- **Files**: `plainh.png` / `plaint.png`
- **Description**: Traditional gold coin design
- **Best for**: Classic, elegant games

### 2. Skull Coin  
- **Files**: `skullh.png` / `skullt.png`
- **Description**: Dark, gothic skull design
- **Best for**: Halloween themes, edgy games

### 3. Trump Coin
- **Files**: `trumpheads.webp` / `trumptails.webp`  
- **Description**: Political themed coin
- **Best for**: Political discussions, meme games

### 4. Mario Bros
- **Files**: `mario.png` / `luigi.png`
- **Description**: Mario (heads) vs Luigi (tails)
- **Best for**: Gaming themes, fun casual games

### 5. Custom Coins
- **Source**: User's profile uploads
- **Requirements**: Both heads and tails images must be uploaded
- **Benefits**: Personalized branding, unique themes

## Benefits

1. **Consistent Visual Experience**: Both players see the same coin design
2. **Creator Control**: Game creators can set the theme/mood with coin choice
3. **Enhanced Customization**: 5 total options (4 defaults + custom)
4. **Better Branding**: Creators can use their custom coins for recognition
5. **Improved UX**: Clear previews and selection interface

## Migration & Compatibility

- **Existing Games**: Will continue to work with fallback to personal coins
- **New Games**: Will require coin selection for creation
- **Database**: Automatically adds coin column to existing databases
- **Frontend**: Gracefully handles games with or without coin data

## Next Steps

1. **Test the implementation** by creating a new game
2. **Verify** that both players see the same coin design
3. **Check** that all 4 default coins display correctly
4. **Confirm** custom coins work when user has uploaded heads/tails images
5. **Validate** backward compatibility with existing games

The system is now ready for testing and use! 🎮🪙 