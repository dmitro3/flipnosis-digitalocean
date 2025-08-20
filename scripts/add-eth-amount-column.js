const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const dbPath = '/opt/flipnosis/app/server/flipz.db'

console.log('🔧 Adding eth_amount column to games table...')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message)
    process.exit(1)
  }
  console.log('✅ Connected to database')
})

// Add eth_amount column to games table
db.run(`
  ALTER TABLE games 
  ADD COLUMN eth_amount TEXT
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️ eth_amount column already exists')
    } else {
      console.error('❌ Error adding eth_amount column:', err.message)
    }
  } else {
    console.log('✅ Added eth_amount column to games table')
  }
  
  // Close database
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message)
    } else {
      console.log('✅ Database connection closed')
    }
  })
}) 