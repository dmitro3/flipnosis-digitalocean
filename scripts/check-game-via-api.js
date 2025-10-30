// Script to check game via API endpoint
// Usage: node scripts/check-game-via-api.js <gameId> [apiUrl]

const https = require('https')
const http = require('http')

const gameId = process.argv[2]
const apiUrl = process.argv[3] || 'https://flipnosis.fun'

if (!gameId) {
  console.error('Usage: node scripts/check-game-via-api.js <gameId> [apiUrl]')
  console.error('Example: node scripts/check-game-via-api.js physics_1761851325102_dc540dbab2d48bf8 https://flipnosis.fun')
  process.exit(1)
}

// Simple fetch function for Node.js
function fetch(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Diagnostic Script'
      }
    }
    
    const req = client.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(json)
          })
        } catch (e) {
          resolve({
            ok: false,
            status: res.statusCode,
            json: () => Promise.resolve({ error: 'Failed to parse JSON', raw: data })
          })
        }
      })
    })
    
    req.on('error', reject)
    req.end()
  })
}

async function checkGame() {
  try {
    console.log(`\n🔍 Checking game: ${gameId}`)
    console.log(`🌐 API URL: ${apiUrl}\n`)
    
    // Try the comprehensive debug endpoint first
    const url = `${apiUrl}/api/debug/comprehensive/${gameId}`
    console.log(`📡 Fetching: ${url}\n`)
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ API Error:', data)
      // Try simpler endpoint
      console.log('\n🔄 Trying simpler debug endpoint...\n')
      const simpleUrl = `${apiUrl}/api/debug/game/${gameId}`
      const simpleResponse = await fetch(simpleUrl)
      const simpleData = await simpleResponse.json()
      
      console.log('📊 Debug Results:')
      console.log(JSON.stringify(simpleData, null, 2))
      return
    }
    
    console.log('📊 Comprehensive Debug Results:\n')
    
    // Database check
    console.log('🗄️  DATABASE:')
    if (data.database.found) {
      console.log('  ✅ Game found in database')
      console.log(`     - ID: ${data.database.game.id}`)
      console.log(`     - Creator: ${data.database.game.creator}`)
      console.log(`     - Status: ${data.database.game.status}`)
      console.log(`     - Winner: ${data.database.game.winner || 'NULL'}`)
      console.log(`     - NFT Deposited: ${data.database.game.nft_deposited || 0}`)
      console.log(`     - NFT Claimed: ${data.database.game.nft_claimed || 0}`)
      
      // Check if it would appear in claimables
      if (data.database.game.status === 'completed' && data.database.game.winner) {
        console.log(`  ✅ Would appear in winner claimables`)
      } else {
        console.log(`  ❌ Would NOT appear in winner claimables`)
      }
    } else {
      console.log('  ❌ Game NOT found in database')
    }
    
    // Conversion
    console.log('\n🔄 CONVERSION:')
    console.log(`  - Original: ${data.conversion.original}`)
    console.log(`  - Bytes32: ${data.conversion.bytes32}`)
    
    // Blockchain check
    console.log('\n⛓️  BLOCKCHAIN:')
    if (data.blockchain.directReadSucceeded) {
      if (data.blockchain.exists) {
        console.log('  ✅ Game found on-chain')
        console.log(`  - Creator: ${data.blockchain.game.creator}`)
        console.log(`  - Winner: ${data.blockchain.game.winner}`)
        console.log(`  - Completed: ${data.blockchain.game.completed}`)
        console.log(`  - NFT Claimed: ${data.blockchain.game.nftClaimed}`)
      } else {
        console.log('  ❌ Game exists but creator is zero address (not initialized)')
      }
    } else {
      console.log('  ❌ Failed to read from blockchain')
      console.log(`     Error: ${data.blockchain.error}`)
    }
    
    // Blockchain Service check
    if (data.blockchainService) {
      console.log('\n🔧 BLOCKCHAIN SERVICE:')
      if (data.blockchainService.methodSucceeded) {
        console.log('  ✅ Service method succeeded')
      } else {
        console.log('  ❌ Service method failed')
        console.log(`     Error: ${data.blockchainService.error}`)
      }
    }
    
    // Full JSON for detailed inspection
    console.log('\n📄 Full Diagnostic Data:')
    console.log(JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

checkGame()

