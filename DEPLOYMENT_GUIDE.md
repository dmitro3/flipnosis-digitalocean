# NFT Flip Game - Smart Contract Deployment Guide

## Prerequisites

1. **Wallet Setup**: Have MetaMask installed with Base network added
2. **Base ETH**: Get some Base ETH for gas fees from [Base Bridge](https://bridge.base.org/)
3. **Remix IDE**: Open [remix.ethereum.org](https://remix.ethereum.org)

## Step 1: Get Required Contract Dependencies

In Remix, you'll need to install the following dependencies:

### OpenZeppelin Contracts
```
npm install @openzeppelin/contracts
```

### Chainlink Contracts  
```
npm install @chainlink/contracts
```

Or manually create these files in Remix:

1. `@openzeppelin/contracts/token/ERC721/IERC721.sol`
2. `@openzeppelin/contracts/token/ERC20/IERC20.sol`
3. `@openzeppelin/contracts/security/ReentrancyGuard.sol`
4. `@openzeppelin/contracts/access/Ownable.sol`
5. `@openzeppelin/contracts/security/Pausable.sol`
6. `@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol`

## Step 2: Create and Deploy Contract

1. **Create NFTFlipGame.sol** in Remix and paste the main contract code
2. **Create DeployNFTFlipGame.sol** with this deployment script:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NFTFlipGame.sol";

contract DeployNFTFlipGame {
    NFTFlipGame public nftFlipGame;
    
    constructor() {
        nftFlipGame = new NFTFlipGame(
            0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70, // ETH/USD Price Feed on Base
            0x7e860098F58bBFC8648a4311b374B1D669a2bc6B, // USDC/USD Price Feed on Base
            0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, // USDC Token Address on Base
            YOUR_FEE_WALLET_ADDRESS // Replace with your wallet address
        );
    }
    
    function getContractAddress() public view returns (address) {
        return address(nftFlipGame);
    }
}
```

3. **Compile**: Select Solidity version 0.8.19+ and compile both contracts
4. **Deploy**: 
   - Connect MetaMask to Base network
   - Deploy the `DeployNFTFlipGame` contract
   - Copy the deployed contract address
   - Call `getContractAddress()` to get your main NFTFlipGame contract address

## Step 3: Update Frontend Configuration

1. **Update contractService.js**:
```javascript
const CONTRACT_CONFIG = {
  address: "YOUR_DEPLOYED_CONTRACT_ADDRESS", // Replace with actual address
  chainId: 8453,
  rpcUrl: "https://mainnet.base.org"
}
```

2. **Create .env file** in your project root:
```bash
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
VITE_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
VITE_FEE_RECIPIENT=YOUR_FEE_WALLET_ADDRESS
```

3. **Get Alchemy API Key**:
   - Go to [alchemy.com](https://alchemy.com)
   - Create account and new app
   - Select Base network
   - Copy API key to .env file

## Step 4: Test the Integration

### Create a Test Game

1. Connect wallet to your app
2. Make sure you're on Base network
3. Have some test NFTs in your wallet
4. Create a flip game with small amount (e.g., $1 USD)
5. Test joining with second wallet

### Test Functions

- ✅ Create game (transfers NFT to contract)
- ✅ Join game with ETH 
- ✅ Join game with USDC
- ✅ Make counter offers
- ✅ Accept/reject counter offers
- ✅ Flip coin mechanism
- ✅ Claim winnings
- ✅ Cancel games

## Step 5: Production Considerations

### Security Improvements Needed

1. **Replace Simple Randomness**: 
   - Current coin flip uses block properties (not secure)
   - Integrate Chainlink VRF for true randomness
   - Cost: ~0.25 LINK per flip

2. **Add Timeouts**:
   - Games auto-expire after 7 days
   - Add timeout for inactive flips
   - Emergency pause functionality

3. **Gas Optimization**:
   - Batch multiple operations
   - Optimize storage layout
   - Use events for off-chain indexing

### Monitoring & Analytics

1. **Event Indexing**:
   - Use The Graph Protocol
   - Index all game events
   - Create subgraph for queries

2. **Contract Verification**:
   - Verify contract on BaseScan
   - Publish source code
   - Enable contract interaction UI

## Base Network Addresses

```javascript
const BASE_MAINNET = {
  CHAIN_ID: 8453,
  RPC_URL: "https://mainnet.base.org",
  EXPLORER: "https://basescan.org",
  
  // Chainlink Price Feeds
  ETH_USD_FEED: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
  USDC_USD_FEED: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B",
  
  // Tokens
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  WETH: "0x4200000000000000000000000000000000000006"
}
```

## Gas Estimates

| Function | Estimated Gas | Base ETH Cost |
|----------|---------------|---------------|  
| Create Game | 150,000 | ~$0.50 |
| Join Game | 100,000 | ~$0.35 |
| Flip Coin | 80,000 | ~$0.25 |
| Claim Winnings | 120,000 | ~$0.40 |

## Troubleshooting

### Common Issues:

1. **"Insufficient funds"**: Ensure wallet has Base ETH for gas
2. **"NFT not found"**: Make sure NFT exists on Base network
3. **"Game not active"**: Check game status and expiration
4. **"Price feed error"**: Verify Chainlink feeds are working

### Testing Checklist:

- [ ] Contract deployed successfully
- [ ] Frontend connects to contract
- [ ] NFTs load from Base network
- [ ] Can create game (NFT gets escrowed)
- [ ] Can join with ETH
- [ ] Can join with USDC  
- [ ] Counter offers work
- [ ] Coin flip works
- [ ] Winner gets NFT + payment
- [ ] Platform fee deducted correctly

## Next Steps

1. **Deploy on Base Mainnet**
2. **Add your custom token support**
3. **Implement Chainlink VRF for randomness**
4. **Add game discovery/filtering**
5. **Build leaderboards and stats**
6. **Add mobile app support**

## Support

- Base Network: [docs.base.org](https://docs.base.org)
- Chainlink VRF: [docs.chain.link](https://docs.chain.link)
- OpenZeppelin: [docs.openzeppelin.com](https://docs.openzeppelin.com) 