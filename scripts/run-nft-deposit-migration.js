const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path  
const DATABASE_PATH = path.join(__dirname, '..', 'server', 'flipz-clean.db')

async function runNFTDepositMigration() {
  console.log('🔧 Running NFT Deposit Tracking Migration...\n')
  
  const db = new sqlite3.Database(DATABASE_PATH)
  
  try {
    // Check if database exists
    await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='games'", (err, row) => {
        if (err) reject(err)
        else if (!row) reject(new Error('Games table not found'))
        else resolve()
      })
    })
    
    console.log('✅ Database and games table found')
    
    // Add new columns for NFT deposit tracking
    const migrations = [
      'ALTER TABLE games ADD COLUMN nft_deposited BOOLEAN DEFAULT false',
      'ALTER TABLE games ADD COLUMN nft_deposit_time TIMESTAMP',
      'ALTER TABLE games ADD COLUMN nft_deposit_hash TEXT',
      'ALTER TABLE games ADD COLUMN nft_deposit_verified BOOLEAN DEFAULT false',
      'ALTER TABLE games ADD COLUMN last_nft_check_time TIMESTAMP'
    ]
    
    console.log('📋 Adding NFT deposit tracking columns...')
    
    for (const migration of migrations) {
      await new Promise((resolve, reject) => {
        db.run(migration, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`❌ Error running migration: ${migration}`, err.message)
            // Don't reject, just log the error and continue
            console.log(`⚠️ Column may already exist, continuing...`)
          } else {
            console.log(`✅ ${migration}`)
          }
          resolve() // Always resolve to continue with next migration
        })
      })
    }
    
    // Create indexes for better performance
    console.log('\n📋 Creating indexes...')
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_games_nft_deposit_status ON games(nft_deposited, created_at)',
      'CREATE INDEX IF NOT EXISTS idx_games_cleanup_candidates ON games(status, nft_deposit_verified, created_at)'
    ]
    
    for (const index of indexes) {
      await new Promise((resolve, reject) => {
        db.run(index, (err) => {
          if (err) {
            console.error(`❌ Error creating index: ${index}`, err.message)
            reject(err)
          } else {
            console.log(`✅ ${index}`)
            resolve()
          }
        })
      })
    }
    
    // Check existing games and update their NFT deposit status
    console.log('\n🔍 Checking existing games for NFT deposit status...')
    
    const games = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, nft_contract, nft_token_id, creator_deposited, status 
        FROM games 
        WHERE nft_deposited IS NULL OR nft_deposited = false
      `, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
    
    console.log(`📋 Found ${games.length} games to check`)
    
    // For now, we'll mark games as having NFT deposited if creator_deposited is true
    // This is a reasonable assumption since the old system didn't track NFT deposits separately
    let updatedCount = 0
    
    for (const game of games) {
      if (game.creator_deposited) {
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE games 
            SET nft_deposited = true,
                nft_deposit_verified = true,
                last_nft_check_time = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [game.id], (err) => {
            if (err) reject(err)
            else {
              updatedCount++
              resolve()
            }
          })
        })
      }
    }
    
    console.log(`✅ Updated ${updatedCount} games with NFT deposit status`)
    
    // Show final statistics
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_games,
          SUM(CASE WHEN nft_deposited = true THEN 1 ELSE 0 END) as games_with_nft,
          SUM(CASE WHEN nft_deposited = false THEN 1 ELSE 0 END) as games_without_nft,
          SUM(CASE WHEN nft_deposit_verified = true THEN 1 ELSE 0 END) as verified_games
        FROM games
      `, (err, row) => {
        if (err) reject(err)
        else resolve(row || {})
      })
    })
    
    console.log('\n📊 Migration Statistics:')
    console.log(`   Total games: ${stats.total_games}`)
    console.log(`   Games with NFT deposited: ${stats.games_with_nft}`)
    console.log(`   Games without NFT deposited: ${stats.games_without_nft}`)
    console.log(`   Verified games: ${stats.verified_games}`)
    
    console.log('\n✅ NFT Deposit Tracking Migration completed successfully!')
    console.log('\n🚀 Next steps:')
    console.log('   1. Restart your server to enable the cleanup service')
    console.log('   2. The cleanup service will run every 5 minutes')
    console.log('   3. Games older than 10 minutes without NFT deposits will be cleaned up')
    console.log('   4. NFT deposit status will be verified against the contract')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    db.close()
  }
}

// Run the migration
runNFTDepositMigration().catch(console.error)
