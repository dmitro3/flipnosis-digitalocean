const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const dbPath = path.join(__dirname, '../server/flipz-clean.db')

console.log('🔧 Starting creator_address schema fix...')
console.log('📁 Database path:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message)
    process.exit(1)
  }
  console.log('✅ Connected to database')
})

// Run migrations
const runMigrations = async () => {
  try {
    console.log('\n📋 Running migrations...')
    
    // 1. Add creator_address column to games table if it doesn't exist
    console.log('1️⃣ Adding creator_address column to games table...')
    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE games ADD COLUMN creator_address TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err)
        } else {
          console.log('✅ creator_address column added to games table (or already exists)')
          resolve()
        }
      })
    })
    
    // 2. Copy creator to creator_address where it's null in games
    console.log('2️⃣ Copying creator to creator_address in games table...')
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE games SET creator_address = creator WHERE creator_address IS NULL
      `, function(err) {
        if (err) {
          reject(err)
        } else {
          console.log(`✅ Updated ${this.changes} rows in games table`)
          resolve()
        }
      })
    })
    
    // 3. Add creator_address column to listings table if it doesn't exist
    console.log('3️⃣ Adding creator_address column to listings table...')
    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE listings ADD COLUMN creator_address TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err)
        } else {
          console.log('✅ creator_address column added to listings table (or already exists)')
          resolve()
        }
      })
    })
    
    // 4. Copy creator to creator_address where it's null in listings
    console.log('4️⃣ Copying creator to creator_address in listings table...')
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE listings SET creator_address = creator WHERE creator_address IS NULL
      `, function(err) {
        if (err) {
          reject(err)
        } else {
          console.log(`✅ Updated ${this.changes} rows in listings table`)
          resolve()
        }
      })
    })
    
    // 5. Verify the changes
    console.log('\n🔍 Verifying changes...')
    
    // Check games table
    await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as total, 
               COUNT(creator_address) as with_creator_address,
               COUNT(creator) as with_creator
        FROM games
      `, (err, row) => {
        if (err) {
          reject(err)
        } else {
          console.log('📊 Games table stats:')
          console.log(`   Total rows: ${row.total}`)
          console.log(`   With creator: ${row.with_creator}`)
          console.log(`   With creator_address: ${row.with_creator_address}`)
          resolve()
        }
      })
    })
    
    // Check listings table
    await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as total, 
               COUNT(creator_address) as with_creator_address,
               COUNT(creator) as with_creator
        FROM listings
      `, (err, row) => {
        if (err) {
          reject(err)
        } else {
          console.log('📊 Listings table stats:')
          console.log(`   Total rows: ${row.total}`)
          console.log(`   With creator: ${row.with_creator}`)
          console.log(`   With creator_address: ${row.with_creator_address}`)
          resolve()
        }
      })
    })
    
    console.log('\n✅ All migrations completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message)
      } else {
        console.log('🔒 Database connection closed')
      }
    })
  }
}

// Run the migrations
runMigrations()
