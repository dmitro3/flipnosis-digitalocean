const { ethers } = require('hardhat')

async function testContractIntegration() {
  console.log('🧪 Testing Contract Integration...\n')

  try {
    // Get the deployed contract
    const NFTFlipGame = await ethers.getContractFactory('contracts/NFTFlipGame.sol:NFTFlipGame')
    const contract = await NFTFlipGame.attach('0x93277281Fd256D0601Ce86Cdb1D5c00a97b59839') // Base mainnet address
    
    console.log('✅ Contract loaded successfully')
    console.log('Contract address:', await contract.getAddress())
    
    // Test basic contract functions
    console.log('\n📋 Testing basic functions...')
    
    // Get platform fee receiver
    const feeReceiver = await contract.platformFeeReceiver()
    console.log('Platform fee receiver:', feeReceiver)
    
    // Get platform fee percentage
    const feePercentage = await contract.platformFeePercentage()
    console.log('Platform fee percentage:', feePercentage.toString(), '%')
    
    // Get listing fee
    const listingFee = await contract.listingFee()
    console.log('Listing fee:', ethers.formatEther(listingFee), 'ETH')
    
    // Get game count
    const gameCount = await contract.gameCount()
    console.log('Total games created:', gameCount.toString())
    
    // Test game creation (if we have a signer)
    const [signer] = await ethers.getSigners()
    if (signer) {
      console.log('\n🎮 Testing game creation...')
      console.log('Signer address:', await signer.getAddress())
      
      // Mock NFT contract address (you can replace with a real one)
      const mockNFTContract = '0x1234567890123456789012345678901234567890'
      const tokenId = 1
      const priceUSD = 100 // $100 in cents
      const acceptedToken = 0 // ETH
      const maxRounds = 5
      const gameType = 0 // NFT vs Crypto
      const authInfo = JSON.stringify({
        coinDesign: { name: 'Test Coin', heads: 'heads', tails: 'tails' },
        gameType: 'nft-vs-crypto',
        creator: await signer.getAddress()
      })
      
      console.log('Creating game with parameters:')
      console.log('- NFT Contract:', mockNFTContract)
      console.log('- Token ID:', tokenId)
      console.log('- Price USD:', priceUSD)
      console.log('- Game Type:', gameType === 0 ? 'NFT vs Crypto' : 'NFT vs NFT')
      console.log('- Max Rounds:', maxRounds)
      
      // Estimate gas for game creation
      const gasEstimate = await contract.createGame.estimateGas(
        mockNFTContract,
        tokenId,
        priceUSD,
        acceptedToken,
        maxRounds,
        gameType,
        authInfo
      )
      
      console.log('Estimated gas for game creation:', gasEstimate.toString())
      
      // Check if signer has enough balance
      const balance = await ethers.provider.getBalance(await signer.getAddress())
      console.log('Signer balance:', ethers.formatEther(balance), 'ETH')
      
      if (balance > ethers.parseEther('0.01')) {
        console.log('✅ Sufficient balance for testing')
        
        // Create the game
        const tx = await contract.createGame(
          mockNFTContract,
          tokenId,
          priceUSD,
          acceptedToken,
          maxRounds,
          gameType,
          authInfo,
          { value: listingFee }
        )
        
        console.log('Transaction hash:', tx.hash)
        console.log('Waiting for confirmation...')
        
        const receipt = await tx.wait()
        console.log('✅ Game created successfully!')
        console.log('Gas used:', receipt.gasUsed.toString())
        
        // Get the new game count
        const newGameCount = await contract.gameCount()
        console.log('New game count:', newGameCount.toString())
        
        // Get the created game
        const gameId = newGameCount - 1n
        const game = await contract.games(gameId)
        console.log('\n📊 Game details:')
        console.log('- Game ID:', gameId.toString())
        console.log('- Creator:', game.creator)
        console.log('- NFT Contract:', game.nftContract)
        console.log('- Token ID:', game.tokenId.toString())
        console.log('- Price USD:', game.priceUSD.toString())
        console.log('- Game Type:', game.gameType.toString())
        console.log('- Status:', game.joiner === '0x0000000000000000000000000000000000000000' ? 'Waiting' : 'Active')
        
      } else {
        console.log('❌ Insufficient balance for testing')
      }
    } else {
      console.log('❌ No signer available for testing')
    }
    
  } catch (error) {
    console.error('❌ Error testing contract integration:', error)
  }
}

// Run the test
testContractIntegration()
  .then(() => {
    console.log('\n✅ Contract integration test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }) 