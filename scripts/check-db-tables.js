const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz-clean.db')

const db = new sqlite3.Database(DATABASE_PATH)

console.log('📋 Checking database tables...')

db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
  if (err) {
    console.error('❌ Database error:', err.message)
  } else {
    console.log('✅ Tables found:', tables.map(t => t.name))
    
    // Check if games table exists and get recent games
    if (tables.some(t => t.name === 'games')) {
      console.log('\n🎮 Checking games table structure...')
      db.all('PRAGMA table_info(games)', (err, columns) => {
        if (err) {
          console.error('❌ Error getting table info:', err.message)
        } else {
          console.log('Games table columns:')
          columns.forEach(col => {
            console.log(`  ${col.name}: ${col.type}`)
          })
        }
        
        console.log('\n🎮 Checking recent games...')
        db.all('SELECT id, blockchain_game_id, status, created_at FROM games ORDER BY created_at DESC LIMIT 5', (err, games) => {
          if (err) {
            console.error('❌ Error checking games:', err.message)
          } else {
            console.log(`Found ${games.length} recent games:`)
            games.forEach(game => {
              console.log(`  ${game.id}: ${game.blockchain_game_id || 'no-blockchain-id'} - Status: ${game.status} - Created: ${game.created_at}`)
            })
          }
          db.close()
        })
      })
    } else {
      console.log('❌ No games table found')
      db.close()
    }
  }
})
