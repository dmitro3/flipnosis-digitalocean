# New Contract Deployment Guide - Abandoning Compromised Wallet

## Situation
- **Current Admin Wallet**: `0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628`
- **New Wallet (Secure)**: `0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628`
- **Old Contract**: `0x6cB1E31F2A3df57A7265ED2eE26dcF8D02CE1B69` (owned by compromised wallet)
- **Action**: Deploy fresh contract with new wallet as owner

## Step-by-Step Process

### Step 1: Prepare Environment
1. **Connect your new wallet** to MetaMask
2. **Set the private key** in your `.env` file:
   ```env
   PRIVATE_KEY=your_new_wallet_private_key_here
   ```
3. **Ensure you have enough ETH** in your new wallet for deployment (recommend at least 0.01 ETH)

### Step 2: Deploy New Contract
```bash
npx hardhat run scripts/deploy-new-contract.js --network base
```

This will:
- Deploy a new NFTFlipGame contract
- Set your new wallet as the owner
- Set your new wallet as the platform fee receiver
- Save deployment info to a timestamped file

### Step 3: Update Application
```bash
npx hardhat run scripts/update-contract-address.js
```

This will automatically update:
- `src/services/ContractService.js` - Contract address
- `deployments/base-deployment.json` - Deployment record

### Step 4: Verify Deployment
Check that the new contract is working:
```bash
npx hardhat run scripts/check-owner-only.js --network base
```

## What This Accomplishes

### ✅ Security Benefits
- **Fresh start** with secure wallet
- **No connection** to compromised wallet
- **Full control** over new contract
- **Clean slate** for admin functions

### ✅ Functional Benefits
- **Admin panel** will work with new wallet
- **NFT withdrawal** functions will work
- **All admin functions** accessible
- **Platform fee collection** to secure wallet

### ✅ Abandonment Strategy
- **Old contract** can be left as-is
- **Worthless NFTs** stay in old contract
- **No risk** from compromised wallet
- **Clean separation** of old and new systems

## Files Created/Modified

### New Files
- `scripts/deploy-new-contract.js` - Deploy new contract
- `scripts/update-contract-address.js` - Update application
- `deployments/new-contract-deployment-[timestamp].json` - Deployment record
- `NEW_CONTRACT_DEPLOYMENT_GUIDE.md` - This guide

### Modified Files
- `src/services/ContractService.js` - New contract address
- `deployments/base-deployment.json` - Updated deployment info

## Post-Deployment Checklist

### ✅ Technical Verification
- [ ] New contract deployed successfully
- [ ] Contract address updated in application
- [ ] New wallet is contract owner
- [ ] Admin panel accessible with new wallet

### ✅ Functional Testing
- [ ] Admin panel loads with new wallet
- [ ] NFT management functions work
- [ ] Platform fee settings accessible
- [ ] Pause/unpause functions work

### ✅ Security Verification
- [ ] Old wallet has no access to new contract
- [ ] New wallet has full admin privileges
- [ ] No references to old contract in code
- [ ] Environment variables updated

## Expected Outcomes

### After Deployment
- **New contract address** will be generated
- **Your new wallet** will be the contract owner
- **Admin panel** will work without errors
- **NFT withdrawal** functions will work properly

### Old Contract Status
- **Remains deployed** but abandoned
- **Worthless NFTs** stay locked inside
- **Compromised wallet** has no access to new system
- **No security risk** to new contract

## Troubleshooting

### If Deployment Fails
- Check wallet has enough ETH for gas
- Verify private key is correct in `.env`
- Ensure you're connected to Base network
- Try refreshing MetaMask connection

### If Update Script Fails
- Check deployment file exists
- Verify file paths are correct
- Manually update contract address if needed

### If Admin Panel Still Doesn't Work
- Clear browser cache
- Refresh MetaMask connection
- Verify contract address is updated
- Check network connection

## Security Notes

### ✅ Best Practices
- **Never share** private keys
- **Use hardware wallet** if possible
- **Regular security audits** of wallet
- **Monitor transactions** regularly

### ⚠️ Important Reminders
- **Old wallet is compromised** - never use it again
- **Old contract is abandoned** - no need to interact with it
- **New contract is secure** - only use new wallet
- **Backup new wallet** securely

## Next Steps After Deployment

1. **Test all admin functions** with new wallet
2. **Update any documentation** with new contract address
3. **Inform team members** of new contract
4. **Monitor new contract** for any issues
5. **Consider additional security** measures

---

**🎉 You'll have a completely fresh, secure contract under your control!**
