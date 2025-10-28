# Battle Royale Withdrawal System - Fixed

## What Was Fixed

### 1. Removed Server-Side Claim Endpoints (CRITICAL FIX)
**Problem**: The previous implementation had server-side endpoints that used the server's wallet to call withdrawal functions on behalf of users. This was architecturally wrong and potentially dangerous.

**Fixed**:
- ❌ Removed `/api/battle-royale/:gameId/claim-creator-funds` (used server wallet)
- ❌ Removed `/api/battle-royale/:gameId/claim-winner-nft` (used server wallet)  
- ✅ Added `/api/battle-royale/:gameId/mark-creator-paid` (DB update only)
- ✅ Added `/api/battle-royale/:gameId/mark-nft-claimed` (DB update only)

**Files Changed**:
- `server/routes/api.js` - Replaced claim endpoints with DB update endpoints
- `server/services/blockchain.js` - Removed `withdrawWinnerNFT()` and `withdrawCreatorFunds()` methods

### 2. Updated Frontend to Update Database After Withdrawals
**Problem**: Frontend was calling the contract correctly with user wallets, but wasn't updating the database to reflect successful withdrawals.

**Fixed**: Updated `src/pages/Profile.jsx` to call the new DB update endpoints after successful withdrawals:
- After creator withdraws funds → calls `/api/battle-royale/:gameId/mark-creator-paid`
- After winner claims NFT → calls `/api/battle-royale/:gameId/mark-nft-claimed`

This ensures the UI properly reflects withdrawal status across all pages.

### 3. Verified Create Battle Flow is Clean
**Confirmed**: The create battle flow has NO conflicts:
1. Frontend submits form
2. Backend creates DB entry ONLY (no blockchain operations)
3. Frontend handles ALL blockchain operations:
   - Approves NFT for transfer
   - Calls contract's `createBattleRoyale` function
   - All using the USER's wallet (not server wallet)

---

## How The System Works Now (Correct Architecture)

### Game Creation Flow
```
User → Frontend → Backend (DB only) → Frontend → Contract
                                       (User Wallet)
```

1. User fills out create battle form
2. Frontend sends data to `/api/battle-royale/create`
3. Backend creates database entry and physics game state (NO blockchain)
4. Frontend calls `contractService.createBattleRoyale()`
   - Approves NFT with user's wallet
   - Calls contract's `createBattleRoyale` with user's wallet
5. NFT is now in escrow in the contract

### Game Play Flow
```
Players → Frontend → Contract → Backend (complete game)
         (User Wallets)         (Server monitors)
```

1. Players pay entry fees (user wallets → contract)
2. Game plays out
3. Backend calls contract's `completeBattleRoyale` (server wallet, onlyOwner)
   - This sets the winner address
   - NO assets are transferred - they stay in contract
4. Database is updated with winner

### Withdrawal Flow (CORRECT - User Wallets)

#### Creator Withdraws Entry Fees
```
Creator → Frontend → Contract → Frontend → Backend (DB update)
         (User Wallet)          (Success)
```

1. Creator clicks "Withdraw Funds" on Profile page
2. Frontend calls `contractService.withdrawBattleRoyaleCreatorFunds(gameId)`
3. Contract function `withdrawCreatorFunds` is called **with creator's wallet**:
   - Verifies `msg.sender == game.creator`
   - Calculates platform fee
   - Transfers fee to platform
   - Transfers remaining funds to creator
   - Marks `creatorPaid = true` in contract
4. On success, frontend calls `/api/battle-royale/:gameId/mark-creator-paid`
5. Database flag `creator_paid` is set to 1
6. UI updates to show "Funds Withdrawn"

#### Winner Claims NFT
```
Winner → Frontend → Contract → Frontend → Backend (DB update)
        (User Wallet)          (Success)
```

1. Winner clicks "Claim NFT" on Profile page
2. Frontend calls `contractService.withdrawBattleRoyaleWinnerNFT(gameId)`
3. Contract function `withdrawWinnerNFT` is called **with winner's wallet**:
   - Verifies `msg.sender == game.winner`
   - Transfers NFT to winner
   - Marks `nftClaimed = true` in contract
4. On success, frontend calls `/api/battle-royale/:gameId/mark-nft-claimed`
5. Database flag `nft_claimed` is set to 1
6. UI updates to show "NFT Claimed"

---

## Contract Address (Consistent Across All Components)
```
0x1d0C6aA57c2c4c7764B9FFdd13DFB6319db02A64
```

Confirmed in:
- ✅ Frontend: `src/services/ContractService.js` line 234
- ✅ Backend: `server/server.js` line 28  
- ✅ Admin Panel: `src/components/AdminPanel.jsx` line 197

