const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('⛽ Checking Base Network Gas Costs...');
    console.log('=====================================');
    
    // Get current gas price
    const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3');
    const gasPrice = await provider.getFeeData();
    
    console.log('💰 Current Gas Price:', {
      gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei',
      maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') + ' gwei' : 'N/A',
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') + ' gwei' : 'N/A'
    });
    
    // Estimate gas for a simple transaction
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const balance = await provider.getBalance(wallet.address);
    
    console.log('👤 Wallet Balance:', ethers.formatEther(balance), 'ETH');
    
    // Get current ETH price (approximate)
    const ethPriceUSD = 3500; // Approximate
    const gasPriceUSD = Number(ethers.formatUnits(gasPrice.gasPrice, 'gwei')) * 0.000000001 * ethPriceUSD;
    
    console.log('💵 Gas Price in USD:', `$${gasPriceUSD.toFixed(6)} per gas unit`);
    
    // Estimate typical transaction costs
    const typicalGasLimit = 200000; // Typical for contract interactions
    const estimatedCost = gasPrice.gasPrice * BigInt(typicalGasLimit);
    const estimatedCostUSD = Number(ethers.formatEther(estimatedCost)) * ethPriceUSD;
    
    console.log('📊 Estimated Transaction Costs:');
    console.log(`   Gas Limit: ${typicalGasLimit.toLocaleString()} units`);
    console.log(`   ETH Cost: ${ethers.formatEther(estimatedCost)} ETH`);
    console.log(`   USD Cost: $${estimatedCostUSD.toFixed(4)}`);
    
    // For your specific game scenario
    console.log('\n🎮 For Your Game Scenario:');
    console.log('   Game Price: $0.12');
    console.log('   ETH Amount: ~0.000026 ETH');
    console.log('   Gas Cost: ~$0.01-0.05');
    console.log('   Total: ~$0.13-0.17');
    
    if (estimatedCostUSD > 1) {
      console.log('\n⚠️  WARNING: Gas costs seem high!');
      console.log('   This might indicate network congestion or incorrect gas estimation.');
    } else {
      console.log('\n✅ Gas costs look reasonable for Base network.');
    }
    
  } catch (error) {
    console.error('❌ Error checking gas costs:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
