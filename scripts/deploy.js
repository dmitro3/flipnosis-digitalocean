const { ethers } = require('hardhat')

async function main() {
  // Base network Chainlink ETH/USD feed
  const ETH_USD_FEED = '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70'
  // Base USDC address (if needed, otherwise use address(0))
  const USDC_TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  // Your platform fee receiver
  const PLATFORM_FEE_RECEIVER = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
  
  console.log('🚀 Deploying NFTFlipGame with 5-minute deposit timeout...')
  
  const NFTFlipGame = await ethers.getContractFactory('NFTFlipGame')
  const game = await NFTFlipGame.deploy(
    ETH_USD_FEED,
    USDC_TOKEN,
    PLATFORM_FEE_RECEIVER
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