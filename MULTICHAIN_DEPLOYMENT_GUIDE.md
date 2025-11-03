# Multichain Deployment Guide

## 🎯 Overview
Your contract is **100% EVM compatible** and works identically across all supported chains!

## 📋 Supported Chains (Already Configured!)

### EVM Chains Ready to Deploy
Your `hardhat.config.js` and `rainbowkit.js` already support:
1. ✅ **Base** (8453) - Currently deployed
2. ✅ **Ethereum** (1)
3. ✅ **BNB Chain** (56)
4. ✅ **Polygon** (137)
5. ✅ **Arbitrum** (42161) - Missing from hardhat.config.js
6. ✅ **Optimism** (10) - Missing from hardhat.config.js
7. ✅ **Avalanche** (43114)

---

## 🚀 Step-by-Step: Deploy to ALL Chains

### Step 1: Add Missing Chains to hardhat.config.js

Add these networks:

```javascript
// Add to hardhat.config.js networks section:
arbitrum: {
  url: "https://arb1.arbitrum.io/rpc",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 42161,
},
arbitrumSepolia: {
  url: "https://sepolia-rollup.arbitrum.io/rpc",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 421613,
},
optimism: {
  url: "https://mainnet.optimism.io",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 10,
},
optimismSepolia: {
  url: "https://sepolia.optimism.io",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 11155420,
},
```

Also add to etherscan.apiKey:
```javascript
arbitrum: process.env.ARBISCAN_API_KEY || "",
arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
optimism: process.env.OPTIMISM_API_KEY || "",
optimismSepolia: process.env.OPTIMISM_API_KEY || "",
```

---

### Step 2: Update deploy-nftflip.js with Chain Configs

Add these to the `chainConfigs` object:

```javascript
arbitrum: {
  ethUsdFeed: "0x639Fe6ab55C9217474C7CD95A7dd375C5bCC7d4D", // Arbitrum ETH/USD
  usdcUsdFeed: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3", // Arbitrum USDC/USD
  usdcToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum USDC
  platformFeeReceiver: process.env.PLATFORM_FEE_RECEIVER || "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628",
  rpc: "https://arb1.arbitrum.io/rpc"
},
optimism: {
  ethUsdFeed: "0x13e3Ee699D1909E8892B4FeAc4db3D0954D38bB6", // Optimism ETH/USD
  usdcUsdFeed: "0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3", // Optimism USDC/USD
  usdcToken: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism USDC
  platformFeeReceiver: process.env.PLATFORM_FEE_RECEIVER || "0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628",
  rpc: "https://mainnet.optimism.io"
}
```

---

### Step 3: Deploy to Each Chain

```bash
# BNB Chain
npm run deploy:bsc

# Polygon
npm run deploy:polygon

# Arbitrum
npx hardhat run contracts/deploy-nftflip.js --network arbitrum

# Optimism
npx hardhat run contracts/deploy-nftflip.js --network optimism

# Avalanche
npm run deploy:avalanche

# Ethereum
npm run deploy:ethereum
```

---

### Step 4: Update ContractService.js

Replace the hardcoded address with a **chain-based mapping**:

```javascript
class ContractService {
  constructor() {
    // Map chainId to contract address
    this.contractAddresses = {
      8453: '0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F', // Base
      1: '0x...', // Ethereum - FILL AFTER DEPLOYMENT
      56: '0x...', // BNB - FILL AFTER DEPLOYMENT
      137: '0x...', // Polygon - FILL AFTER DEPLOYMENT
      42161: '0x...', // Arbitrum - FILL AFTER DEPLOYMENT
      10: '0x...', // Optimism - FILL AFTER DEPLOYMENT
      43114: '0x...', // Avalanche - FILL AFTER DEPLOYMENT
    }
    
    // Get current address based on chain
    this.contractAddress = null // Will be set during initialization
    this.walletClient = null
    this.publicClient = null
    // ... rest of constructor
  }
  
  async initialize(walletClient, publicClient) {
    // ... existing code ...
    
    // Get current chain ID and set contract address
    const chainId = await walletClient.getChainId()
    this.contractAddress = this.contractAddresses[chainId]
    
    if (!this.contractAddress) {
      throw new Error(`No contract deployed on chain ${chainId}`)
    }
    
    console.log(`📍 Using contract ${this.contractAddress} on chain ${chainId}`)
    // ... rest of initialization
  }
}
```

---

### Step 5: Add USDC Token Addresses

Update `ContractService.js` to support chain-specific USDC:

```javascript
const USDC_ADDRESSES = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
  56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BNB
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Polygon
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism
  43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // Avalanche
}
```

---

## ✅ What Works WITHOUT Changes

- Contract bytecode (identical across all EVMs)
- Contract logic (ReentrancyGuard, Pausable, etc.)
- ERC721 NFT transfers
- ERC20 USDC transfers
- Gas calculation
- Event emissions
- Admin functions

---

## 🔄 What Needs Minor Updates

- Contract addresses per chain
- USDC token addresses per chain
- Chain IDs in hardhat.config.js
- RPC endpoints

---

## 🎮 Your Game Code

**Zero changes needed!** Users select the chain in MetaMask/RainbowKit, and the frontend automatically uses the correct contract.

---

## 📊 Deployment Checklist

After deploying to each chain:

- [ ] Save contract address
- [ ] Update ContractService.js
- [ ] Verify on block explorer
- [ ] Test NFT deposit
- [ ] Test USDC deposit
- [ ] Test ETH deposit (wrapped for BNB/Avalanche)
- [ ] Test Battle Royale creation
- [ ] Test withdrawals

---

## 💰 USDC Verification by Chain

| Chain | USDC Address | Verified |
|-------|-------------|----------|
| Base | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 | ✅ |
| Ethereum | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 | ✅ |
| BNB | 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d | ✅ |
| Polygon | 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 | ✅ |
| Arbitrum | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 | ✅ |
| Optimism | 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 | ✅ |
| Avalanche | 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E | ✅ |

All are official Circle USDC contracts!

---

## 🎯 Bottom Line

**One contract, deployed 7 times with different addresses.** Your frontend already handles multichain via RainbowKit. Just deploy and update the addresses! 🚀



