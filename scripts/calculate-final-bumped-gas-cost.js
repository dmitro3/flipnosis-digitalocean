const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🧮 Final Bumped Gas Cost Calculation...');
    console.log('=======================================');
    
    // Final bumped parameters
    const depositGasLimit = 15000;
    const gameCreationGasLimit = 25000;
    const maxFeePerGas = BigInt(200000000); // 0.2 gwei (bumped from 0.1)
    const maxPriorityFeePerGas = BigInt(1000000); // 0.001 gwei
    
    console.log('🔧 Final Bumped Gas Parameters:');
    console.log(`   Gas Limit (deposit): ${depositGasLimit.toLocaleString()} units`);
    console.log(`   Gas Limit (game creation): ${gameCreationGasLimit.toLocaleString()} units`);
    console.log(`   Max Fee Per Gas: ${ethers.formatUnits(maxFeePerGas, 'gwei')} gwei`);
    console.log(`   Max Priority Fee: ${ethers.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`);
    
    // Calculate costs
    const depositGasCost = BigInt(depositGasLimit) * maxFeePerGas;
    const depositGasCostETH = ethers.formatEther(depositGasCost);
    const depositGasCostUSD = Number(depositGasCostETH) * 3500;
    
    const gameCreationGasCost = BigInt(gameCreationGasLimit) * maxFeePerGas;
    const gameCreationGasCostETH = ethers.formatEther(gameCreationGasCost);
    const gameCreationGasCostUSD = Number(gameCreationGasCostETH) * 3500;
    
    console.log('\n💸 Final Bumped Gas Costs:');
    console.log('   Deposit ETH:');
    console.log(`     Gas Cost: ${depositGasCostETH} ETH`);
    console.log(`     USD Cost: $${depositGasCostUSD.toFixed(6)}`);
    console.log('   Game Creation:');
    console.log(`     Gas Cost: ${gameCreationGasCostETH} ETH`);
    console.log(`     USD Cost: $${gameCreationGasCostUSD.toFixed(6)}`);
    
    // Progress summary
    console.log('\n📊 Gas Cost Progress:');
    console.log('   Initial: $6.34');
    console.log('   After first fix: $0.92');
    console.log('   After second fix: $0.69');
    console.log('   Ultra-low: $0.002625');
    console.log('   First bump: $0.005250');
    console.log(`   Final bump: $${depositGasCostUSD.toFixed(6)}`);
    console.log(`   Total reduction: ${((6.34 - depositGasCostUSD) / 6.34 * 100).toFixed(1)}%`);
    
    if (depositGasCostUSD < 0.01) {
      console.log('\n✅ PERFECT: Gas costs are still in the sub-cent range!');
    } else if (depositGasCostUSD < 0.10) {
      console.log('\n✅ EXCELLENT: Gas costs are still very low!');
    } else {
      console.log('\n⚠️  Gas costs are higher but should be very reliable');
    }
    
    // Show what MetaMask should display
    console.log('\n🎯 Expected MetaMask Display:');
    console.log(`   Amount: 0.000034 ETH (unchanged)`);
    console.log(`   Network fee: ~$${depositGasCostUSD.toFixed(6)}`);
    console.log(`   Total: ~$${(0.14 + depositGasCostUSD).toFixed(6)}`);
    
    console.log('\n🔧 Maximum Reliability:');
    console.log('   - Bumped max fee from 0.1 gwei to 0.2 gwei');
    console.log('   - This gives 6x buffer over current network gas price');
    console.log('   - Should eliminate any "internal json rpc error"');
    console.log('   - Still extremely cheap at ~$0.01');
    
  } catch (error) {
    console.error('❌ Error calculating final bumped gas cost:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
