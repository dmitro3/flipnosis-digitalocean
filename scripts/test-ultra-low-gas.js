const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🧮 Testing Ultra-Low Gas Parameters...');
    console.log('=====================================');
    
    const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3');
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    console.log('💰 Current Gas Prices:');
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
    console.log(`   Max Fee Per Gas: ${feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : 'N/A'} gwei`);
    console.log(`   Max Priority Fee: ${feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : 'N/A'} gwei`);
    
    // Test the new ultra-low parameters
    console.log('\n🔧 New Ultra-Low Gas Parameters:');
    console.log('   Gas Limit: 15,000 units (deposit) / 25,000 units (game creation)');
    console.log('   Max Fee Per Gas: 2 gwei');
    console.log('   Max Priority Fee: 0.1 gwei');
    
    // Calculate costs with new parameters
    const depositGasLimit = 15000;
    const gameCreationGasLimit = 25000;
    const maxFeePerGas = BigInt(2000000000); // 2 gwei
    
    // Calculate deposit cost
    const depositGasCost = BigInt(depositGasLimit) * maxFeePerGas;
    const depositGasCostETH = ethers.formatEther(depositGasCost);
    const depositGasCostUSD = Number(depositGasCostETH) * 3500;
    
    // Calculate game creation cost
    const gameCreationGasCost = BigInt(gameCreationGasLimit) * maxFeePerGas;
    const gameCreationGasCostETH = ethers.formatEther(gameCreationGasCost);
    const gameCreationGasCostUSD = Number(gameCreationGasCostETH) * 3500;
    
    console.log('\n💸 Estimated Gas Costs:');
    console.log('   Deposit ETH:');
    console.log(`     Gas Cost: ${depositGasCostETH} ETH`);
    console.log(`     USD Cost: $${depositGasCostUSD.toFixed(4)}`);
    console.log('   Game Creation:');
    console.log(`     Gas Cost: ${gameCreationGasCostETH} ETH`);
    console.log(`     USD Cost: $${gameCreationGasCostUSD.toFixed(4)}`);
    
    // Compare with previous costs
    console.log('\n📊 Cost Comparison:');
    console.log('   Previous: $0.69');
    console.log(`   New: $${depositGasCostUSD.toFixed(4)}`);
    console.log(`   Reduction: ${((0.69 - depositGasCostUSD) / 0.69 * 100).toFixed(1)}%`);
    
    if (depositGasCostUSD < 0.10) {
      console.log('\n✅ SUCCESS: Gas costs are now in the cents range!');
    } else {
      console.log('\n⚠️  Gas costs are still higher than expected');
    }
    
    // Test with current network gas price (as fallback)
    console.log('\n🔄 Fallback Calculation (using current network gas price):');
    const fallbackDepositCost = BigInt(depositGasLimit) * feeData.gasPrice;
    const fallbackDepositCostETH = ethers.formatEther(fallbackDepositCost);
    const fallbackDepositCostUSD = Number(fallbackDepositCostETH) * 3500;
    
    console.log(`   Using current gas price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
    console.log(`   Fallback cost: $${fallbackDepositCostUSD.toFixed(4)}`);
    
  } catch (error) {
    console.error('❌ Error testing ultra-low gas:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
