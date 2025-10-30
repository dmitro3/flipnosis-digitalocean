const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = '0xB2FC2180e003D818621F4722FFfd7878A218581D';
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';

// Get gameId from the transaction input data
// From the transaction: 0x69de5bcce4374da5f74252da71676298bc4efc3209b3321d4ab18f35e9559ca5837901f2
const GAME_ID_BYTES32 = '0xe4374da5f74252da71676298bc4efc3209b3321d4ab18f35e9559ca5837901f2';

const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "bytes32", "name": "gameId", "type": "bytes32"}],
    "name": "getBattleRoyaleGame",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "creator", "type": "address"},
        {"internalType": "address", "name": "nftContract", "type": "address"},
        {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
        {"internalType": "uint256", "name": "entryFee", "type": "uint256"},
        {"internalType": "uint256", "name": "serviceFee", "type": "uint256"},
        {"internalType": "uint8", "name": "maxPlayers", "type": "uint8"},
        {"internalType": "uint8", "name": "currentPlayers", "type": "uint8"},
        {"internalType": "address", "name": "winner", "type": "address"},
        {"internalType": "bool", "name": "completed", "type": "bool"},
        {"internalType": "bool", "name": "creatorPaid", "type": "bool"},
        {"internalType": "bool", "name": "nftClaimed", "type": "bool"},
        {"internalType": "uint256", "name": "totalPool", "type": "uint256"},
        {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
        {"internalType": "bool", "name": "isUnder20", "type": "bool"},
        {"internalType": "uint256", "name": "minUnder20Wei", "type": "uint256"}
      ],
      "internalType": "struct NFTFlipGame.BattleRoyaleGame",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkGame() {
  console.log('\n✅ LATEST GAME CHECK (NFT 5601)');
  console.log('═══════════════════════════════\n');
  console.log(`GameId (bytes32): ${GAME_ID_BYTES32}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  try {
    const gameState = await contract.getBattleRoyaleGame(GAME_ID_BYTES32);
    
    if (gameState.creator === ethers.ZeroAddress) {
      console.log('❌ Game does NOT exist on-chain');
      console.log('   The BattleRoyaleCreated event was emitted but game struct is empty');
      console.log('   This should not be possible - contact developer\n');
    } else {
      console.log('✅ Game EXISTS on-chain!');
      console.log('\n📊 Game Details:');
      console.log(`   Creator: ${gameState.creator}`);
      console.log(`   NFT Contract: ${gameState.nftContract}`);
      console.log(`   NFT Token ID: ${gameState.tokenId.toString()}`);
      console.log(`   Entry Fee: ${ethers.formatEther(gameState.entryFee)} ETH`);
      console.log(`   Service Fee: ${ethers.formatEther(gameState.serviceFee)} ETH`);
      console.log(`   Max Players: ${gameState.maxPlayers}`);
      console.log(`   Current Players: ${gameState.currentPlayers}`);
      console.log(`   Winner: ${gameState.winner}`);
      console.log(`   Completed: ${gameState.completed}`);
      console.log(`   NFT Claimed: ${gameState.nftClaimed}`);
      console.log(`   Creator Paid: ${gameState.creatorPaid}`);
      console.log(`   Total Pool: ${ethers.formatEther(gameState.totalPool)} ETH`);
      console.log(`   Created At: ${new Date(Number(gameState.createdAt) * 1000).toISOString()}\n`);
      
      console.log('🎯 Status: Game was successfully created!');
      console.log('   The RPC node was just slow to index the transaction.\n');
    }
  } catch (error) {
    console.error('❌ Error reading game state:', error.message);
  }
}

checkGame();

