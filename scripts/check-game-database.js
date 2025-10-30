// Script to check a specific game in the database
// Usage: node scripts/check-game-database.js <gameId>

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const gameId = process.argv[2]

if (!gameId) {
  console.error('Usage: node scripts/check-game-database.js <gameId>')
  process.exit(1)
}

// Find database file
const possiblePaths = [
  path.join(__dirname, '..', 'server', 'data', 'flipnosis.db'),
  path.join(__dirname, '..', 'data', 'flipnosis.db'),
  path.join(__dirname, '..', 'flipnosis.db'),
  process.env.DATABASE_PATH
].filter(Boolean)

let dbPath = null
for (const path of possiblePaths) {
  if (fs.existsSync(path)) {
    console.log(`📂 Using database: ${path}`)
    dbPath = path
    break
  }
}

if (!dbPath) {
  console.error('❌ Database file not found. Tried:', possiblePaths)
  process.exit(1)
}

console.log(`\n🔍 Checking game: ${gameId}\n`)

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err)
    process.exit(1)
  }
})

// Wrap database calls in promises
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

async function checkGame() {
  try {
    const game = await dbGet('SELECT * FROM battle_royale_games WHERE id = ?', [gameId])
    
    if (!game) {
      console.log('❌ Game NOT found in database!')
      console.log('\n📋 Available games (last 10):')
      const recentGames = await dbAll('SELECT id, creator, status, winner_address, created_at FROM battle_royale_games ORDER BY created_at DESC LIMIT 10')
      recentGames.forEach(g => {
        console.log(`  - ${g.id} | Creator: ${g.creator} | Status: ${g.status} | Winner: ${g.winner_address || 'N/A'}`)
      })
      db.close()
      process.exit(1)
    }
    
    console.log('✅ Game found in database!\n')
    console.log('📊 Game Details:')
    console.log(JSON.stringify(game, null, 2))
    
    // Check participants
    console.log('\n👥 Participants:')
    const participants = await dbAll('SELECT * FROM battle_royale_participants WHERE game_id = ? ORDER BY slot_number', [gameId])
    if (participants.length === 0) {
      console.log('  ⚠️  No participants found!')
    } else {
      participants.forEach(p => {
        console.log(`  - Slot ${p.slot_number}: ${p.player_address} | Status: ${p.status} | Entry Paid: ${p.entry_paid}`)
      })
    }
    
    // Check critical fields for claims
    console.log('\n🔑 Critical Fields for Claims:')
    console.log(`  - id: ${game.id}`)
    console.log(`  - status: ${game.status}`)
    console.log(`  - winner: ${game.winner || 'NULL'}`)
    console.log(`  - winner_address: ${game.winner_address || 'NULL'}`)
    console.log(`  - nft_deposited: ${game.nft_deposited || 0}`)
    console.log(`  - nft_claimed: ${game.nft_claimed || 0}`)
    console.log(`  - creator_paid: ${game.creator_paid || 0}`)
    console.log(`  - completion_tx: ${game.completion_tx || 'NULL'}`)
    console.log(`  - completion_block: ${game.completion_block || 'NULL'}`)
    
    // Check if game would appear in claimables
    console.log('\n🎯 Claimables Check:')
    if (game.status === 'completed' && game.winner_address) {
      console.log(`  ✅ Would appear in winner claimables for: ${game.winner_address}`)
    } else {
      console.log(`  ❌ Would NOT appear in winner claimables`)
      if (game.status !== 'completed') {
        console.log(`     - Status is '${game.status}', needs to be 'completed'`)
      }
      if (!game.winner_address) {
        console.log(`     - winner_address is ${game.winner_address || 'NULL'}, needs to be set`)
      }
    }
    
    // Convert gameId to bytes32 for contract check
    const ethers = require('ethers')
    const gameIdBytes32 = ethers.id(gameId)
    console.log(`\n⛓️  Contract Check:`)
    console.log(`  - gameId (string): ${gameId}`)
    console.log(`  - gameId (bytes32): ${gameIdBytes32}`)
    console.log(`  - Use this bytes32 to check on BaseScan:`)
    console.log(`    https://basescan.org/address/0xa90abBDE769BC2901A8E68E6C9758B1Cd6699A5F#readContract`)
    console.log(`    Function: getBattleRoyaleGame`)
    console.log(`    Parameter: ${gameIdBytes32}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  } finally {
    db.close()
  }
}

checkGame()

