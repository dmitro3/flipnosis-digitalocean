# NFT Flip Game Platform - Deployment Guide

## Overview

This guide covers the deployment and setup of the enhanced NFT flipping game platform with multi-chain support, NFT vs NFT games, and comprehensive admin features.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Hardhat development environment
- MetaMask or similar wallet
- Access to blockchain RPC endpoints
- Database (SQLite/PostgreSQL)

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd crypto-flipz-final-2

# Install dependencies
npm install

# Install additional dependencies for new features
npm install @openzeppelin/contracts@4.9.0
npm install lucide-react
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Blockchain Configuration
PRIVATE_KEY=your_private_key_here
ADMIN_WALLET=your_admin_wallet_address

# Database
DATABASE_URL=your_database_url

# API Configuration
API_URL=https://cryptoflipz2-production.up.railway.app

# Chain RPC URLs (optional - for local development)
BASE_RPC_URL=https://base.blockpi.network/v1/rpc/public
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org/
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
POLYGON_RPC_URL=https://polygon-rpc.com/
```

## 📋 Smart Contract Deployment

### 1. Update Admin Wallet

Edit `contracts/deploy-nftflip.js` and update the `platformFeeReceiver` address for each chain:

```javascript
const chainConfigs = {
  base: {
    // ... other config
    platformFeeReceiver: "YOUR_ADMIN_WALLET_ADDRESS", // Update this
  },
  // ... other chains
};
```

### 2. Deploy to Base (Recommended)

```bash
# Deploy to Base mainnet
npx hardhat run contracts/deploy-nftflip.js --network base

# Or deploy to Base testnet
npx hardhat run contracts/deploy-nftflip.js --network base-testnet
```

### 3. Deploy to Other Chains

```bash
# Ethereum
npx hardhat run contracts/deploy-nftflip.js --network ethereum

# BNB Chain
npx hardhat run contracts/deploy-nftflip.js --network bsc

# Avalanche
npx hardhat run contracts/deploy-nftflip.js --network avalanche

# Polygon
npx hardhat run contracts/deploy-nftflip.js --network polygon
```

### 4. Update Contract Addresses

After deployment, update the contract addresses in:

1. **ContractService.js** (`src/services/ContractService.js`):
```javascript
export const SUPPORTED_CHAINS = {
  base: {
    contractAddress: 'YOUR_DEPLOYED_CONTRACT_ADDRESS',
    // ... other config
  },
  // ... other chains
};
```

2. **AdminPanel.jsx** (`src/components/AdminPanel.jsx`):
```javascript
const CONTRACT_ADDRESSES = {
  'base': 'YOUR_DEPLOYED_CONTRACT_ADDRESS',
  // ... other chains
};
```

3. **Update Admin Wallet** in AdminPanel.jsx:
```javascript
const ADMIN_WALLET = 'YOUR_ADMIN_WALLET_ADDRESS';
```

## 🗄️ Database Setup

### 1. Run Migration

```bash
# If using SQLite
sqlite3 your_database.db < scripts/database-migration.sql

# If using PostgreSQL
psql -d your_database -f scripts/database-migration.sql
```

### 2. Verify Migration

Check that all new tables and columns were created:

```sql
-- Check new columns in games table
PRAGMA table_info(games);

-- Check new tables
SELECT name FROM sqlite_master WHERE type='table';
```

## 🔧 Frontend Configuration

### 1. Update API Endpoints

In your frontend components, ensure the API URL is correct:

```javascript
const API_URL = 'https://cryptoflipz2-production.up.railway.app';
```

### 2. Add New Components

The following new components have been added:

- `src/components/AdminPanel.jsx` - Admin control panel
- `src/components/NotificationSystem.jsx` - Real-time notifications
- `src/components/ProfileWithNotifications.jsx` - Enhanced profile

### 3. Update Routes

Add the admin panel route to your routing configuration:

```javascript
// In your Routes.jsx or App.jsx
import AdminPanel from './components/AdminPanel';

