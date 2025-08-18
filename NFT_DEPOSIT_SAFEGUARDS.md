# NFT Deposit Safeguards System

## Overview

The NFT Deposit Safeguards system prevents users from entering games where NFTs haven't actually been deposited into the smart contract. This addresses the issue where creators could create games but fail to deposit their NFTs, leaving empty games that players couldn't actually play.

## Features

### 1. Database Tracking
- **New Fields Added:**
  - `nft_deposited` (BOOLEAN) - Whether NFT is marked as deposited
  - `nft_deposit_time` (TIMESTAMP) - When NFT was deposited
  - `nft_deposit_hash` (TEXT) - Transaction hash of NFT deposit
  - `nft_deposit_verified` (BOOLEAN) - Whether deposit verified against contract
  - `last_nft_check_time` (TIMESTAMP) - Last time contract was checked

### 2. Homepage Protection
- **Entry Verification:** Users cannot enter games where NFTs aren't deposited
- **Database First:** Checks database status first, falls back to contract verification
- **Error Messages:** Clear feedback when games aren't ready

### 3. Visual Indicators
- **NFT Deposit Badge:** Shows NFT deposit status on game cards
- **Color Coding:**
  - 🟢 Green: NFT deposited and verified
  - 🟡 Yellow: NFT deposited but not verified
  - 🔴 Red: NFT not deposited
- **Clickable:** Users can click to refresh NFT status

### 4. Automatic Cleanup
- **Background Service:** Runs every 5 minutes
- **Age-Based Removal:** Games older than 10 minutes without NFT deposits are cancelled
- **Contract Verification:** Verifies NFT deposits against blockchain
- **Cooldown Protection:** 2-minute cooldown between contract checks

## Implementation Details

### Database Migration
```bash
node scripts/run-nft-deposit-migration.js
```

### Cleanup Service
- **Location:** `server/services/cleanupService.js`
- **Interval:** 5 minutes
- **Max Age:** 10 minutes for games without NFT deposits
- **Contract Check Cooldown:** 2 minutes

### Frontend Components
- **NFTDepositBadge:** `src/components/NFTDepositBadge.jsx`
- **Homepage Integration:** `src/pages/Home.jsx`
- **Contract Service:** Uses existing `ContractService.js`

### API Endpoints
- **Deposit Confirmation:** `POST /api/games/:gameId/deposit-confirmed`
- **Cleanup Stats:** `GET /api/cleanup/stats`

## Deployment

### Quick Deploy
```bash
./deployment/deploy-nft-safeguards.ps1 "Add NFT deposit safeguards"
```

### Manual Steps
1. Run database migration:
   ```bash
   node scripts/run-nft-deposit-migration.js
   ```

2. Build and deploy:
   ```bash
   npm run build
   ./deployment/deploy-hetzner-git-fixed.ps1 "Add NFT deposit safeguards"
   ```

3. Verify deployment:
   ```bash
   ./deployment/check-hetzner-status-fixed.ps1 -ServerIP 159.69.242.154
   ```

## Configuration

### Cleanup Service Settings
```javascript
// In server/services/cleanupService.js
this.CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
this.MAX_AGE_MINUTES = 10 // 10 minutes for games without NFT deposits
this.CONTRACT_CHECK_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes between contract checks
```

### Visual Badge Settings
```javascript
// In src/components/NFTDepositBadge.jsx
// Colors and styling can be customized
```

## Monitoring

### Cleanup Service Stats
```bash
curl https://flipnosis.com/api/cleanup/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "total_games": 150,
    "old_games_without_nft": 3,
    "games_needing_verification": 2,
    "cancelled_games": 5,
    "verified_games": 140
  },
  "cleanup_config": {
    "max_age_minutes": 10,
    "cleanup_interval_minutes": 5,
    "contract_check_cooldown_minutes": 2
  }
}
```

### Server Logs
Look for cleanup service logs:
```
🧹 Starting cleanup service...
🧹 Running cleanup...
📋 Found 5 games to check
✅ Cleanup completed: 2 games cleaned, 3 NFTs verified
```

## Benefits

1. **Prevents Empty Games:** Users can't enter games without deposited NFTs
2. **Automatic Cleanup:** Old incomplete games are automatically removed
3. **Visual Feedback:** Clear indicators show which games are ready
4. **Contract Verification:** Ensures database matches blockchain state
5. **Performance:** Database checks are fast, contract checks are rate-limited

## Troubleshooting

### Common Issues

1. **Migration Fails:**
   - Check database permissions
   - Ensure database file exists
   - Run migration manually: `node scripts/run-nft-deposit-migration.js`

2. **Cleanup Service Not Running:**
   - Check server logs for cleanup service startup
   - Verify blockchain service is initialized
   - Check `/api/cleanup/stats` endpoint

3. **NFT Badges Not Showing:**
   - Check browser console for errors
   - Verify `NFTDepositBadge` component is imported
   - Check database has new columns

4. **Games Not Being Cleaned Up:**
   - Check cleanup service logs
   - Verify game ages are correct
   - Check contract verification is working

### Debug Commands

```bash
# Check database schema
sqlite3 server/flipz.db ".schema games"

# Check cleanup stats
curl https://flipnosis.com/api/cleanup/stats

# Check server health
curl https://flipnosis.com/health

# View recent games
sqlite3 server/flipz.db "SELECT id, nft_deposited, nft_deposit_verified, created_at FROM games ORDER BY created_at DESC LIMIT 10;"
```

## Future Enhancements

1. **Admin Panel Integration:** Add cleanup stats to admin panel
2. **Email Notifications:** Notify creators when their games are cleaned up
3. **Manual Cleanup:** Add admin endpoint to manually trigger cleanup
4. **Metrics Dashboard:** Real-time monitoring of cleanup service
5. **Configurable Settings:** Make cleanup intervals configurable via admin panel
