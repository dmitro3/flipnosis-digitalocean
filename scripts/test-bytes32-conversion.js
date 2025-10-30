const { ethers } = require('ethers');

// The gameId from your error
const gameId = 'physics_1761841924099_037b3f177a813354';

// The bytes32 from the transaction input data (Topic 1 from event log 17)
const expectedBytes32 = '0x8340a08025a64846840947e78871d428356656fcde48b3fe695ecab123abc45c';

// What our code calculates
const calculatedBytes32 = ethers.id(gameId);

console.log('\n🔍 BYTES32 CONVERSION CHECK');
console.log('═══════════════════════════════════════\n');
console.log('GameId (original):', gameId);
console.log('\nExpected (from transaction):', expectedBytes32);
console.log('Calculated (ethers.id()):', calculatedBytes32);
console.log('\nMatch:', expectedBytes32 === calculatedBytes32 ? '✅ YES' : '❌ NO');

if (expectedBytes32 !== calculatedBytes32) {
  console.log('\n🚨 MISMATCH DETECTED!');
  console.log('This is the problem - we are using a different bytes32 than the contract!\n');
} else {
  console.log('\n✅ Conversion is correct. Problem is elsewhere.\n');
}

// Now let's check what the contract actually returns
async function checkContract() {
  require('dotenv').config();
  
  const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
  const CONTRACT_ADDRESS = '0xB2FC2180e003D818621F4722FFfd7878A218581D';
  
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
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  console.log('⛓️  CHECKING CONTRACT WITH BOTH BYTES32 VALUES\n');
  
  // Try with calculated bytes32
  console.log('1️⃣ Trying with calculated bytes32:', calculatedBytes32);
  try {
    const game1 = await contract.getBattleRoyaleGame(calculatedBytes32);
    console.log('   Result:', {
      creator: game1.creator,
      nftContract: game1.nftContract,
      tokenId: game1.tokenId?.toString()
    });
    
    if (game1.creator === ethers.ZeroAddress) {
      console.log('   ❌ Game NOT found with calculated bytes32\n');
    } else {
      console.log('   ✅ Game FOUND with calculated bytes32!\n');
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }
  
  // Try with expected bytes32
  console.log('2️⃣ Trying with expected bytes32 (from transaction):', expectedBytes32);
  try {
    const game2 = await contract.getBattleRoyaleGame(expectedBytes32);
    console.log('   Result:', {
      creator: game2.creator,
      nftContract: game2.nftContract,
      tokenId: game2.tokenId?.toString()
    });
    
    if (game2.creator === ethers.ZeroAddress) {
      console.log('   ❌ Game NOT found with expected bytes32\n');
    } else {
      console.log('   ✅ Game FOUND with expected bytes32!\n');
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }
  
  console.log('🎯 CONCLUSION:');
  console.log('If game is found with expected but not calculated, we have a conversion bug.');
  console.log('If game is not found with either, the createBattleRoyale call silently failed.\n');
}

checkContract();

