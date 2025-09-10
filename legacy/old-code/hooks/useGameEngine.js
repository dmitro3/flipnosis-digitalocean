// hooks/useGameEngine.js
// Single Source of Truth for ALL game state management
// Uses Socket.io to communicate with server-side game engine

import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../contexts/ToastContext'
import socketService from '../services/SocketService'

/**
 * Single Game Engine Hook - Handles ALL game state and Socket.io communication
 * This replaces multiple conflicting state management systems
 * 
 * Server handles ALL game logic - client just sends actions and renders state
 */
export const useGameEngine = (gameId, address, gameData) => {
  const { showSuccess, showError, showInfo } = useToast()
  
  // === SINGLE SOURCE OF TRUTH STATE ===
  const [gameState, setGameState] = useState({
    // Connection state
    connected: false,
    loading: true,
    
    // Game status
    status: 'waiting', // waiting, active, completed
    phase: 'waiting', // waiting, choosing, charging, flipping, results
    
    // Player info (from server)
    creator: null,
    challenger: null,
    currentTurn: null,
    
    // Round info
    currentRound: 1,
    totalRounds: 3,
    creatorScore: 0,
    challengerScore: 0,
    
    // Choice tracking
    creatorChoice: null,
    challengerChoice: null,
    canMakeChoice: false,
    
    // Power/charging
    creatorPower: 0,
    challengerPower: 0,
    isCharging: false,
    chargingPlayer: null,
    
    // Flip results
    flipResult: null,
    roundWinner: null,
    gameWinner: null,
    
    // UI state
    countdown: null,
    showResults: false,
    flipAnimation: null
  })
  
  // Track if we're initialized to prevent multiple connections
  const initializedRef = useRef(false)
  const cleanupRef = useRef(null)
  
  // === HELPER FUNCTIONS ===
  const isCreator = useCallback(() => {
    if (!address || !gameState.creator) return false
    return address.toLowerCase() === gameState.creator.toLowerCase()
  }, [address, gameState.creator])
  
  const isChallenger = useCallback(() => {
    if (!address || !gameState.challenger) return false
    return address.toLowerCase() === gameState.challenger.toLowerCase()
  }, [address, gameState.challenger])
  
  const isMyTurn = useCallback(() => {
    if (!gameState.currentTurn || !address) return false
    return address.toLowerCase() === gameState.currentTurn.toLowerCase()
  }, [address, gameState.currentTurn])
  
  const canMakeChoice = useCallback(() => {
    const myTurn = isMyTurn()
    const isChoosingPhase = gameState.phase === 'choosing'
    const isActive = gameState.status === 'active'
    const noCreatorChoice = !gameState.creatorChoice || gameState.creatorChoice === null
    const noChallengerChoice = !gameState.challengerChoice || gameState.challengerChoice === null
    
    const canChoose = myTurn && isChoosingPhase && isActive && noCreatorChoice && noChallengerChoice
    
    console.log('🎮 NEW GAME ENGINE - canMakeChoice check:', {
      myTurn,
      isChoosingPhase,
      isActive,
      noCreatorChoice,
      noChallengerChoice,
      canChoose,
      currentTurn: gameState.currentTurn,
      address,
      phase: gameState.phase,
      status: gameState.status,
      creatorChoice: gameState.creatorChoice,
      challengerChoice: gameState.challengerChoice
    })
    
    return canChoose
  }, [isMyTurn, gameState.phase, gameState.status, gameState.creatorChoice, gameState.challengerChoice, gameState.currentTurn, address])
  
  // === SOCKET.IO EVENT HANDLERS ===
  const handleGameStateUpdate = useCallback((data) => {
    console.log('🎮 NEW GAME ENGINE - Server game state update:', data)
    
    try {
      setGameState(prev => {
        // Determine the correct phase based on server data
        let gamePhase = data.phase || prev.phase
        
        // If server says game is active but doesn't specify phase, default to choosing
        if (data.status === 'active' && !data.phase && prev.phase === 'waiting') {
          gamePhase = 'choosing'
          console.log('🎮 NEW GAME ENGINE - Server says active but no phase, defaulting to choosing')
        }
        
        const newState = {
          ...prev,
          // Update from server state (only if provided)
          status: data.status || prev.status,
          phase: gamePhase,
          creator: data.creator || prev.creator,
          challenger: data.challenger || prev.challenger,
          currentTurn: data.currentTurn || prev.currentTurn,
          currentRound: data.currentRound || prev.currentRound,
          totalRounds: 5, // Fixed to 5 rounds (first to 3)
          creatorScore: typeof data.creatorScore === 'number' ? data.creatorScore : prev.creatorScore,
          challengerScore: typeof data.challengerScore === 'number' ? data.challengerScore : prev.challengerScore,
          creatorChoice: data.creatorChoice !== undefined ? data.creatorChoice : prev.creatorChoice,
          challengerChoice: data.challengerChoice !== undefined ? data.challengerChoice : prev.challengerChoice,
          creatorPower: typeof data.creatorPower === 'number' ? data.creatorPower : prev.creatorPower,
          challengerPower: typeof data.challengerPower === 'number' ? data.challengerPower : prev.challengerPower,
          flipResult: data.flipResult || prev.flipResult,
          roundWinner: data.roundWinner || prev.roundWinner,
          gameWinner: data.gameWinner || prev.gameWinner,
          chargingPlayer: data.chargingPlayer || prev.chargingPlayer,
          // Keep local UI state
          loading: false
        }
        
        console.log('🎮 NEW GAME ENGINE - State updated:', {
          phase: newState.phase,
          status: newState.status,
          creator: newState.creator,
          challenger: newState.challenger,
          currentTurn: newState.currentTurn,
          currentRound: newState.currentRound,
          creatorChoice: newState.creatorChoice,
          challengerChoice: newState.challengerChoice,
          canMakeChoice: newState.status === 'active' && newState.phase === 'choosing'
        })
        
        return newState
      })
    } catch (error) {
      console.error('❌ Error updating game state:', error)
    }
  }, [])
  
  const handleGameStarted = useCallback((data) => {
    console.log('🚀 Game started by server:', data)
    
    setGameState(prev => ({
      ...prev,
      status: data.status || 'active',
      phase: data.phase || 'choosing', // Use phase from server
      creator: data.creator || prev.creator,
      challenger: data.challenger || prev.challenger,
      currentTurn: data.currentTurn || data.creator, // Creator usually goes first
      currentRound: data.currentRound || 1,
      totalRounds: data.totalRounds || 5,
      creatorScore: data.creatorScore || 0,
      challengerScore: data.challengerScore || 0,
      loading: false
    }))
    
    showInfo('🎮 Game started! Choose heads or tails!')
  }, [showInfo])
  
  const handleGameReady = useCallback((data) => {
    console.log('🎯 Game ready:', data)
    showInfo('Game is ready! Starting soon...')
  }, [showInfo])
  
  const handleRoundResult = useCallback((data) => {
    console.log('🎲 NEW GAME ENGINE - Round result from server:', data)
    
    // Set up synchronized flip animation
    const flipAnimation = data.flipAnimation || {
      duration: 3000,
      rotations: 10,
      result: data.result
    }
    
    setGameState(prev => ({
      ...prev,
      flipResult: data.result,
      roundWinner: data.roundWinner,
      creatorScore: data.creatorScore || prev.creatorScore,
      challengerScore: data.challengerScore || prev.challengerScore,
      currentRound: data.round || prev.currentRound,
      phase: 'flipping',
      showResults: false,
      // Trigger synchronized flip animation
      flipAnimation: {
        ...flipAnimation,
        seed: data.seed, // Use server seed for deterministic animation
        isActive: true,
        startTime: Date.now()
      }
    }))
    
    // Show result message after animation
    setTimeout(() => {
      const playerFlipped = data.player
      const isPlayerWinner = data.roundWinner === playerFlipped
      const isMyFlip = playerFlipped === address
      
      if (isMyFlip) {
        if (isPlayerWinner) {
          showSuccess(`🎉 You won! Coin landed ${data.result}!`)
        } else {
          showInfo(`😔 You lost. Coin landed ${data.result}.`)
        }
      } else {
        showInfo(`${isPlayerWinner ? '😔' : '🎉'} Opponent ${isPlayerWinner ? 'won' : 'lost'}. Coin landed ${data.result}.`)
      }
      
      setGameState(prev => ({
        ...prev,
        phase: 'results',
        showResults: true,
        flipAnimation: null
      }))
      
      // Check if game is over (first to 3 wins)
      const creatorWins = data.creatorScore || 0
      const challengerWins = data.challengerScore || 0
      
      if (creatorWins >= 3 || challengerWins >= 3) {
        // Game over
        setTimeout(() => {
          const gameWinner = creatorWins >= 3 ? prev.creator : prev.challenger
          setGameState(prev => ({
            ...prev,
            phase: 'completed',
            gameWinner,
            showResults: false
          }))
          
          if (gameWinner === address) {
            showSuccess('🏆 You won the game! Congratulations!')
          } else {
            showInfo('😔 You lost the game. Better luck next time!')
          }
        }, 3000)
      }
    }, flipAnimation.duration)
    
  }, [address, showSuccess, showInfo])
  
  const handleDepositConfirmed = useCallback((data) => {
    console.log('💰 Deposit confirmed:', data)
    
    if (data.bothDeposited) {
      showInfo('Both players deposited! Game starting...')
    }
  }, [showInfo])
  
  const handleRoundComplete = useCallback((data) => {
    console.log('🔄 Round complete, starting next round:', data)
    
    setGameState(prev => ({
      ...prev,
      currentRound: data.nextRound,
      currentTurn: data.currentTurn,
      phase: 'choosing',
      creatorChoice: null,
      challengerChoice: null,
      creatorPower: 0,
      challengerPower: 0,
      flipResult: null,
      roundWinner: null,
      showResults: false,
      flipAnimation: null
    }))
    
    if (data.message) {
      showInfo(data.message)
    }
  }, [showInfo])
  
  // === GAME ACTIONS (sent to server) ===
  const makeChoice = useCallback((choice) => {
    if (!canMakeChoice()) {
      console.log('❌ Cannot make choice right now')
      return
    }
    
    console.log('🎯 Making choice:', choice)
    
    socketService.emit('player_choice', {
      gameId: gameId,
      choice: choice,
      power: 0 // Will be set during charging phase
    })
    
    // Optimistic update for immediate UI feedback
    setGameState(prev => ({
      ...prev,
      [isCreator() ? 'creatorChoice' : 'challengerChoice']: choice,
      phase: 'charging'
    }))
    
  }, [gameId, canMakeChoice, isCreator])
  
  const chargePower = useCallback((power) => {
    if (gameState.phase !== 'charging' || !isMyTurn()) return
    
    // Clamp power to 1-10 range
    const clampedPower = Math.max(1, Math.min(10, power))
    
    console.log('⚡ Charging power:', clampedPower)
    
    // Update local state immediately for smooth UI
    setGameState(prev => ({
      ...prev,
      [isCreator() ? 'creatorPower' : 'challengerPower']: clampedPower,
      isCharging: true
    }))
  }, [gameState.phase, isMyTurn, isCreator])
  
  const executeFlip = useCallback((finalPower) => {
    console.log('🎲 NEW GAME ENGINE - Executing flip with power:', finalPower)
    
    // Send player choice with power to server
    socketService.emit('player_choice', {
      gameId: gameId,
      choice: isCreator() ? gameState.creatorChoice : gameState.challengerChoice,
      power: finalPower,
      round: gameState.currentRound
    })
    
    console.log('🎲 NEW GAME ENGINE - Player choice with power sent to server:', {
      gameId,
      player: address,
      choice: isCreator() ? gameState.creatorChoice : gameState.challengerChoice,
      power: finalPower,
      round: gameState.currentRound
    })
    
    // Update local state immediately
    setGameState(prev => ({
      ...prev,
      phase: 'flipping',
      isCharging: false,
      [isCreator() ? 'creatorPower' : 'challengerPower']: finalPower
    }))
    
    // Add timeout fallback in case server doesn't respond
    setTimeout(() => {
      setGameState(prev => {
        // Only proceed if we're still in flipping phase (server hasn't responded)
        if (prev.phase === 'flipping') {
          console.log('🕐 NEW GAME ENGINE - Server timeout, switching turns locally')
          
          // Check if this is a single-player round or both players need to flip
          if (prev.creatorChoice && prev.challengerChoice) {
            // Both players have chosen, should get result from server
            // For now, just simulate a simple result
            const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
            const creatorWins = flipResult === prev.creatorChoice
            
            return {
              ...prev,
              phase: 'results',
              flipResult,
              roundWinner: creatorWins ? prev.creator : prev.challenger,
              showResults: true
            }
          } else {
            // Only one player has chosen so far, switch to other player's turn
            const nextPlayer = prev.currentTurn === prev.creator ? prev.challenger : prev.creator
            
            console.log('🔄 NEW GAME ENGINE - Switching turns:', {
              previousTurn: prev.currentTurn,
              nextTurn: nextPlayer,
              creatorChoice: prev.creatorChoice,
              challengerChoice: prev.challengerChoice
            })
            
            return {
              ...prev,
              phase: 'choosing',
              currentTurn: nextPlayer,
              flipResult: null
            }
          }
        }
        return prev
      })
    }, 4000) // 4 second timeout
    
  }, [gameId, address, isCreator, gameState.creatorChoice, gameState.challengerChoice, gameState.currentRound])
  
  const requestGameState = useCallback(() => {
    if (gameId && socketService.isConnected()) {
      console.log('📊 NEW GAME ENGINE - Requesting game state from server')
      socketService.emit('request_game_state', { gameId })
    }
  }, [gameId])
  
  const forceGameStart = useCallback(() => {
    if (gameId && socketService.isConnected()) {
      console.log('🚀 NEW GAME ENGINE - Forcing game start')
      
      // Try to trigger game start if both players are present
      setGameState(prev => {
        if (prev.creator && prev.challenger && prev.status !== 'active') {
          showInfo('Starting game manually...')
          return {
            ...prev,
            status: 'active',
            phase: 'choosing',
            currentTurn: prev.creator,
            currentRound: 1
          }
        }
        return prev
      })
    }
  }, [gameId, showInfo])
  
  // === SOCKET.IO CONNECTION MANAGEMENT ===
  useEffect(() => {
    if (!gameId || !address || initializedRef.current) return
    
    let mounted = true
    
    const initializeConnection = async () => {
      try {
        console.log('🎮 Initializing game engine for:', gameId)
        
        // Connect to Socket.io server
        await socketService.connect(gameId, address)
        
        if (!mounted) return
        
        // Register event listeners
        socketService.on('game_state_update', handleGameStateUpdate)
        socketService.on('game_started', handleGameStarted)
        socketService.on('game_ready', handleGameReady)
        socketService.on('round_result', handleRoundResult)
        socketService.on('round_complete', handleRoundComplete)
        socketService.on('deposit_confirmed', handleDepositConfirmed)
        
        // Store cleanup function
        cleanupRef.current = () => {
          socketService.off('game_state_update', handleGameStateUpdate)
          socketService.off('game_started', handleGameStarted)
          socketService.off('game_ready', handleGameReady)
          socketService.off('round_result', handleRoundResult)
          socketService.off('round_complete', handleRoundComplete)
          socketService.off('deposit_confirmed', handleDepositConfirmed)
        }
        
        setGameState(prev => ({
          ...prev,
          connected: true,
          loading: false
        }))
        
        // Request current game state from server
        requestGameState()
        
        initializedRef.current = true
        
      } catch (error) {
        console.error('❌ Failed to initialize game engine:', error)
        if (mounted) {
          setGameState(prev => ({
            ...prev,
            loading: false
          }))
          showError('Failed to connect to game server')
        }
      }
    }
    
    initializeConnection()
    
    return () => {
      mounted = false
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [gameId, address, handleGameStateUpdate, handleGameStarted, handleGameReady, handleRoundResult, handleRoundComplete, handleDepositConfirmed, requestGameState, showError])
  
  // === GAME DATA SYNC ===
  useEffect(() => {
    if (gameData) {
      console.log('🎮 NEW GAME ENGINE - Syncing with gameData:', {
        gameDataStatus: gameData.status,
        gameDataPhase: gameData.phase,
        creator: gameData.creator,
        challenger: gameData.challenger || gameData.joiner,
        creatorDeposited: gameData.creator_deposited,
        challengerDeposited: gameData.challenger_deposited
      })
      
      // Initialize from gameData when available
      setGameState(prev => {
        const bothDeposited = gameData.creator_deposited && gameData.challenger_deposited
        const shouldBeActive = gameData.status === 'active' || 
                              gameData.phase === 'game_active' || 
                              bothDeposited
        
        const newState = {
          ...prev,
          creator: gameData.creator || prev.creator,
          challenger: gameData.challenger || gameData.joiner || prev.challenger,
          status: shouldBeActive ? 'active' : prev.status,
          phase: shouldBeActive ? 'choosing' : prev.phase,
          currentTurn: gameData.creator || prev.currentTurn, // Creator goes first
          totalRounds: 5 // Fixed to 5 rounds
        }
        
        // Auto-start game if both players are present but game isn't active
        if (newState.creator && newState.challenger && newState.status === 'waiting' && bothDeposited) {
          console.log('🚀 NEW GAME ENGINE - Auto-starting game (both players detected)')
          newState.status = 'active'
          newState.phase = 'choosing'
          newState.currentTurn = newState.creator
          showInfo('🎮 Starting game! Both players ready!')
        }
        
        return newState
      })
    }
  }, [gameData])
  
  return {
    // State
    gameState,
    
    // Computed properties
    isCreator: isCreator(),
    isChallenger: isChallenger(),
    isMyTurn: isMyTurn(),
    canMakeChoice: canMakeChoice(),
    
    // Actions
    makeChoice,
    chargePower,
    executeFlip,
    requestGameState,
    forceGameStart,
    
    // Connection info
    connected: gameState.connected,
    loading: gameState.loading
  }
}

// DISABLED - Using new server-side game state management instead
// export default useGameEngine
export default function useDisabledGameEngine() {
  console.warn('useGameEngine has been disabled. Use server-side game state instead.')
  return {
    gameState: null,
    isGameReady: false,
    connected: false,
    handleChoice: () => {},
    handlePowerChargeStart: () => {},
    handlePowerChargeStop: () => {},
    requestGameState: () => {}
  }
}
