# Battle Royale NFT Withdrawal System

## Overview
This implementation creates a comprehensive withdrawal system for Battle Royale games, moving all withdrawal logic from the game page to the user's profile page for enhanced security and better user experience.

## Features Implemented

### 1. **Cancel Game Functionality**
- **Location**: `src/components/BattleRoyale/LobbyScreen.jsx`
- **Features**:
  - Creator-only "Cancel Flip" button in the lobby
  - Confirms cancellation with the user
  - Updates game status to 'cancelled' in database
  - Prevents new players from joining
  - Redirects creator to their profile after cancellation
  - Broadcasts cancellation to all players in the lobby

### 2. **API Endpoints**
All endpoints are in `server/routes/api.js`:

#### Cancel Game Endpoint
- **Route**: `POST /api/battle-royale/:gameId/cancel`
- **Auth**: Creator verification
- **Function**: Cancels a game that's in 'filling' status
- **Response**: Success/error message

#### Get Created Games
- **Route**: `GET /api/users/:address/created-games`
- **Returns**: All Battle Royale games created by the user
- **Sorted**: Most recent first

#### Get Participated Games
- **Route**: `GET /api/users/:address/participated-games`
- **Returns**: All Battle Royale games the user joined
- **Includes**: Player status, elimination round, win/loss data

### 3. **Database Schema Updates**
New migration file: `scripts/migration-add-withdrawal-tracking.sql`

Added fields to `battle_royale_games` table:
- `nft_withdrawn` - Boolean tracking if NFT was withdrawn
- `creator_funds_withdrawn` - Boolean tracking if creator withdrew their earnings
- `nft_withdrawn_at` - Timestamp of NFT withdrawal
- `creator_funds_withdrawn_at` - Timestamp of funds withdrawal
- `nft_withdrawn_tx_hash` - Blockchain transaction hash for NFT withdrawal
- `creator_funds_withdrawn_tx_hash` - Blockchain transaction hash for funds withdrawal

### 4. **Profile Page - Battle Royale Tab**
**Location**: `src/pages/Profile.jsx`

New "⚔️ Battle Royale" tab with two sections:

#### Creator Games Section (👑 Games I Created)
Shows all games created by the user with:
- NFT preview image
- Game details (name, collection, entry fee)
- Game status badge (Waiting, In Progress, Completed, Cancelled)
- Player count (current/max)
- **Action Buttons**:
  - **View Game**: Navigate to game lobby
  - **💰 Withdraw Funds**: (Shown for completed games) - Withdraws creator earnings from the smart contract
  - **🎨 Reclaim NFT**: (Shown for cancelled games) - Reclaims NFT after 24 hours
  - Status indicators when already withdrawn

#### Player Games Section (🎮 Games I Joined)
Shows all games the user participated in with:
- NFT preview image with special golden border for won games
- Game details
- Status badges:
  - Game status (Waiting, Playing, Complete, Cancelled)
  - **🏆 WINNER** badge for won games
  - **💀 Eliminated** badge showing elimination round
- **Action Buttons**:
  - **View Game**: Navigate to game page
  - **🏆 Claim NFT**: (Winners only) - Claims the NFT prize from the smart contract
  - Status indicator when NFT already claimed

### 5. **Smart Contract Integration**
**Location**: `src/services/ContractService.js`

Three new methods added:

#### `withdrawBattleRoyaleCreatorFunds(gameId)`
- Calls smart contract's `withdrawCreatorFunds(bytes32 gameId)`
- Transfers entry fees minus platform fee to creator
- Available only for completed games
- Returns transaction hash and receipt

#### `withdrawBattleRoyaleWinnerNFT(gameId)`
- Calls smart contract's `withdrawWinnerNFT(bytes32 gameId)`
- Transfers NFT prize to winner
- Available only for completed games
- Winner must be verified participant

#### `reclaimBattleRoyaleNFT(gameId)`
- Calls smart contract's `reclaimBattleRoyaleNFT(bytes32 gameId)`
- Returns NFT to creator for cancelled/unfilled games
- **Note**: Smart contract has a 24-hour waiting period built-in for security
- Refunds all joined players (they must call individually)

