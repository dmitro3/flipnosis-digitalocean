const { ethers } = require('ethers')

async function checkContractNFTs() {
  console.log('🔍 Checking NFT deposits in contract...\n')
  
  const RPC_URL = 'https://mainnet.base.org'
  const CONTRACT_ADDRESS = '0x035003062428fD92384317d7a853d8b4Dff9888a'
  const CREATOR_ADDRESS = '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28'
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    
    // Check balance of creator address
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS, 
      ['function balanceOf(address) view returns (uint256)'], 
      provider
    )
    
    const balance = await contract.balanceOf(CREATOR_ADDRESS)
    console.log(`📊 NFTs in contract for creator ${CREATOR_ADDRESS}:`)
    console.log(`   Balance: ${balance.toString()}`)
    
    // Also check total supply
    const totalSupplyContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ['function totalSupply() view returns (uint256)'],
      provider
    )
    
    const totalSupply = await totalSupplyContract.totalSupply()
    console.log(`   Total supply: ${totalSupply.toString()}`)
    
    // Check if this is the game contract or the NFT contract
    const gameContract = new ethers.Contract(
      '0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28', // This might be the game contract
      ['function balanceOf(address) view returns (uint256)'],
      provider
    )
    
    try {
      const gameBalance = await gameContract.balanceOf(CREATOR_ADDRESS)
      console.log(`   NFTs in game contract: ${gameBalance.toString()}`)
    } catch (e) {
      console.log('   Game contract check failed (might not be an NFT contract)')
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message)
  }
}

checkContractNFTs().catch(console.error)
