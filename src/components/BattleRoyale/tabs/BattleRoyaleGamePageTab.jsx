import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { ethers } from 'ethers'
import { useWallet } from '../../../contexts/WalletContext'
import { useToast } from '../../../contexts/ToastContext'
// import { useContractService } from '../../../utils/useContractService'
import { useProfile } from '../../../contexts/ProfileContext'
import contractService from '../../../services/ContractService'
import { getApiUrl } from '../../../config/api'
import socketService from '../../../services/SocketService'
import BattleRoyale3DCoins from '../BattleRoyale3DCoins'
import CoinSelector from '../../CoinSelector'
import '../BattleRoyaleCoins.css'

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
    width: 240px;
    height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    position: relative;
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
  const { isContractInitialized } = useWallet()
  const { getCoinHeadsImage, getCoinTailsImage } = useProfile()
  
  const [players, setPlayers] = useState(new Array(8).fill(null))
  const [gameStatus, setGameStatus] = useState('filling')
  const [currentPlayers, setCurrentPlayers] = useState(0)
  const [isJoining, setIsJoining] = useState(false)
  const [showCoinSelector, setShowCoinSelector] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [playerCoins, setPlayerCoins] = useState({}) // Store each player's coin choice
  const [playerCoinImages, setPlayerCoinImages] = useState({}) // Store actual coin images for each player
  const [coinSides, setCoinSides] = useState({}) // Track which side (heads/tails) is showing for each player

  // Load coin images for a player
  const loadPlayerCoinImages = React.useCallback(async (playerAddress, coinChoice) => {
    try {
      let headsImage, tailsImage
      
      if (coinChoice?.type === 'custom') {
        // Load custom coin images from profile
        headsImage = await getCoinHeadsImage(playerAddress)
        tailsImage = await getCoinTailsImage(playerAddress)
      } else {
        // Use default coin images
        headsImage = coinChoice?.headsImage || '/coins/plainh.png'
        tailsImage = coinChoice?.tailsImage || '/coins/plaint.png'
      }
      
      setPlayerCoinImages(prev => ({
        ...prev,
        [playerAddress]: { headsImage, tailsImage }
      }))
    } catch (error) {
      console.error('Error loading coin images for player:', playerAddress, error)
      // Fallback to default coin
      setPlayerCoinImages(prev => ({
        ...prev,
        [playerAddress]: { 
          headsImage: '/coins/plainh.png', 
          tailsImage: '/coins/plaint.png' 
        }
      }))
    }
  }, [getCoinHeadsImage, getCoinTailsImage])

  // Socket: connect and subscribe to server lobby state
  useEffect(() => {
    if (!gameId || !address) return

    let connected = false

    const onStateUpdate = (data) => {
      try {
        console.log('📊 Battle Royale state update received:', {
          phase: data.phase,
          gamePhase: data.gamePhase,
          status: data.status,
          currentPlayers: data.currentPlayers,
          playerSlots: data.playerSlots?.length
        })
        
        // data.players may be object keyed by address; normalize into 8-slot array if slots provided
        if (data.playerSlots) {
          const slots = new Array(8).fill(null)
          data.playerSlots.forEach((playerAddress, idx) => {
            if (playerAddress && data.players && data.players[playerAddress]) {
              const p = data.players[playerAddress]
              slots[idx] = {
                address: playerAddress,
                joinedAt: p.joinedAt || new Date().toISOString(),
                coin: p.coin || { id: 'plain', type: 'default', name: 'Classic' }
              }
            }
          })
          setPlayers(slots)
          const joinedCount = slots.filter(Boolean).length
          setCurrentPlayers(joinedCount)
          
          // Use the server's phase/gamePhase if available, otherwise fallback to status
          const newGameStatus = data.phase || data.gamePhase || data.status || (joinedCount >= 8 ? 'starting' : 'filling')
          console.log('📊 Setting game status to:', newGameStatus)
          setGameStatus(newGameStatus)

          // preload coin images
          if (data.players) {
            Object.entries(data.players).forEach(([addrKey, playerVal]) => {
              if (playerVal?.coin) {
                loadPlayerCoinImages(addrKey, playerVal.coin)
              }
            })
          }
        }
      } catch (e) {
        console.error('Failed to process battle royale state update', e)
      }
    }

    const onGameStarting = (data) => {
      console.log('🚀 Battle Royale game starting:', data)
      console.log('📊 Current game status before update:', gameStatus)
      showToast(`Game starting in ${data.countdown} seconds!`, 'success')
      setGameStatus('starting')
      console.log('📊 Game status updated to: starting')
    }

    const setup = async () => {
      try {
        // Only connect if not already connected to the same game
        if (!socketService.isConnected() || socketService.getCurrentRoom() !== `br_${gameId}`) {
          await socketService.connect(gameId, address)
        }
        connected = true
        socketService.on('battle_royale_state_update', onStateUpdate)
        socketService.on('battle_royale_starting', onGameStarting)
        // Join room and request state
        socketService.emit('join_battle_royale_room', { roomId: `br_${gameId}`, address })
        socketService.emit('request_battle_royale_state', { gameId })
      } catch (err) {
        console.error('Socket setup failed in BattleRoyaleGamePageTab', err)
      }
    }

    setup()

    return () => {
      if (connected) {
        socketService.off('battle_royale_state_update', onStateUpdate)
        socketService.off('battle_royale_starting', onGameStarting)
      }
    }
  }, [gameId, address, loadPlayerCoinImages])

  // Initialize creator in slot 0 when game loads
  useEffect(() => {
    if (gameData && gameData.creator) {
      const newPlayers = [...players]
      if (!newPlayers[0] || newPlayers[0].address !== gameData.creator) {
        const defaultCoin = { id: 'plain', type: 'default', name: 'Classic' }
        newPlayers[0] = {
          address: gameData.creator,
          joinedAt: new Date().toISOString(),
          coin: defaultCoin,
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
          [gameData.creator]: defaultCoin
        }))
        
        // Load coin images for creator
        loadPlayerCoinImages(gameData.creator, defaultCoin)
      }
    }
  }, [gameData, loadPlayerCoinImages])

  // Load coin images for all existing players
  useEffect(() => {
    players.forEach((player, index) => {
      if (player && player.address && !playerCoinImages[player.address]) {
        const coinChoice = playerCoins[player.address] || player.coin || { id: 'plain', type: 'default', name: 'Classic' }
        loadPlayerCoinImages(player.address, coinChoice)
      }
    })
  }, [players, playerCoins, playerCoinImages, loadPlayerCoinImages])

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

        // Notify server to add player to in-memory game and room
        try {
          socketService.emit('join_battle_royale', { gameId, address })
          socketService.emit('request_battle_royale_state', { gameId })
        } catch (e) {
          console.error('Failed to notify server about join', e)
        }
        
        // Update local state to show the player in the slot
        const defaultCoin = { id: 'plain', type: 'default', name: 'Classic' }
        const newPlayers = [...players]
        newPlayers[slotIndex] = {
          address: address,
          joinedAt: new Date().toISOString(),
          coin: defaultCoin
        }
        setPlayers(newPlayers)
        setCurrentPlayers(prev => prev + 1)
        
        // Set default coin for the player
        setPlayerCoins(prev => ({
          ...prev,
          [address]: defaultCoin
        }))
        
        // Load coin images for the new player
        loadPlayerCoinImages(address, defaultCoin)
        
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
      
      // Load coin images for the new coin choice
      loadPlayerCoinImages(address, coin)
      
      // Send coin update to server
      try {
        socketService.emit('battle_royale_update_coin', {
          gameId,
          address,
          coinData: coin
        })
        console.log('🪙 Sent coin update to server:', coin)
      } catch (error) {
        console.error('Error sending coin update to server:', error)
      }
      
      showToast(`Coin changed to ${coin.name}`, 'success')
    }
    setShowCoinSelector(false)
    setSelectedSlot(null)
  }

  // Toggle coin side (heads/tails) for lobby viewing
  const toggleCoinSide = React.useCallback((playerAddress) => {
    setCoinSides(prev => ({
      ...prev,
      [playerAddress]: prev[playerAddress] === 'tails' ? 'heads' : 'tails'
    }))
  }, [])

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

        {/* Start Game Button - Only for Creator */}
        {isCreator && gameStatus === 'filling' && currentPlayers >= 2 && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '1rem'
          }}>
            <button
              onClick={() => {
                // Start the game with current players
                console.log('🚀 Start game button clicked!', {
                  gameId,
                  address,
                  currentPlayers,
                  gameStatus,
                  isCreator
                })
                try {
                  socketService.emit('battle_royale_start_early', {
                    gameId,
                    address
                  })
                  console.log('🚀 Sent start game request to server')
                  showToast('Starting game now!', 'success')
                } catch (error) {
                  console.error('Error starting game:', error)
                  showToast('Failed to start game', 'error')
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                color: '#000',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 136, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.3)'
              }}
            >
              🚀 Start Game ({currentPlayers}/8 players)
            </button>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#888', 
              marginTop: '0.5rem' 
            }}>
              Start with {currentPlayers} players (reduced payout)
            </div>
          </div>
        )}
      </GameStatus>

      {/* Unified Battle Royale Coins Display */}
      <BattleRoyale3DCoins
        players={players.map((player, index) => ({
          address: player?.address,
          coin: player?.coin || playerCoins[player?.address],
          isEliminated: false,
          slotIndex: index
        }))}
        gamePhase={gameStatus}
        serverState={null} // Pass server state when available
        flipStates={{}} // Pass flip states when game is active
        onFlipComplete={(playerAddress, result) => {
          console.log(`Player ${playerAddress} flipped: ${result}`)
        }}
        playerCoinImages={playerCoinImages}
        isCreator={isCreator}
        currentUserAddress={address}
        size={240}
      />

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
              selectedCoin={playerCoins[address] || { id: 'plain', type: 'default', name: 'Classic' }}
              onCoinSelect={handleCoinSelect}
              showCustomOption={true}
            />
          </div>
        </CoinSelectionModal>
      )}
    </TabContainer>
  )
}

export default BattleRoyaleGamePageTab
