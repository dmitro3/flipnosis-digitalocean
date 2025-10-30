const sqlite3 = require('sqlite3').verbose();
const { ethers } = require('ethers');
require('dotenv').config();

// The gameId from the error message
const GAME_ID = 'physics_1761839830398_c83a48cf7f37771e';

const db = new sqlite3.Database('./server/database.sqlite');

console.log('\n🔍 Checking Game:', GAME_ID);
console.log('═══════════════════════════════════════\n');

db.get('SELECT * FROM battle_royale_games WHERE id = ?', [GAME_ID], async (err, game) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    db.close();
    return;
  }

  if (!game) {
    console.log('❌ Game NOT found in database');
    console.log('   This means the game record was never created\n');
    
    // Check if there are ANY games in the database
    db.get('SELECT COUNT(*) as count FROM battle_royale_games', [], (err, result) => {
      if (err) {
        console.error('Error counting games:', err);
      } else {
        console.log(`📊 Total games in database: ${result.count}`);
        
        if (result.count > 0) {
          db.all('SELECT id, creator, status, nft_deposited, winner_address FROM battle_royale_games ORDER BY created_at DESC LIMIT 5', [], (err, games) => {
            if (!err && games) {
              console.log('\n📋 Recent games in database:');
              games.forEach((g, i) => {
                console.log(`\n${i + 1}. ${g.id}`);
                console.log(`   Status: ${g.status}`);
                console.log(`   NFT Deposited: ${g.nft_deposited ? 'Yes' : 'No'}`);
                console.log(`   Winner: ${g.winner_address || 'Not set'}`);
              });
            }
            db.close();
          });
        } else {
          console.log('\n⚠️  Database is empty - no games have been created');
          db.close();
        }
      }
    });
    return;
  }

  console.log('✅ Game FOUND in database!\n');
  console.log('📊 Database Record:');
  console.log(`   Status: ${game.status}`);
  console.log(`   Creator: ${game.creator}`);
  console.log(`   Winner: ${game.winner_address || 'Not set'}`);
  console.log(`   NFT: ${game.nft_contract} #${game.nft_token_id}`);
  console.log(`   NFT Deposited: ${game.nft_deposited ? 'Yes' : 'No'}`);
  console.log(`   NFT Claimed: ${game.nft_claimed ? 'Yes' : 'No'}`);
  console.log(`   Created: ${game.created_at}`);
  
  // Now check on-chain
  console.log('\n⛓️  Checking On-Chain State...');
  
  const CONTRACT_ADDRESS = '0xB2FC2180e003D818621F4722FFfd7878A218581D';
  const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
  
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
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const gameIdBytes32 = ethers.id(GAME_ID);
    
    console.log(`   GameId (bytes32): ${gameIdBytes32}`);
    
    const onChainGame = await contract.getBattleRoyaleGame(gameIdBytes32);
    
    if (onChainGame.creator === ethers.ZeroAddress) {
      console.log('\n❌ Game does NOT exist on-chain');
      console.log('   Even though database shows nft_deposited =', game.nft_deposited);
      console.log('   This means there was a verification failure during creation\n');
    } else {
      console.log('\n✅ Game EXISTS on-chain!');
      console.log(`   Creator: ${onChainGame.creator}`);
      console.log(`   Winner: ${onChainGame.winner}`);
      console.log(`   Completed: ${onChainGame.completed}`);
      console.log(`   NFT Claimed: ${onChainGame.nftClaimed}\n`);
    }
  } catch (error) {
    console.error('\n❌ Error checking on-chain:', error.message);
  }
  
  db.close();
});

