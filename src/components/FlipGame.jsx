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

    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://cryptoflipz2-production.up.railway.app' 
      : 'ws://localhost:3001'
    
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('✅ Connected to WebSocket')
      setConnected(true)
      setSocket(ws)
      
      // Join game
      ws.send(JSON.stringify({
        type: 'connect_to_game',
        gameId,
        address
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('📡 Received:', data.type)
      
      switch (data.type) {
        case 'game_state':
          setGameState(data)
          break
          
        case 'flip_animation':
          setFlipAnimation(data)
          setRoundResult(null) // Clear previous result
          break
          
        case 'round_result':
          setRoundResult(data)
          setTimeout(() => setRoundResult(null), 4000) // Clear after 4s
          break
          
        case 'error':
          showError(data.error)
          break
      }
    }

    ws.onclose = () => {
      console.log('❌ WebSocket disconnected')
      setConnected(false)
      setSocket(null)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
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
      const receipt = await paymentTx.wait()
      
      const joinResponse = await fetch(`${API_URL}/api/games/${gameData.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinerAddress: address,
          paymentTxHash: receipt.hash,
          paymentAmount: gameData.priceUSD
        })
      })
      
      if (joinResponse.ok) {
        setGameData(prev => ({ ...prev, joiner: address, status: 'joined' }))
        
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
      }
        
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
      <Container>
        <ContentWrapper>
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
              background: roundResult.isWinner && roundResult.playerAddress === address ? 
                'linear-gradient(45deg, rgba(0, 255, 65, 0.9), rgba(0, 255, 65, 0.7))' : 
                'linear-gradient(45deg, rgba(255, 20, 147, 0.9), rgba(255, 20, 147, 0.7))',
              padding: '3rem 4rem',
              borderRadius: '2rem',
              border: `4px solid ${roundResult.isWinner && roundResult.playerAddress === address ? '#00FF41' : '#FF1493'}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '1rem'
              }}>
                {roundResult.isWinner && roundResult.playerAddress === address ? '🏆 WINNER!' : '💔 LOSER!'}
              </div>
              <div style={{ fontSize: '1.5rem', color: 'white', fontWeight: 'bold' }}>
                Coin: {roundResult.result.toUpperCase()}
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
