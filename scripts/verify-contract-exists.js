const { ethers } = require('ethers')

async function verifyContractExists() {
  console.log('🔍 Verifying Contract Exists...\n')
  
  const RPC_URL = 'https://mainnet.base.org'
  const CONTRACT_ADDRESS = '0xd76B12D50192492ebB56bD226127eE799658fF0a'
  
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    
    // Check if the address has any code deployed
    const code = await provider.getCode(CONTRACT_ADDRESS)
    
    console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}`)
    console.log(`📊 Code length: ${code.length} characters`)
    
    if (code === '0x') {
      console.log('❌ Contract NOT deployed - No code found at this address')
      console.log('💡 This address appears to be empty or invalid')
    } else {
      console.log('✅ Contract IS deployed - Code found at this address')
      
      // Check the balance
      const balance = await provider.getBalance(CONTRACT_ADDRESS)
      console.log(`💰 ETH Balance: ${ethers.formatEther(balance)} ETH`)
      
      // Try to get transaction count
      const txCount = await provider.getTransactionCount(CONTRACT_ADDRESS)
      console.log(`📈 Transaction Count: ${txCount}`)
      
      // Try some basic function calls to see what works
      console.log('\n🔍 Testing basic contract functions...')
      
      const basicContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        [
          'function owner() view returns (address)',
          'function paused() view returns (bool)',
          'function nextGameId() view returns (uint256)',
          'function platformFeeReceiver() view returns (address)'
        ],
        provider
      )
      
      try {
        const owner = await basicContract.owner()
        console.log(`✅ Owner: ${owner}`)
      } catch (e) {
        console.log(`❌ Owner function failed: ${e.message}`)
      }
      
      try {
        const paused = await basicContract.paused()
        console.log(`✅ Paused: ${paused}`)
      } catch (e) {
        console.log(`❌ Paused function failed: ${e.message}`)
      }
      
      try {
        const nextGameId = await basicContract.nextGameId()
        console.log(`✅ Next Game ID: ${nextGameId.toString()}`)
      } catch (e) {
        console.log(`❌ Next Game ID function failed: ${e.message}`)
      }
      
      try {
        const feeReceiver = await basicContract.platformFeeReceiver()
        console.log(`✅ Platform Fee Receiver: ${feeReceiver}`)
      } catch (e) {
        console.log(`❌ Platform Fee Receiver function failed: ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message)
  }
}

verifyContractExists().catch(console.error)
