#!/usr/bin/env node

/**
 * Game Consistency Checker
 * 
 * This script checks for consistency between database games and on-chain games.
 * It identifies:
 * 1. Games missing contract_game_id in the database
 * 2. Games where the on-chain game doesn't exist
 * 3. Games where the on-chain game exists but has different data
 * 
 * Usage: node scripts/checkGameConsistency.js
 */

const sqlite3 = require('sqlite3').verbose();
const { ethers } = require('ethers');

// Configuration - UPDATE THESE VALUES
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // <-- SET YOUR CONTRACT ADDRESS
const RPC_URL = 'https://mainnet.base.org'; // <-- SET YOUR RPC URL
const DB_PATH = './server/games.db';

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  "function games(uint256) view returns (tuple(uint256 gameId, address creator, address joiner, address nftContract, uint256 tokenId, uint8 state, uint8 gameType, uint256 priceUSD, uint8 paymentToken, uint256 totalPaid, address winner, uint256 createdAt, uint256 creatorWins, uint256 joinerWins, uint256 currentRound, uint256 lastFlipResult, bytes32 lastFlipHash, tuple(string coinType, string headsImage, string tailsImage, bool isCustom) coinInfo))",
  "function nextGameId() view returns (uint256)"
];

async function checkGameConsistency() {
  console.log('🔍 Starting Game Consistency Check...\n');
  
  // Connect to database
  const db = new sqlite3.Database(DB_PATH);
  
  // Connect to Ethereum node
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  console.log('📊 Configuration:');
  console.log(`   Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`   RPC URL: ${RPC_URL}`);
  console.log(`   Database: ${DB_PATH}\n`);
  
  // Check if contract is accessible
  try {
    const nextGameId = await contract.nextGameId();
    console.log(`✅ Contract accessible. Next game ID: ${nextGameId.toString()}\n`);
  } catch (error) {
    console.error('❌ Cannot access contract:', error.message);
    console.log('   Please check your CONTRACT_ADDRESS and RPC_URL\n');
    db.close();
    return;
  }
  
  // Get all games from database
  db.all('SELECT id, contract_game_id, creator, joiner, nft_contract, nft_token_id, price_usd, status FROM games ORDER BY id', async (err, rows) => {
    if (err) {
      console.error('❌ Database error:', err);
      db.close();
      return;
    }
    
    console.log(`📋 Found ${rows.length} games in database\n`);
    
    let missingContractId = 0;
    let missingOnChain = 0;
    let inconsistent = 0;
    let consistent = 0;
    
    for (const row of rows) {
      console.log(`🔍 Checking game: ${row.id}`);
      
      // Check if contract_game_id is missing
      if (!row.contract_game_id) {
        console.log(`   ❌ Missing contract_game_id`);
        missingContractId++;
        continue;
      }
      
      console.log(`   📝 Contract game ID: ${row.contract_game_id}`);
      
      try {
        // Check if on-chain game exists
        const onChainGame = await contract.games(row.contract_game_id);
        
        if (onChainGame.creator === ethers.ZeroAddress) {
          console.log(`   ❌ On-chain game does not exist`);
          missingOnChain++;
          continue;
        }
        
        // Check for data consistency
        const dbCreator = row.creator?.toLowerCase();
        const chainCreator = onChainGame.creator.toLowerCase();
        const dbJoiner = row.joiner?.toLowerCase();
        const chainJoiner = onChainGame.joiner.toLowerCase();
        const dbNftContract = row.nft_contract?.toLowerCase();
        const chainNftContract = onChainGame.nftContract.toLowerCase();
        const dbTokenId = row.nft_token_id;
        const chainTokenId = onChainGame.tokenId.toString();
        const dbPriceUSD = parseFloat(row.price_usd);
        const chainPriceUSD = parseFloat(onChainGame.priceUSD) / 1000000; // Convert from 6 decimals
        
        let isConsistent = true;
        let inconsistencies = [];
        
        if (dbCreator !== chainCreator) {
          isConsistent = false;
          inconsistencies.push(`creator: DB=${dbCreator} vs Chain=${chainCreator}`);
        }
        
        if (dbNftContract !== chainNftContract) {
          isConsistent = false;
          inconsistencies.push(`nft_contract: DB=${dbNftContract} vs Chain=${chainNftContract}`);
        }
        
        if (dbTokenId !== chainTokenId) {
          isConsistent = false;
          inconsistencies.push(`token_id: DB=${dbTokenId} vs Chain=${chainTokenId}`);
        }
        
        if (Math.abs(dbPriceUSD - chainPriceUSD) > 0.01) { // Allow small difference for rounding
          isConsistent = false;
          inconsistencies.push(`price_usd: DB=${dbPriceUSD} vs Chain=${chainPriceUSD}`);
        }
        
        if (isConsistent) {
          console.log(`   ✅ Consistent`);
          consistent++;
        } else {
          console.log(`   ⚠️  Inconsistent: ${inconsistencies.join(', ')}`);
          inconsistent++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error fetching on-chain game: ${error.message}`);
        missingOnChain++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log('===========');
    console.log(`✅ Consistent games: ${consistent}`);
    console.log(`❌ Missing contract_game_id: ${missingContractId}`);
    console.log(`❌ Missing on-chain game: ${missingOnChain}`);
    console.log(`⚠️  Inconsistent data: ${inconsistent}`);
    console.log(`📋 Total games checked: ${rows.length}\n`);
    
    if (missingContractId > 0) {
      console.log('🔧 RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. Games missing contract_game_id need to be recreated on-chain');
      console.log('2. Check the CreateFlip flow to ensure contract_game_id is being saved');
      console.log('3. Verify the contract service is returning game IDs correctly\n');
    }
    
    if (missingOnChain > 0) {
      console.log('🔧 RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. On-chain games that don\'t exist may have been created with wrong parameters');
      console.log('2. Check transaction history for failed game creations');
      console.log('3. Verify the contract address is correct\n');
    }
    
    if (inconsistent > 0) {
      console.log('🔧 RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. Inconsistent games have different data in DB vs on-chain');
      console.log('2. This could indicate a bug in the game creation flow');
      console.log('3. Check if the correct data is being sent to the contract\n');
    }
    
    db.close();
  });
}

// Run the check
checkGameConsistency().catch(console.error); 