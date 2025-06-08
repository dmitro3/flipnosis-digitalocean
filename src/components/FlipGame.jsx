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
import ReliableGoldCoin from './ReliableGoldCoin'
import PowerDisplay from '../components/PowerDisplay'
import PaymentService from '../services/PaymentService'
import { ethers } from 'ethers'
import ProfilePicture from './ProfilePicture'
import baseEthLogo from '../../Images/baseeth.webp'
import hazeVideo from '../../Images/Video/haze.webm'
import GoldGameInstructions from './GoldGameInstructions'
import styled from '@emotion/styled'

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
`

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
    if (!gameId || !address) {
      console.log('❌ Cannot connect - missing gameId or address:', { gameId, address })
      return
    }

    console.log('🎮 Setting up WebSocket connection:', { gameId, address })
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    let reconnectTimer

    const connect = () => {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://cryptoflipz2-production.up.railway.app' 
        : 'ws://localhost:3001'
      
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnected(true)
        setSocket(ws)
        reconnectAttempts = 0
        
        // Join game
        const joinMessage = {
          type: 'connect_to_game',
          gameId,
          address
        }
        console.log('🎮 Sending join message:', joinMessage)
        ws.send(JSON.stringify(joinMessage))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Received WebSocket message:', {
            type: data.type,
            phase: data.phase,
            currentPlayer: data.currentPlayer,
            creatorChoice: data.creatorChoice,
            joinerChoice: data.joinerChoice,
            creator: data.creator,
            joiner: data.joiner
          })
          
          switch (data.type) {
            case 'game_state':
              console.log('🔄 Game state update:', {
                phase: data.phase,
                currentRound: data.currentRound,
                currentPlayer: data.currentPlayer,
                creatorWins: data.creatorWins,
                joinerWins: data.joinerWins,
                isFlipInProgress: data.isFlipInProgress,
                creatorChoice: data.creatorChoice,
                joinerChoice: data.joinerChoice,
                creator: data.creator,
                joiner: data.joiner
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
          }, 2000 * reconnectAttempts)
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
    // Only allow charging if player has made their choice and it's the charging phase
    if (!isMyTurn || !socket || isChargingRef.current || gameState?.phase !== 'round_active') return
    
    // Check if player has made their choice
    const playerChoice = isCreator ? gameState?.creatorChoice : gameState?.joinerChoice
    if (!playerChoice) {
      showError('You must choose heads or tails first!')
      return
    }
    
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

  const handlePlayerChoice = (choice) => {
    console.log('🎯 handlePlayerChoice called:', {
      choice,
      hasSocket: !!socket,
      hasGameState: !!gameState,
      gamePhase: gameState?.phase,
      isMyTurn: gameState?.currentPlayer === address,
      currentPlayer: gameState?.currentPlayer,
      myAddress: address,
      isCreator,
      isJoiner
    })

    if (!socket || !gameState) {
      console.log('❌ Cannot make choice - missing socket or gameState')
      showError('Connection error - please refresh')
      return
    }
    
    if (gameState.phase !== 'choosing') {
      console.log('❌ Cannot make choice - wrong phase:', gameState.phase)
      showError('Not in choosing phase')
      return
    }
    
    const isMyTurn = gameState.currentPlayer === address
    if (!isMyTurn) {
      console.log('❌ Not my turn:', { 
        currentPlayer: gameState.currentPlayer, 
        myAddress: address,
        isCreator,
        isJoiner
      })
      showError('Not your turn')
      return
    }
    
    console.log('🎯 Sending player choice to server:', choice)
    
    socket.send(JSON.stringify({
      type: 'player_choice',
      gameId,
      address,
      choice
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
      <BackgroundVideo autoPlay loop muted playsInline>
        <source src={hazeVideo} type="video/webm" />
      </BackgroundVideo>
      <Container style={{ 
        position: 'relative', 
        minHeight: '100vh',
        background: 'transparent !important',
        zIndex: 1
      }}>
        <ContentWrapper>
          {/* Main Game Area - Three Column Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '300px 1fr 300px', // Fixed widths for player cards
            gap: '2rem', 
            marginBottom: '2rem',
            alignItems: 'start', // Align to top
            minHeight: '500px'
          }}>
            
            {/* Player 1 Box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: isCreator ? `2px solid ${theme.colors.neonPink}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1rem',
              padding: '1rem',
              animation: gameState?.currentPlayer === gameState?.creator ? 'playerTurnGlow 1s ease-in-out infinite' : 'none',
              boxShadow: gameState?.currentPlayer === gameState?.creator ? '0 0 20px rgba(0, 255, 65, 0.5)' : 'none'
            }}>
              {/* Compact Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: isCreator ? 
                  `linear-gradient(45deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})` : 
                  'rgba(255,255,255,0.1)',
                borderRadius: '0.75rem'
              }}>
                {/* Profile Picture */}
                <ProfilePicture
                  address={gameState?.creator}
                  size="50px"
                  isClickable={isCreator}
                  showUploadIcon={isCreator}
                />
                
                {/* Player Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'white', fontWeight: 'bold', margin: 0, fontSize: '1rem' }}>
                    PLAYER 1 {isCreator && '(YOU)'}
                  </h3>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
                    {gameState?.creator ? `${gameState.creator.slice(0, 6)}...${gameState.creator.slice(-4)}` : 'Waiting...'}
                  </div>
                </div>
              </div>

              {/* Round Indicators for Player 1 */}
              <GoldGameInstructions
                isPlayerTurn={isMyTurn}
                gamePhase={gameState?.phase}
                isPlayer={isPlayer}
                playerNumber={1}
                spectatorMode={!isPlayer}
                currentPower={gameState?.chargingPlayer === address ? 
                  (gameState?.currentPlayer === gameState?.creator ? gameState?.creatorPower : gameState?.joinerPower) : 0
                }
                currentRound={gameState?.currentRound}
                maxRounds={gameState?.maxRounds}
                creatorWins={gameState?.creatorWins}
                joinerWins={gameState?.joinerWins}
              />
            </div>

            {/* Center - Coin and Power Area */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Coin */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <ReliableGoldCoin
                  isFlipping={!!flipAnimation}
                  flipResult={flipAnimation?.result}
                  flipDuration={flipAnimation?.duration}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={isMyTurn && gameState?.phase === 'round_active'}
                  isCharging={gameState?.chargingPlayer === address}
                  chargingPlayer={gameState?.chargingPlayer}
                  gamePhase={gameState?.phase}
                  creatorPower={gameState?.creatorPower || 0}
                  joinerPower={gameState?.joinerPower || 0}
                  creatorChoice={gameState?.creatorChoice}
                  joinerChoice={gameState?.joinerChoice}
                  isCreator={isCreator}
                />
              </div>

              {/* Power Display with Choice Buttons */}
              <PowerDisplay
                creatorPower={gameState?.creatorPower || 0}
                joinerPower={gameState?.joinerPower || 0}
                currentPlayer={gameState?.currentPlayer}
                creator={gameState?.creator}
                joiner={gameState?.joiner}
                chargingPlayer={gameState?.chargingPlayer}
                gamePhase={gameState?.phase}
                isMyTurn={isMyTurn}
                playerChoice={isCreator ? gameState?.creatorChoice : gameState?.joinerChoice}
                onPlayerChoice={handlePlayerChoice}
              />
            </div>

            {/* Player 2 Box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: isJoiner ? `2px solid ${theme.colors.neonBlue}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1rem',
              padding: '1rem',
              animation: gameState?.currentPlayer === gameState?.joiner ? 'playerTurnGlow 1s ease-in-out infinite' : 'none',
              boxShadow: gameState?.currentPlayer === gameState?.joiner ? '0 0 20px rgba(0, 255, 65, 0.5)' : 'none'
            }}>
              {/* Compact Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: isJoiner ? 
                  `linear-gradient(45deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})` : 
                  'rgba(255,255,255,0.1)',
                borderRadius: '0.75rem'
              }}>
                {/* Profile Picture */}
                <ProfilePicture
                  address={gameState?.joiner}
                  size="50px"
                  isClickable={isJoiner}
                  showUploadIcon={isJoiner}
                />
                
                {/* Player Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'white', fontWeight: 'bold', margin: 0, fontSize: '1rem' }}>
                    PLAYER 2 {isJoiner && '(YOU)'}
                  </h3>
                  <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
                    {gameState?.joiner ? `${gameState.joiner.slice(0, 6)}...${gameState.joiner.slice(-4)}` : 'Waiting...'}
                  </div>
                </div>
              </div>

              {/* Round Indicators for Player 2 */}
              <GoldGameInstructions
                isPlayerTurn={isMyTurn}
                gamePhase={gameState?.phase}
                isPlayer={isPlayer}
                playerNumber={2}
                spectatorMode={!isPlayer}
                currentPower={gameState?.chargingPlayer === address ? 
                  (gameState?.currentPlayer === gameState?.creator ? gameState?.creatorPower : gameState?.joinerPower) : 0
                }
                currentRound={gameState?.currentRound}
                maxRounds={gameState?.maxRounds}
                creatorWins={gameState?.creatorWins}
                joinerWins={gameState?.joinerWins}
              />
            </div>
          </div>

          {/* Spectator Mode Message */}
          {!isPlayer && (
            <div style={{
              marginTop: '2rem',
              textAlign: 'center',
              padding: '1rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '1rem'
            }}>
              <p style={{ color: '#FFD700', fontWeight: 'bold', margin: 0 }}>
                👀 SPECTATING
              </p>
            </div>
          )}

          {/* Game Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <NeonText style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              FLIP#{gameId.slice(-6).toUpperCase()}
            </NeonText>
            <div style={{ color: theme.colors.textSecondary }}>
              Best of {gameData?.rounds} • ${gameData?.priceUSD?.toFixed(2)}
              {gameState && <span> • {gameState.spectators} watching</span>}
            </div>
          </div>

          {/* Game Status */}
          {gameState?.phase === 'choosing' && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {isMyTurn ? (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '1rem'
                }}>
                  <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    🎯 CHOOSE YOUR SIDE!
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    Select heads or tails in your player box, then you can charge power and flip!
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
                    ⏳ Opponent is Choosing
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    Waiting for {!isCreator ? 'Player 1' : 'Player 2'} to choose heads or tails
                  </div>
                </div>
              )}
            </div>
          )}

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
                    ⚡ YOUR TURN TO FLIP!
                  </div>
                  <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                    You chose {isCreator ? gameState.creatorChoice?.toUpperCase() : gameState.joinerChoice?.toUpperCase()} - Hold coin to charge power, release to flip!
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
                    They chose {!isCreator ? gameState.creatorChoice?.toUpperCase() : gameState.joinerChoice?.toUpperCase()} and are charging power to flip
                  </div>
                </div>
              )}
            </div>
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
                  background: theme.colors.neonPink
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
