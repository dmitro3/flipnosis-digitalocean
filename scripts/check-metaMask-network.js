const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🔍 Checking MetaMask Network Configuration...');
    console.log('============================================');
    
    // Check if we're connected to Base network
    const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3');
    
    // Get network info
    const network = await provider.getNetwork();
    console.log('🌐 Network Information:');
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Name: ${network.name}`);
    
    // Check if this is Base mainnet (chain ID 8453)
    if (network.chainId === 8453n) {
      console.log('✅ Connected to Base mainnet');
    } else {
      console.log('❌ NOT connected to Base mainnet!');
      console.log('   This might explain the "Insufficient funds" error.');
      console.log('   MetaMask might be on Ethereum mainnet instead.');
    }
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    console.log('\n⛽ Gas Information:');
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
    console.log(`   Max Fee Per Gas: ${feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : 'N/A'} gwei`);
    console.log(`   Max Priority Fee: ${feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : 'N/A'} gwei`);
    
    // Check if the wallet has any balance
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const balance = await provider.getBalance(wallet.address);
      
      console.log('\n💰 Wallet Balance:');
      console.log(`   Address: ${wallet.address}`);
      console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
      
      // Check if balance is sufficient for a typical transaction
      const typicalGasLimit = 200000;
      const estimatedGasCost = feeData.gasPrice * BigInt(typicalGasLimit);
      const estimatedGasCostETH = ethers.formatEther(estimatedGasCost);
      
      console.log('\n📊 Transaction Cost Estimate:');
      console.log(`   Gas Limit: ${typicalGasLimit.toLocaleString()} units`);
      console.log(`   Estimated Gas Cost: ${estimatedGasCostETH} ETH`);
      console.log(`   Estimated Gas Cost (USD): $${(Number(estimatedGasCostETH) * 3500).toFixed(4)}`);
      
      if (balance < estimatedGasCost) {
        console.log('\n❌ INSUFFICIENT BALANCE!');
        console.log(`   Need at least: ${estimatedGasCostETH} ETH`);
        console.log(`   Have: ${ethers.formatEther(balance)} ETH`);
        console.log(`   Missing: ${ethers.formatEther(estimatedGasCost - balance)} ETH`);
      } else {
        console.log('\n✅ Sufficient balance for transaction');
      }
    } else {
      console.log('\n⚠️ No PRIVATE_KEY found in environment');
    }
    
    // Check contract deployment
    const contractAddress = '0x6527c1e6b12cd0F6d354B15CF7935Dc5516DEcaf';
    const code = await provider.getCode(contractAddress);
    
    console.log('\n📋 Contract Status:');
    if (code === '0x') {
      console.log('   ❌ Contract not deployed at this address');
    } else {
      console.log('   ✅ Contract exists at this address');
    }
    
    console.log('\n🔧 MetaMask Troubleshooting:');
    console.log('   1. Make sure MetaMask is connected to Base mainnet (chain ID 8453)');
    console.log('   2. Check that you have Base ETH (not Ethereum mainnet ETH)');
    console.log('   3. Verify the wallet address in MetaMask matches your deployment wallet');
    console.log('   4. Try refreshing the page and reconnecting MetaMask');
    
  } catch (error) {
    console.error('❌ Error checking MetaMask configuration:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
