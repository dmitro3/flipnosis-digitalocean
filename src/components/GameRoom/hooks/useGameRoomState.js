import { useState, useEffect } from 'react'
import { useToast } from '../../../contexts/ToastContext'

export const useGameRoomState = (gameId, address, gameData) => {
  const { showSuccess, showError, showInfo } = useToast()

  // Game room specific state
  const [gameState, setGameState] = useState({
    phase: 'choosing', // choosing, charging, flipping, completed
    currentRound: 1,
    currentTurn: null,
    creatorChoice: null,
    joinerChoice: null,
    creatorPower: 0,
    joinerPower: 0,
    chargingPlayer: null,
    flipResult: null,
    roundWinner: null,
    creatorWins: 0,
    joinerWins: 0,
    flipSeed: null // For deterministic animations
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

  // FIXED: Better turn determination logic
  const getChoosingPlayer = (round) => {
    // Round 1, 3, 5: Creator chooses first
    // Round 2, 4: Joiner chooses first
    if (round === 1 || round === 3 || round === 5) {
      return getGameCreator()
    } else {
      return getGameJoiner()
    }
  }

  const isMyTurn = () => {
    // Don't allow turns if game hasn't started yet
    const creatorDeposited = gameData?.creator_deposited === 1 || gameData?.creator_deposited === true
    const challengerDeposited = gameData?.challenger_deposited === 1 || gameData?.challenger_deposited === true
    
    if (!creatorDeposited || !challengerDeposited || gameData?.status !== 'active') {
      console.log('🔍 Game not ready for turns:', { 
        creatorDeposited, 
        challengerDeposited, 
        status: gameData?.status 
      })
      return false
    }

    if (gameState.phase === 'choosing') {
      // FIXED: Use the proper turn determination
      const choosingPlayer = getChoosingPlayer(gameState.currentRound)
      const isMyTurnResult = address?.toLowerCase() === choosingPlayer?.toLowerCase() && 
             !gameState.creatorChoice && 
             !gameState.joinerChoice
      
      console.log('🔍 isMyTurn choosing phase:', { 
        address: address?.toLowerCase(), 
        choosingPlayer: choosingPlayer?.toLowerCase(), 
        hasCreatorChoice: !!gameState.creatorChoice,
        hasJoinerChoice: !!gameState.joinerChoice,
        isMyTurn: isMyTurnResult 
      })
      
      return isMyTurnResult
    }

    // Charging phase - check if it's this player's turn to charge
    if (gameState.phase === 'charging') {
      if (gameState.currentTurn) {
        return gameState.currentTurn === address
      } else {
        // Fallback: allow the player who made their choice to charge
        const hasMadeChoice = (isCreator() && gameState.creatorChoice) || (isJoiner() && gameState.joinerChoice)
        return hasMadeChoice
      }
    }

    // Other phases - no turn restrictions
    return true
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

  // FIXED: Better reset for next round
  const resetForNextRound = () => {
    const nextRound = gameState.currentRound + 1
    const gameOver = gameState.creatorWins >= 3 || gameState.joinerWins >= 3 || nextRound > 5

    if (gameOver) {
      // Game is complete
      const winner = gameState.creatorWins > gameState.joinerWins ? getGameCreator() : getGameJoiner()
      handleGameCompleted({
        winner,
        finalResult: gameState.flipResult,
        playerChoice: isCreator() ? gameState.creatorChoice : gameState.joinerChoice
      })
      return
    }

    setGameState(prev => ({
      ...prev,
      phase: 'choosing',
      currentRound: nextRound,
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

    setFlipAnimation(null)
    setShowResultPopup(false)
    setResultData(null)

    // Start countdown for next round
    setTimeout(() => {
      startRoundCountdown()
    }, 1000)
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

    // Helpers
    isCreator,
    isJoiner,
    isMyTurn,
    getGameCreator,
    getGameJoiner,
    getChoosingPlayer // FIXED: Export the turn determination function
  }
}
