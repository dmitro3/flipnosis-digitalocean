const { ethers } = require('ethers')

// Database gameId found via API
const dbGameId = 'physics_1761826719974_9e6457b7defc3aa6'

// On-chain gameId from event
const onChainGameId = '0x64b166c77afec24d2c8d510ede2aa5e7d75ac45a3f4ae198497b54c7df61d98c'

console.log('🔍 Verification: Database gameId vs On-chain gameId')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')
console.log('📋 Database gameId:')
console.log(`   ${dbGameId}`)
console.log('')
console.log('🔐 Hashing database gameId (ethers.id = keccak256):')
const dbHash = ethers.id(dbGameId)
console.log(`   ${dbHash}`)
console.log('')
console.log('🔐 On-chain gameId (from event):')
console.log(`   ${onChainGameId}`)
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

if (dbHash.toLowerCase() === onChainGameId.toLowerCase()) {
  console.log('')
  console.log('✅✅✅ MATCH VERIFIED! ✅✅✅')
  console.log('')
  console.log('🎉 The database gameId correctly hashes to the on-chain gameId!')
  console.log('')
  console.log('✅ Game creation flow is working correctly')
  console.log('✅ Withdrawals will find the correct game on-chain')
  console.log('✅ NFT and funds are properly linked to this game')
} else {
  console.log('')
  console.log('❌❌❌ MISMATCH DETECTED! ❌❌❌')
  console.log('')
  console.log('⚠️  The database gameId does NOT match the on-chain gameId!')
  console.log('⚠️  This means:')
  console.log('   - Withdrawals will FAIL')
  console.log('   - Game completion will FAIL')
  console.log('   - The NFT is locked in the contract with wrong gameId')
  console.log('')
  console.log('🔧 Possible causes:')
  console.log('   1. Different gameId used when creating on-chain vs database')
  console.log('   2. Frontend used a different gameId string')
  console.log('   3. Hash function mismatch (unlikely)')
}

console.log('')

