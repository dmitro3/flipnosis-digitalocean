#!/usr/bin/env node

/**
 * Fix script to create the missing coin_unlock_transactions table
 * Run this on your server to fix the coin unlock issue
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path - adjust if needed
const DATABASE_PATH = path.join(__dirname, 'server', 'flipz.db')

console.log('🔧 Fixing coin unlock table issue...')
console.log('📁 Database path:', DATABASE_PATH)

const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err)
    process.exit(1)
  }
  console.log('✅ Connected to database')
})

// Check if table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='coin_unlock_transactions'", (err, result) => {
  if (err) {
    console.error('❌ Error checking table:', err)
    process.exit(1)
  }
  
  if (result) {
    console.log('✅ coin_unlock_transactions table already exists')
    process.exit(0)
  }
  
  console.log('⚠️ Table not found, creating it...')
  
  // Create the table
  db.run(`
    CREATE TABLE coin_unlock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_address TEXT NOT NULL,
      coin_id TEXT NOT NULL,
      flip_cost INTEGER NOT NULL,
      flip_balance_before INTEGER NOT NULL,
      flip_balance_after INTEGER NOT NULL,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating table:', err)
      process.exit(1)
    }
    console.log('✅ Created coin_unlock_transactions table')
    
    // Create index
    db.run(`
      CREATE INDEX idx_coin_unlock_transactions_player 
      ON coin_unlock_transactions(player_address)
    `, (err) => {
      if (err) {
        console.error('❌ Error creating index:', err)
      } else {
        console.log('✅ Created index for coin_unlock_transactions')
      }
      
      console.log('🎉 Fix complete! Coin unlock should now work.')
      process.exit(0)
    })
  })
})
