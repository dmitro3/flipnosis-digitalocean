const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const DATABASE_PATH = '/opt/flipnosis/app/server/flipz.db'

console.log('🔧 Fixing missing chat_messages table...')
console.log('📊 Database path:', DATABASE_PATH)

const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err)
    process.exit(1)
  }
  console.log('✅ Connected to database')
})

// Check if chat_messages table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_messages'", (err, result) => {
  if (err) {
    console.error('❌ Error checking chat_messages table:', err)
    process.exit(1)
  }
  
  if (result) {
    console.log('✅ chat_messages table already exists')
    process.exit(0)
  }
  
  console.log('⚠️ chat_messages table not found, creating it...')
  
  // Create chat_messages table
  const createTableSQL = `
    CREATE TABLE chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      sender_address TEXT NOT NULL,
      message TEXT NOT NULL,
      message_type TEXT DEFAULT 'chat',
      message_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating chat_messages table:', err)
      process.exit(1)
    }
    
    console.log('✅ chat_messages table created successfully')
    
    // Create index
    const createIndexSQL = `
      CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id)
    `
    
    db.run(createIndexSQL, (err) => {
      if (err) {
        console.error('❌ Error creating index:', err)
      } else {
        console.log('✅ Index created successfully')
      }
      
      // Verify table was created
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_messages'", (err, result) => {
        if (err) {
          console.error('❌ Error verifying table creation:', err)
        } else if (result) {
          console.log('✅ chat_messages table verified')
        } else {
          console.error('❌ Table creation verification failed')
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err)
          } else {
            console.log('✅ Database connection closed')
          }
          process.exit(0)
        })
      })
    })
  })
})
