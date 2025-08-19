import { useState, useEffect } from 'react'
import webSocketService from '../../../services/WebSocketService'
import { useToast } from '../../../contexts/ToastContext'

export const useGameRoomWebSocket = (gameId, address, gameData) => {
  const { showError, showInfo } = useToast()
  const [wsConnected, setWsConnected] = useState(false)
  const [wsRef, setWsRef] = useState(null)

  // Initialize WebSocket connection for game room (private 2-player room)
  const initializeWebSocket = async () => {
    if (!gameId || !address) {
      console.log('⚠️ Cannot initialize game room WebSocket - missing gameId or address')
      return
    }

    try {
      console.log('🔌 Initializing game room WebSocket connection for game:', gameId)
      
      // Connect using the WebSocket service with private game room
      const gameRoomId = `game_room_${gameId}` // Private room for 2 players only
      const ws = await webSocketService.connect(gameRoomId, address)
      if (ws) {
        setWsRef(ws)
        setWsConnected(true)
        console.log('✅ Game room WebSocket connection established successfully')
      } else {
        console.error('❌ Failed to connect game room WebSocket')
        setWsConnected(false)
      }
    } catch (error) {
      console.error('❌ Failed to initialize game room WebSocket:', error)
      setWsConnected(false)
    }
  }

  // Set up connection state monitoring
  useEffect(() => {
    const checkConnectionState = () => {
      try {
        if (webSocketService && typeof webSocketService.isConnected === 'function') {
          const isConnected = webSocketService.isConnected()
          setWsConnected(isConnected)
        } else {
          const ws = webSocketService?.getWebSocket?.()
          const connected = ws && ws.readyState === WebSocket.OPEN
          setWsConnected(connected)
        }
      } catch (error) {
        console.error('❌ Error checking game room WebSocket connection:', error)
        setWsConnected(false)
      }
    }

    const interval = setInterval(checkConnectionState, 2000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  // Initialize WebSocket when game data is available
  useEffect(() => {
    if (gameId && address && gameData) {
      initializeWebSocket()
    }

    return () => {
      // Cleanup will be handled by the WebSocket service
    }
  }, [gameId, address, gameData])

  // WebSocket message handler for game room events
  const handleWebSocketMessage = (data) => {
    console.log('🎮 Game room message received:', data)
    
    switch (data.type) {
      case 'BOTH_CHOICES_MADE':
        console.log('✅ Both player choices made:', data)
        // Trigger an event that the game room state can listen to
        window.dispatchEvent(new CustomEvent('gameRoomChoicesMade', { 
          detail: {
            activePlayer: data.activePlayer,
            activeChoice: data.activeChoice,
            otherPlayer: data.otherPlayer,
            otherChoice: data.otherChoice,
            round: data.round
          }
        }))
        showInfo(`${data.activeChoice.toUpperCase()} vs ${data.otherChoice.toUpperCase()} - Power phase starting!`)
        break
        
      case 'POWER_PHASE_STARTED':
        console.log('⚡ Power phase started')
        window.dispatchEvent(new CustomEvent('gameRoomPowerPhase', { detail: data }))
        break
        
      case 'FLIP_RESULT':
        console.log('🎲 Flip result received:', data)
        window.dispatchEvent(new CustomEvent('gameRoomFlipResult', { detail: data }))
        break
        
      case 'ROUND_COMPLETED':
        console.log('🏁 Round completed:', data)
        window.dispatchEvent(new CustomEvent('gameRoomRoundComplete', { detail: data }))
        break
        
      case 'GAME_COMPLETED':
        console.log('🏆 Game completed:', data)
        window.dispatchEvent(new CustomEvent('gameRoomGameComplete', { detail: data }))
        break
        
      default:
        console.log('📨 Unhandled game room message:', data.type)
    }
  }

  // Set up WebSocket message listeners
  useEffect(() => {
    if (wsConnected && webSocketService) {
      // Add event listener for raw WebSocket messages
      const ws = webSocketService.getWebSocket()
      if (ws) {
        const messageHandler = (event) => {
          try {
            const data = JSON.parse(event.data)
            handleWebSocketMessage(data)
          } catch (error) {
            console.error('❌ Error parsing game room WebSocket message:', error)
          }
        }

        ws.addEventListener('message', messageHandler)
        
        return () => {
          ws.removeEventListener('message', messageHandler)
        }
      }
    }
  }, [wsConnected, webSocketService])

  // Game room specific message handlers
  const handlePlayerChoice = (choice) => {
    try {
      if (!webSocketService || typeof webSocketService.isConnected !== 'function') {
        showError('WebSocket service not available')
        return
      }
      
      if (!webSocketService.isConnected()) {
        showError('Not connected to game server')
        return
      }

      // Validate choice
      if (!['heads', 'tails'].includes(choice)) {
        console.error('❌ Invalid choice:', choice)
        return
      }

      // Determine the opposite choice for the other player
      const oppositeChoice = choice === 'heads' ? 'tails' : 'heads'

      // Send choice to server via WebSocket
      webSocketService.send({
        type: 'GAME_ACTION',
        gameId,
        action: 'MAKE_CHOICE',
        choice,
        oppositeChoice,
        player: address
      })
    } catch (error) {
      console.error('❌ Error in handlePlayerChoice:', error)
      showError('Failed to send choice to server')
    }
  }

  const handlePowerChargeStart = () => {
    try {
      if (webSocketService && typeof webSocketService.isConnected === 'function' && webSocketService.isConnected()) {
        webSocketService.send({
          type: 'GAME_ACTION',
          gameId,
          action: 'POWER_CHARGE_START',
          player: address
        })
      }
    } catch (error) {
      console.error('❌ Error in handlePowerChargeStart:', error)
      showError('Failed to send power charge start to server')
    }
  }

  const handlePowerChargeStop = async (powerLevel) => {
    try {
      if (!webSocketService || typeof webSocketService.isConnected !== 'function') {
        showError('WebSocket service not available')
        return
      }
      
      if (!webSocketService.isConnected()) {
        showError('Not connected to game server')
        return
      }

      const validPowerLevel = typeof powerLevel === 'number' && !isNaN(powerLevel) ? powerLevel : 5

      // Send power charge completion to server
      webSocketService.send({
        type: 'GAME_ACTION',
        gameId,
        action: 'POWER_CHARGED',
        player: address,
        powerLevel: validPowerLevel
      })
    } catch (error) {
      console.error('❌ Error in handlePowerChargeStop:', error)
      showError('Failed to send power charge to server')
    }
  }

  const handleForfeit = () => {
    try {
      if (webSocketService && typeof webSocketService.isConnected === 'function' && webSocketService.isConnected()) {
        webSocketService.send({
          type: 'GAME_ACTION',
          gameId,
          action: 'FORFEIT_GAME',
          player: address
        })
        showInfo('Game forfeited. Your opponent wins.')
      }
    } catch (error) {
      console.error('❌ Error in handleForfeit:', error)
      showError('Failed to forfeit game')
    }
  }

  // Detect disconnect and warn about forfeit
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (wsConnected) {
        const message = 'If you leave now, you will forfeit the game. Are you sure?'
        event.returnValue = message
        return message
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && wsConnected) {
        console.log('⚠️ Tab hidden - player may be leaving')
        // Could implement a timer here to forfeit if hidden too long
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [wsConnected])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webSocketService && typeof webSocketService.disconnect === 'function') {
        webSocketService.disconnect()
      }
    }
  }, [wsRef])

  return {
    wsConnected,
    wsRef: webSocketService?.getWebSocket?.() || null,
    webSocketService,
    handlePlayerChoice,
    handlePowerChargeStart,
    handlePowerChargeStop,
    handleForfeit
  }
}
