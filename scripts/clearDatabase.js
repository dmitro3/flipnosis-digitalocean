const API_URL = 'https://cryptoflipz2-production.up.railway.app'

async function clearDatabase() {
  console.log('🗑️ Clearing all games from database...')
  
  try {
    // First, get all games to see what we're deleting
    const response = await fetch(`${API_URL}/api/games`)
    if (response.ok) {
      const games = await response.json()
      console.log(`📊 Found ${games.length} games to delete`)
      
      if (games.length === 0) {
        console.log('✅ Database is already empty')
        return
      }
      
      // Delete all games
      const deleteResponse = await fetch(`${API_URL}/api/admin/games`, {
        method: 'DELETE'
      })
      
      if (deleteResponse.ok) {
        console.log('✅ All games deleted from database')
      } else {
        const errorText = await deleteResponse.text()
        console.error('❌ Failed to delete games:', errorText)
      }
    } else {
      console.error('❌ Failed to fetch games:', response.status)
    }
  } catch (error) {
    console.error('❌ Error clearing database:', error)
  }
}

clearDatabase()
  .then(() => {
    console.log('🎉 Database cleared successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed to clear database:', error)
    process.exit(1)
  }) 