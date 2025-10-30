const { ethers } = require('ethers')

// On-chain gameId from the event log
const onChainGameIdBytes32 = '0x64b166c77afec24d2c8d510ede2aa5e7d75ac45a3f4ae198497b54c7df61d98c'

// From the transaction timestamp (Oct-30-2025 12:19:03 PM +UTC)
// And the game creation flow generates: physics_${Date.now()}_${random}
// Let's simulate what the gameId could be

// The transaction was at: Oct-30-2025 12:19:03 PM UTC
// That's approximately: 1730288343000 milliseconds since epoch
// But let's check a range around that time

console.log('🔍 On-chain gameId (bytes32):', onChainGameIdBytes32)
console.log('')
console.log('📊 Testing gameId formats:')
console.log('')

// Test the format: physics_${timestamp}_${hex}
// We need to find the timestamp that matches
// Since we know it was created around Oct-30-2025 12:19:03 PM UTC

// Let's query what format ethers.id uses - it's keccak256(utf8String)
// Same as what viem/ethers uses

// We need to reverse-engineer or query the database to find the actual gameId
// But we can verify the hash function works correctly

const testGameId = 'physics_1730288343000_abc123def456'
const hash = ethers.id(testGameId)
console.log(`Test gameId: ${testGameId}`)
console.log(`Hashed:     ${hash}`)
console.log(`Match:      ${hash.toLowerCase() === onChainGameIdBytes32.toLowerCase() ? '✅ YES' : '❌ NO'}`)
console.log('')
console.log('⚠️  To find the exact gameId, we need to query the database.')
console.log('    The format should be: physics_${timestamp}_${8-byte-hex}')
console.log('    We can search games created around Oct 30, 2025 12:19 UTC')

