# Secure Wallet Redeployment Guide

## Overview
This guide will help you redeploy your NFTFlipGame contract with your new secure wallet `0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1` after your previous wallet was compromised.

## Prerequisites

### 1. Set up your new wallet
- Make sure your new wallet `0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1` has some ETH on Base
- You'll need about 0.01-0.02 ETH for deployment (~$20-40)

### 2. Update environment variables
Create or update your `.env` file with your new wallet's private key:

```bash
# New secure wallet private key
PRIVATE_KEY=your_new_wallet_private_key_here

# Base RPC URL (if not already set)
VITE_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3

# BaseScan API key (for verification)
VITE_BASESCAN_API_KEY=your_basescan_api_key_here
```

## Step 1: Deploy New Contract

Run the deployment script with your new wallet:

```bash
npx hardhat run scripts/deploy-with-new-wallet.js --network base
```

**Expected Output:**
```
🚀 Deploying NFTFlipGame contract with NEW WALLET...
======================================================================
👤 NEW Admin Wallet: 0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1
💰 USDC Token: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
🔒 OLD Compromised Wallet: 0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628
🔑 Connected Wallet: 0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1

📦 Deploying NFTFlipGame contract with Battle Royale...
📝 Deploy transaction hash: 0x...
✅ Contract deployed successfully!
📍 NEW Contract Address: 0x[NEW_ADDRESS]
👤 Contract Owner: 0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1
```

## Step 2: Update Frontend Configuration

After deployment, update your frontend with the new contract address:

```bash
node scripts/update-frontend-config.js 0x[NEW_CONTRACT_ADDRESS]
```

This will automatically update:
- `src/services/ContractService.js`
- `.env` files
- `package.json` (if applicable)

## Step 3: Update Server Configuration

Update your server's contract address in the blockchain service:

1. **Update server environment variables:**
```bash
# In your server .env or environment
CONTRACT_ADDRESS=0x[NEW_CONTRACT_ADDRESS]
CONTRACT_OWNER_PRIVATE_KEY=your_new_wallet_private_key
```

2. **Update server code** (if hardcoded):
   - Check `server/services/blockchain.js`
   - Update any hardcoded contract addresses

## Step 4: Verify Deployment

### Test Admin Functions
1. Connect your new wallet to the frontend
2. Go to the admin panel
3. Try to access admin functions like:
   - Emergency NFT withdrawal
   - Direct NFT transfer
   - Platform fee settings

### Test Battle Royale
1. Create a new Battle Royale game
2. Join with another wallet
3. Complete the game
4. Test NFT claiming

## Step 5: Migrate Existing Games (Optional)

If you have existing games on the old contract that need to be migrated:

1. **Emergency withdraw NFTs** from old contract (if possible)
2. **Transfer NFTs** to new contract using admin functions
3. **Update database** to reference new contract address

## Security Notes

### Old Contract
- The old contract at `0xDE5B1D7Aa9913089710184da2Ba6980D661FDedb` should be considered compromised
- Do not use any admin functions on the old contract
- Users should not interact with the old contract

### New Contract
- Your new wallet `0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1` has full admin access
- Keep your private key secure
- Consider using a hardware wallet for additional security

## Troubleshooting

### Deployment Issues
- **Insufficient funds**: Make sure your new wallet has enough ETH
- **Wrong wallet**: Verify your `.env` has the correct private key
- **Network issues**: Check your RPC URL and network connection

### Frontend Issues
- **Contract not found**: Verify the contract address is updated everywhere
- **Admin access denied**: Make sure you're connected with the new wallet
- **Functions missing**: Ensure you deployed the latest contract version

### Server Issues
- **Blockchain service errors**: Update server with new contract address
- **Transaction failures**: Check if server is using the new wallet

## Files Created/Modified

### New Files
- `scripts/deploy-with-new-wallet.js` - Deployment script
- `scripts/update-frontend-config.js` - Frontend update script
- `deployments/secure-wallet-deployment-[timestamp].json` - Deployment info

### Modified Files
- `src/services/ContractService.js` - Updated contract address
- `.env` files - Updated with new contract address
- Server configuration - Updated contract address

## Next Steps After Deployment

1. **Test thoroughly** - Make sure all functions work
2. **Update documentation** - Update any docs with new contract address
3. **Notify users** - If needed, notify users about the contract change
4. **Monitor** - Keep an eye on the new contract for any issues
5. **Backup** - Save your deployment info and private key securely

## Emergency Contacts

If you encounter issues:
- Check the deployment logs for error messages
- Verify your wallet has sufficient funds
- Ensure all environment variables are correct
- Test with a small transaction first

---

**Remember**: This is a security-critical operation. Take your time, verify each step, and test thoroughly before going live.
