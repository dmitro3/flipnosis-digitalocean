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
  LiveScoreDisplay,
  LivePlayerCard,
  LiveRoundResult,
  SpectatorCounter
} from '../components/GameUtilities'
import WebSocketStatus from '../components/WebSocketStatus'
import ThreeCoin from '../components/ThreeCoin'
import EnhancedPowerBar from '../components/EnhancedPowerBar'
import PaymentService from '../services/PaymentService'
import { ethers } from 'ethers'

const FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { isConnected, address, provider } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()

  // API URL
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Game data state
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Player identification
  const isCreator = gameData?.creator === address
  const isJoiner = gameData?.joiner === address
  const isPlayer = isCreator || isJoiner

  // WebSocket connection
  const {
    connected: wsConnected,
    socket,
    gameState,
    gamePhase,
    currentRound,
    scores,
    spectatorCount,
    isMyTurn,
    startGame,
    joinGame,
    flipComplete,
    updatePower,
    makeChoice,
    startCharging,
    stopCharging
  } = useWebSocket(
    gameId,
    address,
    isCreator,
    gameData ? {
      creator: gameData.creator,
      joiner: gameData.joiner,
      maxRounds: gameData.rounds,
      priceUSD: gameData.priceUSD
    } : null
  )

  // Game state
  const [myChoice, setMyChoice] = useState(null) // 'heads' or 'tails'
  const [myPower, setMyPower] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [flipResult, setFlipResult] = useState(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [syncedFlipData, setSyncedFlipData] = useState(null)

  // Refs for power charging
  const chargingIntervalRef = useRef(null)

  // New state for preventing race conditions
  const [claimingSlot, setClaimingSlot] = useState(false)
  const [joiningGame, setJoiningGame] = useState(false)

  // Load game data
  const loadGame = async () => {
    try {
      setLoading(true)
      
      console.log('📊 Loading game from database:', gameId)
      
      const response = await fetch(`${API_URL}/api/games/${gameId}`)
      
      if (response.ok) {
        const dbGame = await response.json()
        console.log('✅ Loaded game from database:', dbGame)
        
        const gameData = {
          id: dbGame.id,
          creator: dbGame.creator,
          joiner: dbGame.joiner,
          nft: {
            contractAddress: dbGame.nft_contract,
            tokenId: dbGame.nft_token_id,
            name: dbGame.nft_name,
            image: dbGame.nft_image || 'https://picsum.photos/300/300?random=' + dbGame.id,
            collection: dbGame.nft_collection,
            chain: dbGame.nft_chain
          },
          price: dbGame.price_usd,
          priceUSD: dbGame.price_usd,
          currency: 'USD',
          rounds: dbGame.rounds,
          status: dbGame.status,
          winner: dbGame.winner,
          creatorWins: dbGame.creator_wins || 0,
          joinerWins: dbGame.joiner_wins || 0,
          createdAt: dbGame.created_at,
          startedAt: dbGame.started_at,
          completedAt: dbGame.completed_at,
          listingFee: {
            amountETH: dbGame.listing_fee_eth,
            transactionHash: dbGame.listing_fee_hash
          }
        }
        
        setGameData(gameData)
        return
      }
      
      throw new Error('Game not found')
      
    } catch (error) {
      console.error('❌ Error loading game:', error)
      showError('Game not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGame()
  }, [gameId])

  // Handle synchronized flip animations
  useEffect(() => {
    if (gameState?.syncedFlip) {
      console.log('🎬 Starting synchronized flip:', gameState.syncedFlip)
      setSyncedFlipData(gameState.syncedFlip)
      setIsFlipping(true)
      
      // Clear after animation duration
      setTimeout(() => {
        setIsFlipping(false)
        setSyncedFlipData(null)
      }, gameState.syncedFlip.duration)
    }
  }, [gameState?.syncedFlip])

  // Handle game state updates from WebSocket
  useEffect(() => {
    if (gameState?.phase === 'game_complete' && gameState?.winner) {
      const isWinner = gameState.winner === address
      showSuccess(`🏆 Game Over! ${isWinner ? 'You won!' : 'You lost!'}`)
    }
  }, [gameState?.phase, gameState?.winner, address])

  // Auto-start game when both players are ready - ENHANCED
  useEffect(() => {
    console.log('🔍 Auto-start check:', {
      hasJoiner: !!gameData?.joiner,
      hasCreator: !!gameData?.creator,
      gameStatus: gameData?.status,
      gamePhase: gamePhase,
      isCreator: isCreator,
      wsConnected: wsConnected
    })

    if (gameData?.joiner && 
        gameData?.creator && 
        (gameData?.status === 'joined' || gameData?.status === 'active') && 
        gamePhase === 'waiting' && 
        isCreator && 
        wsConnected) {
      
      console.log('🚀 AUTO-STARTING GAME - All conditions met!')
      setTimeout(() => {
        handleStartGame()
      }, 1000) // 1 second delay
    }
  }, [gameData?.joiner, gameData?.creator, gameData?.status, gamePhase, isCreator, wsConnected])

  // Manual start button fallback
  const showStartButton = gameData?.joiner && 
                         gameData?.creator && 
                         gameData?.status === 'joined' && 
                         (gamePhase === 'waiting' || gamePhase === 'ready') && 
                         isCreator

  // Choice selection
  const handleChoiceSelection = (choice) => {
    console.log('🎯 Player chose:', choice)
    setMyChoice(choice)
    makeChoice(choice)
  }

  // Power charging logic
  const handlePowerChargeStart = () => {
    console.log('🔋 Power charge START - isMyTurn:', isMyTurn, 'gamePhase:', gamePhase, 'hasChoice:', !!myChoice)
    
    if (gamePhase === 'round_active' && isMyTurn && myChoice && !isCharging) {
      setIsCharging(true)
      startCharging()
      
      chargingIntervalRef.current = setInterval(() => {
        setMyPower(prev => {
          const newPower = Math.min(10, prev + 0.2)
          updatePower(newPower)
          return newPower
        })
      }, 50)
      
      console.log('✅ Started charging')
    }
  }

  const handlePowerChargeStop = () => {
    console.log('🔋 Power charge STOP - isCharging:', isCharging, 'myPower:', myPower)
    
    if (isCharging && myChoice) {
      setIsCharging(false)
      stopCharging()
      
      if (chargingIntervalRef.current) {
        clearInterval(chargingIntervalRef.current)
        chargingIntervalRef.current = null
      }
      
      if (myPower > 0) {
        executeFlip(myPower, myChoice)
      }
    }
  }

  // Cleanup charging interval
  useEffect(() => {
    return () => {
      if (chargingIntervalRef.current) {
        clearInterval(chargingIntervalRef.current)
      }
    }
  }, [])

  const executeFlip = (power, choice) => {
    console.log('🎲 executeFlip called with power:', power, 'choice:', choice)
    
    if (!isMyTurn || !choice) {
      console.log('❌ Cannot flip - not your turn or no choice made')
      return
    }

    // Send flip data to WebSocket for synchronization
    flipComplete(choice, power)
    
    // Reset local state
    setMyPower(0)
    setMyChoice(null)
  }

  // Join game function
  const handleJoinGame = async () => {
    if (!gameData || !provider || !address) {
      showError('Missing required data for joining')
      return
    }

    if (joiningGame || claimingSlot) {
      showError('Another player is already joining this game...')
      return
    }

    try {
      setClaimingSlot(true)
      showInfo('Claiming player slot...')
      
      const claimResponse = await fetch(`${API_URL}/api/games/${gameData.id}/claim-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerAddress: address })
      })
      
      if (!claimResponse.ok) {
        const error = await claimResponse.json()
        throw new Error(error.error || 'Failed to claim slot')
      }
      
      setJoiningGame(true)
      showInfo('Processing payment...')
      
      const paymentResult = await PaymentService.calculateETHAmount(gameData.priceUSD)
      if (!paymentResult.success) {
        throw new Error('Failed to calculate payment amount: ' + paymentResult.error)
      }

      const signer = await provider.getSigner()
      const feeRecipient = PaymentService.getFeeRecipient()
      
      const txResult = await PaymentService.buildTransaction(feeRecipient, paymentResult.weiAmount, provider)
      if (!txResult.success) {
        throw new Error('Failed to build transaction: ' + txResult.error)
      }
      
      const paymentTx = await signer.sendTransaction(txResult.txConfig)
      showInfo('Confirming payment...')
      
      const receipt = await paymentTx.wait()
      console.log('✅ Payment confirmed:', receipt.hash)
      
      const joinResponse = await fetch(`${API_URL}/api/games/${gameData.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinerAddress: address,
          paymentTxHash: receipt.hash,
          paymentAmount: gameData.priceUSD
        })
      })
      
      if (!joinResponse.ok) {
        throw new Error('Failed to complete join')
      }
      
      const updatedGame = {
        ...gameData,
        joiner: address,
        status: 'joined',
        paymentTxHash: receipt.hash
      }
      setGameData(updatedGame)

      if (wsConnected && socket) {
        joinGame(address, receipt.hash)
      }

      showSuccess('Successfully joined the game!')
        
    } catch (error) {
      console.error('❌ Failed to join game:', error)
      showError('Failed to join: ' + error.message)
      
      try {
        const releaseResponse = await fetch(`${API_URL}/api/games/${gameData.id}/release-slot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerAddress: address })
        })
        
        if (!releaseResponse.ok) {
          const releaseError = await releaseResponse.json()
          console.log('⚠️ Could not release slot:', releaseError)
        }
      } catch (releaseError) {
        console.error('Failed to release slot:', releaseError)
      }
    } finally {
      setJoiningGame(false)
      setClaimingSlot(false)
    }
  }

  // Start game function
  const handleStartGame = () => {
    console.log('🚀 Starting game')
    startGame()
  }

  // Determine what UI to show
  const canJoin = gameData && 
                  !gameData.joiner && 
                  !claimingSlot &&
                  gameData.creator !== address && 
                  gameData.status === 'waiting' &&
                  isConnected &&
                  address

  const showChoiceButtons = gamePhase === 'round_active' && isMyTurn && !myChoice
  const showPowerCharging = gamePhase === 'round_active' && isMyTurn && myChoice && !isFlipping
  const showWaitingForOpponent = gamePhase === 'round_active' && !isMyTurn

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

  if (!gameData) {
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
                  Best of {gameData.rounds} • ${gameData.priceUSD?.toFixed(2)}
                </span>
                <SpectatorCounter count={spectatorCount} isLive={gamePhase === 'round_active'} />
              </div>
            </div>
          </div>

          {/* Main Game Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {/* Player 1 (Creator) */}
            <LivePlayerCard
              player={gameState?.creator || gameData.creator}
              isCurrentUser={isCreator}
              playerNumber={1}
              nft={gameData.nft}
              score={scores.creator}
              gamePhase={gamePhase}
              spectatorMode={!isPlayer}
              isActiveTurn={isMyTurn && gamePhase === 'round_active'}
              playerChoice={gameState?.creatorChoice}
            />

            {/* Center - Coin and Controls */}
            <GlassCard style={{ 
              textAlign: 'center', 
              position: 'relative',
              background: 'transparent',
              backdropFilter: 'none'
            }}>
              {/* Live Score Display */}
              <LiveScoreDisplay gameState={gameState} />

              {/* Game Status */}
              {gamePhase === 'waiting' && gameData?.joiner && gameData?.creator && (
                <div style={{
                  background: 'rgba(0, 255, 0, 0.1)',
                  padding: '1rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(0, 255, 0, 0.3)',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ color: theme.colors.statusSuccess, margin: 0 }}>
                    🚀 Starting Game...
                  </h3>
                </div>
              )}

              {/* Choice Buttons */}
              {showChoiceButtons && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    color: theme.colors.neonYellow, 
                    marginBottom: '1rem',
                    textShadow: `0 0 10px ${theme.colors.neonYellow}`
                  }}>
                    🎯 Choose Your Side!
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Button
                      onClick={() => handleChoiceSelection('heads')}
                      style={{
                        background: `linear-gradient(45deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})`,
                        fontSize: '1.5rem',
                        padding: '1rem 2rem',
                        minWidth: '120px'
                      }}
                    >
                      👑 HEADS
                    </Button>
                    <Button
                      onClick={() => handleChoiceSelection('tails')}
                      style={{
                        background: `linear-gradient(45deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})`,
                        fontSize: '1.5rem',
                        padding: '1rem 2rem',
                        minWidth: '120px'
                      }}
                    >
                      💎 TAILS
                    </Button>
                  </div>
                </div>
              )}

              {/* 3D Coin with Enhanced Power Bar */}
              <div style={{ 
                position: 'relative', 
                margin: '2rem auto', 
                width: '300px', 
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ThreeCoin
                  isFlipping={isFlipping}
                  flipResult={syncedFlipData?.result}
                  flipDuration={syncedFlipData?.duration}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={showPowerCharging}
                  gamePhase={gamePhase}
                  power={myPower}
                  isCharging={isCharging}
                  style={{
                    filter: isCharging ? 'brightness(1.2) saturate(1.3)' : 'brightness(1)',
                    transform: showPowerCharging ? 'scale(1.05)' : 'scale(1)'
                  }}
                />
                
                {/* Enhanced Power Bar */}
                <EnhancedPowerBar
                  power={myPower}
                  isCharging={isCharging}
                  isVisible={showPowerCharging}
                  label={`${myChoice?.toUpperCase()} Power`}
                  color={isCreator ? theme.colors.neonPink : theme.colors.neonBlue}
                />
              </div>

              {/* Game Instructions */}
              {showPowerCharging && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '1rem',
                  borderRadius: '1rem',
                  border: `1px solid ${theme.colors.neonYellow}`,
                  backdropFilter: 'blur(10px)'
                }}>
                  <p style={{ 
                    color: theme.colors.statusSuccess, 
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    🎯 You chose {myChoice?.toUpperCase()}!
                  </p>
                  <p style={{ color: theme.colors.textSecondary }}>
                    Hold the coin to charge power, release to flip!
                  </p>
                </div>
              )}

              {showWaitingForOpponent && (
                <div style={{
                  background: 'rgba(255, 165, 0, 0.1)',
                  padding: '1rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 165, 0, 0.3)'
                }}>
                  <p style={{ color: theme.colors.statusWarning, fontSize: '1.2rem' }}>
                    ⏳ Waiting for opponent...
                  </p>
                  {gameState?.currentPlayerChoice && (
                    <p style={{ color: theme.colors.textSecondary }}>
                      They chose {gameState.currentPlayerChoice.toUpperCase()}
                    </p>
                  )}
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
              player={gameState?.joiner || gameData.joiner}
              isCurrentUser={isJoiner}
              playerNumber={2}
              cryptoAmount={`${gameData.priceUSD?.toFixed(2)}`}
              score={scores.joiner}
              gamePhase={gamePhase}
              spectatorMode={!isPlayer}
              isActiveTurn={!isMyTurn && gamePhase === 'round_active'}
              playerChoice={gameState?.joinerChoice}
            />
          </div>

          {/* Join Button */}
          {canJoin && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{
                background: 'rgba(0, 255, 65, 0.1)',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid rgba(0, 255, 65, 0.3)',
                marginBottom: '1rem'
              }}>
                <h3 style={{ 
                  color: theme.colors.neonGreen, 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  textShadow: `0 0 10px ${theme.colors.neonGreen}`
                }}>
                  💎 JOIN THE BATTLE!
                </h3>
                <p style={{ color: theme.colors.textSecondary, fontSize: '1rem', marginBottom: '0.5rem' }}>
                  Entry Fee: <span style={{ color: theme.colors.neonYellow, fontWeight: 'bold' }}>${gameData.priceUSD.toFixed(2)}</span>
                </p>
                <p style={{ color: theme.colors.textTertiary, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Winner takes all! Best of {gameData.rounds} rounds.
                </p>
              </div>
              
              <Button 
                onClick={handleJoinGame}
                disabled={joiningGame}
                style={{ 
                  width: '100%',
                  background: `linear-gradient(45deg, ${theme.colors.neonGreen}, ${theme.colors.neonBlue})`,
                  fontSize: '1.2rem',
                  padding: '1rem 2rem',
                  boxShadow: `0 0 20px ${theme.colors.neonGreen}`,
                  animation: 'neon-pulse 2s infinite'
                }}
              >
                {joiningGame ? (
                  <>
                    <LoadingSpinner style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Processing Payment...
                  </>
                ) : (
                  `💰 PAY & JOIN ($${gameData.priceUSD.toFixed(2)} USD)`
                )}
              </Button>
            </div>
          )}

          {/* Round Results */}
          {syncedFlipData && (
            <LiveRoundResult
              flipResult={syncedFlipData.result}
              playerChoice={syncedFlipData.playerChoice}
              isWinner={syncedFlipData.result === syncedFlipData.playerChoice}
              currentPlayer={syncedFlipData.playerAddress}
              isCurrentUser={syncedFlipData.playerAddress === address}
            />
          )}

          {/* Manual Start Button - Fallback */}
          {showStartButton && (
            <div style={{
              background: 'rgba(255, 20, 147, 0.1)',
              padding: '1.5rem',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 20, 147, 0.3)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                color: theme.colors.neonPink, 
                marginBottom: '1rem',
                textShadow: `0 0 10px ${theme.colors.neonPink}`
              }}>
                🎮 Ready to Start!
              </h3>
              <p style={{ color: theme.colors.textSecondary, marginBottom: '1.5rem' }}>
                Both players have joined. Start the first round!
              </p>
              <Button
                onClick={handleStartGame}
                style={{
                  width: '100%',
                  background: `linear-gradient(45deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})`,
                  fontSize: '1.2rem',
                  padding: '1rem 2rem',
                  boxShadow: `0 0 20px ${theme.colors.neonPink}`,
                  animation: 'neon-pulse 2s infinite'
                }}
              >
                🚀 START GAME
              </Button>
            </div>
          )}
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
}

export default FlipGame
