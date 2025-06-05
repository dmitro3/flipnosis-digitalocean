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
import EnhancedReliableGoldCoin from '../components/EnhancedReliableGoldCoin'
import CompactPlayerCard from '../components/CompactPlayerCard'
import PowerDisplay from '../components/PowerDisplay'
import PaymentService from '../services/PaymentService'
import { ethers } from 'ethers'
import ProfilePicture from './ProfilePicture'
import baseEthLogo from '../../Images/baseeth.webp'
import GoldGameInstructions from './GoldGameInstructions'

const EnhancedFlipGame = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { isConnected, address, provider } = useWallet()
  const { showSuccess, showError, showInfo } = useToast()

  // API URL
  const API_URL = 'https://cryptoflipz2-production.up.railway.app'

  // Local state
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joiningGame, setJoiningGame] = useState(false)

  // WebSocket state - Enhanced for choice system
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [flipAnimation, setFlipAnimation] = useState(null)
  const [roundResult, setRoundResult] = useState(null)

  // Choice system state
  const [currentPlayerChoice, setCurrentPlayerChoice] = useState(null)
  const [opponentChoice, setOpponentChoice] = useState(null)
  const [hasChosen, setHasChosen] = useState(false)
  const [canChoose, setCanChoose] = useState(false)

  // Refs for user input
  const isChargingRef = useRef(false)

  // Player identification
  const isCreator = gameData?.creator === address
  const isJoiner = gameData?.joiner === address
  const isPlayer = isCreator || isJoiner
  const isMyTurn = gameState?.currentPlayer === address

  // Enhanced game phases
  const gamePhase = gameState?.phase || 'waiting'
  const isWaitingForChoice = gamePhase === 'waiting_for_choice'
  const isChargingPhase = gamePhase === 'charging_power'
  const isFlippingPhase = gamePhase === 'flipping'

  // WebSocket connection with enhanced message handling
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
        reconnectAttempts = 0
        
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
          console.log('📡 Received:', data.type, data)
          
          switch (data.type) {
            case 'game_state':
              console.log('🔄 Enhanced game state:', data)
              setGameState(data)
              
              // Handle choice-related state
              if (data.phase === 'waiting_for_choice') {
                setCanChoose(data.currentPlayer === address && !data.playerHasChosen)
                setHasChosen(data.playerHasChosen || false)
                setCurrentPlayerChoice(data.currentPlayerChoice || null)
                setOpponentChoice(data.opponentChoice || null)
              } else {
                setCanChoose(false)
              }
              break
              
            case 'choice_made':
              console.log('🎯 Choice made:', data)
              if (data.player === address) {
                setCurrentPlayerChoice(data.choice)
                setHasChosen(true)
                setCanChoose(false)
              } else {
                setOpponentChoice(data.choice)
              }
              break
              
            case 'flip_animation':
              console.log('🎬 Flip animation received:', data)
              setFlipAnimation(data)
              setRoundResult(null)
              break
              
            case 'round_result':
              console.log('🏁 Round result received:', data)
              setRoundResult(data)
              // Reset choices for next round
              setCurrentPlayerChoice(null)
              setOpponentChoice(null)
              setHasChosen(false)
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

  // Choice selection handler
  const handleChoiceSelect = (choice) => {
    if (!canChoose || !socket || hasChosen) return
    
    console.log('🎯 Selecting choice:', choice)
    
    setCurrentPlayerChoice(choice)
    setHasChosen(true)
    setCanChoose(false)
    
    // Send choice to server
    socket.send(JSON.stringify({
      type: 'make_choice',
      gameId,
      address,
      choice
    }))
  }

  // User input handlers
  const handlePowerChargeStart = () => {
    if (!isMyTurn || !socket || isChargingRef.current || !hasChosen) return
    
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
        minHeight: '100vh',
        background: 'transparent !important',
        zIndex: 1
      }}>
        {/* Enhanced Plasma Background */}
        <div className="plasma-background">
          <div className="plasma-lightning"></div>
          <div className="plasma-particles"></div>
        </div>
        
        <ContentWrapper>
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

          {/* Enhanced Three Column Layout */}
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
            
            {/* Left - Player 1 (Creator) */}
            <CompactPlayerCard
              player={gameState?.creator || gameData?.creator}
              isCurrentUser={isCreator}
              playerNumber={1}
              nft={gameData?.nft}
              cryptoAmount={gameData?.priceUSD?.toFixed(2)}
              score={gameState?.creatorWins || 0}
              gamePhase={gamePhase}
              isActiveTurn={gameState?.currentPlayer === gameState?.creator}
              choice={gameState?.currentPlayer === gameState?.creator ? currentPlayerChoice : opponentChoice}
              onChoiceSelect={isCreator ? handleChoiceSelect : null}
              canChoose={isCreator && canChoose}
              hasChosen={isCreator ? hasChosen : gameState?.opponentHasChosen}
              contractAddress={gameData?.nft?.contractAddress}
              tokenId={gameData?.nft?.tokenId}
              nftChain={gameData?.nft?.chain}
            />

            {/* Center - Enhanced Coin */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: '2rem',
                transform: 'scale(1.0)'
              }}>
                <EnhancedReliableGoldCoin
                  isFlipping={!!flipAnimation}
                  flipResult={flipAnimation?.result}
                  flipDuration={flipAnimation?.duration}
                  onPowerCharge={handlePowerChargeStart}
                  onPowerRelease={handlePowerChargeStop}
                  isPlayerTurn={isMyTurn && hasChosen && isChargingPhase}
                  isCharging={gameState?.chargingPlayer === address}
                  chargingPlayer={gameState?.chargingPlayer}
                  gamePhase={gamePhase}
                  playerChoice={currentPlayerChoice}
                  opponentChoice={opponentChoice}
                  currentPlayer={gameState?.currentPlayer}
                  viewerAddress={address}
                />
              </div>

              {/* Enhanced Power Display */}
              {(isChargingPhase || isFlippingPhase) && (
                <PowerDisplay
                  creatorPower={gameState?.creatorPower || 0}
                  joinerPower={gameState?.joinerPower || 0}
                  currentPlayer={gameState?.currentPlayer}
                  creator={gameState?.creator}
                  joiner={gameState?.joiner}
                  chargingPlayer={gameState?.chargingPlayer}
                />
              )}
            </div>

            {/* Right - Player 2 (Joiner) */}
            <CompactPlayerCard
              player={gameState?.joiner || gameData?.joiner}
              isCurrentUser={isJoiner}
              playerNumber={2}
              cryptoAmount={gameData?.priceUSD?.toFixed(2)}
              score={gameState?.joinerWins || 0}
              gamePhase={gamePhase}
              isActiveTurn={gameState?.currentPlayer === gameState?.joiner}
              choice={gameState?.currentPlayer === gameState?.joiner ? currentPlayerChoice : opponentChoice}
              onChoiceSelect={isJoiner ? handleChoiceSelect : null}
              canChoose={isJoiner && canChoose}
              hasChosen={isJoiner ? hasChosen : gameState?.opponentHasChosen}
            />
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
                  👑 Player 1
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
                  💎 Player 2
                </div>
              </div>
            </div>
          )}

          {/* Game Status */}
          {isWaitingForChoice && isMyTurn && canChoose && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 50%, rgba(0, 0, 0, 0.4) 100%)',
                border: '3px solid #FFD700',
                borderRadius: '1rem',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
                animation: 'goldContainerGlow 2s ease-in-out infinite'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
                <div style={{ 
                  color: '#FFD700', 
                  fontWeight: 'bold',
                  fontSize: '1.5rem',
                  textShadow: '0 0 15px rgba(255, 215, 0, 0.8)',
                  marginBottom: '0.5rem'
                }}>
                  CHOOSE YOUR SIDE!
                </div>
                <div style={{ 
                  color: 'rgba(255, 215, 0, 0.8)', 
                  fontSize: '1rem'
                }}>
                  Select Heads or Tails, then charge power to flip
                </div>
              </div>
            </div>
          )}

          {isChargingPhase && isMyTurn && hasChosen && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                padding: '1.5rem',
                background: 'rgba(0, 255, 65, 0.1)',
                border: '2px solid rgba(0, 255, 65, 0.3)',
                borderRadius: '1rem'
              }}>
                <div style={{ color: theme.colors.statusSuccess, fontWeight: 'bold', fontSize: '1.2rem' }}>
                  ⚡ CHARGE POWER & FLIP!
                </div>
                <div style={{ color: theme.colors.textSecondary, marginTop: '0.5rem' }}>
                  You chose {currentPlayerChoice?.toUpperCase()} - Hold coin to charge, release to flip!
                </div>
              </div>
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
                You chose: {currentPlayerChoice?.toUpperCase()}
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

          {/* Gold Game Instructions */}
          <GoldGameInstructions
            isPlayerTurn={isMyTurn}
            gamePhase={gamePhase}
            isPlayer={isPlayer}
            playerNumber={isCreator ? 1 : 2}
            spectatorMode={!isPlayer}
            currentPower={gameState?.chargingPlayer === address ? 
              (gameState?.currentPlayer === gameState?.creator ? gameState?.creatorPower : gameState?.joinerPower) : 0
            }
          />
        </ContentWrapper>
      </Container>
    </ThemeProvider>
  )
}

export default EnhancedFlipGame