## Smart Contract Flow

### For Creators:
1. Create game → NFT deposited in contract
2. If game cancelled → Reclaim NFT from profile (contract enforces 24hr wait for security)
3. If game completes → Withdraw earnings from profile immediately

### For Players:
1. Join game → Pay entry fee
2. Play game
3. If winner → Claim NFT from profile
4. If loser → No further action needed

## Security Improvements

1. **Separation of Concerns**: Game logic is separate from withdrawal logic
2. **No In-Game Manipulation**: Withdrawals can only happen from profile, preventing exploitation during gameplay
3. **Smart Contract Enforcement**: All transfers are validated by the smart contract
4. **Clear Ownership Tracking**: Database tracks withdrawal status to prevent UI confusion
5. **Creator Verification**: Only creators can cancel games and reclaim NFTs
6. **Winner Verification**: Smart contract verifies winner status before NFT transfer

## User Experience Improvements

1. **Single Dashboard**: All game management in one place (profile)
2. **Clear Status Indicators**: Visual badges show game state and available actions
3. **NFT Previews**: Users can see what they're claiming/withdrawing
4. **Historical View**: See all past games and their outcomes
5. **Automatic Refresh**: Game list refreshes after successful withdrawals
6. **Toast Notifications**: Clear feedback for all actions

## Files Modified

### Frontend
- `src/components/BattleRoyale/LobbyScreen.jsx` - Added cancel button and handler
- `src/pages/Profile.jsx` - Added Battle Royale tab with creator and player sections
- `src/services/ContractService.js` - Added three withdrawal methods

### Backend
- `server/routes/api.js` - Added three new endpoints (cancel, created-games, participated-games)

### Database
- `scripts/migration-add-withdrawal-tracking.sql` - New migration for tracking withdrawals

## Testing Checklist

Before going live, test the following flows:

### Creator Flow:
- [ ] Create a Battle Royale game
- [ ] Cancel game in lobby
- [ ] View cancelled game in profile
- [ ] Wait 24 hours and reclaim NFT
- [ ] Create another game and let it complete
- [ ] Withdraw creator funds from profile

### Player Flow:
- [ ] Join a Battle Royale game
- [ ] View game in participated section
- [ ] Win the game
- [ ] Claim NFT from profile

### Edge Cases:
- [ ] Try to cancel game after it starts (should fail)
- [ ] Try to reclaim NFT before 24 hours if game was cancelled (smart contract will reject)
- [ ] Try to claim NFT as non-winner (should fail)
- [ ] Try to withdraw funds twice (should show already withdrawn)
- [ ] Test with games at different stages (filling, active, complete, cancelled)
- [ ] Winner claims NFT immediately after game completes
- [ ] Creator withdraws funds immediately after game completes

## Database Migration

To apply the withdrawal tracking fields, run:

```bash
sqlite3 your_database.db < scripts/migration-add-withdrawal-tracking.sql
```

Or manually execute the migration SQL on your production database.

## Next Steps

1. **Run Database Migration**: Apply the withdrawal tracking schema
2. **Test Locally**: Go through the testing checklist above
3. **Update Smart Contract ABI**: Ensure CONTRACT_ABI in ContractService includes all three withdrawal functions
4. **Deploy**: Push to production
5. **Monitor**: Watch for any withdrawal failures in logs

## Notes

- All withdrawals require gas fees (user pays)
- **Smart Contract Limitation**: 24-hour waiting period is hardcoded in the deployed contract for cancelled game NFT reclaims (line 647). This cannot be changed without deploying a new contract.
- Winner NFT claims and creator fund withdrawals have NO waiting period - instant
- Creator earnings are automatically calculated as: `totalPool - platformFee`
- Platform fee is configurable in the smart contract
- Withdrawal status is tracked in database but ultimate truth is on-chain

## Support

If users report issues:
1. Check transaction hash in browser console logs
2. Verify on block explorer (Basescan)
3. Confirm wallet has sufficient gas
4. Check game status in database
5. Verify user is creator/winner as appropriate

