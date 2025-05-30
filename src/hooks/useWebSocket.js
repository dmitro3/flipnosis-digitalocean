import { useEffect, useRef, useState, useCallback } from 'react'
import { CONFIG } from '../config'

export const useWebSocket = (gameId, playerAddress, isCreator, gameConfig = null) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [gamePhase, setGamePhase] = useState('waiting')
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [flipState, setFlipState] = useState({
    creatorPower: 0,
    joinerPower: 0,
    creatorCharging: false,
    joinerCharging: false,
    creatorReady: false,
    joinerReady: false,
    flipResult: null,
    roundTimer: 30
  })
  
  // Derived state from gameState
  const currentRound = gameState?.currentRound || 1
  const scores = gameState?.scores || { creator: 0, joiner: 0 }
  const spectatorCount = gameState?.spectators?.size || 0
  const isMyTurn = currentPlayer === playerAddress

  // Initialize WebSocket connection
  useEffect(() => {
    if (!gameId || !playerAddress) return

    console.log('🔌 Connecting to WebSocket server...')
    
    const newSocket = new WebSocket(CONFIG.WEBSOCKET_URL)

    newSocket.onopen = () => {
      console.log('✅ Connected to WebSocket server')
      setConnected(true)
      
      // Join the game room
      newSocket.send(JSON.stringify({
        type: 'join_game',
        gameId, 
        address: playerAddress, 
        role: isCreator ? 'creator' : 'joiner',
        gameConfig
      }))
    }

    newSocket.onclose = () => {
      console.log('❌ Disconnected from WebSocket server')
      setConnected(false)
    }

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('📊 Received message:', data)
      
      switch (data.type) {
        case 'game_state':
          setGameState(data.state)
          setGamePhase(data.state.phase || 'waiting')
          setCurrentPlayer(data.state.currentPlayer)
          break
        case 'player_joined':
          setGameState(data.state)
          setGamePhase(data.state.phase || 'ready')
          setCurrentPlayer(data.state.currentPlayer)
          break
        case 'game_started':
          setGameState(data.state)
          setGamePhase('round_active')
          setCurrentPlayer(data.currentPlayer)
          break
        case 'flip_result':
          setGameState(data.state)
          setGamePhase('round_complete')
          setCurrentPlayer(data.state.currentPlayer)
          break
        case 'game_complete':
          setGameState(data.state)
          setGamePhase('game_complete')
          setCurrentPlayer(null)
          break
        case 'round_complete':
          console.log('🏁 Round complete:', data.flipResult)
          setGameState(data.state)
          setGamePhase(data.state.phase)
          setCurrentPlayer(data.state.currentPlayer)
          break
        case 'flip_complete':
          console.log('🎲 Flip completed, updating state')
          setGameState(data.state)
          setGamePhase(data.state.phase)
          setCurrentPlayer(data.currentPlayer)
          break
        case 'turn_switch':
          console.log('🔄 Turn switched to:', data.currentPlayer)
          setCurrentPlayer(data.currentPlayer)
          setGameState(data.state)
          break
      }
    }

    newSocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    setSocket(newSocket)

    return () => {
      console.log('🔌 Cleaning up WebSocket connection')
      newSocket.close()
    }
  }, [gameId, playerAddress, isCreator])

  // WebSocket action functions
  const sendMessage = useCallback((message) => {
    if (socket && connected && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }, [socket, connected])

  const startRound = useCallback((roundNumber) => {
    sendMessage({ type: 'start_round', gameId, roundNumber })
  }, [sendMessage, gameId])

  const chargePower = useCallback((power) => {
    sendMessage({ type: 'charge_power', gameId, address: playerAddress, power })
  }, [sendMessage, gameId, playerAddress])

  const lockPower = useCallback((finalPower) => {
    sendMessage({ type: 'lock_power', gameId, address: playerAddress, power: finalPower })
  }, [sendMessage, gameId, playerAddress])

  return {
    connected,
    socket,
    gameState,
    gamePhase,
    currentRound,
    scores,
    spectatorCount,
    currentPlayer,
    isMyTurn,
    startRound,
    chargePower,
    lockPower,
    sendMessage
  }
} 