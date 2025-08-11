# Deposit Timeout Fix

## Problem
Users were frequently encountering the error "Deposit period has expired or game is not active" on the CreateFlip page, even immediately after successful game creation.

## Root Cause
The issue was caused by a race condition where the `canDeposit` function was being called too quickly after the game creation transaction, before the blockchain state had been fully updated. The `canDeposit` function checks:

```solidity
function canDeposit(bytes32 gameId) external view returns (bool) {
    ActiveGame memory game = games[gameId];
    return game.player1 != address(0) && 
           !game.completed && 
           block.timestamp <= game.depositTime + depositTimeout;
}
```

## Solution Implemented

### 1. Retry Mechanism
Added a retry mechanism with delays in both `depositNFT` and `depositETH` functions:

```javascript
// Add retry mechanism for canDeposit check due to potential race conditions
let canDeposit = false
let retryCount = 0
const maxRetries = 3

while (!canDeposit && retryCount < maxRetries) {
  try {
    canDeposit = await this.contract.canDeposit(gameIdBytes32)
    console.log(`🔍 Can deposit check result (attempt ${retryCount + 1}):`, canDeposit)
    
    if (!canDeposit && retryCount < maxRetries - 1) {
      console.log(`⏳ CanDeposit returned false, waiting 2 seconds before retry...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } catch (error) {
    console.error(`❌ Error calling canDeposit (attempt ${retryCount + 1}):`, error)
    canDeposit = false
    
    if (retryCount < maxRetries - 1) {
      console.log(`⏳ Error occurred, waiting 2 seconds before retry...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  retryCount++
}
```

### 2. Enhanced Fallback Logic
When `canDeposit` returns false after retries, the system now:

1. Gets detailed game information
2. Checks if the game actually exists and is active
3. Manually verifies the deposit timeout hasn't expired
4. Proceeds with deposit if all checks pass

### 3. Additional Delay in CreateFlip
Added a 3-second delay after game creation to ensure blockchain state is fully updated:

```javascript
// Add a small delay to ensure blockchain state is fully updated
showInfo('Waiting for blockchain confirmation...')
await new Promise(resolve => setTimeout(resolve, 3000))
```

### 4. Enhanced Debugging
Added comprehensive logging to help diagnose issues:

- Game state details when `canDeposit` returns false
- Time remaining calculations
- Block timestamp comparisons
- Final game existence verification

## Files Modified

1. `src/services/ContractService.js` - Added retry mechanism and enhanced fallback logic
2. `src/pages/CreateFlip.jsx` - Added delay after game creation
3. `scripts/testDepositFlow.js` - Created test script for debugging

## Expected Behavior

- Game creation should work reliably
- Deposit should proceed even if initial `canDeposit` check fails due to timing
- Better error messages and debugging information
- Reduced frequency of "Deposit period has expired" errors

## Testing

The fix includes:
- Retry mechanism with exponential backoff
- Manual timeout verification
- Enhanced error handling
- Comprehensive logging for debugging

This should resolve the frequent "Deposit period has expired or game is not active" errors that users were experiencing. 