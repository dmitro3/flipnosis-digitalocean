import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
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
import ThreeCoin from '../components/ThreeCoin'
import PowerDisplay from '../components/PowerDisplay'
import PaymentService from '../services/PaymentService'
import { ethers } from 'ethers'

const FlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { isConnected, address, provider } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()

  // API URL
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Local state - ONLY for non-game logic
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joiningGame, setJoiningGame] = useState(false)

  // WebSocket state - SINGLE SOURCE OF TRUTH for game
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [roundResult, setRoundResult] = useState(null)

  // Refs for user input
  const isChargingRef = useRef(false)

  // Player identification
  const isCreator = gameData?.creator === address
  const isJoiner = gameData?.joiner === address
  const isPlayer = isCreator || isJoiner
  const isMyTurn = gameState?.currentPlayer === address

  // WebSocket connection
  useEffect(() => {
    if (!gameId || !address) return

    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    let reconnectTimer

    const connect = () => {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://cryptoflipz2-production.up.railway.app' 
        : 'ws://localhost:3001'
      
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ Connected to WebSocket')
        setConnected(true)
        setSocket(ws)
        reconnectAttempts = 0 // Reset on successful connection
        
        // Join game
        ws.send(JSON.stringify({
          type: 'connect_to_game',
          gameId,
          address
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Received:', data.type)
          
          switch (data.type) {
            case 'game_state':
              console.log('🔄 Game state update:', {
                phase: data.phase,
                currentRound: data.currentRound,
                currentPlayer: data.currentPlayer,
                creatorWins: data.creatorWins,
                joinerWins: data.joinerWins,
                isFlipInProgress: data.isFlipInProgress
              })
              setGameState(data)
              break
              
            case 'flip_animation':
              console.log('🎬 Flip animation received:', data)
              setFlipAnimation(data)
              setRoundResult(null)
              break
              
            case 'round_result':
              console.log('🏁 Round result received:', data)
              setRoundResult(data)
              setTimeout(() => setRoundResult(null), 4000)
              break
              
            case 'error':
              console.log('❌ Error received:', data.error)
              showError(data.error)
              break
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected')
        setConnected(false)
        setSocket(null)
        
        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
          reconnectTimer = setTimeout(() => {
            connect()
          }, 2000 * reconnectAttempts) // Exponential backoff
        } else {
          showError('Lost connection to game server. Please refresh the page.')
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
      }

      return ws
    }

    const ws = connect()

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [gameId, address])

  // Load game data from database
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/api/games/${gameId}`)
        
        if (response.ok) {
          const dbGame = await response.json()
          
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
            rounds: dbGame.rounds,
            status: dbGame.status
          }
          
          setGameData(gameData)
        } else {
          throw new Error('Game not found')
        }
      } catch (error) {
        console.error('❌ Error loading game:', error)
        showError('Game not found')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    loadGame()
  }, [gameId])

  // User input handlers - ONLY send to server
  const handlePowerChargeStart = () => {
    if (!isMyTurn || !socket || isChargingRef.current) return
    
    isChargingRef.current = true
    socket.send(JSON.stringify({
      type: 'start_charging',
      gameId,
      address
    }))
  }

  const handlePowerChargeStop = () => {
    if (!socket || !isChargingRef.current) return
    
    isChargingRef.current = false
    socket.send(JSON.stringify({
      type: 'stop_charging',
      gameId,
      address
    }))
  }

  const handleJoinGame = async () => {
    if (!gameData || !provider || !address || joiningGame) return

    try {
      setJoiningGame(true)
      showInfo('Processing payment...')
      
      const paymentResult = await PaymentService.calculateETHAmount(gameData.priceUSD)
      const signer = await provider.getSigner()
      const feeRecipient = PaymentService.getFeeRecipient()
      
      const txResult = await PaymentService.buildTransaction(feeRecipient, paymentResult.weiAmount, provider)
      const paymentTx = await signer.sendTransaction(txResult.txConfig)
      showInfo('Confirming payment...')
      
      const receipt = await paymentTx.wait()
      console.log('✅ Payment confirmed:', receipt.hash)
      
      // Update game in database first
      const joinResponse = await fetch(`${API_URL}/api/games/${gameData.id}/simple-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinerAddress: address,
          paymentTxHash: receipt.hash,
          paymentAmount: gameData.priceUSD
        })
      })
      
      if (!joinResponse.ok) {
        const error = await joinResponse.json()
        throw new Error(error.error || 'Failed to join game')
      }
      
      // Update local state
      setGameData(prev => ({ ...prev, joiner: address, status: 'joined' }))
      
      // Tell server via WebSocket
      if (socket) {
        socket.send(JSON.stringify({
          type: 'join_game',
          gameId,
          role: 'joiner',
          address,
          entryFeeHash: receipt.hash
        }))
      }
      
      showSuccess('Successfully joined the game!')
        
    } catch (error) {
      console.error('❌ Failed to join game:', error)
      showError('Failed to join: ' + error.message)
    } finally {
      setJoiningGame(false)
    }
  }

  if (!isConnected) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ContentWrapper>
            <GlassCard style={{ textAlign: 'center', padding: '3rem' }}>
              <NeonText>Connect Your Wallet</NeonText>
              <Button onClick={() => navigate('/')}>Go Home</Button>
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

  const canJoin = gameData && 
                  !gameData.joiner && 
                  gameData.creator !== address && 
                  gameData.status === 'waiting' &&
                  isConnected

  return (
    <ThemeProvider theme={theme}>
      <Container style={{ 
        position: 'relative',
        background: `
          radial-gradient(circle at 50% 50%, rgba(0, 20, 0, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%),
          conic-gradient(from 0deg at 50% 50%, 
            transparent 0deg,
            rgba(0, 255, 65, 0.05) 30deg,
            rgba(0, 255, 100, 0.08) 60deg,
            rgba(0, 255, 65, 0.05) 90deg,
            transparent 120deg,
            rgba(0, 255, 65, 0.03) 180deg,
            rgba(0, 255, 100, 0.06) 240deg,
            rgba(0, 255, 65, 0.03) 270deg,
            transparent 360deg
          )
        `,
        backgroundSize: '100% 100%, 200% 200%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        animation: 'spiralRotate 30s linear infinite'
      }}>
        {/* Matrix Green Spiral Background */}
        <div className="spiral-background">
          <div className="spiral-layer-1"></div>
          <div className="spiral-layer-2"></div>
          <div className="matrix-lines"></div>
        </div>
        
        <ContentWrapper>
          {/* Connection Status */}
          {!connected && (
            <div style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 0, 0, 0.9)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              zIndex: 1000
            }}>
              🔴 Reconnecting...
            </div>
          )}

          {/* Game Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <NeonText style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              FLIP GAME #{gameId.slice(-6).toUpperCase()}
              {!isPlayer && <span style={{ color: theme.colors.statusWarning }}> (SPECTATING)</span>}
            </NeonText>
            <div style={{ color: theme.colors.textSecondary }}>
              Best of {gameData?.rounds} • ${gameData?.priceUSD?.toFixed(2)}
              {gameState && <span> • {gameState.spectators} watching</span>}
            </div>
          </div>

          {/* Score Display */}
          {gameState && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: theme.colors.neonPink, fontSize: '3rem', fontWeight: 'bold' }}>
                  {gameState.creatorWins}
                </div>
                <div style={{ color: theme.colors.textSecondary }}>
                  👑 Player 1 (Heads)
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: theme.colors.textPrimary, fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {gameState.currentRound} / {gameState.maxRounds}
                </div>
                <div style={{ color: theme.colors.textSecondary }}>Round</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: theme.colors.neonBlue, fontSize: '3rem', fontWeight: 'bold' }}>
                  {gameState.joinerWins}
                </div>
                <div style={{ color: theme.colors.textSecondary }}>
                  💎 Player 2 (Tails)
                </div>
              </div>
            </div>
          )}

          {/* Game Status */}
          {gameState?.phase === 'round_active' && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {isMyTurn ? (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(0, 255, 65, 0.1)',
                  border: '1px solid rgba(0, 255, 65, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.statusSuccess, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    🎯 YOUR TURN!
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    You are {isCreator ? 'HEADS 👑' : 'TAILS 💎'} - Hold coin to charge power, release to flip!
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: theme.colors.statusWarning, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    ⏳ Opponent's Turn
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    They are {!isCreator ? 'HEADS 👑' : 'TAILS 💎'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Game Area - Three Column Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr 1fr', 
            gap: '2rem', 
            marginBottom: '2rem',
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr',
              gap: '1rem'
            }
          }}>
            
            {/* Left Player Card - Player 1 (Creator) */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: isCreator ? `2px solid ${theme.colors.neonPink}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1rem',
              padding: '1rem',
              animation: gameState?.currentPlayer === gameState?.creator ? 'playerReady 1s infinite' : 'none'
            }}>
              <div style={{ textAlign: 'center' }}>
                {/* Player Header */}
                <div style={{
                  padding: '1rem',
                  background: isCreator ? 
                    `linear-gradient(45deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})` : 
                    'rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    PLAYER 1 {isCreator && '(YOU)'}
                  </h3>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                    {gameState?.creator ? `${gameState.creator.slice(0, 6)}...${gameState.creator.slice(-4)}` : 'Waiting...'}
                  </div>
                  
                  {/* Player Choice Display */}
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    background: theme.colors.neonPink,
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    👑 HEADS
                  </div>
                  
                  {gameState?.currentPlayer === gameState?.creator && gameState?.phase === 'round_active' && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: theme.colors.statusSuccess,
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      animation: 'powerPulse 1s ease-in-out infinite'
                    }}>
                      YOUR TURN
                    </div>
                  )}
                </div>
                
                {/* NFT Display */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  {gameData?.nft ? (
                    <img
                      src={gameData.nft.image}
                      alt={gameData.nft.name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        borderRadius: '1rem',
                        border: isCreator ? `3px solid ${theme.colors.neonPink}` : '1px solid rgba(255,255,255,0.2)'
                      }}
                    />
                  ) : (
                    <div style={{
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: gameState?.creator ? 
                        `linear-gradient(45deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})` : 
                        'rgba(255,255,255,0.1)',
                      borderRadius: '1rem',
                      border: isCreator ? `3px solid ${theme.colors.neonPink}` : '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <div style={{
                        fontSize: '4rem',
                        filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))'
                      }}>
                        👑
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Item Info */}
                <div>
                  <h4 style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>
                    {gameData?.nft ? gameData.nft.name : 'Player 1'}
                  </h4>
                  <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                    {gameData?.nft ? gameData.nft.collection : 'Heads Player'}
                  </p>
                </div>
              </div>
            </div>

            {/* Center - Coin and Game Area */}
            <div style={{ textAlign: 'center' }}>
              {/* Coin */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <ThreeCoin
                  isFlipping={!!flipAnimation}
                  flipResult={flipAnimation?.result}
                  flipDuration={flipAnimation?.duration}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={isMyTurn && gameState?.phase === 'round_active'}
                  isCharging={gameState?.chargingPlayer === address}
                />
              </div>

              {/* Power Display */}
              {gameState?.phase === 'round_active' && (
                <PowerDisplay
                  creatorPower={gameState.creatorPower}
                  joinerPower={gameState.joinerPower}
                  currentPlayer={gameState.currentPlayer}
                  creator={gameState.creator}
                  joiner={gameState.joiner}
                  chargingPlayer={gameState.chargingPlayer}
                />
              )}
            </div>

            {/* Right Player Card - Player 2 (Joiner) */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: isJoiner ? `2px solid ${theme.colors.neonBlue}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1rem',
              padding: '1rem',
              animation: gameState?.currentPlayer === gameState?.joiner ? 'playerReady 1s infinite' : 'none'
            }}>
              <div style={{ textAlign: 'center' }}>
                {/* Player Header */}
                <div style={{
                  padding: '1rem',
                  background: isJoiner ? 
                    `linear-gradient(45deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})` : 
                    'rgba(255,255,255,0.1)',
                  borderRadius: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    PLAYER 2 {isJoiner && '(YOU)'}
                  </h3>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                    {gameState?.joiner ? `${gameState.joiner.slice(0, 6)}...${gameState.joiner.slice(-4)}` : 'Waiting...'}
                  </div>
                  
                  {/* Player Choice Display */}
                  {gameState?.joiner && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: theme.colors.neonBlue,
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      💎 TAILS
                    </div>
                  )}
                  
                  {gameState?.currentPlayer === gameState?.joiner && gameState?.phase === 'round_active' && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: theme.colors.statusSuccess,
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      animation: 'powerPulse 1s ease-in-out infinite'
                    }}>
                      YOUR TURN
                    </div>
                  )}
                </div>
                
                {/* Crypto/Placeholder Display */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <div style={{
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: gameState?.joiner ? 
                      `linear-gradient(45deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})` : 
                      'rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    border: isJoiner ? `3px solid ${theme.colors.neonBlue}` : 
                            gameState?.joiner ? '1px solid rgba(255,255,255,0.2)' : 
                            '2px dashed rgba(255,255,255,0.3)'
                  }}>
                    <div style={{
                      fontSize: '4rem',
                      filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))',
                      opacity: gameState?.joiner ? 1 : 0.5
                    }}>
                      {gameState?.joiner ? '💎' : '⏳'}
                    </div>
                  </div>
                </div>
                
                {/* Item Info */}
                <div>
                  <h4 style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>
                    {gameState?.joiner ? `$${gameData?.priceUSD?.toFixed(2)}` : 'Waiting for player...'}
                  </h4>
                  <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                    {gameState?.joiner ? 'Tails Player' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Join Button */}
          {canJoin && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Button 
                onClick={handleJoinGame}
                disabled={joiningGame}
                style={{ 
                  fontSize: '1.2rem',
                  padding: '1rem 2rem',
                  background: `linear-gradient(45deg, ${theme.colors.neonGreen}, ${theme.colors.neonBlue})`
                }}
              >
                {joiningGame ? 'Processing...' : `JOIN GAME ($${gameData.priceUSD.toFixed(2)})`}
              </Button>
            </div>
          )}

          {/* Round Result Display */}
          {roundResult && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: roundResult.actualWinner === address ? 
                'linear-gradient(45deg, rgba(0, 255, 65, 0.9), rgba(0, 255, 65, 0.7))' : 
                'linear-gradient(45deg, rgba(255, 20, 147, 0.9), rgba(255, 20, 147, 0.7))',
              padding: '3rem 4rem',
              borderRadius: '2rem',
              border: `4px solid ${roundResult.actualWinner === address ? '#00FF41' : '#FF1493'}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '1rem'
              }}>
                {roundResult.actualWinner === address ? '🏆 WINNER!' : '💔 LOSER!'}
              </div>
              <div style={{ fontSize: '1.5rem', color: 'white', fontWeight: 'bold' }}>
                Coin: {roundResult.result.toUpperCase()}
              </div>
              <div style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.5rem' }}>
                You are: {isCreator ? 'HEADS 👑' : 'TAILS 💎'}
              </div>
            </div>
          )}

          {/* Game Complete */}
          {gameState?.phase === 'game_complete' && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{
                padding: '2rem',
                background: gameState.winner === address ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 20, 147, 0.1)',
                border: `2px solid ${gameState.winner === address ? '#00FF41' : '#FF1493'}`,
                borderRadius: '1rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: gameState.winner === address ? '#00FF41' : '#FF1493',
                  marginBottom: '1rem'
                }}>
                  {gameState.winner === address ? '🏆 YOU WON!' : '💔 YOU LOST!'}
                </div>
                <div style={{ color: theme.colors.textSecondary, marginBottom: '2rem' }}>
                  Final Score: {gameState.creatorWins} - {gameState.joinerWins}
                </div>
                <Button onClick={() => navigate('/')}>
                  Back to Games
                </Button>
              </div>
            </div>
          )}
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
}

export default FlipGame
