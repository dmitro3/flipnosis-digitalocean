import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { ethers } from 'ethers'
import { useWallet } from '../../../contexts/WalletContext'
import { useToast } from '../../../contexts/ToastContext'
import { useContractService } from '../../../utils/useContractService'
import { getApiUrl } from '../../../config/api'
import CoinSelector from '../../CoinSelector'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  overflow-y: auto;
`


const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(15px);
  border: 3px solid #FF1493;
  border-radius: 1rem;
  padding: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const PlayerSlot = styled.div`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${props => {
    if (props.occupied) {
      return props.isCurrentUser 
        ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 204, 106, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(0, 191, 255, 0.2) 0%, rgba(138, 43, 226, 0.2) 100%)'
    }
    return 'rgba(255, 255, 255, 0.05)'
  }};
  border: 4px solid ${props => {
    if (props.occupied) {
      return props.isCurrentUser ? '#00ff88' : '#00bfff'
    }
    return 'rgba(255, 255, 255, 0.2)'
  }};
  border-radius: 1rem;
  transition: all 0.3s ease;
  cursor: ${props => !props.occupied && props.canJoin ? 'pointer' : 'default'};
  position: relative;
  
  &:hover {
    ${props => !props.occupied && props.canJoin && `
      border-color: #ff1493;
      background: rgba(255, 20, 147, 0.1);
      transform: translateY(-2px);
    `}
  }
  
  .slot-number {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .player-address {
    color: ${props => props.occupied ? (props.theme?.colors?.textPrimary || 'white') : (props.theme?.colors?.textSecondary || '#aaa')};
    font-family: monospace;
    font-size: 0.7rem;
    text-align: center;
    word-break: break-all;
    padding: 0 0.5rem;
  }
  
  .join-text {
    color: ${props => props.theme?.colors?.neonPink || '#FF1493'};
    font-size: 0.9rem;
    font-weight: bold;
    text-align: center;
  }
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.occupied ? '#00ff88' : '#666'};
  }
  
  .coin-display {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    border: 2px solid #FFD700;
    margin-bottom: 0.5rem;
  }
  
  .coin-change-button {
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid #FFD700;
    color: #FFD700;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    font-size: 0.6rem;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 215, 0, 0.3);
      transform: scale(1.05);
    }
  }
`

const GameStatus = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1rem;
  border: 3px solid #FF1493;
  backdrop-filter: blur(15px);
  
  .status-text {
    color: ${props => props.theme?.colors?.neonPink || '#FF1493'};
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .players-count {
    color: ${props => props.theme?.colors?.textSecondary || '#aaa'};
    font-size: 0.9rem;
  }
`

const JoinButton = styled.button`
  background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(255, 20, 147, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const CoinSelectionModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  
  .modal-content {
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #FFD700;
    border-radius: 1rem;
    padding: 2rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }
  
  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: #FFD700;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    
    &:hover {
      color: #ff6b6b;
    }
  }
`