---

## What to Be Careful Of

### 1. **Contract Address Consistency**
- Frontend, backend, and any admin tools MUST use the same address
- Never change the contract address without updating ALL references

### 2. **Gas Requirements**
- **Creator withdrawing funds**: Creator needs Base ETH for gas
- **Winner claiming NFT**: Winner needs Base ETH for gas
- **Server completing games**: Server wallet needs Base ETH for gas

### 3. **Flow Ownership**
- ✅ **Creation**: Frontend handles NFT approval & deposit (user wallet)
- ✅ **Joining**: Frontend handles entry fee payment (user wallet)
- ✅ **Completion**: Backend calls completeBattleRoyale (server wallet, onlyOwner)
- ✅ **Withdrawals**: Frontend handles all withdrawals (user wallets)

### 4. **Database Schema**
- `creator_paid` (integer, 0 or 1): Tracks if creator withdrew funds
- `nft_claimed` (integer, 0 or 1): Tracks if winner claimed NFT
- `creator_paid_tx` (string): Transaction hash of creator withdrawal
- `nft_claimed_tx` (string): Transaction hash of NFT claim
- `winner` (address): Set when game completes
- `status` (string): 'filling' → 'active' → 'completed'

### 5. **Security**
- ✅ Users always use their own wallets for value transfers
- ✅ Server wallet only completes games (no value transfer)
- ✅ Contract enforces all permissions on-chain
- ❌ NEVER expose CONTRACT_OWNER_KEY in frontend

---

## Testing Checklist

### Fresh Game Test
1. ✅ Create new game:
   - Select NFT
   - Set entry fee
   - Approve NFT (metamask/wallet popup)
   - Create game (contract call)
   - Game appears in lobby

2. ✅ Players join:
   - Pay entry fee + service fee
   - Game fills to max players
   - Game starts automatically

3. ✅ Game completes:
   - Backend calls completeBattleRoyale
   - Winner is determined
   - Database updated with winner
   - Status set to 'completed'

4. ✅ Creator withdraws:
   - Go to Profile page
   - See "Withdraw Funds" button
   - Click button (wallet popup)
   - Funds received (minus platform fee)
   - Button disappears, shows "✅ Funds Withdrawn"

5. ✅ Winner claims NFT:
   - Go to Profile page
   - See "Claim NFT" button
   - Click button (wallet popup)
   - NFT received in wallet
   - Button disappears, shows "✅ NFT Claimed"

---

## Troubleshooting

### "L2 Errors" When Creating Game
**Possible Causes**:
1. Wrong network - Make sure you're on Base (chainId 8453)
2. NFT not owned - Verify you own the NFT you're trying to use
3. Insufficient gas - Ensure you have Base ETH for gas
4. NFT already approved/in use - Check if NFT is already in another game

**Debug Steps**:
1. Check browser console for error messages
2. Verify wallet is connected to Base network
3. Check NFT ownership with `contractService.nfts`
4. Try refreshing NFT list

### "Failed to Withdraw" Errors
**Possible Causes**:
1. Game not completed yet
2. Already withdrawn
3. Not the creator/winner
4. Insufficient gas

**Debug Steps**:
1. Check game status in database
2. Verify contract flags: `creatorPaid` / `nftClaimed`
3. Confirm correct wallet is connected
4. Check wallet has Base ETH for gas

---

## API Endpoints Reference

### Battle Royale Endpoints
```
POST /api/battle-royale/create
- Creates DB entry and physics game
- NO blockchain operations
- Returns gameId

POST /api/battle-royale/:gameId/mark-creator-paid
- Updates DB after creator withdraws funds
- Requires: creator address, transactionHash
- Sets creator_paid = 1

POST /api/battle-royale/:gameId/mark-nft-claimed
- Updates DB after winner claims NFT
- Requires: winner address, transactionHash
- Sets nft_claimed = 1

GET /api/users/:address/created-games
- Returns games created by address
- Includes withdrawal status flags

GET /api/users/:address/participated-games
- Returns games user participated in
- Includes claim status for wins
```

---

## Summary

The system now works correctly with proper separation of concerns:

- **Frontend**: Handles all user-initiated blockchain operations (create, join, withdraw)
- **Backend**: Manages database, physics game state, and game completion
- **Contract**: Enforces all rules and permissions on-chain
- **Database**: Tracks game state and withdrawal status for UI

All withdrawals are initiated by users with their own wallets, ensuring security and proper gas payment. The database tracks withdrawal status to prevent duplicate claims in the UI.

The "create battle" flow is clean with no conflicts - backend only touches the database, frontend handles all blockchain operations.

