const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🧮 Final Gas Cost Calculation...');
    console.log('================================');
    
    // New ultra-low parameters
    const depositGasLimit = 15000;
    const gameCreationGasLimit = 25000;
    const maxFeePerGas = BigInt(50000000); // 0.05 gwei
    const maxPriorityFeePerGas = BigInt(1000000); // 0.001 gwei
    
    console.log('🔧 Final Ultra-Low Gas Parameters:');
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
    
    console.log('\n💸 Final Estimated Gas Costs:');
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
    console.log(`   Final: $${depositGasCostUSD.toFixed(6)}`);
    console.log(`   Total reduction: ${((6.34 - depositGasCostUSD) / 6.34 * 100).toFixed(1)}%`);
    
    if (depositGasCostUSD < 0.01) {
      console.log('\n✅ PERFECT: Gas costs are now in the sub-cent range!');
    } else if (depositGasCostUSD < 0.10) {
      console.log('\n✅ EXCELLENT: Gas costs are now in the cents range!');
    } else {
      console.log('\n⚠️  Gas costs are still higher than expected');
    }
    
    // Show what MetaMask should display
    console.log('\n🎯 Expected MetaMask Display:');
    console.log(`   Amount: 0.000033 ETH (unchanged)`);
    console.log(`   Network fee: ~$${depositGasCostUSD.toFixed(6)}`);
    console.log(`   Total: ~$${(0.12 + depositGasCostUSD).toFixed(6)}`);
    
  } catch (error) {
    console.error('❌ Error calculating final gas cost:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
