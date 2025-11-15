# Grid-Based Multi-Player Coin Flip Game - Implementation Plan

**Target:** Support 1v1, 6-player, 12-player, 18-player, and 24-player games
**Layout:** 6 coins across (max), dynamic rows based on player count
**Key Feature:** Remove tubes entirely, just coins on grid with right sidebar

---

## ✅ COMPLETED

### Phase 0: Foundation
- [x] Add mode selector to Create Battle page (1v1, 6p, 12p, 18p, 24p)
- [x] Update pricing calculations for variable player counts
- [x] Update server API to accept game_mode and max_players
- [x] Update database service to store game_mode field
- [ ] **DATABASE MIGRATION NEEDED:** Run `ALTER TABLE battle_royale_games ADD COLUMN game_mode TEXT DEFAULT '6player';`

---

## 🚧 IN PROGRESS

### Phase 1: Core Structure
- [ ] Create main HTML entry point: `grid-game.html`
- [ ] Create game configuration: `js/config.js`
- [ ] Create scene setup module: `js/core/scene-setup.js`
- [ ] Create animation loop: `js/core/animation-loop.js`
- [ ] Create game state manager: `js/core/game-state.js`

### Phase 2: Grid System
- [ ] Create grid layout calculator (6 across, dynamic rows)
- [ ] Create coin positioning system
- [ ] Create coin creation module (no tubes!)
- [ ] Add simple background per coin slot
- [ ] Test with different player counts (2, 6, 12, 18, 24)

### Phase 3: Coin Mechanics
- [ ] Port coin flip animation from existing game
- [ ] Implement simultaneous flip capability
- [ ] Add player name/avatar labels
- [ ] Add coin customization (heads/tails textures)
- [ ] Visual feedback for eliminated players

### Phase 4: Right Sidebar UI
- [ ] Create sidebar HTML structure
- [ ] Add current round display
- [ ] Add target display (HEADS/TAILS)
- [ ] Add power meter (global or individual - TBD)
- [ ] Add countdown timer
- [ ] Add player stats display
- [ ] Add coin picker
- [ ] Add mute toggle
- [ ] Add total flips counter
- [ ] Add sidebar collapse/expand toggle

### Phase 5: Dynamic Grid Resizing
- [ ] Implement elimination detection
- [ ] Create grid reorganization algorithm
- [ ] Animate coin repositioning
- [ ] Keep eliminated coins visible but grayed out (or remove)
- [ ] Test with progressive eliminations

### Phase 6: Socket.io Integration
- [ ] Create new socket events for grid game
- [ ] Handle simultaneous player flips
- [ ] Sync player states across clients
- [ ] Handle player join/leave
- [ ] Handle round progression
- [ ] Broadcast eliminations

### Phase 7: Server Logic
- [ ] Update PhysicsGameManager for grid modes
- [ ] Remove tube/physics dependencies for grid games
- [ ] Implement round-based logic
- [ ] Handle simultaneous flip timing
- [ ] Determine winners/losers
- [ ] Handle game completion

### Phase 8: Polish & Testing
- [ ] Add sound effects
- [ ] Add haptic feedback
- [ ] Mobile responsiveness
- [ ] Camera positioning for different screen sizes
- [ ] Performance testing with 24 players
- [ ] Cross-browser testing

### Phase 9: Integration
- [ ] Route from lobby to grid-game.html based on game_mode
- [ ] Update lobby display to show game modes
- [ ] Add game mode badges/icons
- [ ] Test end-to-end flow

---

## 📋 KEY DECISIONS TO MAKE

1. **Power Meter:** Synchronized (all players see same bar) vs Individual timing?
2. **Eliminated Players:** Keep visible (grayed out) or remove from grid?
3. **Grid Resizing:** Dynamic (moves coins to top) or Static (leaves gaps)?
4. **Camera:** Fixed orthographic view or dynamic zoom?
5. **Target Selection:** Random flash animation or instant display?

---

## 🎯 CURRENT TASK

**Next Step:** Create main HTML entry point and basic structure

---

## 📝 NOTES

- Keep existing tube-based game completely separate
- All grid game files in `/public/grid-game/`
- Share utilities where possible (audio, socket base, etc.)
- Database already updated to support game_mode field
- Create page already updated with mode selector

---

**Last Updated:** 2025-01-15
**Current Phase:** Phase 1 - Core Structure
