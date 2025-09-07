import { useState, useEffect } from 'react'
import { useToast } from '../../../contexts/ToastContext'
import socketService from '../../../services/SocketService'

export const useGameRoomState = (gameId, address, gameData) => {
  const { showSuccess, showError, showInfo } = useToast()

  // Game room specific state
  const [gameState, setGameState] = useState({
    phase: 'waiting', // waiting, choosing, charging, flipping, round_result, game_complete
    currentRound: 1,
    currentPlayer: null, // Track whose turn it is (creator or joiner address)
    roundPhase: 'player1_choice', // player1_choice, player1_flip, player2_choice, player2_flip, round_complete
    player1Choice: null,
    player2Choice: null,
    player1Power: 0,
    player2Power: 0,
    chargingStartTime: null,
    flipResult: null,
    roundWinner: null,
    creatorWins: 0,
    joinerWins: 0,
    flipSeed: null,
    isCharging: false // Track if currently charging power
  })

  const [playerChoices, setPlayerChoices] = useState({ creator: null, joiner: null })
  const [resultData, setResultData] = useState(null)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [roundCountdown, setRoundCountdown] = useState(null)
  const [roundCountdownInterval, setRoundCountdownInterval] = useState(null)

  // Flip animation state
  const [flipAnimation, setFlipAnimation] = useState(null)

  // Helper functions
  const getGameCreator = () => gameData?.creator
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address

  const isCreator = () => {
    if (!address || !gameData) return false
    const creatorAddress = getGameCreator()
    if (!creatorAddress) return false
    return address.toLowerCase() === creatorAddress.toLowerCase()
  }
  
  const isJoiner = () => {
    if (!address || !gameData) return false
    
    const challengerAddress = gameData?.challenger || gameData?.joiner || 
      gameData?.joiner_address || gameData?.challenger_address
    
    if (!challengerAddress) return false
    
    return address.toLowerCase() === challengerAddress.toLowerCase()
  }

  // Add function to determine who goes first each round
  const getFirstPlayer = (round) => {
    // Alternate who goes first each round
    return round % 2 === 1 ? getGameCreator() : getGameJoiner()
  }

  const isMyTurn = () => {
    if (!gameState.currentPlayer) return false
    return address?.toLowerCase() === gameState.currentPlayer?.toLowerCase()
  }

  // Replace the handlePlayerChoice function:
  const handlePlayerChoice = (choice) => {
    const isPlayer1Turn = gameState.roundPhase === 'player1_choice' && 
                          address === getFirstPlayer(gameState.currentRound)
    const isPlayer2Turn = gameState.roundPhase === 'player2_choice' && 
                          address !== getFirstPlayer(gameState.currentRound)
    
    if (!isPlayer1Turn && !isPlayer2Turn) {
      console.log('Not your turn to choose!')
      return
    }
    
    if (isPlayer1Turn) {
      setGameState(prev => ({
        ...prev,
        player1Choice: choice,
        roundPhase: 'player1_flip',
        phase: 'charging'
      }))
    } else {
      setGameState(prev => ({
        ...prev,
        player2Choice: choice,
        roundPhase: 'player2_flip',
        phase: 'charging'
      }))
    }
    
    // Stop countdown
    stopRoundCountdown()
    
    // Emit choice to server
    socketService.emit('game_action', {
      type: 'MAKE_CHOICE',
      gameId,
      player: address,
      choice,
      roundPhase: gameState.roundPhase
    })
  }

  // Add new power charging functions:
  const handlePowerChargeStart = () => {
    if (gameState.phase !== 'charging') return
    
    const canCharge = 
      (gameState.roundPhase === 'player1_flip' && address === getFirstPlayer(gameState.currentRound)) ||
      (gameState.roundPhase === 'player2_flip' && address !== getFirstPlayer(gameState.currentRound))
    
    if (!canCharge) return
    
    setGameState(prev => ({
      ...prev,
      isCharging: true,
      chargingStartTime: Date.now()
    }))
    
    // Start incrementing power
    const powerInterval = setInterval(() => {
      setGameState(prev => {
        if (!prev.isCharging) {
          clearInterval(powerInterval)
          return prev
        }
        
        const elapsed = (Date.now() - prev.chargingStartTime) / 1000
        const power = Math.min(10, Math.floor(elapsed * 2)) // Max power in 5 seconds
        
        if (prev.roundPhase === 'player1_flip') {
          return { ...prev, player1Power: power }
        } else {
          return { ...prev, player2Power: power }
        }
      })
    }, 100)
  }

  const handlePowerChargeStop = () => {
    if (!gameState.isCharging) return
    
    const finalPower = gameState.roundPhase === 'player1_flip' ? 
                       gameState.player1Power : gameState.player2Power
    
    setGameState(prev => ({
      ...prev,
      isCharging: false,
      phase: 'flipping'
    }))
    
    // Trigger flip animation
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    setFlipAnimation({
      isActive: true,
      result: flipResult,
      duration: 3000
    })
    
    // Emit flip action
    socketService.emit('game_action', {
      type: 'EXECUTE_FLIP',
      gameId,
      player: address,
      power: finalPower,
      roundPhase: gameState.roundPhase
    })
    
    // Handle flip result after animation
    setTimeout(() => {
      handleFlipComplete(flipResult)
    }, 3000)
  }

  // Add flip complete handler:
  const handleFlipComplete = (result) => {
    setFlipAnimation(null)
    
    if (gameState.roundPhase === 'player1_flip') {
      // Player 1 just flipped, now it's player 2's turn
      setGameState(prev => ({
        ...prev,
        phase: 'choosing',
        roundPhase: 'player2_choice',
        currentPlayer: prev.currentPlayer === getGameCreator() ? getGameJoiner() : getGameCreator()
      }))
      
      // Start countdown for player 2
      startRoundCountdown()
    } else {
      // Player 2 just flipped, determine round winner
      const player1Choice = gameState.player1Choice
      const player2Choice = gameState.player2Choice
      
      // Determine winner based on choices and result
      let roundWinner = null
      if (result === player1Choice) {
        roundWinner = getFirstPlayer(gameState.currentRound)
      } else if (result === player2Choice) {
        roundWinner = address === getGameCreator() ? getGameJoiner() : getGameCreator()
      }
      
      const newCreatorWins = roundWinner === getGameCreator() ? 
                             gameState.creatorWins + 1 : gameState.creatorWins
      const newJoinerWins = roundWinner === getGameJoiner() ? 
                            gameState.joinerWins + 1 : gameState.joinerWins
      
      setGameState(prev => ({
        ...prev,
        phase: 'round_result',
        roundWinner,
        flipResult: result,
        creatorWins: newCreatorWins,
        joinerWins: newJoinerWins
      }))
      
      // Show result popup
      setResultData({
        isWinner: roundWinner === address,
        flipResult: result,
        playerChoice: address === getFirstPlayer(gameState.currentRound) ? player1Choice : player2Choice,
        roundWinner
      })
      setShowResultPopup(true)
      
      // Check if game is over
      if (newCreatorWins >= 3 || newJoinerWins >= 3 || gameState.currentRound >= 5) {
        setTimeout(() => {
          handleGameCompleted({
            winner: newCreatorWins > newJoinerWins ? getGameCreator() : getGameJoiner(),
            finalScores: { creator: newCreatorWins, joiner: newJoinerWins }
          })
        }, 3000)
      } else {
        // Prepare for next round after showing results
        setTimeout(() => {
          resetForNextRound()
        }, 5000)
      }
    }
  }

  // Start round countdown timer
  const startRoundCountdown = () => {
    setRoundCountdown(20)

    const interval = setInterval(() => {
      setRoundCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setRoundCountdownInterval(null)

          // Check if it's round 5 - auto-flip at maximum power
          if (gameState.currentRound === 5) {
            handleAutoFlip()
            return null
          }

          if (isMyTurn()) {
            const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'
            const oppositeChoice = autoChoice === 'heads' ? 'tails' : 'heads'

            if (address === getGameCreator()) {
              setPlayerChoices(prev => ({ 
                ...prev, 
                creator: autoChoice,
                joiner: oppositeChoice
              }))
              setGameState(prev => ({
                ...prev,
                creatorChoice: autoChoice,
                joinerChoice: oppositeChoice
              }))
            } else if (address === getGameJoiner()) {
              setPlayerChoices(prev => ({ 
                ...prev, 
                joiner: autoChoice,
                creator: oppositeChoice
              }))
              setGameState(prev => ({
                ...prev,
                joinerChoice: autoChoice,
                creatorChoice: oppositeChoice
              }))
            }

            showInfo('🎲 Auto-flip triggered due to time limit!')
          }

          return null
        }
        return prev - 1
      })
    }, 1000)

    setRoundCountdownInterval(interval)
  }

  // Stop round countdown timer
  const stopRoundCountdown = () => {
    if (roundCountdownInterval) {
      clearInterval(roundCountdownInterval)
      setRoundCountdownInterval(null)
    }
    setRoundCountdown(null)
  }

  // FIXED: Better auto flip for round 5
  const handleAutoFlip = () => {
    try {
      showInfo('Round 5 - Auto-flipping at maximum power!')

      // FIXED: Set both choices to the same for round 5 auto-flip
      const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'

      setGameState(prev => ({
        ...prev,
        creatorChoice: autoChoice,
        joinerChoice: autoChoice,
        creatorPower: 10, // Max power
        joinerPower: 10   // Max power
      }))

      setPlayerChoices(prev => ({
        creator: autoChoice,
        joiner: autoChoice
      }))

      // Trigger the flip immediately
      setTimeout(() => {
        const result = Math.random() < 0.5 ? 'heads' : 'tails'
        const roundWinner = result === autoChoice ? getGameCreator() : getGameJoiner()
        
        handleFlipResult({
          result,
          roundWinner,
          creatorChoice: autoChoice,
          challengerChoice: autoChoice,
          creatorPower: 10,
          joinerPower: 10
        })
      }, 1000)
    } catch (error) {
      console.error('❌ Error in handleAutoFlip:', error)
      showError('Failed to trigger auto-flip')
    }
  }

  // Handle flip result
  const handleFlipResult = (result) => {
    let safeResult
    try {
      safeResult = JSON.parse(JSON.stringify(result))
    } catch (error) {
      safeResult = {
        roundWinner: result?.roundWinner,
        result: result?.result,
        creatorChoice: result?.creatorChoice,
        challengerChoice: result?.challengerChoice,
        creatorPower: result?.creatorPower,
        joinerPower: result?.joinerPower
      }
    }

    // FIXED: Update wins count
    let newCreatorWins = gameState.creatorWins
    let newJoinerWins = gameState.joinerWins
    
    if (safeResult.roundWinner === getGameCreator()) {
      newCreatorWins++
    } else if (safeResult.roundWinner === getGameJoiner()) {
      newJoinerWins++
    }

    setGameState(prev => ({
      ...prev,
      phase: 'flipping',
      flipResult: safeResult.result,
      roundWinner: safeResult.roundWinner,
      creatorPower: safeResult.creatorPower || 0,
      joinerPower: safeResult.joinerPower || 0,
      creatorWins: newCreatorWins,
      joinerWins: newJoinerWins
    }))

    setFlipAnimation({
      result: safeResult.result,
      roundWinner: safeResult.roundWinner,
      creatorChoice: safeResult.creatorChoice,
      challengerChoice: safeResult.challengerChoice,
      creatorPower: safeResult.creatorPower,
      joinerPower: safeResult.joinerPower
    })

    setTimeout(() => {
      setFlipAnimation(null)

      const isRoundWinner = safeResult.roundWinner === address
      const myChoice = isCreator() ? safeResult.creatorChoice : safeResult.challengerChoice

      setResultData({
        isWinner: isRoundWinner,
        flipResult: safeResult.result,
        playerChoice: myChoice,
        roundWinner: safeResult.roundWinner,
        creatorPower: safeResult.creatorPower,
        joinerPower: safeResult.joinerPower
      })
      setShowResultPopup(true)

      if (isRoundWinner) {
        showSuccess(`🎉 You won this round! The coin landed on ${safeResult.result.toUpperCase()}!`)
      } else {
        showInfo(`😔 You lost this round. The coin landed on ${safeResult.result.toUpperCase()}.`)
      }
    }, 3000)
  }

  // Handle game completed
  const handleGameCompleted = (data) => {
    let safeData
    try {
      safeData = JSON.parse(JSON.stringify(data))
    } catch (error) {
      safeData = {
        winner: data?.winner,
        finalResult: data?.finalResult,
        playerChoice: data?.playerChoice
      }
    }

    setGameState(prev => ({
      ...prev,
      phase: 'completed'
    }))

    setResultData({
      isWinner: safeData.winner === address,
      flipResult: safeData.finalResult,
      playerChoice: safeData.playerChoice,
      isGameComplete: true
    })
    setShowResultPopup(true)

    // Award XP based on game result
    const isWinner = safeData.winner === address
    const xpAmount = isWinner ? 1000 : 500
    const xpReason = isWinner ? 'Game Win' : 'Game Loss'
    
    // Award XP to the current player
    fetch(`/api/users/${address}/award-xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: xpAmount,
        reason: xpReason
      })
    }).then(response => {
      if (response.ok) {
        return response.json()
      }
    }).then(result => {
      if (result && result.xpGained) {
        showSuccess(`+${result.xpGained} XP earned for ${xpReason}!`);
      }
    }).catch(error => {
      console.error('Failed to award XP:', error);
    })
  }

  // Update resetForNextRound:
  const resetForNextRound = () => {
    const nextRound = gameState.currentRound + 1
    const nextFirstPlayer = getFirstPlayer(nextRound)
    
    setGameState(prev => ({
      ...prev,
      phase: 'choosing',
      currentRound: nextRound,
      currentPlayer: nextFirstPlayer,
      roundPhase: 'player1_choice',
      player1Choice: null,
      player2Choice: null,
      player1Power: 0,
      player2Power: 0,
      flipResult: null,
      roundWinner: null,
      isCharging: false
    }))
    
    setShowResultPopup(false)
    setResultData(null)
    
    // Start countdown for next round
    startRoundCountdown()
  }

  // Initialize game when both players are present
  useEffect(() => {
    console.log('🎮 Game room initialization check:', {
      gameData,
      creatorDeposited: gameData?.creator_deposited,
      challengerDeposited: gameData?.challenger_deposited,
      status: gameData?.status,
      phase: gameState.phase,
      roundCountdown,
      currentRound: gameState.currentRound
    })

    // Auto-start the game when both players have deposited and we're in choosing phase
    const creatorDeposited = gameData?.creator_deposited === 1 || gameData?.creator_deposited === true
    const challengerDeposited = gameData?.challenger_deposited === 1 || gameData?.challenger_deposited === true
    
    if (creatorDeposited && 
        challengerDeposited && 
        gameData?.status === 'active' && 
        gameState.phase === 'choosing' && 
        !roundCountdown && 
        gameState.currentRound <= 5) {
      
      console.log('🚀 Auto-starting game countdown!')
      startRoundCountdown()
    }
  }, [gameData, gameState.phase, roundCountdown, gameState.currentRound])

  // Listen for game room events from WebSocket
  useEffect(() => {
    const handleChoicesMade = (event) => {
      const { activePlayer, activeChoice, otherPlayer, otherChoice } = event.detail
      console.log('🎯 Handling choices made event:', event.detail)
      
      // Update player choices
      const creatorAddress = getGameCreator()
      const joinerAddress = getGameJoiner()
      
      let creatorChoice, joinerChoice
      if (activePlayer === creatorAddress) {
        creatorChoice = activeChoice
        joinerChoice = otherChoice
      } else {
        creatorChoice = otherChoice
        joinerChoice = activeChoice
      }
      
      setPlayerChoices({
        creator: creatorChoice,
        joiner: joinerChoice
      })
      
      setGameState(prev => ({
        ...prev,
        phase: 'charging',
        creatorChoice,
        joinerChoice
      }))
      
      // Stop the countdown since choices are made
      stopRoundCountdown()
    }
    
    const handlePowerPhase = (event) => {
      console.log('⚡ Power phase started')
      setGameState(prev => ({
        ...prev,
        phase: 'charging'
      }))
    }
    
    const handleFlipResult = (event) => {
      console.log('🎲 Handling flip result:', event.detail)
      handleFlipResult(event.detail)
    }
    
    const handleRoundComplete = (event) => {
      console.log('🏁 Round completed, preparing for next round')
      setTimeout(() => {
        resetForNextRound()
      }, 2000) // Give time to show results
    }
    
    const handleGameComplete = (event) => {
      console.log('🏆 Game completed!')
      handleGameCompleted(event.detail)
    }

    // Add event listeners
    window.addEventListener('gameRoomChoicesMade', handleChoicesMade)
    window.addEventListener('gameRoomPowerPhase', handlePowerPhase)
    window.addEventListener('gameRoomFlipResult', handleFlipResult)
    window.addEventListener('gameRoomRoundComplete', handleRoundComplete)
    window.addEventListener('gameRoomGameComplete', handleGameComplete)
    
    return () => {
      window.removeEventListener('gameRoomChoicesMade', handleChoicesMade)
      window.removeEventListener('gameRoomPowerPhase', handlePowerPhase)
      window.removeEventListener('gameRoomFlipResult', handleFlipResult)
      window.removeEventListener('gameRoomRoundComplete', handleRoundComplete)
      window.removeEventListener('gameRoomGameComplete', handleGameComplete)
    }
  }, [gameState.currentRound, getGameCreator, getGameJoiner])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roundCountdownInterval) {
        clearInterval(roundCountdownInterval)
      }
    }
  }, [roundCountdownInterval])

  return {
    // State
    gameState,
    playerChoices,
    flipAnimation,
    resultData,
    showResultPopup,
    roundCountdown,

    // Actions
    setGameState,
    setPlayerChoices,
    setFlipAnimation,
    handleFlipResult,
    handleGameCompleted,
    resetForNextRound,
    startRoundCountdown,
    stopRoundCountdown,
    handleAutoFlip,
    handlePlayerChoice,
    handlePowerChargeStart,
    handlePowerChargeStop,

    // Helpers
    isCreator,
    isJoiner,
    isMyTurn,
    getGameCreator,
    getGameJoiner,
    getFirstPlayer
  }
}
