const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const DATABASE_PATH = path.join(__dirname, 'flipz.db')

console.log('🚀 Initializing database...')

// Remove existing database file if it exists
if (fs.existsSync(DATABASE_PATH)) {
  fs.unlinkSync(DATABASE_PATH)
  console.log('🗑️ Removed existing database file')
}

// Create new database
const db = new sqlite3.Database(DATABASE_PATH)

// Read schema file
const schemaPath = path.join(__dirname, '..', 'schema.sql')
const schema = fs.readFileSync(schemaPath, 'utf8')

// Split schema into individual statements
const statements = schema
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

console.log(`📝 Found ${statements.length} SQL statements to execute`)

// Execute statements sequentially
let currentIndex = 0

function executeNext() {
  if (currentIndex >= statements.length) {
    console.log('🎉 Database initialization complete!')
    db.close()
    return
  }

  const statement = statements[currentIndex]
  if (statement.trim()) {
    console.log(`📝 Executing statement ${currentIndex + 1}/${statements.length}`)
    
    db.run(statement, (err) => {
      if (err) {
        console.error(`❌ Error executing statement ${currentIndex + 1}:`, err.message)
        console.error('Statement:', statement.substring(0, 100) + '...')
        // Continue with next statement even if this one fails
      } else {
        console.log(`✅ Executed statement ${currentIndex + 1}/${statements.length}`)
      }
      
      currentIndex++
      executeNext()
    })
  } else {
    currentIndex++
    executeNext()
  }
}

// Start execution
executeNext()
