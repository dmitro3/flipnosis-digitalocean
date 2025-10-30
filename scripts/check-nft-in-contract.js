const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = '0xB2FC2180e003D818621F4722FFfd7878A218581D';
const NFT_CONTRACT = '0x035003062428fD92384317d7a853d8b4Dff9888a'; // From transaction log
const TOKEN_ID = '4734'; // From transaction log
const RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';

const NFT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function checkNFT() {
  console.log('\n🖼️ NFT Ownership Check');
  console.log('══════════════════════\n');
  console.log(`NFT Contract: ${NFT_CONTRACT}`);
  console.log(`Token ID: ${TOKEN_ID}`);
  console.log(`Game Contract: ${CONTRACT_ADDRESS}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const nftContract = new ethers.Contract(NFT_CONTRACT, NFT_ABI, provider);

  try {
    const owner = await nftContract.ownerOf(TOKEN_ID);
    console.log(`Current Owner: ${owner}\n`);

    if (owner.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
      console.log('✅ NFT IS in the game contract');
      console.log('🚨 This means the NFT was transferred but game creation failed');
      console.log('\n📋 Recovery Options:');
      console.log('   1. Use admin panel to withdraw NFT');
      console.log('   2. Call directTransferNFT() from contract owner wallet');
      console.log(`   3. Command: directTransferNFT("${NFT_CONTRACT}", "${TOKEN_ID}", "<creator_address>")`);
    } else {
      console.log('ℹ️  NFT is NOT in the game contract');
      console.log('   It may have already been rescued or is with the owner');
    }
  } catch (error) {
    console.error('❌ Error checking NFT ownership:', error.message);
  }
}

checkNFT();

