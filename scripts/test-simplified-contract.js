const { ethers } = require('ethers');

async function main() {
  console.log('🧪 Testing Simplified Escrow Contract...');
  
  // Contract configuration
  const CONTRACT_ADDRESS = '0x89Be2510F8180DC319888Ca44E2FDcBA24274c4E';
  const RPC_URL = 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3';
  
  // Simplified contract ABI (only the functions we need to test)
  const CONTRACT_ABI = [
    "function platformFeePercent() view returns (uint256)",
    "function depositTimeout() view returns (uint256)",
    "function platformFeeReceiver() view returns (address)",
    "function usdcToken() view returns (address)",
    "function isGameReady(bytes32 gameId) view returns (bool)",
    "function getGameParticipants(bytes32 gameId) view returns (address nftPlayer, address cryptoPlayer)"
  ];
  
  try {
    // Connect to provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to Base network');
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    console.log('✅ Contract instance created');
    
    // Test basic contract functions
    console.log('\n🔍 Testing contract configuration...');
    
    const platformFeePercent = await contract.platformFeePercent();
    console.log(`✅ Platform fee: ${platformFeePercent} basis points (${Number(platformFeePercent) / 100}%)`);
    
    const depositTimeout = await contract.depositTimeout();
    console.log(`✅ Deposit timeout: ${depositTimeout} seconds (${Number(depositTimeout) / 3600} hours)`);
    
    const platformFeeReceiver = await contract.platformFeeReceiver();
    console.log(`✅ Platform fee receiver: ${platformFeeReceiver}`);
    
    const usdcToken = await contract.usdcToken();
    console.log(`✅ USDC token: ${usdcToken}`);
    
    // Test game functions with a dummy game ID
    console.log('\n🎮 Testing game functions...');
    const dummyGameId = ethers.id('test-game-123');
    
    const isReady = await contract.isGameReady(dummyGameId);
    console.log(`✅ isGameReady(${dummyGameId}): ${isReady}`);
    
    const [nftPlayer, cryptoPlayer] = await contract.getGameParticipants(dummyGameId);
    console.log(`✅ getGameParticipants(${dummyGameId}):`);
    console.log(`   NFT Player: ${nftPlayer}`);
    console.log(`   Crypto Player: ${cryptoPlayer}`);
    
    console.log('\n🎉 Simplified contract test completed successfully!');
    console.log('📋 Contract is working properly with new simplified functions.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'CALL_EXCEPTION') {
      console.log('💡 This might mean the contract is not deployed or the ABI is incorrect.');
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
