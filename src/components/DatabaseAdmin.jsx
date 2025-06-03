import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { theme } from '../styles/theme'
import { Button } from '../styles/components'

const DatabaseAdmin = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const { address } = useWallet()
  const { showSuccess, showError } = useToast()
  
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'
  
  const fetchGames = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/admin/games`)
      if (response.ok) {
        const data = await response.json()
        setGames(data.games || [])
      } else {
        throw new Error('Failed to fetch games')
      }
    } catch (error) {
      console.error('Error fetching games:', error)
      showError('Failed to load games')
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
  
  const getMyGames = async () => {
    if (!address) return
    
    try {
      const response = await fetch(`${API_URL}/api/games/creator/${address}`)
      if (response.ok) {
        const myGames = await response.json()
        setGames(myGames)
      }
    } catch (error) {
      showError('Failed to load your games')
    }
  }
  
  useEffect(() => {
    if (showAdmin) {
      fetchGames()
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
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Button 
            onClick={fetchGames} 
            disabled={loading}
            style={{ background: '#0088ff' }}
          >
            🔄 {loading ? 'Loading...' : 'Refresh All'}
          </Button>
          
          <Button 
            onClick={getMyGames}
            disabled={!address}
            style={{ background: '#00cc00' }}
          >
            👤 My Games Only
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
                const response = await fetch(`${API_URL}/api/debug/init`, { method: 'POST' })
                const result = await response.json()
                if (result.success) {
                  showSuccess('Database reinitialized!')
                  fetchGames()
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
        
        {loading ? (
          <p style={{ color: 'white' }}>Loading...</p>
        ) : (
          <div>
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
                          Joiner: {formatAddress(game.joiner)}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>Game Info</div>
                        <div style={{ color: theme.colors.textSecondary }}>
                          NFT: {game.nft_name || 'Unknown'}
                        </div>
                        <div style={{ color: theme.colors.neonYellow }}>
                          Price: ${game.price_usd}
                        </div>
                        <div style={{ color: theme.colors.textSecondary }}>
                          Score: {game.creator_wins || 0} - {game.joiner_wins || 0}
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
                        onClick={() => resetGameStatus(game.id, 'waiting')}
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
          </div>
        )}
      </div>
    </div>
  )
}

export default DatabaseAdmin 