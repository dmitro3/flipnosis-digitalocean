import { useEffect } from 'react'
import { useToast } from '../../../contexts/ToastContext'

export const useGameData = (
  gameId, 
  gameData, 
  gameState, 
  address,
  wsRef,
  setGameState,
  setPlayerChoices,
  setStreamedCoinState,
  handleFlipResult,
  handleGameCompleted
) => {
  const { showSuccess, showError, showInfo } = useToast()

  // Handle WebSocket messages
  const handleWebSocketMessage = (data, wsRef, setGameState, setPlayerChoices, setStreamedCoinState, handleFlipResult, handleGameCompleted) => {
    console.log('📨 WebSocket message received:', data)

    // Ensure data is valid
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Invalid WebSocket message format:', data)
      return
    }

    // Handle different message types
    switch (data.type) {
      case 'player_choice_made':
        console.log('🎯 Player choice received:', data)
        const { player, choice } = data

        // Update game state immediately
        setGameState(prev => ({
          ...prev,
          creatorChoice: player === getGameCreator() ? choice : prev.creatorChoice,
          joinerChoice: player === getGameJoiner() ? choice : prev.joinerChoice
        }))

        // Update player choices display
        setPlayerChoices(prev => ({
          ...prev,
          creator: player === getGameCreator() ? choice : prev.creator,
          joiner: player === getGameJoiner() ? choice : prev.joiner
        }))

        // Show notification only if it's from the other player
        if (player !== address) {
          const playerName = player === getGameCreator() ? 'Player 1' : 'Player 2'
          showInfo(`🎯 ${playerName} chose ${choice.toUpperCase()}!`)
        }
        break

      case 'choice_made_ready_to_flip':
        console.log('🎯 Choice made, ready to flip:', data)
        const { creatorChoice, challengerChoice, roundNumber, currentTurn, waitingFor } = data

        // Update game state to charging phase
        setGameState(prev => ({
          ...prev,
          phase: 'charging',
          creatorChoice,
          joinerChoice: challengerChoice,
          currentRound: roundNumber,
          currentTurn: currentTurn || null
        }))

        // Update player choices
        setPlayerChoices({
          creator: creatorChoice,
          joiner: challengerChoice
        })

        // Show appropriate message
        if (waitingFor) {
          showInfo(`Waiting for ${waitingFor.slice(0, 6)}... to choose...`)
        } else if (currentTurn) {
          const isMyTurn = currentTurn === address
          if (isMyTurn) {
            showSuccess('🎯 Your turn! Hold the coin to charge power!')
          } else {
            showInfo(`⚡ ${currentTurn.slice(0, 6)}...'s turn to charge power!`)
          }
        }
        break

      case 'turn_changed':
        console.log('🔄 Turn changed:', data)
        const { currentTurn: newTurn } = data

        setGameState(prev => ({
          ...prev,
          currentTurn: newTurn
        }))

        const isMyTurn = newTurn === address
        if (isMyTurn) {
          showSuccess('🎯 Your turn! Hold the coin to charge power!')
        } else {
          showInfo(`⚡ ${newTurn.slice(0, 6)}...'s turn to charge power!`)
        }
        break

      case 'both_choices_made':
        console.log('🎯 Both choices received:', data)
        const { creatorChoice: cChoice2, challengerChoice: jChoice2 } = data

        // Update state to charging phase
        setGameState(prev => ({
          ...prev,
          creatorChoice: cChoice2,
          joinerChoice: jChoice2,
          phase: 'charging'
        }))

        setPlayerChoices({
          creator: cChoice2,
          joiner: jChoice2
        })

        showSuccess('🎯 Both players have chosen! Hold the coin to charge power!')
        break

      case 'power_charge_started':
        console.log('⚡ Power charge started by:', data.player)
        const { player: chargingPlayer } = data

        // Update charging state
        setGameState(prev => ({
          ...prev,
          chargingPlayer: chargingPlayer
        }))

        // Show notification if it's the other player
        if (chargingPlayer !== address) {
          const playerName = chargingPlayer === getGameCreator() ? 'Player 1' : 'Player 2'
          showInfo(`⚡ ${playerName} is charging power!`)
        }
        break

      case 'power_charged':
        console.log('⚡ Power update received:', data)
        const { player: powerPlayer, powerLevel } = data

        // Update power levels
        setGameState(prev => ({
          ...prev,
          creatorPower: powerPlayer === getGameCreator() ? powerLevel : prev.creatorPower,
          joinerPower: powerPlayer === getGameJoiner() ? powerLevel : prev.joinerPower,
          chargingPlayer: null // Clear charging state when power is set
        }))

        // Show notification if it's the other player
        if (powerPlayer !== address) {
          const playerName = powerPlayer === getGameCreator() ? 'Player 1' : 'Player 2'
          showInfo(`⚡ ${playerName} charged power: ${powerLevel.toFixed(1)}/10`)
        }
        break

      case 'choice_update':
        console.log('🔄 Choice update:', data)
        break

      case 'auto_flip_triggered':
        console.log('🎲 Auto-flip triggered:', data)
        const { autoChoice } = data
        setGameState(prev => ({
          ...prev,
          creatorChoice: autoChoice,
          joinerChoice: autoChoice,
          phase: 'charging'
        }))

        setPlayerChoices({
          creator: autoChoice,
          joiner: autoChoice
        })

        showInfo('🎲 Auto-flip triggered due to time limit!')
        break

      case 'PLAYER_CHOICE':
        console.log('👤 Player made choice:', data)
        // Update UI to show player has made their choice
        if (data.player === getGameCreator()) {
          setPlayerChoices(prev => ({ ...prev, creator: data.choice }))
          setGameState(prev => ({ ...prev, creatorChoice: data.choice }))
        } else if (data.player === getGameJoiner()) {
          setPlayerChoices(prev => ({ ...prev, joiner: data.choice }))
          setGameState(prev => ({ ...prev, joinerChoice: data.choice }))
        }
        break

      case 'FLIP_RESULT':
        console.log('🎲 Flip result received:', data)
        handleFlipResult(data)
        break

      case 'FLIP_STARTED':
        console.log('🎬 Server-side flip started:', data)
        setStreamedCoinState(prev => ({
          ...prev,
          isStreaming: true,
          flipStartTime: Date.now(),
          duration: data.duration || 3000
        }))
        setGameState(prev => ({
          ...prev,
          phase: 'flipping'
        }))
        break

      case 'COIN_FRAME':
        console.log('🎬 Received coin frame:', data.timestamp)
        setStreamedCoinState(prev => ({
          ...prev,
          frameData: data.frameData
        }))
        break

      case 'FLIP_RESULT':
        console.log('🎲 Flip result received:', data)
        // Stop streaming mode
        setStreamedCoinState(prev => ({
          ...prev,
          isStreaming: false,
          frameData: null
        }))
        handleFlipResult(data)
        break

      case 'GAME_COMPLETED':
        console.log('🏁 Game completed:', data)
        handleGameCompleted(data)
        break

      case 'your_offer_accepted':
        console.log('🎉 Your offer was accepted!')
        showSuccess('Your offer has been accepted! Waiting for deposit...')
        setTimeout(() => {
          window.location.href = `/game/${data.gameId}`
        }, 2000)
        break

      case 'game_awaiting_challenger_deposit':
        console.log('💰 Game awaiting your deposit')
        showInfo('Game is waiting for your ETH deposit')
        break

      case 'deposit_received':
        console.log('✅ Deposit received:', data)
        if (data.bothDeposited) {
          showSuccess('🎮 Game is now active! Both players can start playing.')
          // Set game state to choosing phase immediately
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            creatorChoice: null,
            joinerChoice: null
          }))
        }
        break

      case 'game_started':
        console.log('🎮 Game started notification:', data)
        showSuccess('🎮 Game is now active! Choose heads or tails to begin!')
        setGameState(prev => ({
          ...prev,
          phase: 'choosing',
          creatorChoice: null,
          joinerChoice: null
        }))
        break

      case 'offer_accepted':
        console.log('🎉 Offer accepted notification:', data)
        showSuccess('🎉 Your offer was accepted! Redirecting to game...')
        setTimeout(() => {
          window.location.href = `/game/${data.gameId}`
        }, 2000)
        break

      case 'PLAYER_CHOICE_BROADCAST':
        console.log('🎯 Player choice broadcast received:', data)
        const { player: broadcastPlayer, choice: broadcastChoice } = data

        // Only process if it's from the other player
        if (broadcastPlayer !== address) {
          setGameState(prev => ({
            ...prev,
            creatorChoice: broadcastPlayer === getGameCreator() ? broadcastChoice : prev.creatorChoice,
            joinerChoice: broadcastPlayer === getGameJoiner() ? broadcastChoice : prev.joinerChoice
          }))

          setPlayerChoices(prev => ({
            ...prev,
            creator: broadcastPlayer === getGameCreator() ? broadcastChoice : prev.creator,
            joiner: broadcastPlayer === getGameJoiner() ? broadcastChoice : prev.joiner
          }))

          const otherPlayerName = broadcastPlayer === getGameCreator() ? 'Player 1' : 'Player 2'
          showInfo(`🎯 ${otherPlayerName} chose ${broadcastChoice.toUpperCase()}!`)

          // Check if both players have chosen
          const currentChoices = {
            creator: broadcastPlayer === getGameCreator() ? broadcastChoice : (gameState.creatorChoice || playerChoices.creator),
            joiner: broadcastPlayer === getGameJoiner() ? broadcastChoice : (gameState.joinerChoice || playerChoices.joiner)
          }

          if (currentChoices.creator && currentChoices.joiner) {
            console.log('🎯 Both players have chosen, transitioning to charging phase')
            setGameState(prev => ({
              ...prev,
              phase: 'charging'
            }))
            showSuccess('🎯 Both players have chosen! Hold the coin to charge power!')
          }
        }
        break

      case 'room_joined':
        console.log('🏠 Room joined successfully:', data)
        showInfo(`Connected to game room (${data.members} players)`)
        break

      case 'game_status_changed':
        console.log('🔄 Game status changed:', data)
        if (data.newStatus === 'active') {
          showSuccess('🎮 Game is now active! Choose heads or tails to begin!')
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            creatorChoice: null,
            joinerChoice: null
          }))
        }
        break

      default:
        console.log('📨 Unhandled WebSocket message type:', data.type)
    }
  }

  // Helper functions
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address

  // Set up WebSocket message handler
  useEffect(() => {
    if (wsRef && wsRef.readyState === WebSocket.OPEN) {
      wsRef.onmessage = (event) => {
        try {
          let data = JSON.parse(event.data)
          console.log('📨 Raw WebSocket message:', data)

          // Handle 'message' wrapper from Socket.IO if present
          if (data.type === 'message' && data.data) {
            handleWebSocketMessage(data.data, wsRef, setGameState, setPlayerChoices, setStreamedCoinState, handleFlipResult, handleGameCompleted)
          } else {
            handleWebSocketMessage(data, wsRef, setGameState, setPlayerChoices, setStreamedCoinState, handleFlipResult, handleGameCompleted)
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err, 'Raw data:', event.data)
        }
      }
    }
  }, [wsRef, gameData, address])

  return {
    handleWebSocketMessage
  }
} 