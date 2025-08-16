const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🔍 Debugging Gas Estimation Issue...');
    console.log('====================================');
    
    const contractAddress = '0x6527c1e6b12cd0F6d354B15CF7935Dc5516DEcaf';
    const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3');
    
    // Contract ABI for depositETH function
    const abi = [
      {
        name: 'depositETH',
        type: 'function',
        stateMutability: 'payable',
        inputs: [{ name: 'gameId', type: 'bytes32' }],
        outputs: []
      }
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    // Test parameters
    const gameId = ethers.id('test-game-id');
    const value = ethers.parseEther('0.000033'); // The amount from MetaMask
    
    console.log('🧪 Test Parameters:');
    console.log(`   Game ID: ${gameId}`);
    console.log(`   Value: ${ethers.formatEther(value)} ETH`);
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    console.log('💰 Current Gas Prices:');
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
    console.log(`   Max Fee Per Gas: ${feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : 'N/A'} gwei`);
    console.log(`   Max Priority Fee: ${feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : 'N/A'} gwei`);
    
    // Try to estimate gas
    try {
      console.log('\n🔍 Estimating Gas...');
      const gasEstimate = await contract.depositETH.estimateGas(gameId, { value });
      console.log(`   Gas Estimate: ${gasEstimate.toString()} units`);
      
      // Calculate costs
      const gasCost = gasEstimate * feeData.gasPrice;
      const gasCostETH = ethers.formatEther(gasCost);
      const gasCostUSD = Number(gasCostETH) * 3500; // Approximate ETH price
      
      console.log('💸 Gas Cost Calculation:');
      console.log(`   Gas Cost (ETH): ${gasCostETH} ETH`);
      console.log(`   Gas Cost (USD): $${gasCostUSD.toFixed(4)}`);
      
      // Total transaction cost
      const totalETH = value + gasCost;
      const totalUSD = Number(ethers.formatEther(totalETH)) * 3500;
      
      console.log('📊 Total Transaction Cost:');
      console.log(`   Total (ETH): ${ethers.formatEther(totalETH)} ETH`);
      console.log(`   Total (USD): $${totalUSD.toFixed(4)}`);
      
      if (gasCostUSD > 1) {
        console.log('\n⚠️  WARNING: Gas cost is very high!');
        console.log('   This might be due to:');
        console.log('   1. Incorrect gas estimation');
        console.log('   2. Network congestion');
        console.log('   3. MetaMask using wrong gas price');
      } else {
        console.log('\n✅ Gas cost looks reasonable.');
      }
      
    } catch (error) {
      console.log('❌ Gas estimation failed:', error.message);
      
      // Try with different gas limits
      console.log('\n🧪 Testing Different Gas Limits:');
      const testGasLimits = [50000, 100000, 200000, 300000, 500000];
      
      for (const gasLimit of testGasLimits) {
        const gasCost = BigInt(gasLimit) * feeData.gasPrice;
        const gasCostETH = ethers.formatEther(gasCost);
        const gasCostUSD = Number(gasCostETH) * 3500;
        
        console.log(`   ${gasLimit.toLocaleString()} gas → ${gasCostETH} ETH → $${gasCostUSD.toFixed(4)} USD`);
      }
    }
    
    // Check if there's a gas price issue
    console.log('\n🔍 Checking for Gas Price Issues:');
    const block = await provider.getBlock('latest');
    console.log(`   Latest Block Gas Used: ${block.gasUsed.toString()}`);
    console.log(`   Latest Block Gas Limit: ${block.gasLimit.toString()}`);
    
    // Check if the contract has any issues
    console.log('\n🔍 Checking Contract State:');
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.log('   ❌ Contract not deployed at this address');
    } else {
      console.log('   ✅ Contract exists at this address');
    }
    
  } catch (error) {
    console.error('❌ Error debugging gas estimation:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
