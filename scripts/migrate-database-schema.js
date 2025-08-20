const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path - adjust this to match your server setup
const databasePath = '/opt/flipnosis/app/server/flipz.db'

console.log('🔧 Running database schema migration...')
console.log('📁 Database path:', databasePath)

const db = new sqlite3.Database(databasePath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err)
    process.exit(1)
  }
  console.log('✅ Connected to database')
})

// Define required columns for each table
const requiredColumns = {
  games: [
    'id',
    'listing_id', 
    'offer_id',
    'blockchain_game_id',
    'creator',
    'challenger',
    'nft_contract',
    'nft_token_id',
    'nft_name',
    'nft_image',
    'nft_collection',
    'final_price',
    'coin_data',
    'status',
    'creator_deposited',
    'challenger_deposited',
    'deposit_deadline',
    'winner',
    'game_data',
    'created_at',
    'updated_at'
  ],
  listings: [
    'id',
    'game_id',
    'creator',
    'nft_contract',
    'nft_token_id',
    'nft_name',
    'nft_image',
    'nft_collection',
    'nft_chain',
    'asking_price',
    'status',
    'coin_data',
    'listing_fee_paid',
    'created_at',
    'updated_at'
  ],
  offers: [
    'id',
    'listing_id',
    'offerer_address',
    'offer_price',
    'message',
    'status',
    'created_at',
    'updated_at'
  ],
  game_rounds: [
    'id',
    'game_id',
    'round_number',
    'creator_choice',
    'challenger_choice',
    'flip_result',
    'round_winner',
    'created_at'
  ],
  chat_messages: [
    'id',
    'room_id',
    'sender_address',
    'message',
    'message_type',
    'message_data',
    'created_at'
  ]
}

async function migrateTable(tableName, requiredCols) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 Checking table: ${tableName}`)
    
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        console.error(`❌ Error getting table info for ${tableName}:`, err)
        reject(err)
        return
      }
      
      const existingColumns = columns.map(col => col.name)
      const missingColumns = requiredCols.filter(col => !existingColumns.includes(col))
      
      if (missingColumns.length === 0) {
        console.log(`✅ ${tableName} table is up to date`)
        resolve()
        return
      }
      
      console.log(`➕ Missing columns in ${tableName}:`, missingColumns)
      
      // Add missing columns one by one
      let completed = 0
      missingColumns.forEach(columnName => {
        let columnType = 'TEXT' // Default type
        
        // Determine column type based on name
        if (columnName.includes('_at') || columnName === 'deposit_deadline') {
          columnType = 'TIMESTAMP'
        } else if (columnName.includes('_price') || columnName.includes('_fee')) {
          columnType = 'REAL'
        } else if (columnName.includes('_deposited') || columnName.includes('_paid')) {
          columnType = 'BOOLEAN'
        } else if (columnName === 'id' || columnName.includes('_number')) {
          columnType = 'INTEGER'
        }
        
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`, (err) => {
          if (err) {
            console.error(`❌ Error adding column ${columnName} to ${tableName}:`, err)
          } else {
            console.log(`✅ Added column ${columnName} to ${tableName}`)
          }
          
          completed++
          if (completed === missingColumns.length) {
            console.log(`✅ Completed migration for ${tableName}`)
            resolve()
          }
        })
      })
    })
  })
}

async function runMigration() {
  try {
    for (const [tableName, columns] of Object.entries(requiredColumns)) {
      await migrateTable(tableName, columns)
    }
    
    console.log('\n🎉 Database migration completed successfully!')
    
    // Verify all tables exist and have required columns
    console.log('\n🔍 Final verification:')
    for (const [tableName, columns] of Object.entries(requiredColumns)) {
      db.all(`PRAGMA table_info(${tableName})`, (err, tableColumns) => {
        if (err) {
          console.error(`❌ Error verifying ${tableName}:`, err)
        } else {
          const existingColumns = tableColumns.map(col => col.name)
          const missingColumns = columns.filter(col => !existingColumns.includes(col))
          
          if (missingColumns.length === 0) {
            console.log(`✅ ${tableName}: All columns present`)
          } else {
            console.log(`❌ ${tableName}: Missing columns:`, missingColumns)
          }
        }
      })
    }
    
    setTimeout(() => {
      db.close()
      console.log('\n🔒 Database connection closed')
    }, 2000)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    db.close()
    process.exit(1)
  }
}

runMigration()
