const { ethers } = require('hardhat')

async function main() {
  // Base USDC address
  const USDC_TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  // Your platform fee receiver
  const PLATFORM_FEE_RECEIVER = '0xDd6377919ef1Ad4baBBEAd667eFE3F6607558628'
  
  console.log('🚀 Deploying NFTFlipGame with early completion support...')
  
  const NFTFlipGame = await ethers.getContractFactory('NFTFlipGame')
  const game = await NFTFlipGame.deploy(
    PLATFORM_FEE_RECEIVER,
    USDC_TOKEN
  )
  
  await game.waitForDeployment()
  
  console.log('✅ NFTFlipGame deployed to:', await game.getAddress())
  console.log('📝 Update CONTRACT_ADDRESS in ContractService.js to:', await game.getAddress())
  console.log('⏰ Deposit timeout set to: 5 minutes (300 seconds)')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}) 