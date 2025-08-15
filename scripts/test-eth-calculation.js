const { ethers } = require('hardhat');

async function main() {
  try {
    console.log('🧮 Testing ETH Amount Calculation...');
    console.log('====================================');
    
    const contractAddress = '0xF5fdE838AB5aa566AC7d1b9116523268F39CC6D0';
    const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3');
    
    // Contract ABI for getETHAmount function
    const abi = [
      {
        name: 'getETHAmount',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'usdAmount', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    // Test with $0.12 (120000 in 6 decimals)
    const priceUSD = 0.12;
    const priceUSDWei = ethers.parseUnits(priceUSD.toString(), 6);
    
    console.log('💰 Test Parameters:');
    console.log(`   Price USD: $${priceUSD}`);
    console.log(`   Price USD (6 decimals): ${priceUSDWei.toString()}`);
    
    // Get ETH amount from contract
    const ethAmount = await contract.getETHAmount(priceUSDWei);
    const ethAmountFormatted = ethers.formatEther(ethAmount);
    
    console.log('🪙 Contract Calculation:');
    console.log(`   ETH Amount (wei): ${ethAmount.toString()}`);
    console.log(`   ETH Amount (ETH): ${ethAmountFormatted} ETH`);
    
    // Calculate USD value (approximate)
    const ethPriceUSD = 3500; // Approximate
    const usdValue = Number(ethAmountFormatted) * ethPriceUSD;
    
    console.log('💵 USD Value:');
    console.log(`   USD Value: $${usdValue.toFixed(4)}`);
    
    // Check if this matches expected
    const expectedUSD = 0.12;
    const difference = Math.abs(usdValue - expectedUSD);
    const percentDiff = (difference / expectedUSD) * 100;
    
    console.log('📊 Comparison:');
    console.log(`   Expected: $${expectedUSD}`);
    console.log(`   Actual: $${usdValue.toFixed(4)}`);
    console.log(`   Difference: $${difference.toFixed(4)} (${percentDiff.toFixed(2)}%)`);
    
    if (percentDiff > 10) {
      console.log('\n⚠️  WARNING: Large difference detected!');
      console.log('   This might explain the high transaction costs you\'re seeing.');
    } else {
      console.log('\n✅ Calculation looks reasonable.');
    }
    
    // Test with different amounts
    console.log('\n🧪 Testing Different Amounts:');
    const testAmounts = [0.01, 0.05, 0.10, 0.15, 0.20, 0.50, 1.00];
    
    for (const amount of testAmounts) {
      const amountWei = ethers.parseUnits(amount.toString(), 6);
      const ethResult = await contract.getETHAmount(amountWei);
      const ethFormatted = ethers.formatEther(ethResult);
      const usdResult = Number(ethFormatted) * ethPriceUSD;
      
      console.log(`   $${amount.toFixed(2)} → ${ethFormatted} ETH → $${usdResult.toFixed(4)} USD`);
    }
    
  } catch (error) {
    console.error('❌ Error testing ETH calculation:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
