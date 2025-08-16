const { ethers } = require('hardhat')

async function main() {
  console.log('🧪 Testing payFeeAndCreateGame function...')
  
  // Contract address
  const contractAddress = "0x89Be2510F8180DC319888Ca44E2FDcBA24274c4E"
  
  try {
    // Get the contract
    const contract = await ethers.getContractAt("NFTFlipGame", contractAddress)
    console.log('✅ Contract instance created')
    
    // Test 1: Check if the function exists by getting its signature
    console.log('\n🔍 Test 1: Checking function existence...')
    try {
      // Try to get the function signature
      const functionSignature = contract.interface.getFunction('payFeeAndCreateGame')
      console.log('✅ Function exists:', functionSignature.format())
    } catch (error) {
      console.error('❌ Function does not exist:', error.message)
      return
    }
    
    // Test 2: Check if we can estimate gas (this will fail if function doesn't exist)
    console.log('\n🔍 Test 2: Testing gas estimation...')
    try {
      const gameId = ethers.id('test_game_123')
      const nftContract = "0x1234567890123456789012345678901234567890" // dummy address
      const tokenId = 1
      const priceUSD = ethers.parseUnits("100", 6) // $100 in 6 decimals
      const paymentToken = 0 // ETH
      const fee = ethers.parseEther("0.001") // small fee for testing
      
      const gasEstimate = await contract.payFeeAndCreateGame.estimateGas(
        gameId,
        nftContract,
        tokenId,
        priceUSD,
        paymentToken,
        { value: fee }
      )
      console.log('✅ Gas estimation successful:', gasEstimate.toString())
    } catch (error) {
      console.error('❌ Gas estimation failed:', error.message)
      console.error('🔍 Error details:', {
        code: error.code,
        reason: error.reason,
        data: error.data
      })
    }
    
    // Test 3: Check contract state
    console.log('\n🔍 Test 3: Checking contract state...')
    try {
      const listingFeeUSD = await contract.listingFeeUSD()
      console.log('✅ Listing fee USD:', listingFeeUSD.toString())
      
      const ethAmount = await contract.getETHAmount(listingFeeUSD)
      console.log('✅ ETH amount for fee:', ethers.formatEther(ethAmount))
    } catch (error) {
      console.error('❌ Error checking contract state:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error testing contract:', error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 