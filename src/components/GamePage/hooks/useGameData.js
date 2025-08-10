import { useEffect } from 'react'
import { useToast } from '../../../contexts/ToastContext'
import webSocketService from '../../../services/WebSocketService'

export const useGameData = (
  gameId, 
  gameData, 
  gameState, 
  address,
  wsRef, // This is no longer used, kept for compatibility
  setGameState,
  setPlayerChoices,
  setStreamedCoinState,
  handleFlipResult,
  handleGameCompleted,
  loadGameData, // Added this parameter
  playerChoices // Added this parameter
) => {
  const { showSuccess, showError, showInfo } = useToast()

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
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

        // With the new logic, both players should have choices immediately
        // since the opposite choice is automatically assigned
        const shouldTransitionToCharging = creatorChoice && challengerChoice
        
        // Update game state
        setGameState(prev => ({
          ...prev,
          phase: 'charging', // Always transition to charging since both choices are set
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
        if (currentTurn) {
          const isMyTurn = currentTurn === address
          if (isMyTurn) {
            showSuccess('🎯 Your turn! Hold the coin to charge power!')
          } else {
            showInfo(`⚡ ${currentTurn.slice(0, 6)}...'s turn to charge power!`)
          }
        } else {
          showSuccess('🎯 Both players have chosen! Hold the coin to charge power!')
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

      case 'power_phase_started':
        console.log('⚡ Power phase started:', data)
        const { currentTurn: powerPhaseTurn } = data
        
        setGameState(prev => ({
          ...prev,
          phase: 'power_charging',
          currentTurn: powerPhaseTurn
        }))
        
        const isMyTurnForPower = powerPhaseTurn === address
        if (isMyTurnForPower) {
          showSuccess('🎯 Your turn! Hold the coin to charge power!')
        } else {
          showInfo(`⚡ ${powerPhaseTurn.slice(0, 6)}...'s turn to charge power!`)
        }
        break

      case 'turn_switched':
        console.log('🔄 Turn switched:', data)
        const { currentTurn: newCurrentTurn } = data
        
        setGameState(prev => ({
          ...prev,
          currentTurn: newCurrentTurn
        }))
        
        const isMyTurnNow = newCurrentTurn === address
        if (isMyTurnNow) {
          showSuccess('🎯 Your turn! Hold the coin to charge power!')
        } else {
          showInfo(`⚡ ${newCurrentTurn.slice(0, 6)}...'s turn to charge power!`)
        }
        break

      case 'new_round_started':
        console.log('🔄 New round started:', data)
        const { roundNumber: newRoundNumber, creatorWins, challengerWins } = data
        
        setGameState(prev => ({
          ...prev,
          phase: 'waiting_for_choices',
          currentRound: newRoundNumber,
          creatorWins: creatorWins,
          challengerWins: challengerWins,
          creatorChoice: null,
          joinerChoice: null,
          currentTurn: null,
          creatorPower: 0,
          joinerPower: 0,
          chargingPlayer: null
        }))
        
        setPlayerChoices({
          creator: null,
          joiner: null
        })
        
        showSuccess(`🔄 Round ${newRoundNumber} started! Choose heads or tails!`)
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
        // Stop streaming mode
        setStreamedCoinState(prev => ({
          ...prev,
          isStreaming: false,
          frameData: null
        }))
        // Reset flip state
        setGameState(prev => ({
          ...prev,
          isFlipping: false, // Stop the flip animation
          phase: 'choosing' // Return to choosing phase for next round
        }))
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
          phase: 'flipping',
          isFlipping: true, // Add this to trigger coin animation
          flipResult: data.result, // Add the flip result
          flipDuration: data.duration || 3000 // Add flip duration
        }))
        break

      case 'COIN_FRAME':
        console.log('🎬 Received coin frame:', data.timestamp)
        setStreamedCoinState(prev => ({
          ...prev,
          frameData: data.frameData
        }))
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
        // Reload game data to trigger countdown
        loadGameData()
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
          joinerChoice: null,
          gameStarted: true // Add this to mark game as started
        }))
        // Also update player choices to reset them
        setPlayerChoices({
          creator: null,
          joiner: null
        })
        break

      case 'offer_accepted':
        console.log('🎉 Offer accepted notification:', data)
        showSuccess('🎉 Your offer was accepted! Redirecting to game...')
        // Update local state to show deposit UI immediately
        setGameState(prev => ({
          ...prev,
          phase: 'waiting_deposit'
        }))
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
            creator: broadcastPlayer === getGameCreator() ? broadcastChoice : (gameState.creatorChoice || (playerChoices && playerChoices.creator)),
            joiner: broadcastPlayer === getGameJoiner() ? broadcastChoice : (gameState.joinerChoice || (playerChoices && playerChoices.joiner))
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

      case 'game_status_update':
        console.log('🔄 Game status updated:', data)
        if (data.status === 'waiting_challenger_deposit') {
          // Force reload to ensure all data is fresh
          loadGameData()
          
          // Show appropriate message
          if (data.challenger === address) {
            showInfo('Your offer was accepted! Please deposit ETH to start the game.')
          } else {
            showInfo('Offer accepted! Waiting for challenger to deposit.')
          }
        }
        break

      case 'game_awaiting_challenger_deposit':
        console.log('💰 Game awaiting challenger deposit')
        showInfo('Game is waiting for challenger deposit')
        
        // Update game state to show deposit UI
        setGameState(prev => ({
          ...prev,
          phase: 'waiting_deposit'
        }))
        
        // Reload game data to get latest status and deadline
        loadGameData()
        break

      default:
        console.log('📨 Unhandled WebSocket message type:', data.type)
    }
  }

  // Helper functions
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address

  // Set up WebSocket message handlers
  useEffect(() => {
    if (gameId && address) {
      // Register message handlers with the WebSocket service
      webSocketService.on('player_choice_made', handleWebSocketMessage)
      webSocketService.on('choice_made_ready_to_flip', handleWebSocketMessage)
      webSocketService.on('turn_changed', handleWebSocketMessage)
      webSocketService.on('both_choices_made', handleWebSocketMessage)
      webSocketService.on('power_charge_started', handleWebSocketMessage)
      webSocketService.on('power_charged', handleWebSocketMessage)
      webSocketService.on('power_phase_started', handleWebSocketMessage)
      webSocketService.on('turn_switched', handleWebSocketMessage)
      webSocketService.on('new_round_started', handleWebSocketMessage)
      webSocketService.on('choice_update', handleWebSocketMessage)
      webSocketService.on('auto_flip_triggered', handleWebSocketMessage)
      webSocketService.on('PLAYER_CHOICE', handleWebSocketMessage)
      webSocketService.on('FLIP_RESULT', handleWebSocketMessage)
      webSocketService.on('FLIP_STARTED', handleWebSocketMessage)
      webSocketService.on('COIN_FRAME', handleWebSocketMessage)
      webSocketService.on('GAME_COMPLETED', handleWebSocketMessage)
      webSocketService.on('your_offer_accepted', handleWebSocketMessage)
      webSocketService.on('game_awaiting_challenger_deposit', handleWebSocketMessage)
      webSocketService.on('deposit_received', handleWebSocketMessage)
      webSocketService.on('game_started', handleWebSocketMessage)
      webSocketService.on('offer_accepted', handleWebSocketMessage)
      webSocketService.on('PLAYER_CHOICE_BROADCAST', handleWebSocketMessage)
      webSocketService.on('room_joined', handleWebSocketMessage)
      webSocketService.on('game_status_changed', handleWebSocketMessage)

      // Cleanup function
      return () => {
        // Remove all message handlers
        webSocketService.off('player_choice_made', handleWebSocketMessage)
        webSocketService.off('choice_made_ready_to_flip', handleWebSocketMessage)
        webSocketService.off('turn_changed', handleWebSocketMessage)
        webSocketService.off('both_choices_made', handleWebSocketMessage)
        webSocketService.off('power_charge_started', handleWebSocketMessage)
        webSocketService.off('power_charged', handleWebSocketMessage)
        webSocketService.off('power_phase_started', handleWebSocketMessage)
        webSocketService.off('turn_switched', handleWebSocketMessage)
        webSocketService.off('new_round_started', handleWebSocketMessage)
        webSocketService.off('choice_update', handleWebSocketMessage)
        webSocketService.off('auto_flip_triggered', handleWebSocketMessage)
        webSocketService.off('PLAYER_CHOICE', handleWebSocketMessage)
        webSocketService.off('FLIP_RESULT', handleWebSocketMessage)
        webSocketService.off('FLIP_STARTED', handleWebSocketMessage)
        webSocketService.off('COIN_FRAME', handleWebSocketMessage)
        webSocketService.off('GAME_COMPLETED', handleWebSocketMessage)
        webSocketService.off('your_offer_accepted', handleWebSocketMessage)
        webSocketService.off('game_awaiting_challenger_deposit', handleWebSocketMessage)
        webSocketService.off('deposit_received', handleWebSocketMessage)
        webSocketService.off('game_started', handleWebSocketMessage)
        webSocketService.off('offer_accepted', handleWebSocketMessage)
        webSocketService.off('PLAYER_CHOICE_BROADCAST', handleWebSocketMessage)
        webSocketService.off('room_joined', handleWebSocketMessage)
        webSocketService.off('game_status_changed', handleWebSocketMessage)
      }
    }
  }, [gameId, address, gameData, gameState, playerChoices, setGameState, setPlayerChoices, setStreamedCoinState, handleFlipResult, handleGameCompleted, loadGameData])

  return {
    handleWebSocketMessage
  }
} 