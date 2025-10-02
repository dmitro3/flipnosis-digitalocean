import React, { useState, useEffect, useCallback } from 'react'
import styled from '@emotion/styled'
import { ethers } from 'ethers'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  
  const [players, setPlayers] = useState(new Array(6).fill(null))
  const [gameStatus, setGameStatus] = useState('filling')
  const [currentPlayers, setCurrentPlayers] = useState(0)
  const [isJoining, setIsJoining] = useState(false)
  const [showCoinSelector, setShowCoinSelector] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [playerCoins, setPlayerCoins] = useState({}) // Store each player's coin choice
  const [playerCoinImages, setPlayerCoinImages] = useState({}) // Store actual coin images for each player
  const [coinSides, setCoinSides] = useState({}) // Track which side (heads/tails) is showing for each player
  
  // Server-controlled game state
  const [serverState, setServerState] = useState(null)
  const [serverGamePhase, setServerGamePhase] = useState('filling')
  const [serverFlipStates, setServerFlipStates] = useState({})

  // Power charge handlers
  const handlePowerChargeStart = useCallback(() => {
    console.log('🔋 Power charge started')
    socketService.emit('battle_royale_charge_start', {
      gameId,
      address
    })
  }, [gameId, address])

  const handlePowerChargeStop = useCallback((power) => {
    console.log('🔋 Power charge stopped with power:', power)
    socketService.emit('battle_royale_charge_stop', {
      gameId,
      address,
      power: power || 5
    })
  }, [gameId, address])

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
        [playerAddress.toLowerCase()]: { headsImage, tailsImage }
      }))
    } catch (error) {
      console.error('Error loading coin images for player:', playerAddress, error)
      // Fallback to default coin
      setPlayerCoinImages(prev => ({
        ...prev,
        [playerAddress.toLowerCase()]: { 
          headsImage: '/coins/plainh.png', 
          tailsImage: '/coins/plaint.png' 
        }
      }))
    }
  }, [getCoinHeadsImage, getCoinTailsImage]) // Ensure proper dependencies

  // Socket: connect and subscribe to server lobby state
  useEffect(() => {
    if (!gameId || !address) return

    let connected = false
    let mounted = true // Add mounted flag

    const onStateUpdate = (data) => {
      if (!mounted) return
      
      console.log('📊 Battle Royale state update received:', data)
      
      // Store the full server state
      setServerState(data)
      
      // Update game phase from server
      if (data.gamePhase) {
        setServerGamePhase(data.gamePhase)
      }
      
      // Update flip states from server
      if (data.flipStates) {
        setServerFlipStates(data.flipStates)
      }
      
      // Update player slots
      if (data.playerSlots) {
        const slots = new Array(6).fill(null) // Changed to 6 slots
        data.playerSlots.forEach((playerAddress, idx) => {
          if (playerAddress && data.players && data.players[playerAddress]) {
            const p = data.players[playerAddress]
            slots[idx] = {
              address: playerAddress,
              joinedAt: p.joinedAt || new Date().toISOString(),
              coin: p.coin || { id: 'plain', type: 'default', name: 'Classic' },
              choice: p.choice,
              status: p.status
            }
          }
        })
        setPlayers(slots)
        setCurrentPlayers(slots.filter(Boolean).length)
        
        // Update game status
        let newGameStatus = 'filling'
        if (data.gamePhase === 'starting' || data.gamePhase === 'revealing_target') {
          newGameStatus = 'starting'
        } else if (data.gamePhase && data.gamePhase !== 'filling' && data.gamePhase !== 'waiting_players') {
          newGameStatus = 'in_progress'
        } else if (data.gamePhase === 'game_complete') {
          newGameStatus = 'completed'
        }
        
        setGameStatus(newGameStatus)
        
        // Load coin images
        if (data.players && mounted) {
          Object.entries(data.players).forEach(([addrKey, playerVal]) => {
            if (playerVal?.coin) {
              loadPlayerCoinImages(addrKey, playerVal.coin)
            }
          })
        }
      }
    }

    const onGameStarting = (data) => {
      if (!mounted) return // Check if still mounted
      
      console.log('🚀 Battle Royale game starting:', data)
      console.log('📊 Game starting event received')
      showToast(`Game starting in ${data.countdown} seconds!`, 'success')
      
      if (mounted) {
        setGameStatus('starting')
        // Remove this navigation - let parent handle it
        // setTimeout(() => {
        //   navigate(`/battle-royale/${gameId}/play`)
        // }, 1000)
      }
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
      mounted = false // Mark as unmounted
      if (connected) {
        socketService.off('battle_royale_state_update', onStateUpdate)
        socketService.off('battle_royale_starting', onGameStarting)
      }
    }
  }, [gameId, address]) // Remove dependencies causing infinite loop

  // Add cleanup mechanism
  useEffect(() => {
    // Return cleanup function that properly handles unmounting
    return () => {
      console.log('🧹 Cleaning up BattleRoyaleGamePageTab')
      
      // Clear any pending timeouts
      const timeoutId = setTimeout(() => {}, 0)
      for (let i = 0; i < timeoutId; i++) {
        clearTimeout(i)
      }
      
      // Clear any pending intervals
      const intervalId = setInterval(() => {}, 1000)
      for (let i = 0; i < intervalId; i++) {
        clearInterval(i)
      }
    }
  }, [])

  // Initialize creator when game loads (only if creator participates)
  useEffect(() => {
    // Check creator participation - handle both boolean and integer (0/1) from database
    const creatorParticipates = gameData?.creator_participates === true || 
                                 gameData?.creator_participates === 1 ||
                                 gameData?.creator_participates === '1'
    
    console.log('🪙 Creator initialization check:', {
      hasGameData: !!gameData,
      creator: gameData?.creator,
      creator_participates_raw: gameData?.creator_participates,
      creator_participates_type: typeof gameData?.creator_participates,
      creatorParticipates,
      currentPlayers: players,
      isCreator: gameData?.creator?.toLowerCase() === address?.toLowerCase()
    })
    
    // Only initialize if creator participates AND we haven't already initialized
    if (gameData && gameData.creator && creatorParticipates) {
      const newPlayers = [...players]
      const creatorAlreadyAdded = newPlayers.some(p => p?.address?.toLowerCase() === gameData.creator?.toLowerCase())
      
      if (!creatorAlreadyAdded) {
        const defaultCoin = { id: 'plain', type: 'default', name: 'Classic' }
        
        // Find first empty slot
        const emptySlotIndex = newPlayers.findIndex(p => p === null)
        if (emptySlotIndex !== -1) {
          newPlayers[emptySlotIndex] = {
            address: gameData.creator,
            joinedAt: new Date().toISOString(),
            coin: defaultCoin,
            isCreator: true,
            entryPaid: true
          }
          
          setPlayers(newPlayers)
          setCurrentPlayers(prev => Math.max(prev, 1))
          setPlayerCoins(prev => ({
            ...prev,
            [gameData.creator]: defaultCoin
          }))
          
          // Load coin images for creator
          loadPlayerCoinImages(gameData.creator, defaultCoin)
          
          console.log('🪙 Creator initialized in slot', emptySlotIndex, ':', {
            address: gameData.creator,
            coin: defaultCoin,
            isCreator: true
          })
        }
      } else {
        console.log('🪙 Creator already added to players')
      }
    } else {
      console.log('🪙 Creator will NOT participate in this game')
    }
  }, [gameData?.creator, gameData?.creator_participates]) // Only re-run when these change

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
  const userAlreadyJoined = address ? players.some(player => player?.address?.toLowerCase() === address?.toLowerCase()) : false

  // Creator participation check - handle both boolean and integer from database
  const creatorParticipates = gameData?.creator_participates === true || 
                              gameData?.creator_participates === 1 ||
                              gameData?.creator_participates === '1'

  const isCreatorAndParticipating = isCreator && creatorParticipates

  // User can join if:
  // 1. They have a connected wallet (address exists)
  // 2. They haven't already joined
  // 3. Game is filling
  // 4. Less than 6 players
  // 5. Either they're NOT the creator, OR they ARE the creator AND they want to participate
  const canJoin = !!address && 
                  !userAlreadyJoined && 
                  gameStatus === 'filling' && 
                  currentPlayers < 6 && 
                  (!isCreator || isCreatorAndParticipating)

  console.log('🎮 Join eligibility:', {
    address,
    hasAddress: !!address,
    userAlreadyJoined,
    gameStatus,
    currentPlayers,
    isCreator,
    creatorParticipates,
    isCreatorAndParticipating,
    canJoin
  })
  
  // Calculate the entry fee for joining players (1/6th of total prize)
  const totalPrize = parseFloat(gameData.entryFee || gameData.entry_fee || 0)
  const entryFeePerPlayer = totalPrize / 6 // Each of the 6 joining players pays 1/6th

  const handleSlotClick = async (slotIndex) => {
    console.log('🪙 Slot clicked:', slotIndex, 'Player at slot:', players[slotIndex], 'Can join:', canJoin, 'Address:', address)
    
    // If it's the current user's slot and they want to change coin
    if (players[slotIndex]?.address?.toLowerCase() === address?.toLowerCase() || (players[slotIndex]?.isCreator && address?.toLowerCase() === gameData?.creator?.toLowerCase())) {
      console.log('🪙 Opening coin selector for current user slot')
      setSelectedSlot(slotIndex)
      setShowCoinSelector(true)
      return
    }
    
    // If it's an empty slot and user can join
    if (players[slotIndex] === null && canJoin) {
      console.log('🪙 Joining empty slot')
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
      
      // Calculate total amount in USD (1/6th of prize + service fee)
      const totalPrize = parseFloat(gameData.entryFee || gameData.entry_fee || 0)
      const entryFeeUSD = totalPrize / 6 // Each joining player pays 1/6th of total prize
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
        if (currentPlayers + 1 >= 6) {
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
    console.log('🪙 Coin selected:', coin, 'Selected slot:', selectedSlot, 'Current address:', address)
    console.log('🪙 Players array:', players)
    console.log('🪙 Player at selected slot:', players[selectedSlot])
    
    if (selectedSlot !== null) {
      const playerAtSlot = players[selectedSlot]
      const isCurrentUser = playerAtSlot?.address?.toLowerCase() === address?.toLowerCase()
      const isCreatorAtSlot = playerAtSlot?.isCreator && address?.toLowerCase() === gameData?.creator?.toLowerCase()
      
      console.log('🪙 Is current user:', isCurrentUser, 'Is creator at slot:', isCreatorAtSlot)
      
      if (isCurrentUser || isCreatorAtSlot) {
        const playerAddress = playerAtSlot.address
        
        // Update the player's coin choice
        setPlayerCoins(prev => ({
          ...prev,
          [playerAddress]: coin
        }))
        
        // Update the player object in the slot
        const newPlayers = [...players]
        if (newPlayers[selectedSlot]) {
          newPlayers[selectedSlot] = {
            ...newPlayers[selectedSlot],
            coin: coin
          }
          setPlayers(newPlayers)
        }
        
        // Load coin images for the new coin choice
        loadPlayerCoinImages(playerAddress, coin)
        
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
      } else {
        console.log('🪙 Cannot change coin - not the player at this slot')
        showToast('You can only change your own coin', 'error')
      }
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

  // Always use BattleRoyale3DCoins for game display
  return (
    <TabContainer>
      <GameStatus>
        <div className="status-text">
          {gameStatus === 'filling' ? 'Waiting for players...' : 
           gameStatus === 'starting' ? 'Game Starting!' : 
           gameStatus === 'in_progress' ? 'Game In Progress' :
           'Game Complete'}
        </div>
        <div className="players-count">
          {currentPlayers} / 6 Players Joined
        </div>

        {/* Start Game Button - Only for Creator */}
        {isCreator && gameStatus === 'filling' && currentPlayers >= 2 && (
          <button
            onClick={() => {
              socketService.emit('battle_royale_start_early', {
                gameId,
                address
              })
              showToast('Starting game now!', 'success')
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
              marginTop: '1rem'
            }}
          >
            🚀 Start Game ({currentPlayers}/6 players)
          </button>
        )}
      </GameStatus>

      {/* Main Game Display */}
      <BattleRoyale3DCoins
        players={players.map((player, index) => ({
          address: player?.address,
          coin: player?.coin || playerCoins[player?.address],
          status: player?.status,
          choice: player?.choice,
          slotIndex: index
        }))}
        gamePhase={serverGamePhase}
        serverState={serverState}
        flipStates={serverFlipStates}
        onFlipComplete={(playerAddress, result) => {
          console.log(`Player ${playerAddress} flipped: ${result}`)
        }}
        playerCoinImages={playerCoinImages}
        isCreator={isCreator}
        currentUserAddress={address}
        size={240}
        onSlotClick={handleSlotClick}
        canJoin={canJoin}
        isJoining={isJoining}
        coinSides={coinSides}
        onCoinSideToggle={toggleCoinSide}
        onCoinChange={(playerAddress) => {
          const slotIndex = players.findIndex(p => p?.address === playerAddress)
          setSelectedSlot(slotIndex)
          setShowCoinSelector(true)
        }}
      />

      {/* Join button and coin selector modal remain the same */}
      {!userAlreadyJoined && gameStatus === 'filling' && (!isCreator || isCreatorParticipating) && (
        <div style={{ textAlign: 'center' }}>
          <JoinButton 
            onClick={() => handleSlotClick(players.findIndex(p => p === null))}
            disabled={!canJoin || isJoining}
          >
            {isJoining ? 'Joining...' : `Join Battle Royale`}
          </JoinButton>
        </div>
      )}

      {/* Keep the CoinSelectionModal as is */}
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
