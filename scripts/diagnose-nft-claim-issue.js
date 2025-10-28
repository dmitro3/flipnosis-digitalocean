const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 Diagnosing NFT claim issue...\n');

  // Get the contract
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xB2FC2180e003D818621F4722FFfd7878A218581D';
  const contract = await ethers.getContractAt('NFTFlipGame', contractAddress);

  // Get the game ID from command line args or use a test one
  const gameId = process.argv[2];
  if (!gameId) {
    console.error('❌ Please provide a game ID as argument');
    console.log('Usage: npx hardhat run scripts/diagnose-nft-claim-issue.js --network base -- <gameId>');
    process.exit(1);
  }

  const gameIdBytes32 = ethers.id(gameId);
  console.log(`🎮 Game ID: ${gameId}`);
  console.log(`🎮 Game ID (bytes32): ${gameIdBytes32}\n`);

  try {
    // Check if the game exists in the contract
    console.log('📋 Checking Battle Royale game in contract...');
    const battleRoyaleGame = await contract.getBattleRoyaleGame(gameIdBytes32);
    
    if (battleRoyaleGame.creator === ethers.ZeroAddress) {
      console.log('❌ Game does not exist in contract');
      return;
    }

    console.log('✅ Game exists in contract');
    console.log(`   Creator: ${battleRoyaleGame.creator}`);
    console.log(`   Winner: ${battleRoyaleGame.winner}`);
    console.log(`   Completed: ${battleRoyaleGame.completed}`);
    console.log(`   NFT Claimed: ${battleRoyaleGame.nftClaimed}`);
    console.log(`   NFT Contract: ${battleRoyaleGame.nftContract}`);
    console.log(`   Token ID: ${battleRoyaleGame.tokenId}`);
    console.log(`   Current Players: ${battleRoyaleGame.currentPlayers}`);
    console.log(`   Max Players: ${battleRoyaleGame.maxPlayers}\n`);

    // Check who is trying to claim (you can replace this with the actual winner address)
    const winnerAddress = process.argv[3] || '0x0000000000000000000000000000000000000000';
    console.log(`🏆 Winner address trying to claim: ${winnerAddress}`);
    console.log(`🏆 Winner in contract: ${battleRoyaleGame.winner}`);
    console.log(`🏆 Addresses match: ${battleRoyaleGame.winner.toLowerCase() === winnerAddress.toLowerCase()}\n`);

    // Check if the contract owns the NFT
    console.log('🔍 Checking NFT ownership...');
    try {
      const nftContract = await ethers.getContractAt('IERC721', battleRoyaleGame.nftContract);
      const owner = await nftContract.ownerOf(battleRoyaleGame.tokenId);
      console.log(`   NFT Owner: ${owner}`);
      console.log(`   Contract owns NFT: ${owner.toLowerCase() === contractAddress.toLowerCase()}\n`);
    } catch (error) {
      console.log(`   ❌ Error checking NFT ownership: ${error.message}\n`);
    }

    // Check if the winner can claim
    console.log('🔍 Checking claim eligibility...');
    const canClaim = battleRoyaleGame.winner.toLowerCase() === winnerAddress.toLowerCase() && 
                    battleRoyaleGame.completed && 
                    !battleRoyaleGame.nftClaimed;
    console.log(`   Can claim: ${canClaim}`);
    
    if (!canClaim) {
      console.log('   Issues:');
      if (battleRoyaleGame.winner.toLowerCase() !== winnerAddress.toLowerCase()) {
        console.log('   - Winner address mismatch');
      }
      if (!battleRoyaleGame.completed) {
        console.log('   - Game not completed in contract');
      }
      if (battleRoyaleGame.nftClaimed) {
        console.log('   - NFT already claimed');
      }
    }

    // Check contract owner
    console.log('\n👑 Contract owner:');
    const owner = await contract.owner();
    console.log(`   Owner: ${owner}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
