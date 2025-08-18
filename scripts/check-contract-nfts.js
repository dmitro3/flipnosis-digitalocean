const { ethers } = require('ethers')

async function checkContractNFTs() {
  console.log('🔍 Checking NFT deposits in contract...\n')
  
  const RPC_URL = 'https://mainnet.base.org'
const GAME_CONTRACT_ADDRESS = '0x6cB1E31F2A3df57A7265ED2eE26dcF8D02CE1B69'
const CREATOR_ADDRESS = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    
    // Check the game contract for NFT deposits
    const gameContract = new ethers.Contract(
      GAME_CONTRACT_ADDRESS,
      [
        'function getGameNFT(uint256 gameId) view returns (address nftContract, uint256 tokenId, address owner)',
        'function getGame(uint256 gameId) view returns (tuple(address creator, address challenger, uint256 creatorDeposit, uint256 challengerDeposit, bool creatorDeposited, bool challengerDeposited, uint256 gameStartTime, uint256 gameEndTime, bool gameEnded, address winner))',
        'function nextGameId() view returns (uint256)'
      ],
      provider
    )
    
    // Get the next game ID to see how many games exist
    const nextGameId = await gameContract.nextGameId()
    console.log(`📊 Game contract info:`)
    console.log(`   Next Game ID: ${nextGameId.toString()}`)
    console.log(`   Total games created: ${nextGameId.toString() - 1}`)
    
    // Check a few recent games to see if they have NFTs deposited
    const gamesToCheck = Math.min(5, nextGameId.toString() - 1)
    console.log(`\n🔍 Checking last ${gamesToCheck} games for NFT deposits:`)
    
    for (let i = 1; i <= gamesToCheck; i++) {
      try {
        const gameId = nextGameId.toString() - i
        const gameData = await gameContract.getGame(gameId)
        const nftData = await gameContract.getGameNFT(gameId)
        
        console.log(`   Game ${gameId}:`)
        console.log(`     Creator: ${gameData.creator}`)
        console.log(`     Creator Deposited: ${gameData.creatorDeposited}`)
        console.log(`     NFT Contract: ${nftData.nftContract}`)
        console.log(`     Token ID: ${nftData.tokenId}`)
        console.log(`     NFT Owner: ${nftData.owner}`)
      } catch (e) {
        console.log(`   Game ${nextGameId.toString() - i}: Error - ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message)
  }
}

checkContractNFTs().catch(console.error)
