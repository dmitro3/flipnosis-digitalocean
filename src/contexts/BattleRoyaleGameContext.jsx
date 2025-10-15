import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from './WalletContext'
import { useToast } from './ToastContext'
import { useProfile } from './ProfileContext'
import socketService from '../services/SocketService'

const BattleRoyaleGameContext = createContext(null)

export const useBattleRoyaleGame = () => {
  const context = useContext(BattleRoyaleGameContext)
  if (!context) {
    throw new Error('useBattleRoyaleGame must be used within BattleRoyaleGameProvider')
  }
  return context
}

export const BattleRoyaleGameProvider = ({ gameId, children }) => {
  const { address } = useWallet()
  const { showToast } = useToast()
  const { getCoinHeadsImage, getCoinTailsImage } = useProfile()

  // ===== SINGLE SOURCE OF TRUTH =====
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const [playerCoinImages, setPlayerCoinImages] = useState({})
  const [imagesLoading, setImagesLoading] = useState(true)
  
  // Track loaded images to prevent re-loading
  const loadedAddresses = useRef(new Set())
  const socketInitialized = useRef(false)

  // ===== LOAD COIN IMAGES =====
  const loadCoinImagesForPlayer = useCallback(async (playerAddress, coinData) => {
    const key = playerAddress.toLowerCase()
    
    console.log(`🖼️ Loading coin images for ${playerAddress}, coinData:`, coinData)
    
    if (loadedAddresses.current.has(key)) {
      console.log(`🖼️ Coin images already loaded for ${playerAddress}`)
      return // Already loaded
    }

    try {
      let headsImage, tailsImage

      if (coinData?.type === 'custom') {
        console.log(`🖼️ Loading custom coin for ${playerAddress}`)
        headsImage = await getCoinHeadsImage(playerAddress)
        tailsImage = await getCoinTailsImage(playerAddress)
      } else {
        console.log(`🖼️ Loading default coin for ${playerAddress}:`, coinData?.headsImage, coinData?.tailsImage)
        headsImage = coinData?.headsImage || '/coins/plainh.png'
        tailsImage = coinData?.tailsImage || '/coins/plaint.png'
      }

      setPlayerCoinImages(prev => ({
        ...prev,
        [key]: { headsImage, tailsImage }
      }))

      loadedAddresses.current.add(key)
      console.log(`✅ Loaded coin images for ${playerAddress}: ${headsImage}, ${tailsImage}`)
    } catch (error) {
      console.error('Error loading coin images:', error)
      setPlayerCoinImages(prev => ({
        ...prev,
        [key]: { 
          headsImage: '/coins/plainh.png', 
          tailsImage: '/coins/plaint.png' 
        }
      }))
      loadedAddresses.current.add(key)
    }
  }, [getCoinHeadsImage, getCoinTailsImage])

  // ===== LOAD ALL PLAYER IMAGES =====
  const loadAllPlayerImages = useCallback(async (players) => {
    if (!players) {
      console.log('🖼️ No players to load images for')
      return
    }

    console.log('🖼️ Loading coin images for players:', Object.keys(players))
    setImagesLoading(true)
    const loadPromises = []

    Object.entries(players).forEach(([playerAddress, playerData]) => {
      console.log(`🖼️ Player ${playerAddress} has coin:`, playerData?.coin)
      if (playerData?.coin) {
        loadPromises.push(loadCoinImagesForPlayer(playerAddress, playerData.coin))
      } else {
        console.log(`⚠️ Player ${playerAddress} has no coin data`)
      }
    })

    await Promise.all(loadPromises)
    setImagesLoading(false)
    console.log('✅ All player coin images loaded')
  }, [loadCoinImagesForPlayer])

  // ===== SOCKET EVENT HANDLERS =====
  const handleStateUpdate = useCallback((data) => {
    console.log('📊 Game state update received:', {
      gameId: data.gameId,
      phase: data.phase,
      currentPlayers: data.currentPlayers,
      playerSlots: data.playerSlots,
      playerAddresses: data.players ? Object.keys(data.players) : 'none'
    })
    
    // Debug: Show each player and their slot
    if (data.players) {
      Object.entries(data.players).forEach(([addr, player]) => {
        console.log(`  👤 Player ${addr.slice(0, 6)}... in slot ${player.slotNumber}, coin: ${player.coin?.name || 'none'}`)
      })
    }
    
    setGameState(data)
    setLoading(false)

    // Load coin images for any new players
    if (data.players) {
      loadAllPlayerImages(data.players)
    }
  }, [loadAllPlayerImages])

  const handleRoundStart = useCallback((data) => {
    console.log('🚀 Round starting:', data.round)
    showToast(`Round ${data.round} - Choose wisely!`, 'info')
  }, [showToast])

  const handlePlayerFlipped = useCallback((data) => {
    console.log('🪙 Player flipped:', data.playerAddress)
    // State update will be sent separately by server
  }, [])

  const handleRoundEnd = useCallback((data) => {
    console.log('🏁 Round ending:', data)
    if (data.eliminatedPlayers?.length > 0) {
      showToast(`${data.eliminatedPlayers.length} players eliminated`, 'warning')
    }
  }, [showToast])

  const handleGameComplete = useCallback((data) => {
    console.log('🏆 Game complete:', data)
    const isWinner = data.winner === address
    showToast(
      isWinner ? '🎉 You won!' : `Game over! Winner: ${data.winner?.slice(0, 6)}...`,
      isWinner ? 'success' : 'info'
    )
  }, [address, showToast])

  const handleGameStarting = useCallback((data) => {
    console.log('⏱️ Game starting in:', data.countdown)
    showToast(`Game starting in ${data.countdown} seconds!`, 'success')
  }, [showToast])

  const handleError = useCallback((data) => {
    console.error('❌ Battle Royale error:', data)
    showToast(data.message || 'Game error', 'error')
  }, [showToast])

  const handleShieldDeployed = useCallback((data) => {
    console.log('🛡️ Shield deployed by:', data.playerAddress)
    showToast('Shield deployed!', 'info')
  }, [showToast])

  const handleLightningActivated = useCallback((data) => {
    console.log('⚡ Lightning Round activated by:', data.playerAddress)
    showToast('⚡ LIGHTNING ROUND ACTIVATED!', 'warning')
  }, [showToast])

  const handleLightningEarned = useCallback((data) => {
    console.log('⚡ Lightning Round earned by:', data.playerAddress)
    if (data.playerAddress === address) {
      showToast('⚡ You earned Lightning Round!', 'success')
    }
  }, [address, showToast])

  const handleShieldSaved = useCallback((data) => {
    console.log('🛡️ Shield saved player:', data.playerAddress)
    if (data.playerAddress === address) {
      showToast('🛡️ Shield saved you!', 'success')
    }
  }, [address, showToast])

  // ===== PHYSICS GAME EVENT HANDLERS =====
  const handlePhysicsStateUpdate = useCallback((data) => {
    console.log('🎮 Physics state update:', data)
    setGameState(data)
    setLoading(false)

    // Fallback hard redirect for active phase to ensure transport (e.g., Player 2)
    try {
      if (data?.phase === 'round_active' || data?.phase === 'playing') {
        const id = data?.gameId || gameId
        if (id) {
          console.log('🚀 Physics active phase detected - hard redirecting to test-tubes.html')
          // Store wallet address in localStorage for the test-tubes page to use
          if (address) {
            localStorage.setItem('walletAddress', address)
          }
          window.location.href = `/test-tubes.html?gameId=${id}`
        }
      }
    } catch (e) {
      console.warn('Redirect attempt failed:', e)
    }

    if (data.players) {
      loadAllPlayerImages(data.players)
    }
  }, [gameId, loadAllPlayerImages])

  const handlePhysicsTurnStart = useCallback((data) => {
    console.log('🎯 Turn started for:', data.playerAddress)
    const isMyTurn = data.playerAddress?.toLowerCase() === address?.toLowerCase()
    if (isMyTurn) {
      showToast('Your turn! Aim and fire!', 'info')
    }
  }, [address, showToast])

  const handlePhysicsCoinLanded = useCallback((data) => {
    console.log('🎲 Coin landed:', data)
    const wasMe = data.playerAddress?.toLowerCase() === address?.toLowerCase()
    if (wasMe) {
      showToast(data.won ? '✅ You won!' : '❌ You lost a life', data.won ? 'success' : 'warning')
    }
  }, [address, showToast])

  const handlePhysicsGameOver = useCallback((data) => {
    console.log('🏆 Physics game over:', data)
    const isWinner = data.winner?.toLowerCase() === address?.toLowerCase()
    showToast(
      isWinner ? '🎉 Victory! You won!' : `Game over! Winner: ${data.winner?.slice(0, 6)}...`,
      isWinner ? 'success' : 'info'
    )
  }, [address, showToast])

  const handlePhysicsGameStarting = useCallback((data) => {
    console.log('⏱️ Physics game starting:', data.countdown)
    showToast(`Game starting in ${data.countdown} seconds!`, 'success')
  }, [showToast])

  // ===== SOCKET INITIALIZATION =====
  useEffect(() => {
    if (!gameId || !address || socketInitialized.current) return

    let mounted = true

    const initializeSocket = async () => {
      try {
        console.log('🔌 Initializing Battle Royale socket...')
        
        await socketService.connect(gameId, address)
        
        if (!mounted) return

        // Register all event listeners
        socketService.on('battle_royale_state_update', handleStateUpdate)
        socketService.on('battle_royale_round_start', handleRoundStart)
        socketService.on('battle_royale_player_flipped', handlePlayerFlipped)
        socketService.on('battle_royale_round_end', handleRoundEnd)
        socketService.on('battle_royale_game_complete', handleGameComplete)
        socketService.on('battle_royale_starting', handleGameStarting)
        socketService.on('battle_royale_error', handleError)
        socketService.on('battle_royale_shield_deployed', handleShieldDeployed)
        socketService.on('battle_royale_lightning_activated', handleLightningActivated)
        socketService.on('battle_royale_lightning_earned', handleLightningEarned)
        socketService.on('battle_royale_shield_saved', handleShieldSaved)
        
        // Physics game event listeners
        socketService.on('physics_state_update', handlePhysicsStateUpdate)
        socketService.on('physics_turn_start', handlePhysicsTurnStart)
        socketService.on('physics_coin_landed', handlePhysicsCoinLanded)
        socketService.on('physics_game_over', handlePhysicsGameOver)
        socketService.on('physics_game_starting', handlePhysicsGameStarting)

        // Join room
        const roomId = `game_${gameId}`
        socketService.emit('join_battle_royale_room', { roomId, address })

        // Request initial state
        socketService.emit('request_battle_royale_state', { gameId })

        setConnected(true)
        socketInitialized.current = true
        console.log('✅ Socket initialized successfully')

      } catch (error) {
        console.error('❌ Socket initialization failed:', error)
        if (mounted) {
          setError('Failed to connect to game')
          setLoading(false)
        }
      }
    }

    initializeSocket()

    return () => {
      mounted = false
      if (socketInitialized.current) {
        socketService.off('battle_royale_state_update', handleStateUpdate)
        socketService.off('battle_royale_round_start', handleRoundStart)
        socketService.off('battle_royale_player_flipped', handlePlayerFlipped)
        socketService.off('battle_royale_round_end', handleRoundEnd)
        socketService.off('battle_royale_game_complete', handleGameComplete)
        socketService.off('battle_royale_starting', handleGameStarting)
        socketService.off('battle_royale_error', handleError)
        socketService.off('battle_royale_shield_deployed', handleShieldDeployed)
        socketService.off('battle_royale_lightning_activated', handleLightningActivated)
        socketService.off('battle_royale_lightning_earned', handleLightningEarned)
        socketService.off('battle_royale_shield_saved', handleShieldSaved)
        
        // Physics game event listeners
        socketService.off('physics_state_update', handlePhysicsStateUpdate)
        socketService.off('physics_turn_start', handlePhysicsTurnStart)
        socketService.off('physics_coin_landed', handlePhysicsCoinLanded)
        socketService.off('physics_game_over', handlePhysicsGameOver)
        socketService.off('physics_game_starting', handlePhysicsGameStarting)
        socketInitialized.current = false
      }
    }
  }, [gameId, address, handleStateUpdate, handleRoundStart, handlePlayerFlipped, handleRoundEnd, handleGameComplete, handleGameStarting, handleError, handleShieldDeployed, handleLightningActivated, handleLightningEarned, handleShieldSaved, handlePhysicsStateUpdate, handlePhysicsTurnStart, handlePhysicsCoinLanded, handlePhysicsGameOver, handlePhysicsGameStarting])

  // ===== PLAYER ACTIONS =====
  const makeChoice = useCallback((choice) => {
    if (!gameId || !address || !gameState) return false
    // All games are now physics games
    socketService.emit('physics_set_choice', { gameId, address, choice })
    console.log(`🎯 Choice made: ${choice}`)
    return true
  }, [gameId, address, gameState])

  // Coin flipping removed - handled by PhysicsGameManager in HTML game
  const flipCoin = useCallback((power = 5) => {
    console.log('🪙 Coin flipping is handled by the HTML game, not the lobby')
    return false
  }, [])

  // Coin updating removed - handled by PhysicsGameManager in HTML game
  const updateCoin = useCallback((coinData) => {
    console.log('🪙 Coin updating is handled by the HTML game, not the lobby')
    return false
  }, [])

  const startGameEarly = useCallback(() => {
    if (!gameId || !address || !gameState) return false

    const isCreator = gameState.creator?.toLowerCase() === address?.toLowerCase()
    if (!isCreator) {
      showToast('Only the creator can start the game', 'error')
      return false
    }

    if (gameState.currentPlayers < 2) {
      showToast('Need at least 2 players to start', 'error')
      return false
    }

    socketService.emit('battle_royale_start_early', {
      gameId,
      address
    })

    console.log('🚀 Starting game early')
    return true
  }, [gameId, address, gameState, showToast])

  // ===== CONTEXT VALUE =====
  const value = {
    gameState,
    loading: loading || imagesLoading,
    error,
    connected,
    playerCoinImages,
    address,
    makeChoice,
    flipCoin,
    updateCoin,
    startGameEarly
  }

  return (
    <BattleRoyaleGameContext.Provider value={value}>
      {children}
    </BattleRoyaleGameContext.Provider>
  )
}
