const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🔍 MetaMask Wallet Check...');
    console.log('==========================');
    
    // Show the deployment wallet info
    if (process.env.PRIVATE_KEY) {
      const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3');
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const balance = await provider.getBalance(wallet.address);
      
      console.log('💰 Deployment Wallet (has Base ETH):');
      console.log(`   Address: ${wallet.address}`);
      console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`   Private Key (first 10 chars): ${process.env.PRIVATE_KEY.substring(0, 10)}...`);
      
      console.log('\n🔧 To fix "Insufficient funds" error:');
      console.log('   1. Open MetaMask');
      console.log('   2. Click the account icon (top right)');
      console.log('   3. Click "Import Account"');
      console.log('   4. Select "Private Key"');
      console.log('   5. Enter your private key (starts with: ' + process.env.PRIVATE_KEY.substring(0, 10) + '...)');
      console.log('   6. Make sure MetaMask is connected to Base mainnet (chain ID 8453)');
      console.log('   7. Refresh the Flipnosis page and reconnect MetaMask');
      
      console.log('\n⚠️  IMPORTANT:');
      console.log('   - Make sure you\'re on Base mainnet, not Ethereum mainnet');
      console.log('   - The wallet with Base ETH is: ' + wallet.address);
      console.log('   - If MetaMask shows a different address, that\'s why you get "Insufficient funds"');
      
    } else {
      console.log('❌ No PRIVATE_KEY found in environment');
      console.log('   Check your .env file for the PRIVATE_KEY variable');
    }
    
  } catch (error) {
    console.error('❌ Error checking MetaMask wallet:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
