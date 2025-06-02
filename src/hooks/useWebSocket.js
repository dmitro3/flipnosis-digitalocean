import { useEffect, useRef, useState, useCallback } from 'react'

export const useWebSocket = (gameId, playerAddress, isCreator, gameConfig = null) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState({
    gameId: gameId,
    creator: null,
    joiner: null,
    phase: 'waiting',
    currentRound: 1,
    maxRounds: 5,
    creatorWins: 0,
    joinerWins: 0,
    winner: null,
    currentPlayer: null,
    spectators: 0,
    flipState: {
      creatorPower: 0,
      joinerPower: 0,
      creatorReady: false,
      joinerReady: false,
      flipResult: null,
      roundTimer: 30
    }
  })

  // Initialize WebSocket connection
  useEffect(() => {
    if (!gameId || !playerAddress) return

    console.log('🔌 Connecting to WebSocket server...')
    
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://your-production-domain.com' 
      : 'ws://localhost:3001'
    
    const newSocket = new WebSocket(wsUrl)

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
      try {
        const data = JSON.parse(event.data)
        console.log('📊 Received WebSocket message:', data.type, data)
        
        // Handle different message types
        switch (data.type) {
          case 'game_data_response':
            // Game data received from database
            if (data.gameData) {
              console.log('📋 Received game data from database:', data.gameData)
              // You can emit this data to parent component if needed
            }
            break
          
          case 'error':
            console.error('❌ WebSocket error:', data.error)
            break
          
          default:
            // Update game state from server
            if (data.state) {
              setGameState(prevState => ({
                ...prevState,
                ...data.state
              }))
            }
            break
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    newSocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    setSocket(newSocket)

    return () => {
      console.log('🔌 Cleaning up WebSocket connection')
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close()
      }
    }
  }, [gameId, playerAddress, isCreator])

  // WebSocket action functions
  const sendMessage = useCallback((message) => {
    if (socket && connected && socket.readyState === WebSocket.OPEN) {
      console.log('📤 Sending WebSocket message:', message.type, message)
      socket.send(JSON.stringify(message))
    } else {
      console.error('❌ Cannot send message - WebSocket not connected')
    }
  }, [socket, connected])

  const startGame = useCallback(() => {
    sendMessage({ type: 'start_game', gameId })
  }, [sendMessage, gameId])

  const joinGame = useCallback((joinerAddress) => {
    sendMessage({ 
      type: 'player_joined', 
      gameId, 
      joinerAddress, 
      startGame: true 
    })
  }, [sendMessage, gameId])

  const flipComplete = useCallback((result, power) => {
    sendMessage({ 
      type: 'flip_complete', 
      gameId, 
      player: isCreator ? 'creator' : 'joiner',
      result,
      power
    })
  }, [sendMessage, gameId, isCreator])

  const updatePower = useCallback((power) => {
    sendMessage({
      type: 'charge_power',
      gameId,
      address: playerAddress,
      power
    })
  }, [sendMessage, gameId, playerAddress])

  // Derived state
  const isMyTurn = gameState.currentPlayer === playerAddress
  const scores = {
    creator: gameState.creatorWins || 0,
    joiner: gameState.joinerWins || 0
  }
  const spectatorCount = gameState.spectators || 0
  const currentRound = gameState.currentRound || 1
  const gamePhase = gameState.phase || 'waiting'

  return {
    connected,
    gameState,
    gamePhase,
    currentRound,
    scores,
    spectatorCount,
    isMyTurn,
    sendMessage,
    startGame,
    joinGame,
    flipComplete,
    updatePower
  }
} 