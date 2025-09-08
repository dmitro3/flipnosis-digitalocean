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
    return isMyTurn() && 
           gameState.phase === 'choosing' && 
           gameState.status === 'active' &&
           !gameState.creatorChoice && 
           !gameState.challengerChoice
  }, [isMyTurn, gameState.phase, gameState.status, gameState.creatorChoice, gameState.challengerChoice])
  
  // === SOCKET.IO EVENT HANDLERS ===
  const handleGameStateUpdate = useCallback((data) => {
    console.log('🎮 Server game state update:', data)
    
    try {
      setGameState(prev => ({
        ...prev,
        // Update from server state (only if provided)
        status: data.status || prev.status,
        phase: data.phase || prev.phase,
        creator: data.creator || prev.creator,
        challenger: data.challenger || prev.challenger,
        currentTurn: data.currentTurn || prev.currentTurn,
        currentRound: data.currentRound || prev.currentRound,
        totalRounds: data.totalRounds || prev.totalRounds,
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
      }))
    } catch (error) {
      console.error('❌ Error updating game state:', error)
    }
  }, [])
  
  const handleGameStarted = useCallback((data) => {
    console.log('🚀 Game started by server:', data)
    
    setGameState(prev => ({
      ...prev,
      status: 'active',
      phase: 'choosing',
      creator: data.creator || prev.creator,
      challenger: data.challenger || prev.challenger,
      currentTurn: data.currentTurn || data.creator, // Creator usually goes first
      currentRound: data.currentRound || 1,
      loading: false
    }))
    
    showInfo('🎮 Game started! Choose heads or tails!')
  }, [showInfo])
  
  const handleGameReady = useCallback((data) => {
    console.log('🎯 Game ready:', data)
    showInfo('Game is ready! Starting soon...')
  }, [showInfo])
  
  const handleRoundResult = useCallback((data) => {
    console.log('🎲 Round result from server:', data)
    
    setGameState(prev => ({
      ...prev,
      flipResult: data.result,
      roundWinner: data.roundWinner,
      creatorScore: data.creatorScore,
      challengerScore: data.challengerScore,
      phase: 'results',
      showResults: true
    }))
    
    // Show result message
    const isWinner = data.roundWinner === address
    if (isWinner) {
      showSuccess(`🎉 You won! Coin landed ${data.result}!`)
    } else {
      showInfo(`😔 You lost. Coin landed ${data.result}.`)
    }
    
    // Auto-advance to next round after showing results
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        phase: 'choosing',
        showResults: false,
        creatorChoice: null,
        challengerChoice: null,
        flipResult: null,
        roundWinner: null
      }))
    }, 3000)
  }, [address, showSuccess, showInfo])
  
  const handleDepositConfirmed = useCallback((data) => {
    console.log('💰 Deposit confirmed:', data)
    
    if (data.bothDeposited) {
      showInfo('Both players deposited! Game starting...')
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
    
    console.log('⚡ Charging power:', power)
    
    // Update local state immediately for smooth UI
    setGameState(prev => ({
      ...prev,
      [isCreator() ? 'creatorPower' : 'challengerPower']: power,
      isCharging: true
    }))
  }, [gameState.phase, isMyTurn, isCreator])
  
  const executeFlip = useCallback((finalPower) => {
    console.log('🎲 Executing flip with power:', finalPower)
    
    socketService.emit('player_choice', {
      gameId: gameId,
      choice: isCreator() ? gameState.creatorChoice : gameState.challengerChoice,
      power: finalPower
    })
    
    setGameState(prev => ({
      ...prev,
      phase: 'flipping',
      isCharging: false,
      [isCreator() ? 'creatorPower' : 'challengerPower']: finalPower
    }))
    
  }, [gameId, isCreator, gameState.creatorChoice, gameState.challengerChoice])
  
  const requestGameState = useCallback(() => {
    if (gameId && socketService.isConnected()) {
      console.log('📊 Requesting game state from server')
      socketService.emit('request_game_state', { gameId })
    }
  }, [gameId])
  
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
        socketService.on('deposit_confirmed', handleDepositConfirmed)
        
        // Store cleanup function
        cleanupRef.current = () => {
          socketService.off('game_state_update', handleGameStateUpdate)
          socketService.off('game_started', handleGameStarted)
          socketService.off('game_ready', handleGameReady)
          socketService.off('round_result', handleRoundResult)
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
  }, [gameId, address, handleGameStateUpdate, handleGameStarted, handleGameReady, handleRoundResult, handleDepositConfirmed, requestGameState, showError])
  
  // === GAME DATA SYNC ===
  useEffect(() => {
    if (gameData && !gameState.creator) {
      // Initialize from gameData when available
      setGameState(prev => ({
        ...prev,
        creator: gameData.creator,
        challenger: gameData.challenger || gameData.joiner,
        status: gameData.status === 'active' ? 'active' : prev.status
      }))
    }
  }, [gameData, gameState.creator])
  
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
    
    // Connection info
    connected: gameState.connected,
    loading: gameState.loading
  }
}

export default useGameEngine
