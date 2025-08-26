import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import { useToast } from '../../../contexts/ToastContext'
import { useProfile } from '../../../contexts/ProfileContext'
import contractService from '../../../services/ContractService'
import webSocketService from '../../../services/WebSocketService'
import { getApiUrl } from '../../../config/api'

export const useUnifiedGameState = (gameId, address) => {
  const { showSuccess, showError, showInfo } = useToast()
  const { getPlayerName } = useProfile()

  // Game phases: 'waiting' | 'locked' | 'countdown' | 'choosing' | 'flipping' | 'result' | 'completed'
  const [gamePhase, setGamePhase] = useState('waiting')
  
  // Core game data
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Player state
  const [players, setPlayers] = useState({
    creator: { address: null, name: '', power: 0, choice: null },
    joiner: { address: null, name: '', power: 0, choice: null },
    current: null // Who's turn is it
  })
  
  const [spectators, setSpectators] = useState([])
  
  // Game state
  const [currentRound, setCurrentRound] = useState(1)
  const [scores, setScores] = useState({
    creator: 0,
    joiner: 0,
    round1: null,
    round2: null,
    round3: null,
    round4: null,
    round5: null
  })
  
  // Current round state
  const [playerChoice, setPlayerChoice] = useState(null)
  const [opponentChoice, setOpponentChoice] = useState(null)
  const [powerLevel, setPowerLevel] = useState(0)
  const [flipResult, setFlipResult] = useState(null)
  const [roundWinner, setRoundWinner] = useState(null)
  const [gameWinner, setGameWinner] = useState(null)
  
  // UI state
  const [showLockAnimation, setShowLockAnimation] = useState(false)
  const [countdownTime, setCountdownTime] = useState(0)
  const [depositTimeLeft, setDepositTimeLeft] = useState(120) // 2 minutes
  const [autoFlipTimer, setAutoFlipTimer] = useState(null)
  
  // Communication state
  const [offers, setOffers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  
  // Timers
  const depositTimerRef = useRef(null)
  const autoFlipTimerRef = useRef(null)
  const roundTimerRef = useRef(null)

  // Helper functions
  const isCreator = useCallback(() => {
    return address?.toLowerCase() === players.creator.address?.toLowerCase()
  }, [address, players.creator.address])

  const isJoiner = useCallback(() => {
    return address?.toLowerCase() === players.joiner.address?.toLowerCase()
  }, [address, players.joiner.address])

  const isSpectator = useCallback(() => {
    return !isCreator() && !isJoiner()
  }, [isCreator, isJoiner])

  const isMyTurn = useCallback(() => {
    return address?.toLowerCase() === players.current?.toLowerCase()
  }, [address, players.current])

  const canMakeChoice = useCallback(() => {
    return isMyTurn() && gamePhase === 'choosing' && !playerChoice
  }, [isMyTurn, gamePhase, playerChoice])

  // Load initial game data
  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) return

      try {
        setLoading(true)
        const response = await fetch(`${getApiUrl()}/api/game-sessions/${gameId}`)
        const data = await response.json()
        
        if (data.success) {
          setGameData(data.game)
          
          // Set up players
          setPlayers({
            creator: {
              address: data.game.creator,
              name: await getPlayerName(data.game.creator),
              power: 0,
              choice: null
            },
            joiner: {
              address: data.game.joiner || null,
              name: data.game.joiner ? await getPlayerName(data.game.joiner) : '',
              power: 0,
              choice: null
            },
            current: data.game.creator // Creator always goes first
          })

          // Determine initial phase
          if (!data.game.joiner) {
            setGamePhase('waiting')
          } else if (data.game.status === 'active') {
            setGamePhase('countdown')
            // Start countdown after both players are in
            setTimeout(() => setGamePhase('choosing'), 3000)
          }
        }
      } catch (error) {
        console.error('Error loading game:', error)
        showError('Failed to load game data')
      } finally {
        setLoading(false)
      }
    }

    loadGameData()
  }, [gameId])

  // WebSocket message handlers
  useEffect(() => {
    if (!webSocketService.isConnected()) return

    const handlers = {
      'offer_made': (data) => {
        setOffers(prev => [...prev, data.offer])
        showInfo(`New offer: ${data.offer.amount}`)
      },

      'offer_accepted': (data) => {
        setGamePhase('locked')
        setPlayers(prev => ({
          ...prev,
          joiner: {
            address: data.joinerAddress,
            name: data.joinerName,
            power: 0,
            choice: null
          }
        }))
        
        // Show lock animation
        setShowLockAnimation(true)
        setTimeout(() => setShowLockAnimation(false), 2000)
        
        // Start deposit timer
        startDepositTimer()
        showSuccess('Offer accepted! Waiting for deposit...')
      },

      'deposit_confirmed': (data) => {
        clearDepositTimer()
        setGamePhase('countdown')
        showSuccess('Deposit confirmed! Game starting...')
        
        // Start game after countdown
        setTimeout(() => {
          setGamePhase('choosing')
          startRoundTimer()
        }, 3000)
      },

      'player_joined': (data) => {
        if (data.address !== address) {
          setSpectators(prev => [...prev, data.address])
          showInfo(`${data.name} is watching`)
        }
      },

      'choice_made': (data) => {
        if (data.player === address) {
          setPlayerChoice(data.choice)
        } else {
          setOpponentChoice(data.choice)
        }
        
        // Check if both players have chosen
        if (playerChoice && opponentChoice) {
          setGamePhase('flipping')
          triggerFlip()
        }
      },

      'power_charged': (data) => {
        if (data.player === players.creator.address) {
          setPlayers(prev => ({
            ...prev,
            creator: { ...prev.creator, power: data.power }
          }))
        } else {
          setPlayers(prev => ({
            ...prev,
            joiner: { ...prev.joiner, power: data.power }
          }))
        }
      },

      'flip_result': (data) => {
        setFlipResult(data.result)
        setRoundWinner(data.winner)
        
        // Update scores
        setScores(prev => ({
          ...prev,
          [data.winner === players.creator.address ? 'creator' : 'joiner']: prev[data.winner === players.creator.address ? 'creator' : 'joiner'] + 1,
          [`round${currentRound}`]: data.winner === players.creator.address ? 'creator' : 'joiner'
        }))
        
        setGamePhase('result')
        
        // Check for game winner
        const creatorWins = scores.creator + (data.winner === players.creator.address ? 1 : 0)
        const joinerWins = scores.joiner + (data.winner === players.joiner.address ? 1 : 0)
        
        if (creatorWins === 3 || joinerWins === 3 || currentRound === 5) {
          setGameWinner(creatorWins > joinerWins ? players.creator.address : players.joiner.address)
          setGamePhase('completed')
        } else {
          // Next round after delay
          setTimeout(() => {
            setCurrentRound(prev => prev + 1)
            setPlayerChoice(null)
            setOpponentChoice(null)
            setFlipResult(null)
            setRoundWinner(null)
            
            // Switch turns
            setPlayers(prev => ({
              ...prev,
              current: prev.current === prev.creator.address ? prev.joiner.address : prev.creator.address
            }))
            
            setGamePhase('choosing')
            startRoundTimer()
          }, 3000)
        }
      },

      'chat_message': (data) => {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          from: data.from,
          message: data.message,
          timestamp: new Date()
        }])
      },

      'game_completed': (data) => {
        setGameWinner(data.winner)
        setGamePhase('completed')
        showInfo('Game completed!')
      }
    }

    // Register handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      webSocketService.on(event, handler)
    })

    // Cleanup
    return () => {
      Object.keys(handlers).forEach(event => {
        webSocketService.off(event)
      })
    }
  }, [address, players, currentRound, scores, playerChoice, opponentChoice])

  // Timer functions
  const startDepositTimer = () => {
    depositTimerRef.current = setInterval(() => {
      setDepositTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(depositTimerRef.current)
          // Handle timeout - cancel game
          setGamePhase('waiting')
          showError('Deposit timeout - game cancelled')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const clearDepositTimer = () => {
    if (depositTimerRef.current) {
      clearInterval(depositTimerRef.current)
      depositTimerRef.current = null
    }
  }

  const startRoundTimer = () => {
    let timeLeft = 30 // 30 seconds to make a choice
    
    roundTimerRef.current = setInterval(() => {
      timeLeft--
      
      if (timeLeft <= 0) {
        clearInterval(roundTimerRef.current)
        
        // Auto-flip if time runs out
        if (currentRound === 5 && scores.creator === 2 && scores.joiner === 2) {
          // Round 5 auto-flip at max power
          handleAutoFlip(100)
        } else {
          // Normal auto-flip
          handleAutoFlip(50)
        }
      }
    }, 1000)
  }

  const handleAutoFlip = (power) => {
    showInfo('Time\'s up! Auto-flipping...')
    
    // Set random choices if not selected
    if (!playerChoice && isMyTurn()) {
      const autoChoice = Math.random() > 0.5 ? 'heads' : 'tails'
      setPlayerChoice(autoChoice)
      webSocketService.send({
        type: 'choice_made',
        gameId,
        player: address,
        choice: autoChoice,
        power
      })
    }
  }

  const triggerFlip = () => {
    // Simulate server-side flip
    webSocketService.send({
      type: 'trigger_flip',
      gameId,
      creatorChoice: isCreator() ? playerChoice : opponentChoice,
      joinerChoice: isJoiner() ? playerChoice : opponentChoice,
      creatorPower: players.creator.power,
      joinerPower: players.joiner.power
    })
  }

  // Action handlers
  const handleAcceptOffer = async (offer) => {
    if (!isCreator()) {
      showError('Only the game creator can accept offers')
      return
    }

    try {
      webSocketService.send({
        type: 'accept_offer',
        gameId,
        offerId: offer.id,
        joinerAddress: offer.from
      })
    } catch (error) {
      showError('Failed to accept offer')
    }
  }

  const handleMakeChoice = (choice) => {
    if (!canMakeChoice()) return
    
    setPlayerChoice(choice)
    
    webSocketService.send({
      type: 'choice_made',
      gameId,
      player: address,
      choice
    })
  }

  const handleSetPower = (power) => {
    if (!isMyTurn() || gamePhase !== 'choosing') return
    
    setPowerLevel(power)
    
    // Broadcast power level
    webSocketService.send({
      type: 'power_charged',
      gameId,
      player: address,
      power
    })
  }

  const handleSendChat = (message) => {
    webSocketService.send({
      type: 'chat_message',
      gameId,
      from: address,
      message
    })
  }

  const handleMakeOffer = (offer) => {
    if (gamePhase !== 'waiting') {
      showError('Cannot make offers after game has started')
      return
    }

    webSocketService.send({
      type: 'make_offer',
      gameId,
      from: address,
      offer
    })
  }

  const handleClaimWinnings = async () => {
    if (gameWinner !== address) {
      showError('Only the winner can claim winnings')
      return
    }

    try {
      const result = await contractService.claimWinnings(gameId)
      if (result.success) {
        showSuccess('Winnings claimed successfully!')
        // Navigate to home or show success animation
      }
    } catch (error) {
      showError('Failed to claim winnings')
    }
  }

  const handleExitGame = () => {
    // Clean up timers
    clearDepositTimer()
    if (roundTimerRef.current) clearInterval(roundTimerRef.current)
    if (autoFlipTimerRef.current) clearInterval(autoFlipTimerRef.current)
    
    // Disconnect websocket
    webSocketService.disconnect()
  }

  return {
    // State
    gamePhase,
    gameData,
    loading,
    players,
    spectators,
    currentRound,
    scores,
    playerChoice,
    opponentChoice,
    powerLevel,
    flipResult,
    roundWinner,
    gameWinner,
    showLockAnimation,
    countdownTime,
    depositTimeLeft,
    offers,
    chatMessages,
    
    // Helper functions
    isCreator,
    isJoiner,
    isSpectator,
    isMyTurn,
    canMakeChoice,
    
    // Actions
    handleAcceptOffer,
    handleMakeChoice,
    handleSetPower,
    handleSendChat,
    handleMakeOffer,
    handleClaimWinnings,
    handleExitGame
  }
}