const BattleRoyaleGamePageTab = ({ gameData, gameId, address, isCreator }) => {
  const { showToast } = useToast()
  const { contractService } = useContractService()
  const { isContractInitialized } = useWallet()
  
  const [players, setPlayers] = useState(new Array(8).fill(null))
  const [gameStatus, setGameStatus] = useState('filling')
  const [currentPlayers, setCurrentPlayers] = useState(0)
  
  // Initialize creator in slot 0 when game loads
  useEffect(() => {
    if (gameData && gameData.creator) {
      const newPlayers = [...players]
      if (!newPlayers[0] || newPlayers[0].address !== gameData.creator) {
        newPlayers[0] = {
          address: gameData.creator,
          joinedAt: new Date().toISOString(),
          coin: { id: 'plain', type: 'default', name: 'Classic' },
          isCreator: true,
          entryPaid: true
        }
        setPlayers(newPlayers)
        setCurrentPlayers(prev => {
          // Only increment if creator wasn't already counted
          return prev === 0 ? 1 : prev
        })
        setPlayerCoins(prev => ({
          ...prev,
          [gameData.creator]: { id: 'plain', type: 'default', name: 'Classic' }
        }))
      }
    }
  }, [gameData])
  const [isJoining, setIsJoining] = useState(false)
  const [showCoinSelector, setShowCoinSelector] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [playerCoins, setPlayerCoins] = useState({}) // Store each player's coin choice

  // Check if current user can join
  const userAlreadyJoined = players.some(player => player?.address === address)
  const canJoin = !userAlreadyJoined && !isCreator && currentPlayers < 8 && gameStatus === 'filling'
  
  // Calculate the entry fee for joining players (1/7th of total prize)
  const totalPrize = parseFloat(gameData.entryFee || gameData.entry_fee || 0)
  const entryFeePerPlayer = totalPrize / 7 // Each of the 7 joining players pays 1/7th

  const handleSlotClick = async (slotIndex) => {
    if (!canJoin || players[slotIndex] !== null) return
    
    // If it's the current user's slot and they want to change coin
    if (players[slotIndex]?.address === address) {
      setSelectedSlot(slotIndex)
      setShowCoinSelector(true)
      return
    }
    
    // If it's an empty slot and user can join
    if (players[slotIndex] === null && canJoin) {
      await joinGame(slotIndex)
    }
  }

  const joinGame = async (slotIndex) => {
    console.log('🎮 Join game called with:', { slotIndex, contractService: !!contractService, isContractInitialized, gameData: !!gameData })
    
    if (!contractService || !isContractInitialized || !gameData) {
      console.log('❌ Contract service not ready:', { contractService: !!contractService, isContractInitialized, gameData: !!gameData })
      showToast('Contract service not ready. Please ensure your wallet is connected to Base network.', 'error')
      return
    }

    setIsJoining(true)
    try {
      showToast('Opening MetaMask to join game...', 'info')
      
      // Calculate total amount in USD (1/7th of prize + service fee)
      const totalPrize = parseFloat(gameData.entryFee || gameData.entry_fee || 0)
      const entryFeeUSD = totalPrize / 7 // Each joining player pays 1/7th of total prize
      const serviceFeeUSD = parseFloat(gameData.serviceFee || gameData.service_fee || 0)
      const totalAmountUSD = entryFeeUSD + serviceFeeUSD
      
      console.log('🎮 Joining Battle Royale:', {
        gameId,
        entryFeeUSD,
        serviceFeeUSD,
        totalAmountUSD
      })
      
      // Convert USD to ETH using the contract service
      const totalAmountETHWei = await contractService.getETHAmount(totalAmountUSD)
      const totalAmountETH = ethers.formatEther(totalAmountETHWei)
      
      console.log('💰 Amount conversion:', {
        totalAmountUSD,
        totalAmountETHWei: totalAmountETHWei.toString(),
        totalAmountETH
      })
      
      // Call the contract service to join the game with ETH amount (not wei)
      const result = await contractService.joinBattleRoyale(gameId, totalAmountETH)
      
      if (result.success) {
        showToast('Successfully joined the game!', 'success')
        
        // Update local state to show the player in the slot
        const newPlayers = [...players]
        newPlayers[slotIndex] = {
          address: address,
          joinedAt: new Date().toISOString(),
          coin: { id: 'plain', type: 'default', name: 'Classic' } // Default coin
        }
        setPlayers(newPlayers)
        setCurrentPlayers(prev => prev + 1)
        
        // Set default coin for the player
        setPlayerCoins(prev => ({
          ...prev,
          [address]: { id: 'plain', type: 'default', name: 'Classic' }
        }))
        
        // Update game status if all slots are filled
        if (currentPlayers + 1 >= 8) {
          setGameStatus('starting')
        }
        
        console.log('✅ Successfully joined Battle Royale game')
      } else {
        throw new Error(result.error || 'Failed to join game')
      }
    } catch (error) {
      console.error('❌ Error joining game:', error)
      showToast(`Failed to join game: ${error.message}`, 'error')
    } finally {
      setIsJoining(false)
    }
  }

  const handleCoinSelect = (coin) => {
    if (selectedSlot !== null && players[selectedSlot]?.address === address) {
      // Update the player's coin choice
      setPlayerCoins(prev => ({
        ...prev,
        [address]: coin
      }))
      
      // Update the player object in the slot
      const newPlayers = [...players]
      newPlayers[selectedSlot] = {
        ...newPlayers[selectedSlot],
        coin: coin
      }
      setPlayers(newPlayers)
      
      showToast(`Coin changed to ${coin.name}`, 'success')
    }
    setShowCoinSelector(false)
    setSelectedSlot(null)
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!gameData) {
    return (
      <TabContainer>
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          fontSize: '1.2rem',
          padding: '2rem'
        }}>
          Loading Battle Royale Game Page...
        </div>
      </TabContainer>
    )
  }

  return (
    <TabContainer>
      <GameStatus>
        <div className="status-text">
          {gameStatus === 'filling' ? 'Waiting for game to begin' : 
           gameStatus === 'starting' ? 'Starting Soon!' : 
           'Game In Progress'}
        </div>
        <div className="players-count">
          {currentPlayers} / 8 Players Joined (Creator + {currentPlayers - 1} Joiners)
        </div>
      </GameStatus>

      <PlayersGrid>
        {players.map((player, index) => (
          <PlayerSlot
            key={index}
            occupied={player !== null}
            isCurrentUser={player?.address === address}
            canJoin={canJoin}
            onClick={() => handleSlotClick(index)}
          >
            <div className="slot-number">{index + 1}</div>
            {player ? (
              <>
                {/* Coin Display */}
                <div 
                  className="coin-display"
                  style={{
                    backgroundImage: player.coin?.headsImage ? `url(${player.coin.headsImage})` : 'none',
                    backgroundColor: player.coin?.headsImage ? 'transparent' : 'rgba(255, 215, 0, 0.3)'
                  }}
                />
                
                <div className="player-address">
                  {formatAddress(player.address)}
                </div>
                
                {/* Coin Change Button for current user */}
                {player.address === address && (
                  <button 
                    className="coin-change-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSlot(index)
                      setShowCoinSelector(true)
                    }}
                  >
                    Change Coin
                  </button>
                )}
                
                <div className="status-indicator" />
              </>
            ) : (
              canJoin ? (
                <div className="join-text">
                  {isJoining ? 'Joining...' : 'Click to Join'}
                </div>
              ) : (
                <div className="player-address">Empty</div>
              )
            )}
          </PlayerSlot>
        ))}
      </PlayersGrid>

      {isCreator && (
        <div style={{ textAlign: 'center', color: '#ff1493' }}>
          <p>🎮 You are the creator and first player! You play for FREE and have a chance to win the NFT and all entry fees!</p>
        </div>
      )}

      {!isCreator && !userAlreadyJoined && gameStatus === 'filling' && (
        <div style={{ textAlign: 'center' }}>
          <JoinButton 
            onClick={() => handleSlotClick(players.findIndex(p => p === null))}
            disabled={!canJoin || isJoining}
          >
            {isJoining ? 'Joining Game...' : `Join Battle Royale - $${(entryFeePerPlayer + (gameData.serviceFee || gameData.service_fee || 0)).toFixed(2)}`}
          </JoinButton>
        </div>
      )}

      {userAlreadyJoined && (
        <div style={{ textAlign: 'center', color: '#00ff88' }}>
          <p>✅ You've joined the Battle Royale! Waiting for other players...</p>
        </div>
      )}

      {/* Coin Selection Modal */}
      {showCoinSelector && (
        <CoinSelectionModal>
          <div className="modal-content">
            <button 
              className="close-button"
              onClick={() => {
                setShowCoinSelector(false)
                setSelectedSlot(null)
              }}
            >
              ×
            </button>
            <h2 style={{ 
              color: '#FFD700', 
              textAlign: 'center', 
              marginBottom: '1rem' 
            }}>
              Choose Your Coin
            </h2>
            <CoinSelector 
              onCoinSelect={handleCoinSelect}
              selectedCoin={playerCoins[address] || { id: 'plain', type: 'default', name: 'Classic' }}
              showCustomOption={true}
            />
          </div>
        </CoinSelectionModal>
      )}
    </TabContainer>
  )
}

export default BattleRoyaleGamePageTab
