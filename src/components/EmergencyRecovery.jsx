import React, { useState } from 'react'
import { useWalletConnection } from '../utils/useWalletConnection'
import contractService from '../services/ContractService'
import { useToast } from '../contexts/ToastContext'

const EmergencyRecovery = () => {
  const { address } = useWalletConnection()
  const { showSuccess, showError, showInfo } = useToast()
  const [nftContract, setNftContract] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [myGames, setMyGames] = useState(null)

  const findMyNFT = async () => {
    if (!nftContract || !tokenId) {
      showError('Please enter NFT contract address and token ID')
      return
    }

    setIsSearching(true)
    try {
      showInfo('Searching for your NFT...')
      const result = await contractService.findMyNFTs(nftContract, tokenId)
      setSearchResults(result)
      
      if (result.success) {
        showSuccess(`NFT found: ${result.message}`)
      } else {
        showError('Failed to find NFT: ' + result.error)
      }
    } catch (error) {
      showError('Error searching for NFT: ' + error.message)
    } finally {
      setIsSearching(false)
    }
  }

  const findMyGames = async () => {
    if (!address) {
      showError('Please connect your wallet')
      return
    }

    setIsSearching(true)
    try {
      showInfo('Searching for your games...')
      const result = await contractService.getMyGames(address)
      setMyGames(result)
      
      if (result.success) {
        showSuccess(`Found ${result.myGames.length} games`)
      } else {
        showError('Failed to find games: ' + result.error)
      }
    } catch (error) {
      showError('Error searching for games: ' + error.message)
    } finally {
      setIsSearching(false)
    }
  }

  const cancelGame = async (gameId) => {
    if (!confirm(`Are you sure you want to cancel game ${gameId}? This will return your NFT to your wallet.`)) {
      return
    }

    try {
      showInfo('Cancelling game...')
      const result = await contractService.emergencyCancelGame(gameId)
      
      if (result.success) {
        showSuccess('Game cancelled successfully! Your NFT should be returned to your wallet.')
        // Refresh games list
        findMyGames()
      } else {
        showError('Failed to cancel game: ' + result.error)
      }
    } catch (error) {
      showError('Error cancelling game: ' + error.message)
    }
  }

  return (
    <div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Find Your NFT</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="NFT Contract Address"
            value={nftContract}
            onChange={(e) => setNftContract(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              color: 'white'
            }}
          />
          <input
            type="text"
            placeholder="Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            style={{
              width: '120px',
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              color: 'white'
            }}
          />
          <button
            onClick={findMyNFT}
            disabled={isSearching}
            style={{
              padding: '0.5rem 1rem',
              background: '#FF4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isSearching ? 'not-allowed' : 'pointer'
            }}
          >
            {isSearching ? 'Searching...' : 'Find NFT'}
          </button>
        </div>

        {searchResults && (
          <div style={{
            padding: '1rem',
            background: searchResults.success ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
            border: `1px solid ${searchResults.success ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
            borderRadius: '0.5rem',
            color: searchResults.success ? '#00FF00' : '#FF4444'
          }}>
            <strong>Result:</strong> {searchResults.message || searchResults.error}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Find Your Games</h3>
        <button
          onClick={findMyGames}
          disabled={isSearching || !address}
          style={{
            padding: '0.5rem 1rem',
            background: '#FFD700',
            color: 'black',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: (isSearching || !address) ? 'not-allowed' : 'pointer',
            marginBottom: '1rem'
          }}
        >
          {isSearching ? 'Searching...' : 'Find My Games'}
        </button>

        {myGames && (
          <div>
            <p style={{ color: 'white', marginBottom: '1rem' }}>
              Total games created: {myGames.totalGames}
            </p>
            
            {myGames.myGames.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {myGames.myGames.map((game) => (
                  <div key={game.gameId} style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Game {game.gameId}</strong>
                        <br />
                        <small>NFT: {game.nftContract} #{game.tokenId}</small>
                        <br />
                        <small>State: {game.state === 0 ? 'Created' : game.state === 1 ? 'Joined' : 'Completed'}</small>
                        <br />
                        <small>Joiner: {game.joiner === '0x0000000000000000000000000000000000000000' ? 'None' : game.joiner}</small>
                      </div>
                      {game.state === 0 && (
                        <button
                          onClick={() => cancelGame(game.gameId)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#FF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel Game
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'white' }}>No games found for your address.</p>
            )}
          </div>
        )}
      </div>

      <div style={{
        padding: '1rem',
        background: 'rgba(255, 0, 0, 0.1)',
        border: '1px solid rgba(255, 0, 0, 0.3)',
        borderRadius: '0.5rem',
        color: '#FF4444'
      }}>
        <strong>⚠️ Important:</strong> If your NFT is stuck in a game contract, you can cancel the game to recover it. 
        Only games in "Created" state (no joiner) can be cancelled.
      </div>
    </div>
  )
}

export default EmergencyRecovery 