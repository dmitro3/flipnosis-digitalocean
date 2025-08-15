const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🔍 Debugging Transaction Failure...');
    console.log('==================================');
    
    const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3');
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    console.log('💰 Current Network Gas Prices:');
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
    console.log(`   Max Fee Per Gas: ${feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : 'N/A'} gwei`);
    console.log(`   Max Priority Fee: ${feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : 'N/A'} gwei`);
    
    // Our current ultra-low parameters
    const ourMaxFeePerGas = BigInt(50000000); // 0.05 gwei
    const ourMaxPriorityFeePerGas = BigInt(1000000); // 0.001 gwei
    
    console.log('\n🔧 Our Current Parameters:');
    console.log(`   Max Fee Per Gas: ${ethers.formatUnits(ourMaxFeePerGas, 'gwei')} gwei`);
    console.log(`   Max Priority Fee: ${ethers.formatUnits(ourMaxPriorityFeePerGas, 'gwei')} gwei`);
    
    // Check if our parameters are too low
    if (ourMaxFeePerGas < feeData.gasPrice) {
      console.log('\n❌ PROBLEM: Our max fee is too low!');
      console.log(`   Network gas price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
      console.log(`   Our max fee: ${ethers.formatUnits(ourMaxFeePerGas, 'gwei')} gwei`);
      console.log(`   We need at least: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
    } else {
      console.log('\n✅ Our max fee is sufficient');
    }
    
    // Calculate realistic parameters
    const realisticMaxFeePerGas = feeData.gasPrice * BigInt(2); // 2x current gas price
    const realisticMaxPriorityFeePerGas = feeData.maxPriorityFeePerGas || BigInt(1000000000); // 1 gwei
    
    console.log('\n🎯 Realistic Gas Parameters:');
    console.log(`   Max Fee Per Gas: ${ethers.formatUnits(realisticMaxFeePerGas, 'gwei')} gwei`);
    console.log(`   Max Priority Fee: ${ethers.formatUnits(realisticMaxPriorityFeePerGas, 'gwei')} gwei`);
    
    // Calculate costs with realistic parameters
    const gasLimit = 15000;
    const realisticGasCost = BigInt(gasLimit) * realisticMaxFeePerGas;
    const realisticGasCostETH = ethers.formatEther(realisticGasCost);
    const realisticGasCostUSD = Number(realisticGasCostETH) * 3500;
    
    console.log('\n💸 Realistic Gas Costs:');
    console.log(`   Gas Cost: ${realisticGasCostETH} ETH`);
    console.log(`   USD Cost: $${realisticGasCostUSD.toFixed(6)}`);
    
    if (realisticGasCostUSD < 0.10) {
      console.log('\n✅ EXCELLENT: Realistic costs are still very low!');
    } else {
      console.log('\n⚠️  Realistic costs are higher but should work');
    }
    
  } catch (error) {
    console.error('❌ Error debugging transaction failure:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
