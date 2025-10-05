import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import BattleRoyaleUnified3DScene from '../BattleRoyaleUnified3DScene'
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

    let mounted = true

    const onStateUpdate = (data) => {
      if (!mounted) return
      
      console.log('📊 Lobby state update:', data)
      
      setServerState(data)
      
      if (data.phase) {
        setServerGamePhase(data.phase)
      }
      
      if (data.playerSlots) {
        const slots = new Array(6).fill(null)
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
        
        // Load coin images
        if (data.players && mounted) {
          Object.entries(data.players).forEach(([addrKey, playerVal]) => {
            if (playerVal?.coin) {
              loadPlayerCoinImages(addrKey, playerVal.coin)
              setPlayerCoins(prev => ({
                ...prev,
                [addrKey]: playerVal.coin
              }))
            }
          })
        }
      }
      
      // Update game status
      let newGameStatus = 'filling'
      if (data.phase === 'starting') {
        newGameStatus = 'starting'
      } else if (data.phase && data.phase !== 'filling') {
        newGameStatus = 'in_progress'
      }
      setGameStatus(newGameStatus)
    }

    const onGameStarting = (data) => {
      if (!mounted) return
      console.log('🚀 Game starting:', data)
      showToast(`Game starting in ${data.countdown} seconds!`, 'success')
      if (mounted) {
        setGameStatus('starting')
      }
    }

    const setup = async () => {
      try {
        if (!socketService.isConnected() || socketService.getCurrentRoom() !== `br_${gameId}`) {
          await socketService.connect(gameId, address)
        }
        
        socketService.on('battle_royale_state_update', onStateUpdate)
        socketService.on('battle_royale_starting', onGameStarting)
        
        socketService.emit('join_battle_royale_room', { roomId: `br_${gameId}`, address })
        socketService.emit('request_battle_royale_state', { gameId })
      } catch (err) {
        console.error('Socket setup failed:', err)
      }
    }

    setup()

    return () => {
      mounted = false
      socketService.off('battle_royale_state_update', onStateUpdate)
      socketService.off('battle_royale_starting', onGameStarting)
    }
  }, [gameId, address, showToast]) // ✅ Stable dependencies only

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

  // Initialize creator when game loads (only if creator participates) - FIXED: Remove infinite loop
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
      const creatorAlreadyAdded = players.some(p => p?.address?.toLowerCase() === gameData.creator?.toLowerCase())
      
      if (!creatorAlreadyAdded) {
        const defaultCoin = { id: 'plain', type: 'default', name: 'Classic' }
        
        // Find first empty slot (prefer slot 0 for creator)
        let emptySlotIndex = players.findIndex(p => p === null)
        if (emptySlotIndex === -1 && players[0] === null) {
          emptySlotIndex = 0
        }
        
        if (emptySlotIndex !== -1) {
          setPlayers(prev => {
            const newPlayers = [...prev]
            newPlayers[emptySlotIndex] = {
              address: gameData.creator,
              joinedAt: new Date().toISOString(),
              coin: defaultCoin,
              isCreator: true,
              entryPaid: true
            }
            return newPlayers
          })
          
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
  }, [gameData?.creator, gameData?.creator_participates]) // FIXED: Remove players dependency to prevent infinite loop

  // Load coin images for all existing players
  const loadedAddresses = useRef(new Set())

  useEffect(() => {
    players.forEach((player) => {
      const addr = player?.address?.toLowerCase()
      if (addr && !loadedAddresses.current.has(addr)) {
        loadedAddresses.current.add(addr)
        const coinChoice = playerCoins[addr] || player.coin || { id: 'plain', type: 'default', name: 'Classic' }
        loadPlayerCoinImages(addr, coinChoice)
      }
    })
  }, [players, playerCoins, loadPlayerCoinImages])

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

  // Remove infinite logging - only log when values change
  const prevEligibilityRef = useRef()
  const currentEligibility = {
    address,
    hasAddress: !!address,
    userAlreadyJoined,
    gameStatus,
    currentPlayers,
    isCreator,
    creatorParticipates,
    isCreatorAndParticipating,
    canJoin
  }
  
  if (!prevEligibilityRef.current || JSON.stringify(prevEligibilityRef.current) !== JSON.stringify(currentEligibility)) {
    console.log('🎮 Join eligibility:', currentEligibility)
    prevEligibilityRef.current = currentEligibility
  }
  
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
    
    if (selectedSlot !== null) {
      const playerAtSlot = players[selectedSlot]
      const isCurrentUser = playerAtSlot?.address?.toLowerCase() === address?.toLowerCase()
      const isCreatorAtSlot = playerAtSlot?.isCreator && address?.toLowerCase() === gameData?.creator?.toLowerCase()
      
      if (isCurrentUser || isCreatorAtSlot) {
        const playerAddress = playerAtSlot.address
        
        // Update server FIRST
        try {
          socketService.emit('battle_royale_update_coin', {
            gameId,
            address: playerAddress,
            coinData: coin
          })
          console.log('🪙 Sent coin update to server:', coin)
          
          // Update local state IMMEDIATELY for instant feedback
          setPlayerCoins(prev => ({
            ...prev,
            [playerAddress.toLowerCase()]: coin
          }))
          
          // Force update player coin images IMMEDIATELY
          setPlayerCoinImages(prev => ({
            ...prev,
            [playerAddress.toLowerCase()]: {
              headsImage: coin.headsImage || '/coins/plainh.png',
              tailsImage: coin.tailsImage || '/coins/plaint.png'
            }
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
          
          // Load the actual images asynchronously (for custom coins)
          if (coin.type === 'custom') {
            loadPlayerCoinImages(playerAddress, coin)
          }
          
          showToast(`Coin changed to ${coin.name}`, 'success')
        } catch (error) {
          console.error('Error sending coin update to server:', error)
          showToast('Failed to update coin', 'error')
        }
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

  // Always use BattleRoyaleUnified3DScene for game display
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
        
        {/* Debug info for creator status */}
        {isCreator && (
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#FFD700', 
            marginTop: '0.5rem',
            textAlign: 'center'
          }}>
            👑 Creator Status: {isCreator ? 'YES' : 'NO'} | 
            Game Status: {gameStatus} | 
            Players: {currentPlayers}
          </div>
        )}

        {/* Start Game Button - Only for Creator */}
        {(() => {
          // Creator should be able to start early if they're not participating OR if they are participating
          const showButton = isCreator && gameStatus === 'filling' && currentPlayers >= 2
          
          // Enhanced debugging to help identify the issue
          console.log('🚀 Early start button debug:', {
            isCreator,
            gameStatus,
            currentPlayers,
            showButton,
            address,
            gameDataCreator: gameData?.creator,
            creatorParticipates: gameData?.creator_participates,
            addressMatches: gameData?.creator?.toLowerCase() === address?.toLowerCase(),
            playersArray: players.map(p => ({ address: p?.address, isCreator: p?.isCreator }))
          })
          
          // Also log each condition separately
          console.log('🚀 Early start conditions:', {
            'isCreator': isCreator,
            'gameStatus === filling': gameStatus === 'filling',
            'currentPlayers >= 2': currentPlayers >= 2,
            'final showButton': showButton
          })
          
          return showButton
        })() && (
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

      {/* Lobby Display - 6 Player Slots */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: '1rem',
        padding: '2rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '1rem',
        border: '2px solid rgba(255, 20, 147, 0.3)',
        backdropFilter: 'blur(10px)',
        minHeight: '400px'
      }}>
        {players.map((player, index) => (
          <div
            key={index}
            style={{
              aspectRatio: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '1rem',
              padding: '1rem',
              position: 'relative',
              transition: 'all 0.3s ease',
              cursor: player ? 'pointer' : (canJoin ? 'pointer' : 'default'),
              background: player 
                ? (player.address?.toLowerCase() === address?.toLowerCase()
                    ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 204, 106, 0.2))'
                    : 'linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(138, 43, 226, 0.2))')
                : 'rgba(255, 255, 255, 0.05)',
              border: player 
                ? (player.address?.toLowerCase() === address?.toLowerCase()
                    ? '2px solid #00ff88'
                    : '2px solid #00bfff')
                : '2px solid rgba(255, 255, 255, 0.2)'
            }}
            onClick={() => handleSlotClick(index)}
          >
            {/* Slot Number */}
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              left: '0.5rem',
              color: '#aaa',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {index + 1}
            </div>

            {/* Coin Display */}
            <div 
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #FFD700',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                background: 'radial-gradient(circle, #FFD700, #FFA500)',
                position: 'relative',
                cursor: player ? 'pointer' : 'default'
              }}
              onClick={(e) => {
                if (player) {
                  e.stopPropagation()
                  const playerAddress = player.address?.toLowerCase()
                  if (playerAddress) {
                    setCoinSides(prev => ({
                      ...prev,
                      [playerAddress]: prev[playerAddress] === 'headsImage' ? 'tailsImage' : 'headsImage'
                    }))
                  }
                }
              }}
            >
              {player ? (
                <>
                  {playerCoinImages[player.address?.toLowerCase()] ? (
                    <img 
                      src={playerCoinImages[player.address.toLowerCase()][coinSides[player.address?.toLowerCase()] || 'headsImage']} 
                      alt={`${player.address} coin`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem'
                    }}>
                      🪙
                    </div>
                  )}
                  
                </>
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  color: '#666'
                }}>
                  ?
                </div>
              )}
            </div>

            {/* Player Info */}
            <div style={{
              color: 'white',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              textAlign: 'center',
              padding: '0 0.5rem',
              wordBreak: 'break-all'
            }}>
              {player ? (
                <>
                  <div>{player.address ? `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 'Unknown'}</div>
                  {player.isCreator && (
                    <div style={{ color: '#FFD700', fontWeight: 'bold' }}>👑 Creator</div>
                  )}
                </>
              ) : (
                <div style={{ color: '#FF1493', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {canJoin ? 'Click to Join' : 'Waiting...'}
                </div>
              )}
            </div>

            {/* Coin Change Button - Outside the coin container */}
            {player && (player.address?.toLowerCase() === address?.toLowerCase() || 
              (player.isCreator && address?.toLowerCase() === gameData?.creator?.toLowerCase())) && (
              <button
                className="coin-change-button"
                onClick={(e) => {
                  e.stopPropagation()
                  const slotIndex = players.findIndex(p => p?.address === player.address)
                  setSelectedSlot(slotIndex)
                  setShowCoinSelector(true)
                }}
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  zIndex: 4,
                  boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)',
                  marginTop: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #FFA500, #FF8C00)'
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 2px 10px rgba(255, 215, 0, 0.3)'
                }}
              >
                Change Coin
              </button>
            )}

            {/* Status Indicator */}
            {player && (
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#00ff88',
                boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Join button and coin selector modal remain the same */}
      {!userAlreadyJoined && gameStatus === 'filling' && (!isCreator || isCreatorAndParticipating) && (
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
