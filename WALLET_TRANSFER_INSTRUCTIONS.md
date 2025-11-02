# Transfer Contract Ownership - Step by Step

## Current Situation
- **Contract:** `0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F`
- **Current Owner:** `0x6BA07382CF43E41aBfC80dC43FFc96730194A3c1` (old/compromised wallet)
- **New Owner:** `0x3618cf0af757f3f2b9824202e7f4a79f41d66297` (your new secure wallet)

## Important: You Need the OLD Wallet's Private Key

To transfer ownership, you need to temporarily use the old wallet because **only the current owner can transfer ownership**.

## Option 1: Transfer Ownership (Recommended)

### Step 1: Temporarily Update .env
Put the OLD wallet's private key back in your `.env` file:

```env
PRIVATE_KEY=your_old_wallet_private_key_here
```

### Step 2: Make Sure Old Wallet Has ETH for Gas
The old wallet needs ~0.0001 ETH (~$0.20) for gas fees. Check if it has any:
- If it has ETH: Proceed to Step 3
- If it has 0 ETH: Send a small amount (~$1 worth of ETH on Base) to the old wallet address

### Step 3: Transfer Ownership
```bash
npx hardhat run scripts/transfer-ownership.js --network base
```

This will:
- Transfer contract ownership from old wallet → new wallet
- Only requires ONE transaction
- After this, your new wallet will be the owner

### Step 4: Update Fee Receiver (Now Using New Wallet)
After ownership is transferred, update your `.env` back to the NEW wallet:

```env
PRIVATE_KEY=your_new_wallet_private_key_here
```

Then update the fee receiver:
```bash
npx hardhat run scripts/update-fee-receiver.js --network base
```

## Option 2: Just Update Fee Receiver (Simpler)

If you only want to redirect platform fees and don't need to transfer ownership:

### Step 1: Temporarily Update .env
```env
PRIVATE_KEY=your_old_wallet_private_key_here
```

### Step 2: Make Sure Old Wallet Has ETH for Gas
Same as Option 1 - needs ~0.0001 ETH

### Step 3: Update Fee Receiver
```bash
npx hardhat run scripts/update-fee-receiver.js --network base
```

This updates the fee receiver without transferring ownership.

### Step 4: Restore .env to New Wallet
```env
PRIVATE_KEY=your_new_wallet_private_key_here
```

## Which Option Should You Choose?

- **Option 1 (Transfer Ownership)**: Better long-term. Your new wallet becomes the contract owner, so you can do all admin functions with the new wallet going forward.
- **Option 2 (Update Fee Receiver Only)**: Simpler, but you'll still need the old wallet for other admin functions (if you ever need them).

## ⚠️ Security Note

The old wallet was compromised. Once you've transferred ownership/updated fee receiver:
1. ✅ Update .env back to new wallet's private key
2. ✅ Never use the old wallet again
3. ✅ Delete any saved old wallet private keys from your system

