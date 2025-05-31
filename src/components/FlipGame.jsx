import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import {
  Container,
  ContentWrapper,
  GlassCard,
  NeonText,
  Button,
  LoadingSpinner
} from '../styles/components'
import {
  DualPowerBar,
  DualGameCoin,
  LiveScoreDisplay,
  LivePlayerCard,
  LiveRoundResult,
  DualGameInstructions,
  SpectatorCounter
} from '../components/GameUtilities'
import WebSocketStatus from '../components/WebSocketStatus'
import { ethers } from 'ethers'
import { PaymentToken } from '../services/ContractService'
import { DEFAULT_CONTRACT_ADDRESS } from '../config/contracts'
import { getRequiredPayment } from '../utils/payment'
import ThreeCoin from '../components/ThreeCoin'
import EnhancedPowerBar from '../components/EnhancedPowerBar'

const FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { isConnected, address, provider, firebaseService, delistNFT } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()

  // Initial Firebase game data (for setup only)
  const [initialGame, setInitialGame] = useState(null)
  const [loading, setLoading] = useState(true)

  // Player identification
  const isCreator = initialGame?.creator === address
  const isJoiner = initialGame?.joiner === address
  const isPlayer = isCreator || isJoiner
  const canJoin = !initialGame?.joiner && !isCreator && !loading

  // WebSocket connection with game config
  const {
    connected: wsConnected,
    gameState,
    gamePhase,
    currentRound,
    currentPlayer,
    isMyTurn,
    scores,
    spectatorCount,
    startRound,
    chargePower,
    lockPower,
    sendMessage
  } = useWebSocket(
    gameId,
    address,
    isCreator,
    initialGame ? {
      creator: initialGame.creator,
      joiner: initialGame.joiner,
      maxRounds: initialGame.rounds,
      priceUSD: initialGame.priceUSD
    } : null
  )

  // Add this safe defaults block after your WebSocket destructuring
  const safeFlipState = gameState?.flipState || {
    creatorPower: 0,
    joinerPower: 0,
    creatorReady: false,
    joinerReady: false,
    flipResult: null
  }

  // Refs for power charging
  const powerChargeRef = useRef(null)
  const chargingStartTimeRef = useRef(null)

  // Power management state
  const [myPower, setMyPower] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [opponentPower, setOpponentPower] = useState(0)
  const [flipResult, setFlipResult] = useState(null)
  const [isFlipping, setIsFlipping] = useState(false)

  // Update opponent power when WebSocket state changes
  useEffect(() => {
    if (gameState?.flipState) {
      const oppPower = isCreator ? 
        safeFlipState.joinerPower : 
        safeFlipState.creatorPower
      setOpponentPower(oppPower || 0)
    }
  }, [gameState?.flipState, isCreator])

  // Handle game completion
  useEffect(() => {
    if (gamePhase === 'game_complete' && gameState?.winner) {
      const isWinner = gameState.winner === address
      showSuccess(`🏆 Game Over! ${isWinner ? 'You won!' : 'You lost!'}`)
    }
  }, [gamePhase, gameState?.winner, address])

  // Auto-start game when player 2 connects
  useEffect(() => {
    if (gamePhase === 'waiting_for_players' && initialGame?.joiner && !initialGame?.started && wsConnected) {
      console.log('🎮 Auto-starting game as player 2 connected')
      handleStartGame()
    }
  }, [gamePhase, initialGame?.joiner, initialGame?.started, wsConnected])

  // Start game (only creator can do this when both players are connected)
  const handleStartGame = async () => {
    console.log('🚀 START GAME clicked')
    console.log('WebSocket connected:', wsConnected)
    console.log('Game ID:', gameId)
    console.log('Initial game:', initialGame)
    
    if (!wsConnected) {
      showError('WebSocket not connected')
      return
    }

    if (!sendMessage) {
      showError('WebSocket not ready')
      return
    }

    try {
      console.log('📡 Sending start_game message')
      
      sendMessage({
        type: 'start_game',
        gameId,
        timestamp: Date.now()
      })

      showSuccess('Game starting...')
      
    } catch (error) {
      console.error('❌ Error starting game:', error)
      showError('Failed to start game: ' + error.message)
    }
  }

  // Power charging handlers
  const handlePowerChargeStart = () => {
    console.log('🔋 Power charge START - isMyTurn:', isMyTurn, 'gamePhase:', gamePhase)
    if (gamePhase === 'round_active' && isMyTurn) {
      setIsCharging(true)
      chargingStartTimeRef.current = Date.now()
      console.log('✅ Started charging')
    }
  }

  const handlePowerChargeStop = () => {
    console.log('🔋 Power charge STOP - isCharging:', isCharging, 'myPower:', myPower)
    if (isCharging && myPower > 0) {
      setIsCharging(false)
      
      // Execute flip immediately
      console.log('🎲 Executing flip with power:', myPower)
      executeFlip(myPower)
    }
  }

  // Add power charging effect
  useEffect(() => {
    let powerInterval
    if (isCharging && gamePhase === 'round_active' && isMyTurn) {
      console.log('⚡ Starting power charging interval')
      powerInterval = setInterval(() => {
        setMyPower(prev => {
          const newPower = Math.min(10, prev + 0.2)
          console.log('🔋 Power charging:', prev, '→', newPower)
          return newPower
        })
      }, 50)
    }
    
    return () => {
      if (powerInterval) {
        console.log('🛑 Clearing power interval')
        clearInterval(powerInterval)
      }
    }
  }, [isCharging, gamePhase, isMyTurn])

  // Add timer effect
  useEffect(() => {
    let timerInterval
    if (gamePhase === 'round_active' && !isFlipping) {
      const startTime = Date.now()
      const roundDuration = 30000 // 30 seconds
      
      timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, Math.ceil((roundDuration - elapsed) / 1000))
        
        if (remaining <= 0 && isMyTurn) {
          console.log('⏰ Timer expired!')
          executeFlip(Math.max(myPower, 1))
          clearInterval(timerInterval)
        }
      }, 100)
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [gamePhase, isFlipping, isMyTurn, myPower])

  // Update executeFlip function to use server turn management
  const executeFlip = (power) => {
    console.log('🎲 executeFlip called with power:', power)
    
    if (!isMyTurn) {
      console.log('❌ Not your turn!')
      return
    }

    setIsFlipping(true)
    
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    console.log('🎲 Flip result:', result)
    
    // Send flip result to server immediately
    sendMessage({
      type: 'flip_complete',
      gameId,
      player: isCreator ? 'creator' : 'joiner',
      result,
      power
    })

    // Set the result for the 3D coin animation
    setFlipResult(result)
    
    // Calculate flip duration based on power (2-6 seconds)
    const flipDuration = 2000 + (power * 400)
    
    // Reset state after animation completes
    setTimeout(() => {
      setIsFlipping(false)
      setMyPower(0)
      // Don't reset flipResult here - let the next round reset it
    }, flipDuration)
  }

  // Load initial game data from Firebase (ONE TIME ONLY)
  useEffect(() => {
    const loadInitialGame = async () => {
      if (!firebaseService || !gameId) return

      try {
        setLoading(true)
        const result = await firebaseService.getGame(gameId)
        
        if (!result.success) {
          throw new Error('Game not found')
        }

        setInitialGame(result.game)
        console.log('📋 Initial game data loaded from Firebase:', result.game)

      } catch (error) {
        console.error('Failed to load game:', error)
        showError('Failed to load game')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadInitialGame()
  }, [gameId, firebaseService])

  // Handle Firebase updates from WebSocket server
  useEffect(() => {
    window.updateFirebaseFromWebSocket = async (updateData) => {
      console.log('📝 Updating Firebase from WebSocket:', updateData)
      
      try {
        if (!firebaseService) return
        
        const result = await firebaseService.updateGame(updateData.gameId, {
          status: updateData.status,
          winner: updateData.winner,
          creatorWins: updateData.creatorWins,
          joinerWins: updateData.joinerWins,
          completedAt: updateData.completedAt,
          totalRounds: updateData.totalRounds
        })
        
        if (result.success) {
          console.log('✅ Firebase updated successfully')
        } else {
          console.error('❌ Failed to update Firebase:', result.error)
        }
      } catch (error) {
        console.error('❌ Error updating Firebase:', error)
      }
    }

    return () => {
      delete window.updateFirebaseFromWebSocket
    }
  }, [firebaseService])

  // Show messages for auto-start flow
  useEffect(() => {
    if (gamePhase === 'ready_for_round') {
      showInfo('🎮 Game starting automatically...')
    }
    if (gamePhase === 'round_active' && currentRound === 1) {
      showSuccess('⚡ Round 1 started! Charge your power!')
    }
  }, [gamePhase, currentRound])

  // Add auto-start when both players are ready
  useEffect(() => {
    // Auto-start game when both players are present and game is active
    if (initialGame?.status === 'active' && 
        initialGame?.joiner && 
        initialGame?.creator && 
        gamePhase === 'waiting' && 
        wsConnected) {
      
      console.log('🚀 Auto-starting game - both players ready')
      
      // Send start signal to WebSocket
      if (sendMessage) {
        sendMessage({
          type: 'start_game',
          gameId
        })
      }
    }
  }, [initialGame?.status, initialGame?.joiner, gamePhase, wsConnected])

  // Join game function - WITH PAYMENT (Fixed Gas Fees)
  const handleJoinGame = async () => {
    if (!initialGame || !firebaseService || !provider) return

    try {
      showInfo('Joining game and paying entry fee...')
      
      // Calculate payment
      const ethPriceUSD = 2500 // You can make this dynamic later
      const ethAmount = initialGame.priceUSD / ethPriceUSD
      const weiAmount = ethers.parseEther(ethAmount.toString())

      const signer = await provider.getSigner()
      const feeRecipient = '0xE1E3dFa98C39Ba5b6C643348420420aBC3556416'
      
      // Get gas data
      const feeData = await provider.getFeeData()
      const txConfig = {
        to: feeRecipient,
        value: weiAmount,
        gasLimit: 100000
      }
      
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        txConfig.maxFeePerGas = feeData.maxFeePerGas * 110n / 100n
        txConfig.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * 110n / 100n
      }
      
      // Send payment
      const paymentTx = await signer.sendTransaction(txConfig)
      await paymentTx.wait()
      
      // Update Firebase - this triggers auto-start
      const updateResult = await firebaseService.updateGame(gameId, {
        joiner: address,
        status: 'active', // This is key - changes from 'waiting' to 'active'
        paymentTxHash: paymentTx.hash,
        gameStarted: true,
        updatedAt: new Date()
      })

      if (!updateResult.success) {
        throw new Error('Failed to update game')
      }

      // Update local state immediately
      setInitialGame(prev => ({
        ...prev,
        joiner: address,
        status: 'active',
        gameStarted: true
      }))

      // Notify WebSocket that game should start
      if (wsConnected && sendMessage) {
        sendMessage({
          type: 'player_joined',
          gameId,
          joinerAddress: address,
          startGame: true // This tells server to auto-start
        })
      }

      showSuccess('Payment successful! Game starting...')
      
    } catch (error) {
      console.error('Failed to join game:', error)
      showError('Failed to join: ' + error.message)
    }
  }

  // Start next round (only creator can start rounds)
  const handleStartRound = () => {
    if (!isCreator) {
      showError('Only the game creator can start rounds')
      return
    }
    
    console.log('🚀 Creator starting round', currentRound)
    startRound(currentRound)
    showInfo(`Round ${currentRound} started!`)
  }

  // Reset timer when round starts
  useEffect(() => {
    if (gamePhase === 'round_active') {
      setFlipResult(null)
    }
  }, [gamePhase, currentRound])

  // Start new round
  const startNewRound = () => {
    setGamePhase('round_active')
    setFlipResult(null)
  }

  // Delist game (only when waiting)
  const handleDelist = async () => {
    try {
      showInfo('Delisting game...')
      const result = await delistNFT(gameId)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      showSuccess('Game delisted successfully')
      navigate('/')
    } catch (error) {
      console.error('Failed to delist game:', error)
      showError(error.message || 'Failed to delist game')
    }
  }

  // Handle side choice
  const handleSideChoice = async (choice) => {
    try {
      // Update game state
      sendMessage({
        type: 'side_chosen',
        choice,
        player: isCreator ? 'creator' : 'joiner'
      })
    } catch (error) {
      console.error('Error choosing side:', error)
      showError('Failed to choose side')
    }
  }

  // Add this useEffect after your existing useEffects to sync Firebase updates
  useEffect(() => {
    if (!firebaseService || !gameId) return

    console.log('🔥 Setting up Firebase real-time listener for game:', gameId)
    
    // Listen for real-time changes to the game document
    const unsubscribe = firebaseService.subscribeToGame(gameId, (updatedGame) => {
      console.log('🔥 Firebase game update received:', updatedGame)
      
      // Update local state when Firebase changes
      setInitialGame(updatedGame)
      
      // If joiner was added and we're the creator, log it
      if (updatedGame.joiner && isCreator && !initialGame?.joiner) {
        console.log('✅ Player 2 joined! Joiner:', updatedGame.joiner)
        showSuccess('Player 2 joined the game!')
      }
    })

    return () => {
      console.log('🔥 Cleaning up Firebase listener')
      if (unsubscribe) unsubscribe()
    }
  }, [firebaseService, gameId, isCreator])

  // Loading state
  if (!isConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                Connect Your Wallet
              </NeonText>
              <p style={{ color: theme.colors.textSecondary, marginBottom: '2rem' }}>
                Connect your wallet to join this flip game
              </p>
              <Button onClick={() => navigate('/')}>
                Go Home
              </Button>
            </GlassCard>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <LoadingSpinner />
            </div>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  if (!initialGame) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                Game Not Found
              </NeonText>
              <Button onClick={() => navigate('/')}>
                Go Home
              </Button>
            </GlassCard>
          </ContentWrapper>
        </Container>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <ContentWrapper>
          {/* Game Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <NeonText style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                FLIP GAME #{gameId.slice(-6).toUpperCase()}
                {!isPlayer && <span style={{ color: theme.colors.statusWarning }}> (SPECTATING)</span>}
              </NeonText>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: theme.colors.textSecondary }}>
                  Best of {initialGame.rounds} • ${initialGame.priceUSD?.toFixed(2)}
                </span>
                <SpectatorCounter count={spectatorCount} isLive={gamePhase === 'round_active'} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isPlayer && (
                <WebSocketStatus 
                  connected={wsConnected} 
                  playerCount={gameState?.joiner ? 2 : 1} 
                />
              )}
              {!initialGame.joiner && isCreator && gamePhase === 'waiting' && (
                <Button 
                  onClick={handleDelist} 
                  style={{ background: theme.colors.statusError }}
                >
                  Delist Game
                </Button>
              )}
            </div>
          </div>

          {/* Main Game Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {/* Player 1 (Creator) */}
            <LivePlayerCard
              player={gameState?.creator || initialGame.creator}
              isCurrentUser={isCreator}
              playerNumber={1}
              nft={initialGame.nft}
              score={scores.creator}
              gamePhase={gamePhase}
              flipState={safeFlipState}
              spectatorMode={!isPlayer}
              isActiveTurn={isMyTurn && gamePhase === 'round_active'}
            />

            {/* Center - Coin and Controls */}
            <GlassCard style={{ textAlign: 'center', position: 'relative' }}>
              {/* Live Score Display */}
              <LiveScoreDisplay
                scores={scores}
                currentRound={currentRound}
                gamePhase={gamePhase}
                maxRounds={initialGame.rounds}
                flipState={safeFlipState}
              />

              {/* 3D Coin with Enhanced Power Bar */}
              <div style={{ 
                position: 'relative', 
                margin: '2rem auto', 
                width: '600px', 
                height: '600px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ThreeCoin
                  isFlipping={isFlipping}
                  flipResult={flipResult}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={isMyTurn}
                  gamePhase={gamePhase}
                  power={myPower}
                  isCharging={isCharging}
                  style={{
                    filter: isCharging ? 'brightness(1.2) saturate(1.3)' : 'brightness(1)',
                    transform: isMyTurn && gamePhase === 'round_active' ? 'scale(1.05)' : 'scale(1)'
                  }}
                />
                
                {/* Enhanced Power Bar */}
                <EnhancedPowerBar
                  power={myPower}
                  isCharging={isCharging}
                  isVisible={gamePhase === 'round_active' && isMyTurn}
                  label={isMyTurn ? 'Your Power' : 'Opponent Power'}
                  color={isCreator ? theme.colors.neonPink : theme.colors.neonBlue}
                />
              </div>

              {/* Game Controls with Debug Info */}
              <div style={{ marginTop: '1rem' }}>
                {/* Player 2 - Join Button */}
                {!initialGame?.joiner && !isCreator && initialGame?.status === 'waiting' && (
                  <div>
                    <p style={{ color: theme.colors.textSecondary, marginBottom: '1rem' }}>
                      Entry Price: ${initialGame.priceUSD?.toFixed(2)}
                    </p>
                    <Button 
                      onClick={handleJoinGame} 
                      style={{ 
                        width: '100%',
                        background: theme.colors.neonGreen,
                        fontSize: '1.2rem',
                        padding: '1rem'
                      }}
                    >
                      💰 Join Game & Pay ${initialGame.priceUSD?.toFixed(2)}
                    </Button>
                  </div>
                )}

                {/* Both Players - Start Button (when both are ready) */}
                {(isCreator || isJoiner) && 
                 initialGame?.joiner && 
                 initialGame?.creator && 
                 initialGame?.status === 'active' && 
                 gamePhase === 'ready' && (
                  <div>
                    <p style={{ color: theme.colors.statusSuccess, marginBottom: '1rem', textAlign: 'center' }}>
                      ✅ Both players ready! Payment received.
                    </p>
                    <Button 
                      onClick={handleStartGame} 
                      style={{ 
                        width: '100%',
                        background: theme.colors.neonPink,
                        fontSize: '1.2rem',
                        padding: '1rem'
                      }}
                    >
                      🚀 START GAME
                    </Button>
                  </div>
                )}

                {/* Waiting States */}
                {!initialGame?.joiner && isCreator && (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: theme.colors.statusWarning, fontSize: '1.1rem' }}>
                      ⏳ Waiting for Player 2 to join...
                    </p>
                  </div>
                )}

                {gamePhase !== 'waiting' && (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ color: theme.colors.statusSuccess, fontSize: '1.1rem' }}>
                      🎮 Game in progress!
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced Game Instructions */}
              {gamePhase === 'round_active' && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    padding: '1rem',
                    borderRadius: '1rem',
                    border: `1px solid ${theme.colors.neonYellow}`,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <p style={{ 
                      color: isMyTurn ? theme.colors.statusSuccess : theme.colors.statusWarning, 
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      textShadow: `0 0 10px ${isMyTurn ? theme.colors.statusSuccess : theme.colors.statusWarning}`
                    }}>
                      {isMyTurn ? '🎯 YOUR TURN!' : '⏳ OPPONENT\'S TURN'}
                    </p>
                    
                    <p style={{ 
                      color: theme.colors.textSecondary,
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem'
                    }}>
                      {isMyTurn ? 
                        'Click and hold the coin to charge power, release to flip!' : 
                        'Waiting for opponent to flip the coin...'
                      }
                    </p>
                    
                    {isMyTurn && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1rem',
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: theme.colors.textTertiary
                      }}>
                        <span>💪 More power = Higher flip</span>
                        <span>⚡ More power = Longer spin</span>
                        <span>🎯 Release to set your force</span>
                      </div>
                    )}
                    
                    {/* Round Timer Display */}
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(255, 222, 3, 0.1)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(255, 222, 3, 0.3)'
                    }}>
                      <span style={{ 
                        color: theme.colors.neonYellow,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}>
                        ⏱️ {safeFlipState.roundTimer}s remaining
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Phase Messages */}
              {gamePhase === 'flipping' && (
                <div>
                  <p style={{ color: theme.colors.neonYellow, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    🌀 FLIPPING! 🌀
                  </p>
                </div>
              )}

              {gamePhase === 'round_complete' && (
                <div>
                  <p style={{ color: theme.colors.statusSuccess, fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {flipResult?.toUpperCase()}!
                  </p>
                  <p style={{ color: theme.colors.textSecondary }}>
                    {gameState?.currentRound < initialGame.rounds ? 'Next round starting...' : 'Game complete!'}
                  </p>
                </div>
              )}

              {gamePhase === 'game_complete' && (
                <div>
                  <p style={{ 
                    color: gameState?.winner === address ? theme.colors.statusSuccess : theme.colors.statusError,
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    marginBottom: '1rem'
                  }}>
                    {gameState?.winner === address ? '🏆 YOU WON!' : '💔 YOU LOST!'}
                  </p>
                  <p style={{ color: theme.colors.textSecondary, marginBottom: '2rem' }}>
                    Final Score: {scores.creator} - {scores.joiner}
                  </p>
                  <Button onClick={() => navigate('/')} style={{ width: '100%' }}>
                    Back to Games
                  </Button>
                </div>
              )}
            </GlassCard>

            {/* Player 2 (Joiner) */}
            <LivePlayerCard
              player={gameState?.joiner || initialGame.joiner}
              isCurrentUser={isJoiner}
              playerNumber={2}
              cryptoAmount={`${initialGame.priceUSD?.toFixed(2)}`}
              score={scores.joiner}
              gamePhase={gamePhase}
              flipState={safeFlipState}
              spectatorMode={!isPlayer}
              isActiveTurn={isMyTurn && gamePhase === 'round_active'}
            />
          </div>

          {/* Round Results */}
          <LiveRoundResult
            flipResult={flipResult}
            roundWinner={flipResult === 'heads' ? 'creator' : flipResult === 'tails' ? 'joiner' : null}
            isCurrentUser={isCreator ? (flipResult === 'heads') : (flipResult === 'tails')}
            flipState={safeFlipState}
          />
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
}

export default FlipGame 