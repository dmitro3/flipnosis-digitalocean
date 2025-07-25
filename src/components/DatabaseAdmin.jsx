import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { theme } from '../styles/theme'
import { Button } from '../styles/components'

const DatabaseAdmin = () => {
  const [games, setGames] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [activeView, setActiveView] = useState('all')
  const { address } = useWallet()
  const { showSuccess, showError } = useToast()
  
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'
  
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/admin/games`)
      if (response.ok) {
        const data = await response.json()
        setGames(data.games || [])
        setListings(data.listings || [])
      } else {
        throw new Error('Failed to fetch admin data')
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      showError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }
  
  const deleteGame = async (gameId) => {
    if (!confirm('Delete this game?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/admin/games/${gameId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        showSuccess('Game deleted!')
        fetchGames()
      } else {
        throw new Error('Failed to delete game')
      }
    } catch (error) {
      showError('Error: ' + error.message)
    }
  }
  
  const clearAllGames = async () => {
    if (!confirm('DELETE ALL GAMES? This cannot be undone!')) return
    
    try {
      const response = await fetch(`${API_URL}/api/admin/games`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        showSuccess('All games deleted!')
        fetchGames()
      } else {
        throw new Error('Failed to clear games')
      }
    } catch (error) {
      showError('Error: ' + error.message)
    }
  }
  
  const resetGameStatus = async (gameId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          joiner: newStatus === 'waiting' ? null : undefined // Clear joiner if resetting to waiting
        })
      })
      
      if (response.ok) {
        showSuccess(`Game status updated to ${newStatus}`)
        fetchGames()
      } else {
        throw new Error('Failed to update game')
      }
    } catch (error) {
      showError('Error: ' + error.message)
    }
  }
  
  const getMyData = async () => {
    if (!address) return
    
    try {
      // Get user's games
      const gamesResponse = await fetch(`${API_URL}/api/users/${address}/games`)
      const listingsResponse = await fetch(`${API_URL}/api/users/${address}/listings`)
      
      if (gamesResponse.ok && listingsResponse.ok) {
        const myGames = await gamesResponse.json()
        const myListings = await listingsResponse.json()
        setGames(myGames)
        setListings(myListings)
      }
    } catch (error) {
      showError('Failed to load your data')
    }
  }
  
  useEffect(() => {
    if (showAdmin) {
      fetchData()
    }
  }, [showAdmin])
  
  const formatAddress = (addr) => {
    if (!addr) return 'None'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return theme.colors.statusWarning
      case 'joined': return theme.colors.neonBlue  
      case 'active': return theme.colors.statusSuccess
      case 'completed': return theme.colors.neonPurple
      case 'cancelled': return theme.colors.statusError
      default: return theme.colors.textSecondary
    }
  }
  
  if (!showAdmin) {
    return (
      <Button 
        onClick={() => setShowAdmin(true)}
        style={{ 
          background: '#ff4444',
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 1000,
          fontSize: '0.875rem'
        }}
      >
        🔧 Admin
      </Button>
    )
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 2000,
      padding: '2rem',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'rgba(255, 0, 0, 0.1)',
        padding: '2rem',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 0, 0, 0.3)',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#ff4444', margin: 0 }}>🔧 Database Admin Panel</h2>
          <Button 
            onClick={() => setShowAdmin(false)}
            style={{ background: '#666', fontSize: '1rem' }}
          >
            ✕ Close
          </Button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Button 
            onClick={fetchData} 
            disabled={loading}
            style={{ background: '#0088ff' }}
          >
            🔄 {loading ? 'Loading...' : 'Refresh All'}
          </Button>
          
          <Button 
            onClick={getMyData}
            disabled={!address}
            style={{ background: '#00cc00' }}
          >
            👤 My Data Only
          </Button>
          
          <Button 
            onClick={clearAllGames} 
            style={{ background: '#ff4444' }}
          >
            🗑️ Clear All Games
          </Button>
          
          <Button 
            onClick={async () => {
              try {
                const response = await fetch(`${API_URL}/api/admin/listings`, { method: 'DELETE' })
                if (response.ok) {
                  showSuccess('All listings cleared!')
                  fetchData()
                } else {
                  showError('Failed to clear listings')
                }
              } catch (error) {
                showError('Error: ' + error.message)
              }
            }}
            style={{ background: '#ff6600' }}
          >
            🗑️ Clear All Listings
          </Button>
          
          <Button 
            onClick={async () => {
              try {
                const response = await fetch(`${API_URL}/api/debug/init`, { method: 'POST' })
                const result = await response.json()
                if (result.success) {
                  showSuccess('Database reinitialized!')
                  fetchData()
                } else {
                  showError('Failed to reinitialize database')
                }
              } catch (error) {
                showError('Error: ' + error.message)
              }
            }}
            style={{ background: '#ff8800' }}
          >
            🔄 Reinit DB
          </Button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <Button 
            onClick={() => setActiveView('all')}
            style={{ background: activeView === 'all' ? '#00FF41' : '#666' }}
          >
            📊 All Data
          </Button>
          <Button 
            onClick={() => setActiveView('listings')}
            style={{ background: activeView === 'listings' ? '#00FF41' : '#666' }}
          >
            📦 Listings ({listings.length})
          </Button>
          <Button 
            onClick={() => setActiveView('games')}
            style={{ background: activeView === 'games' ? '#00FF41' : '#666' }}
          >
            🎮 Games ({games.length})
          </Button>
        </div>
        
        {loading ? (
          <p style={{ color: 'white' }}>Loading...</p>
        ) : (
          <div>
            {activeView === 'all' && (
              <>
                <h3 style={{ color: 'white', marginBottom: '1rem' }}>
                  All Database Items (Listings: {listings.length}, Games: {games.length})
                </h3>
                
                <div style={{ 
                  maxHeight: '60vh', 
                  overflowY: 'auto',
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {[...listings.map(l => ({...l, type: 'listing'})), ...games.map(g => ({...g, type: 'game'}))].length === 0 ? (
                    <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '2rem' }}>
                      No data found in database
                    </p>
                  ) : (
                    [...listings.map(l => ({...l, type: 'listing'})), ...games.map(g => ({...g, type: 'game'}))].map(item => (
                      <div key={`${item.type}-${item.id}`} style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${item.type === 'listing' ? '#FFD700' : getStatusColor(item.status)}`,
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>
                              {item.type === 'listing' ? '📦 Listing' : '🎮 Game'} #{item.id}
                            </div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              Status: <span style={{ color: getStatusColor(item.status) }}>{item.status}</span>
                            </div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              Created: {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>Players</div>
                            <div style={{ color: theme.colors.neonPink }}>
                              Creator: {formatAddress(item.creator)}
                            </div>
                            <div style={{ color: theme.colors.neonBlue }}>
                              {item.type === 'listing' ? 'Waiting for offers' : `Challenger: ${formatAddress(item.challenger || item.joiner)}`}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>Details</div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              NFT: {item.nft_name || 'Unknown'}
                            </div>
                            <div style={{ color: theme.colors.neonYellow }}>
                              Price: ${item.asking_price || item.final_price || item.price_usd}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {item.type === 'listing' ? (
                            <>
                              <button 
                                onClick={async () => {
                                  try {
                                    await fetch(`${API_URL}/api/admin/listings/${item.id}`, { method: 'DELETE' })
                                    showSuccess('Listing deleted!')
                                    fetchData()
                                  } catch (error) {
                                    showError('Error: ' + error.message)
                                  }
                                }}
                                style={{ 
                                  background: '#ff4444', 
                                  color: 'white', 
                                  padding: '0.25rem 0.75rem', 
                                  border: 'none', 
                                  borderRadius: '0.25rem', 
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                🗑️ Delete Listing
                              </button>
                              <button 
                                onClick={async () => {
                                  try {
                                    await fetch(`${API_URL}/api/admin/listings/${item.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'open' })
                                    })
                                    showSuccess('Listing reopened!')
                                    fetchData()
                                  } catch (error) {
                                    showError('Error: ' + error.message)
                                  }
                                }}
                                style={{ 
                                  background: '#00cc00', 
                                  color: 'white', 
                                  padding: '0.25rem 0.75rem', 
                                  border: 'none', 
                                  borderRadius: '0.25rem', 
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                ↗️ Reopen
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => deleteGame(item.id)}
                                style={{ 
                                  background: '#ff4444', 
                                  color: 'white', 
                                  padding: '0.25rem 0.75rem', 
                                  border: 'none', 
                                  borderRadius: '0.25rem', 
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                🗑️ Delete
                              </button>
                              
                              <button 
                                onClick={() => resetGameStatus(item.id, 'waiting_challenger_deposit')}
                                style={{ 
                                  background: '#ff8800', 
                                  color: 'white', 
                                  padding: '0.25rem 0.75rem', 
                                  border: 'none', 
                                  borderRadius: '0.25rem', 
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                ⏳ Reset to Waiting
                              </button>
                              
                              <button 
                                onClick={() => resetGameStatus(item.id, 'cancelled')}
                                style={{ 
                                  background: '#666', 
                                  color: 'white', 
                                  padding: '0.25rem 0.75rem', 
                                  border: 'none', 
                                  borderRadius: '0.25rem', 
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                ❌ Cancel
                              </button>
                            </>
                          )}
                          
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/game/${item.id}`)
                              showSuccess(`${item.type === 'listing' ? 'Listing' : 'Game'} URL copied!`)
                            }}
                            style={{ 
                              background: '#0088ff', 
                              color: 'white', 
                              padding: '0.25rem 0.75rem', 
                              border: 'none', 
                              borderRadius: '0.25rem', 
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            🔗 Copy URL
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
            
            {activeView === 'listings' && (
              <>
                <h3 style={{ color: 'white', marginBottom: '1rem' }}>
                  Listings in Database ({listings.length})
                </h3>
                
                <div style={{ 
                  maxHeight: '60vh', 
                  overflowY: 'auto',
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {listings.length === 0 ? (
                    <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '2rem' }}>
                      No listings found in database
                    </p>
                  ) : (
                    listings.map(listing => (
                      <div key={listing.id} style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: `1px solid #FFD700`,
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>📦 Listing #{listing.id}</div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              Status: <span style={{ color: getStatusColor(listing.status) }}>{listing.status}</span>
                            </div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              Created: {new Date(listing.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>Creator</div>
                            <div style={{ color: theme.colors.neonPink }}>
                              {formatAddress(listing.creator)}
                            </div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              NFT: {listing.nft_name || 'Unknown'}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>Details</div>
                            <div style={{ color: theme.colors.neonYellow }}>
                              Price: ${listing.asking_price}
                            </div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              Collection: {listing.nft_collection || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            onClick={async () => {
                              if (!confirm('Delete this listing?')) return
                              try {
                                await fetch(`${API_URL}/api/admin/listings/${listing.id}`, { method: 'DELETE' })
                                showSuccess('Listing deleted!')
                                fetchData()
                              } catch (error) {
                                showError('Error: ' + error.message)
                              }
                            }}
                            style={{ 
                              background: '#ff4444', 
                              color: 'white', 
                              padding: '0.25rem 0.75rem', 
                              border: 'none', 
                              borderRadius: '0.25rem', 
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️ Delete
                          </button>
                          
                          <button 
                            onClick={async () => {
                              try {
                                await fetch(`${API_URL}/api/admin/listings/${listing.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'open' })
                                })
                                showSuccess('Listing reopened!')
                                fetchData()
                              } catch (error) {
                                showError('Error: ' + error.message)
                              }
                            }}
                            style={{ 
                              background: '#00cc00', 
                              color: 'white', 
                              padding: '0.25rem 0.75rem', 
                              border: 'none', 
                              borderRadius: '0.25rem', 
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            ↗️ Reopen
                          </button>
                          
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/game/${listing.id}`)
                              showSuccess('Listing URL copied!')
                            }}
                            style={{ 
                              background: '#0088ff', 
                              color: 'white', 
                              padding: '0.25rem 0.75rem', 
                              border: 'none', 
                              borderRadius: '0.25rem', 
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            🔗 Copy URL
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
            
            {activeView === 'games' && (
              <>
                <h3 style={{ color: 'white', marginBottom: '1rem' }}>
                  Games in Database ({games.length})
                </h3>
                
                <div style={{ 
                  maxHeight: '60vh', 
                  overflowY: 'auto',
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {games.length === 0 ? (
                    <p style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: '2rem' }}>
                      No games found in database
                    </p>
                  ) : (
                    games.map(game => (
                  <div key={game.id} style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${getStatusColor(game.status)}`,
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>Game ID: {game.id}</div>
                        <div style={{ color: theme.colors.textSecondary }}>
                          Status: <span style={{ color: getStatusColor(game.status) }}>{game.status}</span>
                        </div>
                        <div style={{ color: theme.colors.textSecondary }}>
                          Created: {new Date(game.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>Players</div>
                                                    <div style={{ color: theme.colors.neonPink }}>
                              Creator: {formatAddress(game.creator)}
                            </div>
                            <div style={{ color: theme.colors.neonBlue }}>
                              Challenger: {formatAddress(game.challenger || game.joiner)}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>Game Info</div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              NFT: {game.nft_name || 'Unknown'}
                            </div>
                            <div style={{ color: theme.colors.neonYellow }}>
                              Price: ${game.final_price || game.price_usd}
                            </div>
                            <div style={{ color: theme.colors.textSecondary }}>
                              Deposits: {game.creator_deposited ? '✅' : '❌'} / {game.challenger_deposited ? '✅' : '❌'}
                            </div>
                          </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => deleteGame(game.id)}
                        style={{ 
                          background: '#ff4444', 
                          color: 'white', 
                          padding: '0.25rem 0.75rem', 
                          border: 'none', 
                          borderRadius: '0.25rem', 
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                      
                                              <button 
                          onClick={() => resetGameStatus(game.id, 'waiting_challenger_deposit')}
                          style={{ 
                            background: '#ff8800', 
                            color: 'white', 
                            padding: '0.25rem 0.75rem', 
                            border: 'none', 
                            borderRadius: '0.25rem', 
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          ⏳ Reset to Waiting
                        </button>
                      
                      <button 
                        onClick={() => resetGameStatus(game.id, 'cancelled')}
                        style={{ 
                          background: '#666', 
                          color: 'white', 
                          padding: '0.25rem 0.75rem', 
                          border: 'none', 
                          borderRadius: '0.25rem', 
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        ❌ Cancel
                      </button>
                      
                      {game.joiner && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/game/${game.id}`)
                            showSuccess('Game URL copied!')
                          }}
                          style={{ 
                            background: '#0088ff', 
                            color: 'white', 
                            padding: '0.25rem 0.75rem', 
                            border: 'none', 
                            borderRadius: '0.25rem', 
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          🔗 Copy URL
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    )}
  </div>
</div>
)
}

export default DatabaseAdmin 