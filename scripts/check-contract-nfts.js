const { ethers } = require('ethers')

async function checkContractNFTs() {
  console.log('🔍 Checking NFT deposits in contract...\n')
  
  const RPC_URL = 'https://mainnet.base.org'
const GAME_CONTRACT_ADDRESS = '0xd2a2d0A6a0a446c494EdD059680E0f819f9d480B'
const CREATOR_ADDRESS = '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628'
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    
    // Check the game contract for NFT deposits using correct ABI
    const gameContract = new ethers.Contract(
      GAME_CONTRACT_ADDRESS,
      [
        'function nftDeposits(bytes32) view returns (address depositor, address nftContract, uint256 tokenId, bool claimed, uint256 depositTime)',
        'function ethDeposits(bytes32) view returns (address depositor, uint256 amount, bool claimed, uint256 depositTime)',
        'function gameResults(bytes32) view returns (address winner, bool completed, uint256 completionTime)',
        'function isGameReady(bytes32) view returns (bool)'
      ],
      provider
    )
    
    console.log(`📊 Game contract info:`)
    console.log(`   Contract Address: ${GAME_CONTRACT_ADDRESS}`)
    console.log(`   Network: Base Mainnet`)
    
    // Check your recent game using the actual gameId from logs
    const recentGameIds = [
      'game_1755600380520_17c8607d519972b6', // From the logs you provided
    ]
    
    console.log(`\n🔍 Checking specific games for NFT deposits:`)
    
    for (const gameId of recentGameIds) {
      try {
        console.log(`\n   Checking Game: ${gameId}`)
        
        // Convert to bytes32 hash (same as server and frontend)
        const gameIdBytes32 = ethers.id(gameId)
        
        const nftDeposit = await gameContract.nftDeposits(gameIdBytes32)
        const ethDeposit = await gameContract.ethDeposits(gameIdBytes32)
        const gameResult = await gameContract.gameResults(gameIdBytes32)
        const isReady = await gameContract.isGameReady(gameIdBytes32)
        
        console.log(`     Game ID (bytes32): ${gameIdBytes32}`)
        console.log(`     NFT Depositor: ${nftDeposit.depositor}`)
        console.log(`     NFT Contract: ${nftDeposit.nftContract}`)
        console.log(`     Token ID: ${nftDeposit.tokenId}`)
        console.log(`     NFT Claimed: ${nftDeposit.claimed}`)
        console.log(`     Deposit Time: ${new Date(Number(nftDeposit.depositTime) * 1000).toISOString()}`)
        console.log(`     ETH Depositor: ${ethDeposit.depositor}`)
        console.log(`     ETH Amount: ${ethers.formatEther(ethDeposit.amount)}`)
        console.log(`     Game Ready: ${isReady}`)
        console.log(`     Game Completed: ${gameResult.completed}`)
        console.log(`     Winner: ${gameResult.winner}`)
        
      } catch (e) {
        console.log(`   Game ${gameId}: Error - ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message)
  }
}

checkContractNFTs().catch(console.error)
