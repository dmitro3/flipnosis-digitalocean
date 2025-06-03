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
    currentPlayerChoice: null,
    creatorChoice: null,
    joinerChoice: null,
    spectators: 0,
    syncedFlip: null,
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
      ? 'wss://cryptoflipz2-production.up.railway.app' 
      : 'ws://localhost:3001'
    
    const newSocket = new WebSocket(wsUrl)

    newSocket.onopen = () => {
      console.log('✅ Connected to WebSocket server')
      setConnected(true)
      
      newSocket.send(JSON.stringify({
        type: 'connect_to_game',
        gameId, 
        address: playerAddress
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
        
        switch (data.type) {
          case 'game_data_response':
            if (data.gameData) {
              console.log('📋 Received game data from database:', data.gameData)
            }
            break
          
          case 'error':
            console.error('❌ WebSocket error:', data.error)
            break
          
          case 'game_state':
          case 'game_started':
          case 'turn_switch':
          case 'choice_made':
          case 'power_charging':
          case 'synchronized_flip':
          case 'flip_result':
          case 'game_complete':
          case 'player_joined':
          case 'spectator_update':
            if (data.state) {
              setGameState(prevState => ({
                ...prevState,
                ...data.state
              }))
            }
            break
          
          default:
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
  }, [gameId, playerAddress])

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

 const joinGame = useCallback((joinerAddress, entryFeeHash) => {
   sendMessage({ 
     type: 'join_game', 
     gameId, 
     role: 'joiner',
     address: joinerAddress,
     entryFeeHash: entryFeeHash
   })
 }, [sendMessage, gameId])

 const makeChoice = useCallback((choice) => {
   sendMessage({
     type: 'make_choice',
     gameId,
     address: playerAddress,
     choice: choice // 'heads' or 'tails'
   })
 }, [sendMessage, gameId, playerAddress])

 const startCharging = useCallback(() => {
   sendMessage({
     type: 'start_charging',
     gameId,
     address: playerAddress
   })
 }, [sendMessage, gameId, playerAddress])

 const stopCharging = useCallback(() => {
   sendMessage({
     type: 'stop_charging',
     gameId,
     address: playerAddress
   })
 }, [sendMessage, gameId, playerAddress])

 const flipComplete = useCallback((choice, power) => {
   sendMessage({ 
     type: 'flip_complete', 
     gameId, 
     address: playerAddress,
     choice: choice,
     power: power
   })
 }, [sendMessage, gameId, playerAddress])

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
   socket,
   gameState,
   gamePhase,
   currentRound,
   scores,
   spectatorCount,
   isMyTurn,
   sendMessage,
   startGame,
   joinGame,
   makeChoice,
   startCharging,
   stopCharging,
   flipComplete,
   updatePower
 }
} 