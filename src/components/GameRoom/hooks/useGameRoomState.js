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
    joinerWins: 0
  })

  const [playerChoices, setPlayerChoices] = useState({ creator: null, joiner: null })
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [resultData, setResultData] = useState(null)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [roundCountdown, setRoundCountdown] = useState(null)
  const [roundCountdownInterval, setRoundCountdownInterval] = useState(null)

  // Coin state
  const [streamedCoinState, setStreamedCoinState] = useState({
    isStreaming: false,
    frameData: null,
    flipStartTime: null,
    duration: 3000
  })

  // Helper functions
  const getGameCreator = () => gameData?.creator || gameData?.creator_address
  const getGameJoiner = () => gameData?.challenger || gameData?.joiner || gameData?.joiner_address || gameData?.challenger_address

  const isCreator = () => address === getGameCreator()
  const isJoiner = () => {
    if (!address || !gameData) return false
    
    const challengerAddress = gameData?.challenger || gameData?.joiner || 
      gameData?.joiner_address || gameData?.challenger_address
    
    if (!challengerAddress) return false
    
    return address.toLowerCase() === challengerAddress.toLowerCase()
  }

  const isMyTurn = () => {
    // Don't allow turns if game hasn't started yet
    if (!gameData?.creator_deposited || !gameData?.challenger_deposited || gameData?.status !== 'active') {
      return false
    }

    if (gameState.phase === 'choosing') {
      // Round-based turn system
      if (gameState.currentRound === 1 || gameState.currentRound === 3 || gameState.currentRound === 5) {
        return isCreator() && !gameState.creatorChoice
      } else {
        return isJoiner() && !gameState.joinerChoice
      }
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

  // Handle auto flip for round 5
  const handleAutoFlip = () => {
    try {
      showInfo('Round 5 - Auto-flipping at maximum power!')

      const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'

      setGameState(prev => ({
        ...prev,
        creatorChoice: autoChoice,
        joinerChoice: autoChoice
      }))

      setPlayerChoices(prev => ({
        creator: autoChoice,
        joiner: autoChoice
      }))
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

    setGameState(prev => ({
      ...prev,
      phase: 'flipping',
      flipResult: safeResult.result,
      roundWinner: safeResult.roundWinner,
      creatorPower: safeResult.creatorPower || 0,
      joinerPower: safeResult.joinerPower || 0
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

  // Reset game state for next round
  const resetForNextRound = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'choosing',
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

    setStreamedCoinState({
      isStreaming: false,
      frameData: null,
      flipStartTime: null,
      duration: 3000
    })
  }

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
    streamedCoinState,

    // Actions
    setGameState,
    setPlayerChoices,
    setStreamedCoinState,
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
    getGameJoiner
  }
}
