const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path - adjust this to match your server setup
const databasePath = path.join(__dirname, '../server/flipz-clean.db')

console.log('🔧 Fixing deposit_deadline column issue...')
console.log('📁 Database path:', databasePath)

const db = new sqlite3.Database(databasePath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err)
    process.exit(1)
  }
  console.log('✅ Connected to database')
})

// Check if deposit_deadline column exists
db.get("PRAGMA table_info(games)", (err, rows) => {
  if (err) {
    console.error('❌ Error checking table schema:', err)
    db.close()
    return
  }
  
  db.all("PRAGMA table_info(games)", (err, columns) => {
    if (err) {
      console.error('❌ Error getting table info:', err)
      db.close()
      return
    }
    
    const hasDepositDeadline = columns.some(col => col.name === 'deposit_deadline')
    
    if (hasDepositDeadline) {
      console.log('✅ deposit_deadline column already exists')
      db.close()
      return
    }
    
    console.log('➕ Adding deposit_deadline column...')
    
    // Add the missing column
    db.run(`
      ALTER TABLE games 
      ADD COLUMN deposit_deadline TIMESTAMP
    `, (err) => {
      if (err) {
        console.error('❌ Error adding deposit_deadline column:', err)
        db.close()
        return
      }
      
      console.log('✅ Successfully added deposit_deadline column')
      
      // Verify the column was added
      db.all("PRAGMA table_info(games)", (err, columns) => {
        if (err) {
          console.error('❌ Error verifying column addition:', err)
        } else {
          const hasDepositDeadline = columns.some(col => col.name === 'deposit_deadline')
          if (hasDepositDeadline) {
            console.log('✅ Verified: deposit_deadline column is now present')
          } else {
            console.log('❌ Column was not added successfully')
          }
        }
        db.close()
      })
    })
  })
})
