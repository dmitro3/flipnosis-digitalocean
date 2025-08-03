# Gas Optimization Guide for Base Network

## Problem
Users were experiencing high gas fees ($2+) when depositing ETH to start games, instead of the expected few cents on Base network.

## Root Cause
The contract calls were using default gas estimation without any optimization settings, causing MetaMask and other wallets to use conservative gas estimates.

## Solution Implemented

### 1. Gas Optimization Utility
Added `getOptimizedGasSettings()` function in `ContractService.js` that:
- Gets current gas price from the network
- Estimates gas for the specific transaction
- Adds configurable safety buffers
- Uses EIP-1559 gas pricing (maxFeePerGas + maxPriorityFeePerGas)

### 2. Configuration Constants
Added `GAS_CONFIG` object with easily adjustable settings:
```javascript
const GAS_CONFIG = {
  GAS_BUFFER_PERCENT: 120, // 20% buffer for safety
  MAX_FEE_BUFFER_PERCENT: 110, // 10% buffer for max fee
  PRIORITY_FEE_GWEI: 1, // 1 gwei priority fee
  DEFAULT_GAS_LIMIT: 300000, // Default gas limit if estimation fails
  DEFAULT_MAX_FEE_GWEI: 2 // Default max fee if estimation fails
}
```

### 3. Optimized Functions
Updated all contract write functions to use gas optimization:
- `depositETH()` - Player 2 deposits ETH
- `depositNFT()` - Player 1 deposits NFT
- `approveNFT()` - NFT approval for deposit
- `payListingFee()` - Listing fee payment
- `payFeeAndCreateGame()` - Combined fee payment and game creation

### 4. EIP-1559 Gas Pricing
Using modern EIP-1559 gas pricing instead of legacy gasPrice:
- `maxFeePerGas`: Maximum total fee willing to pay
- `maxPriorityFeePerGas`: Priority fee (tip) for faster inclusion

## Expected Results
- Gas fees should now be in the range of a few cents to ~$0.50 on Base network
- More predictable gas costs
- Better transaction prioritization
- Fallback settings if gas estimation fails

## How to Adjust Gas Settings
To modify gas optimization, edit the `GAS_CONFIG` constants in `src/services/ContractService.js`:

- **Lower fees**: Reduce `PRIORITY_FEE_GWEI` or `MAX_FEE_BUFFER_PERCENT`
- **Higher fees for faster processing**: Increase `PRIORITY_FEE_GWEI`
- **More conservative estimates**: Increase `GAS_BUFFER_PERCENT`

## Testing
After deployment, test the deposit flow and check:
1. Gas fees in MetaMask should be much lower
2. Console logs show gas estimates and prices
3. Transactions should confirm quickly on Base network 