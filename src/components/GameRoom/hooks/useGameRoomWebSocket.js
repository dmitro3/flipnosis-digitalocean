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

  // FIXED: Better WebSocket message handler for game room events
  const handleWebSocketMessage = (data) => {
    console.log('🎮 Game room message received:', data)
    
    switch (data.type) {
      case 'GAME_ROOM_JOINED':
        console.log('✅ Joined game room:', data)
        showInfo('Joined game room successfully')
        break
        
      case 'OPPONENT_JOINED':
        console.log('🎮 Opponent joined! Starting game...')
        showInfo('Opponent joined! Game starting...')
        break
        
      case 'ROUND_STARTED':
        console.log('🔄 Round started:', data)
        window.dispatchEvent(new CustomEvent('gameRoomRoundStarted', { detail: data }))
        break
        
      case 'CHOICE_MADE':
        console.log('🎯 Choice made:', data)
        window.dispatchEvent(new CustomEvent('gameRoomChoiceMade', { detail: data }))
        break
        
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
        
      case 'POWER_CHARGED':
        console.log('⚡ Power charged:', data)
        window.dispatchEvent(new CustomEvent('gameRoomPowerCharged', { detail: data }))
        break
        
      case 'BOTH_POWERS_CHARGED':
        console.log('⚡ Both powers charged, executing flip')
        window.dispatchEvent(new CustomEvent('gameRoomBothPowersCharged', { detail: data }))
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

  // FIXED: Better player choice handling
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

      console.log('🎯 Sending choice:', { choice, oppositeChoice, player: address })

      // FIXED: Send choice using the proper message format
      webSocketService.send({
        type: 'MAKE_CHOICE',
        gameId,
        player: address,
        choice,
        oppositeChoice,
        round: 1 // This will be updated by the server based on current round
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
          type: 'POWER_CHARGE_START',
          gameId,
          player: address
        })
      }
    } catch (error) {
      console.error('❌ Error in handlePowerChargeStart:', error)
      showError('Failed to send power charge start to server')
    }
  }

  // FIXED: Better power charge handling
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

      const validPowerLevel = Math.min(10, Math.max(1, powerLevel || 5))

      console.log('⚡ Sending power charge:', { powerLevel: validPowerLevel, player: address })

      // FIXED: Send power charge using the proper message format
      webSocketService.send({
        type: 'POWER_CHARGED',
        gameId,
        player: address,
        powerLevel: validPowerLevel,
        round: 1 // This will be updated by the server based on current round
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
          type: 'FORFEIT_GAME',
          gameId,
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
