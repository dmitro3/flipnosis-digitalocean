const { ethers } = require('ethers');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xB2FC2180e003D818621F4722FFfd7878A218581D';
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

const NFT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function diagnoseGame(gameId) {
  console.log('\n🔍 GAME DIAGNOSTIC REPORT');
  console.log('========================\n');
  console.log(`Game ID: ${gameId}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}\n`);

  // Connect to blockchain
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  // Connect to database
  const db = new sqlite3.Database('./server/database.sqlite');

  try {
    // 1. Check database
    console.log('📊 DATABASE STATE:');
    console.log('─────────────────');
    const dbGame = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM battle_royale_games WHERE id = ?', [gameId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!dbGame) {
      console.log('❌ Game not found in database');
      return;
    }

    console.log(`✅ Game found in database`);
    console.log(`   Creator: ${dbGame.creator}`);
    console.log(`   Winner: ${dbGame.winner_address || 'Not set'}`);
    console.log(`   Status: ${dbGame.status}`);
    console.log(`   NFT: ${dbGame.nft_contract} #${dbGame.nft_token_id}`);
    console.log(`   NFT Deposited: ${dbGame.nft_deposited ? 'Yes' : 'No'}`);
    console.log(`   NFT Deposit Hash: ${dbGame.nft_deposit_hash || 'Not recorded'}`);
    console.log(`   NFT Claimed: ${dbGame.nft_claimed ? 'Yes' : 'No'}`);
    console.log(`   Creator Paid: ${dbGame.creator_paid ? 'Yes' : 'No'}\n`);

    // 2. Check on-chain state
    console.log('⛓️  ON-CHAIN STATE:');
    console.log('─────────────────');
    
    const gameIdBytes32 = ethers.id(gameId);
    console.log(`   GameId (bytes32): ${gameIdBytes32}`);
    
    try {
      const onChainGame = await contract.getBattleRoyaleGame(gameIdBytes32);
      
      if (onChainGame.creator === ethers.ZeroAddress) {
        console.log('❌ Game does NOT exist on-chain');
        console.log(`   ⚠️  This means the createBattleRoyale transaction failed or reverted`);
      } else {
        console.log('✅ Game exists on-chain');
        console.log(`   Creator: ${onChainGame.creator}`);
        console.log(`   Winner: ${onChainGame.winner}`);
        console.log(`   Completed: ${onChainGame.completed}`);
        console.log(`   NFT Claimed: ${onChainGame.nftClaimed}`);
        console.log(`   Creator Paid: ${onChainGame.creatorPaid}`);
        console.log(`   Current Players: ${onChainGame.currentPlayers}`);
        console.log(`   Total Pool: ${ethers.formatEther(onChainGame.totalPool)} ETH`);
      }
    } catch (error) {
      console.log(`❌ Error reading on-chain state: ${error.message}`);
    }

    // 3. Check NFT ownership
    console.log('\n🖼️  NFT OWNERSHIP:');
    console.log('─────────────────');
    
    try {
      const nftContract = new ethers.Contract(dbGame.nft_contract, NFT_ABI, provider);
      const nftOwner = await nftContract.ownerOf(dbGame.nft_token_id);
      console.log(`   Current Owner: ${nftOwner}`);
      
      if (nftOwner.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
        console.log(`   ✅ NFT is in the game contract`);
      } else if (nftOwner.toLowerCase() === dbGame.creator?.toLowerCase()) {
        console.log(`   ℹ️  NFT is with the creator (may not have been deposited)`);
      } else {
        console.log(`   ⚠️  NFT is with a different address`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking NFT ownership: ${error.message}`);
    }

    // 4. Diagnosis
    console.log('\n🔎 DIAGNOSIS:');
    console.log('─────────────');
    
    const nftContract = new ethers.Contract(dbGame.nft_contract, NFT_ABI, provider);
    const nftOwner = await nftContract.ownerOf(dbGame.nft_token_id);
    
    try {
      const onChainGame = await contract.getBattleRoyaleGame(gameIdBytes32);
      const existsOnChain = onChainGame.creator !== ethers.ZeroAddress;
      
      if (existsOnChain && onChainGame.completed && !onChainGame.nftClaimed) {
        console.log('✅ Game is ready for NFT withdrawal by winner');
        console.log(`   Winner should call withdrawWinnerNFT()`);
      } else if (existsOnChain && onChainGame.completed && !onChainGame.creatorPaid) {
        console.log('✅ Game is ready for creator fund withdrawal');
        console.log(`   Creator should call withdrawCreatorFunds()`);
      } else if (!existsOnChain && nftOwner.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
        console.log('🚨 CRITICAL: NFT is stuck in contract but game doesn\'t exist on-chain');
        console.log(`   This means the createBattleRoyale transaction reverted`);
        console.log(`   Solution: Use admin panel to withdraw NFT back to creator`);
        console.log(`   Or call directTransferNFT(${dbGame.nft_contract}, ${dbGame.nft_token_id}, ${dbGame.creator})`);
      } else if (!existsOnChain) {
        console.log('❌ Game was never successfully created on-chain');
        console.log(`   Database shows nft_deposited=${dbGame.nft_deposited} but game doesn't exist on-chain`);
        console.log(`   Check the nft_deposit_hash transaction: ${dbGame.nft_deposit_hash || 'Not recorded'}`);
      } else if (existsOnChain && !onChainGame.completed) {
        console.log('⏳ Game exists on-chain but not yet completed');
        console.log(`   Backend should call completeBattleRoyale()`);
      } else {
        console.log('ℹ️  Game state unclear, manual inspection needed');
      }
    } catch (error) {
      console.log(`❌ Unable to complete diagnosis: ${error.message}`);
    }

  } catch (error) {
    console.error('Error during diagnosis:', error);
  } finally {
    db.close();
  }
}

// Get gameId from command line or use the one from the error
const gameId = process.argv[2] || 'physics_1761831327138_a21bff62f5a5ef48';
diagnoseGame(gameId);

