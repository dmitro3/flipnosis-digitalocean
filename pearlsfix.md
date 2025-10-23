# Pearls Visibility Fix

## Issue Description

When a player charges their power (holds down the charge button), other players cannot see the pearls in the charging player's tube. The pearls remain invisible to remote players even though the charging animation should be visible to everyone.

## Root Cause

The problem was in the power charging system in `public/test-tubes.html` around lines 4858-4902. The code had separate conditions for local vs remote players:

```javascript
// BROKEN CODE - Only local player gets power increment
if (tube.isFilling && !tube.isShattered && playerSlot === i) {
  tube.power = Math.min(tube.power + 0.6, 100);
  // ... power increment logic
}

// BROKEN CODE - Remote players only get visual updates
if (tube.isFilling && !tube.isShattered && playerSlot !== i) {
  const powerPercent = tube.power / 100;
  updatePearlColors(tube, powerPercent, i);
  // ... visual updates only
}
```

**The Problem:** Remote players' tubes never increment their power beyond 0%, so the pearls stay invisible because `tube.power` remains at 0.

## The Fix

Unified the power charging system to work for ALL players:

```javascript
// FIXED CODE - All players get power increment
if (tube.isFilling && !tube.isShattered) {
  // Increase power (0-100 over ~3 seconds) - FOR ALL PLAYERS
  tube.power = Math.min(tube.power + 0.6, 100);
  const powerPercent = tube.power / 100;
  
  // Update foam intensity
  tube.foamIntensity = powerPercent;
  
  // Calculate power level (1-5) based on power percentage
  const powerLevel = Math.min(5, Math.max(1, Math.ceil(tube.power / 20)));
  
  // Broadcast only for local player (to avoid duplicates)
  if (isServerSideMode && socket && gameIdParam && walletParam && playerSlot === i) {
    if (frameCount % 5 === 0) {
      socket.emit('physics_power_charging', {
        gameId: gameIdParam,
        address: walletParam,
        power: tube.power,
        powerLevel: powerLevel,
        playerSlot: i,
        isFilling: tube.isFilling
      });
    }
  }
  
  // Update UI elements for all players
  if (tube.cardElement) {
    const powerBar = tube.cardElement.querySelector('.power-bar');
    const powerText = tube.cardElement.querySelector('.power-text');
    if (powerBar) powerBar.style.width = `${tube.power}%`;
    if (powerText) powerText.textContent = `POWER: ${tube.power.toFixed(0)}%`;
    
    // Change bar color as it charges (pink theme)
    if (tube.power > 75) {
      powerBar.style.background = 'linear-gradient(90deg, #ff1493, #ff69b4)';
    } else if (tube.power > 50) {
      powerBar.style.background = 'linear-gradient(90deg, #ff69b4, #ffb6c1)';
    }
  }
  
  // Unified pearl color update - Same for local and remote
  updatePearlColors(tube, powerPercent, i);
}
```

## Key Changes

1. **Removed `playerSlot` conditions** - All tubes that are `isFilling` now increment their power
2. **Unified power increment** - Both local and remote players see power increase from 0% to 100%
3. **Kept broadcast optimization** - Only local player broadcasts to server to avoid duplicates
4. **Unified visual updates** - All players get the same UI updates and pearl color changes

## Result

Now when any player charges:
- ✅ All players see the pearls become visible immediately
- ✅ All players see the power bar filling up
- ✅ All players see the charging animation
- ✅ All players see pearl colors changing as power increases
- ✅ No duplicate server broadcasts

## Files Modified

- `public/test-tubes.html` (lines ~4858-4902)

## Prevention

To prevent this issue from recurring, ensure that:
1. Power increment logic applies to ALL players, not just local players
2. Visual updates are unified for both local and remote players
3. Server broadcasts are only sent by the local player to avoid duplicates
4. The `playerSlot` condition is only used for server broadcasts, not for power increment logic

## Testing

To verify the fix works:
1. Start a multiplayer game with 2+ players
2. Have player 1 charge their power
3. Verify that player 2 can see the pearls in player 1's tube
4. Have player 2 charge their power
5. Verify that player 1 can see the pearls in player 2's tube
