const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 Fixing Battle Royale winner in contract...\n');

  // Get the contract
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xB2FC2180e003D818621F4722FFfd7878A218581D';
  const contract = await ethers.getContractAt('NFTFlipGame', contractAddress);

  // Get parameters from command line
  const gameId = process.argv[2];
  const winnerAddress = process.argv[3];
  
  if (!gameId || !winnerAddress) {
    console.error('❌ Please provide game ID and winner address');
    console.log('Usage: npx hardhat run scripts/fix-battle-royale-winner.js --network base -- <gameId> <winnerAddress>');
    process.exit(1);
  }

  const gameIdBytes32 = ethers.id(gameId);
  console.log(`🎮 Game ID: ${gameId}`);
  console.log(`🏆 Winner Address: ${winnerAddress}`);
  console.log(`🎮 Game ID (bytes32): ${gameIdBytes32}\n`);

  try {
    // Check current state
    console.log('📋 Checking current game state...');
    const battleRoyaleGame = await contract.getBattleRoyaleGame(gameIdBytes32);
    
    if (battleRoyaleGame.creator === ethers.ZeroAddress) {
      console.log('❌ Game does not exist in contract');
      return;
    }

    console.log(`   Current Winner: ${battleRoyaleGame.winner}`);
    console.log(`   Completed: ${battleRoyaleGame.completed}`);
    console.log(`   NFT Claimed: ${battleRoyaleGame.nftClaimed}\n`);

    // Check if already completed with correct winner
    if (battleRoyaleGame.completed && battleRoyaleGame.winner.toLowerCase() === winnerAddress.toLowerCase()) {
      console.log('✅ Game already completed with correct winner');
      return;
    }

    // Check if game is full
    if (battleRoyaleGame.currentPlayers < battleRoyaleGame.maxPlayers) {
      console.log('❌ Game is not full yet - cannot complete');
      return;
    }

    // Complete the game with the correct winner
    console.log('🏆 Completing Battle Royale with correct winner...');
    const tx = await contract.completeBattleRoyale(gameIdBytes32, winnerAddress);
    console.log(`   Transaction hash: ${tx.hash}`);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedGame = await contract.getBattleRoyaleGame(gameIdBytes32);
    console.log(`   New Winner: ${updatedGame.winner}`);
    console.log(`   Completed: ${updatedGame.completed}`);
    console.log(`   Winner matches: ${updatedGame.winner.toLowerCase() === winnerAddress.toLowerCase()}`);

    if (updatedGame.winner.toLowerCase() === winnerAddress.toLowerCase() && updatedGame.completed) {
      console.log('✅ Fix successful! Winner can now claim the NFT');
    } else {
      console.log('❌ Fix failed - winner still cannot claim');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Only owner')) {
      console.log('\n💡 This error means you need to run this script with the contract owner wallet');
      console.log('   Make sure your .env file has the correct PRIVATE_KEY for the contract owner');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
