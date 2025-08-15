const { ethers } = require('hardhat')

async function main() {
  console.log('🔄 Syncing missing game from blockchain to database...')
  
  // Contract address
  const contractAddress = "0x1e87b4067Ba26cE294D157bEEC3a638541DdA0aC"
  
  // Get the contract
  const contract = await ethers.getContractAt("NFTFlipGame", contractAddress)
  
  // Get game details for game ID 1 (the missing game)
  const gameId = 1
  
  try {
    console.log(`📋 Getting details for game ${gameId}...`)
    
    const gameDetails = await contract.getGameDetails(gameId)
    console.log('✅ Game details from contract:', gameDetails)
    
    // Transform contract data to database format
    const dbGameData = {
      id: gameId.toString(),
      contract_game_id: gameId.toString(),
      creator: gameDetails[1], // creator
      joiner: gameDetails[2] === ethers.ZeroAddress ? null : gameDetails[2], // joiner
      nft_contract: gameDetails[3], // nftContract
      nft_token_id: gameDetails[4].toString(), // tokenId
      nft_name: null, // Will be filled by metadata fetch
      nft_image: null, // Will be filled by metadata fetch
      nft_collection: null, // Will be filled by metadata fetch
      price_usd: Number(gameDetails[7]) / 1000000, // priceUSD (convert from 6 decimals)
      status: getStatusFromContractState(gameDetails[5]), // state
      winner: gameDetails[10] === ethers.ZeroAddress ? null : gameDetails[10], // winner
      creator_wins: Number(gameDetails[12]), // creatorWins
      joiner_wins: Number(gameDetails[13]), // joinerWins
      current_round: Number(gameDetails[14]), // currentRound
      game_type: gameDetails[6] === 1 ? 'nft-vs-nft' : 'nft-vs-crypto', // gameType
      coin: JSON.stringify({
        type: gameDetails[17], // coinType
        headsImage: gameDetails[18], // headsImage
        tailsImage: gameDetails[19], // tailsImage
        isCustom: gameDetails[20] // isCustom
      }),
      transaction_hash: null, // Not available from contract
      nft_chain: 'base',
      listing_fee_usd: 0.2 // Default listing fee
    }
    
    console.log('📊 Database game data:', dbGameData)
    
    // Save to database via API
    const API_URL = 'https://cryptoflipz2-production.up.railway.app'
    const response = await fetch(`${API_URL}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbGameData)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Game synced to database:', result)
    } else {
      const errorText = await response.text()
      console.error('❌ Failed to sync game to database:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Error syncing game:', error)
  }
}

function getStatusFromContractState(state) {
  // Contract states: 0=Created, 1=Joined, 2=Active, 3=Completed, 4=Cancelled
  switch (Number(state)) {
    case 0: return 'waiting'
    case 1: return 'joined'
    case 2: return 'active'
    case 3: return 'completed'
    case 4: return 'cancelled'
    default: return 'waiting'
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 