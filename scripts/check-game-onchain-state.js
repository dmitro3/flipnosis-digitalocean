// Script to check the on-chain state of a Battle Royale game
// Usage: node scripts/check-game-onchain-state.js <gameId>

const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xB2FC2180e003D818621F4722FFfd7878A218581D';
const RPC_URL = process.env.RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3';

const CONTRACT_ABI = [
  "function getBattleRoyaleGame(bytes32 gameId) view returns (tuple(address creator, address nftContract, uint256 tokenId, uint256 entryFee, uint256 serviceFee, uint8 maxPlayers, uint8 currentPlayers, address winner, bool completed, bool creatorPaid, bool nftClaimed, uint256 totalPool, uint256 createdAt, bool isUnder20, uint256 minUnder20Wei))"
];

async function checkGameState(gameId) {
  console.log('🔍 Checking on-chain state for game:', gameId);
  console.log('📋 Contract:', CONTRACT_ADDRESS);
  console.log('🌐 RPC:', RPC_URL.substring(0, 50) + '...\n');

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Convert gameId to bytes32
    const gameIdBytes32 = ethers.id(gameId);
    console.log('🎮 Game ID (bytes32):', gameIdBytes32);
    
    // Get game state
    const game = await contract.getBattleRoyaleGame(gameIdBytes32);
    
    if (game.creator === ethers.ZeroAddress) {
      console.log('❌ Game does not exist on-chain');
      return;
    }
    
    console.log('\n📊 On-Chain Game State:');
    console.log('   Creator:', game.creator);
    console.log('   Winner:', game.winner);
    console.log('   Completed:', game.completed);
    console.log('   NFT Claimed:', game.nftClaimed);
    console.log('   Current Players:', game.currentPlayers.toString());
    console.log('   Max Players:', game.maxPlayers.toString());
    console.log('   Creator Paid:', game.creatorPaid);
    
    // Check if game is completed
    if (!game.completed) {
      console.log('\n⚠️  PROBLEM: Game is NOT marked as completed on-chain!');
      console.log('   This is why withdrawWinnerNFT is failing.');
      console.log('   The backend needs to call completeBattleRoyale() first.');
    } else if (game.winner === ethers.ZeroAddress) {
      console.log('\n⚠️  PROBLEM: Game is completed but winner is not set!');
    } else {
      console.log('\n✅ Game is completed on-chain with winner set');
      if (game.nftClaimed) {
        console.log('⚠️  NFT has already been claimed');
      } else {
        console.log('✅ NFT is ready to be claimed by winner');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking game state:', error.message);
    if (error.code === 'CALL_EXCEPTION') {
      console.error('   This usually means the game does not exist on-chain');
    }
  }
}

const gameId = process.argv[2];
if (!gameId) {
  console.error('Usage: node scripts/check-game-onchain-state.js <gameId>');
  process.exit(1);
}

checkGameState(gameId).catch(console.error);

