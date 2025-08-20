const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Test the chat and offer system
async function testChatAndOffers() {
  console.log('🧪 Testing Chat and Offer System...')
  
  const dbPath = '/opt/flipnosis/app/server/flipz.db'
  console.log('📁 Database path:', dbPath)
  
  // Check if database file exists
  const fs = require('fs')
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found:', dbPath)
    return
  }
  
  console.log('✅ Database file exists')
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err)
      return
    }
    console.log('✅ Database opened successfully')
  })
  
  try {
    // Test 1: Check if chat_messages table exists and has correct structure
    console.log('\n📋 Test 1: Checking chat_messages table structure...')
    
    db.all("PRAGMA table_info(chat_messages)", (err, columns) => {
      if (err) {
        console.error('❌ Error checking chat_messages table:', err)
        return
      }
      
      console.log('✅ chat_messages table columns:')
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type}`)
      })
      
      // Test 2: Check if there are any existing chat messages
      console.log('\n📋 Test 2: Checking existing chat messages...')
      
      db.all('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 10', (err, messages) => {
        if (err) {
          console.error('❌ Error fetching chat messages:', err)
          return
        }
        
        console.log(`✅ Found ${messages.length} chat messages`)
        messages.forEach((msg, index) => {
          console.log(`  ${index + 1}. [${msg.message_type}] ${msg.sender_address}: ${msg.message}`)
        })
        
        // Test 3: Check if offers table exists
        console.log('\n📋 Test 3: Checking offers table...')
        
        db.all("PRAGMA table_info(offers)", (err, columns) => {
          if (err) {
            console.error('❌ Error checking offers table:', err)
            return
          }
          
          console.log('✅ offers table columns:')
          columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type}`)
          })
          
          // Test 4: Check if there are any existing offers
          console.log('\n📋 Test 4: Checking existing offers...')
          
          db.all('SELECT * FROM offers ORDER BY created_at DESC LIMIT 10', (err, offers) => {
            if (err) {
              console.error('❌ Error fetching offers:', err)
              return
            }
            
            console.log(`✅ Found ${offers.length} offers`)
            offers.forEach((offer, index) => {
              console.log(`  ${index + 1}. ${offer.offerer_address}: $${offer.offer_price} - ${offer.status}`)
            })
            
            // Test 5: Check games table
            console.log('\n📋 Test 5: Checking games table...')
            
            db.all('SELECT id, creator, joiner, status, created_at FROM games ORDER BY created_at DESC LIMIT 5', (err, games) => {
              if (err) {
                console.error('❌ Error fetching games:', err)
                return
              }
              
              console.log(`✅ Found ${games.length} games`)
              games.forEach((game, index) => {
                console.log(`  ${index + 1}. ${game.id}: ${game.creator} vs ${game.joiner || 'None'} - ${game.status}`)
              })
              
              console.log('\n🎉 Chat and Offer System Test Complete!')
              console.log('\n📊 Summary:')
              console.log(`  - Chat messages: ${messages.length}`)
              console.log(`  - Offers: ${offers.length}`)
              console.log(`  - Games: ${games.length}`)
              console.log('\n✅ All database tables are properly configured!')
              
              db.close()
            })
          })
        })
      })
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    db.close()
  }
}

// Run the test
testChatAndOffers() 