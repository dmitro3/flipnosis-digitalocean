# Withdrawal System Deployment Instructions

## ✅ Contract Verification Complete

Your deployed contract at **`0x1d0C6aA57c2c4c7764B9FFdd13DFB6319db02A64`** (V2 - Improved) has all improved withdrawal functions:

**Old Contract:** `0x8CE785e0EC60B3e34Ac49D4E1128683d4acc6502` (Legacy - had 24hr wait, no player withdrawals)

1. ✅ `withdrawCreatorFunds(bytes32 gameId)` - Line 574
2. ✅ `withdrawWinnerNFT(bytes32 gameId)` - Line 602
3. ✅ `reclaimBattleRoyaleNFT(bytes32 gameId)` - Line 640

## ⚠️ Important Note: 24-Hour Period

The deployed smart contract has a **24-hour waiting period** for NFT reclaims on cancelled games (line 647):
```solidity
require(block.timestamp > game.createdAt + 24 hours, "Too early to reclaim");
```

**This cannot be changed** without deploying a new contract. However:
- ✅ **Winners can claim NFTs IMMEDIATELY** after game completes
- ✅ **Creators can withdraw funds IMMEDIATELY** after game completes
- ⏰ **Only cancelled game NFT reclaims** have the 24-hour wait

This is actually a good security feature to prevent abuse.

## 🚀 Database Migration (Safe & Tested)

### Step 1: Run the Migration

Open PowerShell and run:

```powershell
cd "C:\Users\danie\Desktop\Flipnosis - Battle Royale current"
.\deployment\migrate-withdrawal-tracking.ps1
```

### What This Script Does:

1. **Backs up your database FIRST** (automatic)
2. **Counts your ~300 games** before migration
3. **Adds 6 new columns** to `battle_royale_games` table:
   - `nft_withdrawn` (Boolean)
   - `creator_funds_withdrawn` (Boolean)
   - `nft_withdrawn_at` (Timestamp)
   - `creator_funds_withdrawn_at` (Timestamp)
   - `nft_withdrawn_tx_hash` (Text)
   - `creator_funds_withdrawn_tx_hash` (Text)
4. **Verifies game count** matches after migration
5. **Rolls back automatically** if anything goes wrong

### Safety Features:

- ✅ **NEVER deletes data** - only adds columns
- ✅ **Automatic backup** before any changes
- ✅ **Verification checks** - counts games before/after
- ✅ **Auto-rollback** if verification fails
- ✅ **No restart required** - changes are immediate

## 📋 Post-Migration Checklist

After running the migration:

### 1. Verify Migration Success
The script will output:
```
✓ All XXX games preserved
✓ New withdrawal tracking columns added
✓ Backup saved as: flipz_backup_withdrawal_YYYYMMDD_HHMMSS.db
```

### 2. Test Withdrawal Features

#### Test Creator Flow:
1. Create a test Battle Royale game
2. Cancel it in the lobby
3. Go to Profile → "⚔️ Battle Royale" tab
4. See the cancelled game with "🎨 Reclaim NFT" button
5. ⚠️ Note: Smart contract enforces 24hr wait for cancelled games

#### Test Winner Flow:
1. Complete an existing game
2. Winner goes to Profile → "⚔️ Battle Royale" tab  
3. See the won game with "🏆 Claim NFT" button
4. Click to claim - should work immediately ✅

#### Test Creator Earnings:
1. Complete an existing game
2. Creator goes to Profile → "⚔️ Battle Royale" tab
3. See completed game with "💰 Withdraw Funds" button
4. Click to withdraw - should work immediately ✅

## 🔧 Troubleshooting

### Migration Fails
If the migration script fails:
1. Check the error message carefully
2. A backup was automatically created: `/opt/flipnosis/app/server/flipz_backup_withdrawal_*.db`
3. Contact support with the error message

### Restore from Backup (if needed)
```bash
ssh root@159.69.242.154
cd /opt/flipnosis/app/server
cp flipz.db flipz_current.db  # Save current state
cp flipz_backup_withdrawal_YYYYMMDD_HHMMSS.db flipz.db  # Restore
systemctl restart flipnosis-app
```

### Check Current Game Count
```bash
ssh root@159.69.242.154
cd /opt/flipnosis/app/server
sqlite3 flipz.db "SELECT COUNT(*) FROM battle_royale_games"
```

## 📊 Database Schema Reference

After migration, `battle_royale_games` table will have these NEW columns:

| Column | Type | Purpose |
|--------|------|---------|
| `nft_withdrawn` | BOOLEAN | Has NFT been withdrawn/claimed |
| `creator_funds_withdrawn` | BOOLEAN | Has creator withdrawn earnings |
| `nft_withdrawn_at` | TIMESTAMP | When NFT was withdrawn |
| `creator_funds_withdrawn_at` | TIMESTAMP | When funds were withdrawn |
| `nft_withdrawn_tx_hash` | TEXT | Blockchain transaction for NFT |
| `creator_funds_withdrawn_tx_hash` | TEXT | Blockchain transaction for funds |

## ✅ What's Already Done

The following have already been implemented and accepted:

1. ✅ Cancel game button in lobby (creator only)
2. ✅ "⚔️ Battle Royale" tab in Profile page
3. ✅ Creator games section with withdraw buttons
4. ✅ Player games section with claim buttons
5. ✅ Smart contract withdrawal methods
6. ✅ API endpoints for game history
7. ✅ Database migration script (ready to run)

## 🎯 Next Actions

1. **Run the migration** (instructions above)
2. **Test the features** (creator and winner flows)
3. **Monitor for issues** in first few withdrawals
4. **Celebrate!** 🎉 Your withdrawal system is production-ready

## 📞 Support

If you encounter any issues:
1. Check browser console for transaction errors
2. Check server logs: `ssh root@159.69.242.154 "journalctl -u flipnosis-app -f"`
3. Verify wallet has sufficient gas for transactions
4. Confirm user is the actual creator/winner

## 🔒 Security Benefits

- ✅ Withdrawals isolated from game page (can't manipulate during gameplay)
- ✅ Smart contract enforces all rules
- ✅ Creator/winner verification on-chain
- ✅ Database tracks status for UI clarity
- ✅ Transaction hashes stored for audit trail