// Add the route
<Route path="/admin" element={<AdminPanel />} />
```

## 🎮 Game Types

### NFT vs Crypto Games

- Players stake NFTs against cryptocurrency
- Winner takes the crypto (minus platform fee)
- Loser forfeits their NFT

### NFT vs NFT Games

- Players stake NFTs against other NFTs
- Winner takes both NFTs
- No platform fees (only listing fee)

## 🔐 Admin Features

### Access Control

- Only the specified admin wallet can access the admin panel
- Multi-chain support for managing games across networks
- Emergency functions for contract management

### Admin Functions

1. **Platform Settings**
   - Update platform fee percentage
   - Update listing fee amount
   - View contract balances

2. **Game Management**
   - View all games across chains
   - Cancel games
   - Return stuck NFTs to players

3. **Player Management**
   - View player statistics
   - Track unclaimed rewards
   - Monitor player activity

4. **Emergency Functions**
   - Emergency NFT withdrawal
   - Emergency ETH withdrawal
   - Emergency token withdrawal

## 📊 Monitoring & Analytics

### Platform Statistics

- Total games per chain
- Active games count
- Volume and fee tracking
- Player statistics

### Real-time Notifications

- Unclaimed rewards alerts
- Game status updates
- System notifications

## 🧪 Testing

### 1. Contract Testing

```bash
# Run contract tests
npx hardhat test

# Test specific functions
npx hardhat test --grep "createGame"
```

### 2. Frontend Testing

```bash
# Start development server
npm run dev

# Test admin panel
# Navigate to /admin and connect with admin wallet
```

### 3. Integration Testing

```bash
# Test game creation
# Test game joining
# Test coin flipping
# Test reward withdrawal
```

## 🔍 Verification

### 1. Contract Verification

After deployment, verify your contract on block explorers:

- **Base**: https://basescan.org
- **Ethereum**: https://etherscan.io
- **BNB Chain**: https://bscscan.com
- **Avalanche**: https://snowtrace.io
- **Polygon**: https://polygonscan.com

### 2. Function Testing

Test all major functions:

```javascript
// Test game creation
await contract.createGame(params);

// Test game joining
await contract.joinGame(params);

// Test coin flipping
await contract.flipCoin(gameId, power);

// Test reward withdrawal
await contract.withdrawRewards();
```

## 🚨 Security Considerations

### 1. Access Control

- Keep admin private keys secure
- Use hardware wallets for admin functions
- Regularly rotate admin keys

### 2. Emergency Procedures

- Monitor contract for unusual activity
- Have emergency withdrawal procedures ready
- Keep backup admin addresses

### 3. Rate Limiting

- Implement rate limiting on API endpoints
- Monitor for spam or abuse
- Set reasonable gas limits

## 📈 Performance Optimization

### 1. Gas Optimization

- Use batch operations where possible
- Optimize contract functions
- Monitor gas usage

### 2. Database Optimization

- Use proper indexes
- Implement caching
- Monitor query performance

### 3. Frontend Optimization

- Implement lazy loading
- Use React.memo for components
- Optimize bundle size

## 🔄 Maintenance

### 1. Regular Updates

- Monitor for contract vulnerabilities
- Update dependencies regularly
- Keep price feeds current

### 2. Backup Procedures

- Regular database backups
- Contract state snapshots
- Configuration backups

### 3. Monitoring

- Set up alerts for unusual activity
- Monitor contract balances
- Track platform metrics

## 🆘 Troubleshooting

### Common Issues

1. **Contract Deployment Fails**
   - Check gas limits
   - Verify constructor parameters
   - Ensure sufficient funds

2. **Admin Panel Not Loading**
   - Verify admin wallet address
   - Check contract addresses
   - Ensure wallet is connected

3. **Database Migration Errors**
   - Check database permissions
   - Verify SQL syntax
   - Ensure database exists

### Support

For issues or questions:
- Check the documentation
- Review error logs
- Contact the development team

## 📝 Post-Deployment Checklist

- [ ] Contract deployed and verified
- [ ] Contract addresses updated in frontend
- [ ] Admin wallet configured
- [ ] Database migration completed
- [ ] Admin panel accessible
- [ ] Game creation tested
- [ ] Game joining tested
- [ ] Coin flipping tested
- [ ] Reward withdrawal tested
- [ ] Emergency functions tested
- [ ] Monitoring set up
- [ ] Documentation updated

## 🎉 Launch

Once all testing is complete:

1. Announce the platform launch
2. Monitor for any issues
3. Gather user feedback
4. Plan future improvements

---

**Note**: This is a comprehensive deployment guide. Adjust configurations based on your specific requirements and infrastructure setup. 