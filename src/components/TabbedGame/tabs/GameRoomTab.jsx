import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import GameRoom from '../../GameRoom/GameRoom'
import GameCoin from '../../GameOrchestrator/GameCoin'
import webSocketService from '../../services/WebSocketService'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const GameStatusHeader = styled.div`
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-bottom: 2px solid rgba(0, 191, 255, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`

const StatusBadge = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'active':
      case 'in_progress':
        return 'rgba(0, 255, 65, 0.2)'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return 'rgba(255, 149, 0, 0.2)'
      case 'waiting_challenger_deposit':
        return 'rgba(255, 215, 0, 0.2)'
      case 'completed':
        return 'rgba(128, 128, 128, 0.2)'
      default:
        return 'rgba(255, 255, 255, 0.1)'
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active':
      case 'in_progress':
        return 'rgba(0, 255, 65, 0.4)'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return 'rgba(255, 149, 0, 0.4)'
      case 'waiting_challenger_deposit':
        return 'rgba(255, 215, 0, 0.4)'
      case 'completed':
        return 'rgba(128, 128, 128, 0.4)'
      default:
        return 'rgba(255, 255, 255, 0.2)'
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active':
      case 'in_progress':
        return '#00FF41'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return '#FF9500'
      case 'waiting_challenger_deposit':
        return '#FFD700'
      case 'completed':
        return '#808080'
      default:
        return '#fff'
    }
  }};
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: bold;
`

const GameInfo = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`

const InfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
`

const InfoValue = styled.span`
  color: #00BFFF;
  font-weight: bold;
  font-size: 1rem;
`

const GameContent = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`

const WaitingState = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background: rgba(0, 0, 40, 0.95);
`

const WaitingIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const WaitingTitle = styled.h2`
  color: #FFD700;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`

const WaitingDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
  max-width: 500px;
  line-height: 1.5;
`

const ActionButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #00BFFF, #0080FF);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(45deg, #0080FF, #0060FF);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const CoinPreview = styled.div`
  display: flex;
  justify-content: center;
  margin: 2rem 0;
`

const GameRoomTab = ({ 
  gameData, 
  gameId, 
  socket, 
  connected, 
  coinConfig, 
  address, 
  isCreator 
}) => {
  const [gameState, setGameState] = useState(null)
  const [isGameReady, setIsGameReady] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [countdownInterval, setCountdownInterval] = useState(null)

  // Check if game is ready to play
  useEffect(() => {
    if (gameData) {
      console.log('🎮 GameRoomTab: Full gameData object:', gameData)
      
      const gameReady = gameData.status === 'active' || 
                       gameData.status === 'in_progress' ||
                       gameData.status === 'playing' ||
                       (gameData.creator_deposited && gameData.challenger_deposited) ||
                       (gameData.creatorDeposited && gameData.challengerDeposited) ||
                       (gameData.creator_deposited && gameData.challenger_deposited) ||
                       (gameData.creator_deposited && gameData.challenger_deposited)
      
      setIsGameReady(gameReady)
      
      console.log('🎮 GameRoomTab: Game ready check:', {
        status: gameData.status,
        creator_deposited: gameData.creator_deposited,
        challenger_deposited: gameData.challenger_deposited,
        creatorDeposited: gameData.creatorDeposited,
        challengerDeposited: gameData.challengerDeposited,
        gameReady,
        allKeys: Object.keys(gameData)
      })
    }
  }, [gameData])

  // Initialize game state when both players are ready
  useEffect(() => {
    if (isGameReady && gameData?.creator_deposited && gameData?.challenger_deposited) {
      console.log('🎮 Initializing game state for active game')
      
      // Only initialize if we don't already have a game state
      if (!gameState || gameState.phase === 'waiting') {
        setGameState({
          phase: 'choosing',
          currentRound: 1,
          totalRounds: 5,
          creatorScore: 0,
          challengerScore: 0,
          currentTurn: gameData?.creator, // Creator goes first
          timeLeft: 20, // 20 second countdown
          creatorChoice: null,
          joinerChoice: null,
          creatorPower: 0,
          joinerPower: 0
        })
        
        // Start the 20-second countdown for player 1 (creator)
        startCountdown()
      }
    }
  }, [isGameReady, gameData])

  // Start countdown timer
  const startCountdown = () => {
    console.log('⏰ Starting 20-second countdown for player 1')
    setCountdown(20)
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setCountdownInterval(null)
          console.log('⏰ Countdown expired - auto-choosing for player 1')
          
          // Auto-choose for player 1 if they haven't chosen
          if (gameState?.phase === 'choosing' && !gameState?.creatorChoice) {
            const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'
            setGameState(prev => ({
              ...prev,
              creatorChoice: autoChoice,
              phase: 'waiting_for_player2'
            }))
            console.log(`🎲 Auto-chose ${autoChoice} for player 1`)
          }
          
          return null
        }
        return prev - 1
      })
    }, 1000)
    
    setCountdownInterval(interval)
  }

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
  }, [countdownInterval])

  // WebSocket connection and message handling
  useEffect(() => {
    if (!gameId || !address) return

    const connectToGameRoom = async () => {
      try {
        const roomId = `game_${gameId}`
        await webSocketService.connect(roomId, address)
        console.log('🎮 Connected to game room WebSocket')
      } catch (error) {
        console.error('❌ Failed to connect to game room WebSocket:', error)
      }
    }

    connectToGameRoom()

    // Handle game state updates from WebSocket
    const handleGameStateUpdate = (data) => {
      console.log('🎮 Received game state update:', data)
      
      switch (data.type) {
        case 'game_started':
          console.log('🎮 Game started via WebSocket')
          setGameState(prev => ({
            ...prev,
            phase: 'choosing',
            currentRound: data.currentRound || 1,
            currentTurn: data.currentTurn
          }))
          startCountdown()
          break
          
        case 'player_choice':
          console.log('🎮 Player choice received:', data)
          if (data.player === gameData?.creator) {
            setGameState(prev => ({
              ...prev,
              creatorChoice: data.choice,
              phase: prev.phase === 'choosing' ? 'waiting_for_player2' : prev.phase
            }))
          } else if (data.player === gameData?.challenger) {
            setGameState(prev => ({
              ...prev,
              joinerChoice: data.choice,
              phase: 'both_chosen'
            }))
            
            // Both players have chosen - execute flip
            setTimeout(() => {
              executeFlip()
            }, 1000)
          }
          break
          
        case 'flip_result':
          console.log('🎮 Flip result received:', data)
          setGameState(prev => ({
            ...prev,
            phase: 'flip_result',
            flipResult: data.result,
            roundWinner: data.winner,
            creatorScore: data.creatorScore || prev.creatorScore,
            challengerScore: data.challengerScore || prev.challengerScore
          }))
          
          // Move to next round after showing result
          setTimeout(() => {
            nextRound()
          }, 3000)
          break
          
        case 'round_complete':
          console.log('🎮 Round complete:', data)
          nextRound()
          break
          
        case 'game_complete':
          console.log('🎮 Game complete:', data)
          setGameState(prev => ({
            ...prev,
            phase: 'game_complete'
          }))
          break
      }
    }

    // Register WebSocket message handlers
    webSocketService.on('game_started', handleGameStateUpdate)
    webSocketService.on('player_choice', handleGameStateUpdate)
    webSocketService.on('flip_result', handleGameStateUpdate)
    webSocketService.on('round_complete', handleGameStateUpdate)
    webSocketService.on('game_complete', handleGameStateUpdate)

    return () => {
      // Cleanup WebSocket handlers
      webSocketService.off('game_started', handleGameStateUpdate)
      webSocketService.off('player_choice', handleGameStateUpdate)
      webSocketService.off('flip_result', handleGameStateUpdate)
      webSocketService.off('round_complete', handleGameStateUpdate)
      webSocketService.off('game_complete', handleGameStateUpdate)
    }
  }, [gameId, address, gameData])

  const getGameStatus = () => {
    switch (gameData?.status) {
      case 'waiting_challenger':
      case 'awaiting_challenger':
      case 'waiting_for_challenger':
        return 'Waiting for challenger'
      case 'waiting_challenger_deposit':
        return 'Waiting for deposit'
      case 'active':
      case 'in_progress':
      case 'playing':
        return 'Game active'
      case 'completed':
        return 'Game completed'
      default:
        return gameData?.status || 'Unknown'
    }
  }

  const getGamePrice = () => {
    return gameData?.payment_amount || 
           gameData?.price_usd || 
           gameData?.final_price || 
           gameData?.price || 
           gameData?.asking_price || 
           gameData?.priceUSD || 
           0
  }

  const handleExitRoom = () => {
    console.log('Exiting game room')
    // Add logic to handle exiting the game
  }

  // Handle player choice
  const handlePlayerChoice = (choice) => {
    if (!gameState || gameState.phase !== 'choosing') return
    
    const isPlayer1 = address?.toLowerCase() === gameData?.creator?.toLowerCase()
    const isPlayer2 = address?.toLowerCase() === gameData?.challenger?.toLowerCase()
    
    if (isPlayer1 && !gameState.creatorChoice) {
      console.log(`🎲 Player 1 chose: ${choice}`)
      
      // Send choice via WebSocket
      webSocketService.send({
        type: 'game_action',
        gameId: gameId,
        action: 'make_choice',
        player: address,
        choice: choice,
        round: gameState.currentRound
      })
      
      setGameState(prev => ({
        ...prev,
        creatorChoice: choice,
        phase: 'waiting_for_player2'
      }))
      
      // Stop countdown
      if (countdownInterval) {
        clearInterval(countdownInterval)
        setCountdownInterval(null)
        setCountdown(null)
      }
    } else if (isPlayer2 && !gameState.joinerChoice) {
      console.log(`🎲 Player 2 chose: ${choice}`)
      
      // Send choice via WebSocket
      webSocketService.send({
        type: 'game_action',
        gameId: gameId,
        action: 'make_choice',
        player: address,
        choice: choice,
        round: gameState.currentRound
      })
      
      setGameState(prev => ({
        ...prev,
        joinerChoice: choice,
        phase: 'both_chosen'
      }))
      
      // Both players have chosen - start the flip
      setTimeout(() => {
        executeFlip()
      }, 1000)
    }
  }

  // Execute the coin flip
  const executeFlip = () => {
    console.log('🎲 Executing coin flip')
    const flipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Determine winner
    let roundWinner = null
    if (gameState.creatorChoice === flipResult) {
      roundWinner = 'creator'
    } else if (gameState.joinerChoice === flipResult) {
      roundWinner = 'joiner'
    }
    
    const newCreatorScore = roundWinner === 'creator' ? gameState.creatorScore + 1 : gameState.creatorScore
    const newChallengerScore = roundWinner === 'joiner' ? gameState.challengerScore + 1 : gameState.challengerScore
    
    console.log(`🎲 Flip result: ${flipResult}, Winner: ${roundWinner}`)
    
    // Send flip result via WebSocket
    webSocketService.send({
      type: 'game_action',
      gameId: gameId,
      action: 'flip_result',
      result: flipResult,
      winner: roundWinner,
      creatorChoice: gameState.creatorChoice,
      joinerChoice: gameState.joinerChoice,
      creatorScore: newCreatorScore,
      challengerScore: newChallengerScore,
      round: gameState.currentRound
    })
    
    // Update game state with result
    setGameState(prev => ({
      ...prev,
      phase: 'flip_result',
      flipResult: flipResult,
      roundWinner: roundWinner,
      creatorScore: newCreatorScore,
      challengerScore: newChallengerScore
    }))
    
    // Show result for 3 seconds, then move to next round
    setTimeout(() => {
      nextRound()
    }, 3000)
  }

  // Move to next round
  const nextRound = () => {
    const nextRoundNum = gameState.currentRound + 1
    if (nextRoundNum > 5) {
      // Game over
      webSocketService.send({
        type: 'game_action',
        gameId: gameId,
        action: 'game_complete',
        finalScore: {
          creator: gameState.creatorScore,
          challenger: gameState.challengerScore
        }
      })
      
      setGameState(prev => ({
        ...prev,
        phase: 'game_complete'
      }))
    } else {
      // Reset for next round
      const nextTurn = nextRoundNum % 2 === 1 ? gameData?.creator : gameData?.challenger
      
      webSocketService.send({
        type: 'game_action',
        gameId: gameId,
        action: 'next_round',
        round: nextRoundNum,
        currentTurn: nextTurn
      })
      
      setGameState(prev => ({
        ...prev,
        phase: 'choosing',
        currentRound: nextRoundNum,
        currentTurn: nextTurn,
        creatorChoice: null,
        joinerChoice: null,
        flipResult: null,
        roundWinner: null
      }))
      
      // Start countdown for next round
      startCountdown()
    }
  }

  const renderWaitingState = () => {
    const status = gameData?.status
    
    // Show debug info in waiting state too
    if (process.env.NODE_ENV === 'development') {
      return (
        <WaitingState>
          <WaitingIcon>🔍</WaitingIcon>
          <WaitingTitle>Debug Mode - Game Data</WaitingTitle>
          <WaitingDescription>
            <div style={{ textAlign: 'left', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <div><strong>Game Status:</strong> {status || 'undefined'}</div>
              <div><strong>Creator Deposited:</strong> {gameData?.creator_deposited ? 'Yes' : 'No'}</div>
              <div><strong>Challenger Deposited:</strong> {gameData?.challenger_deposited ? 'Yes' : 'No'}</div>
              <div><strong>Game Ready:</strong> {isGameReady ? 'Yes' : 'No'}</div>
              <div><strong>Game ID:</strong> {gameId}</div>
              <div><strong>Address:</strong> {address}</div>
            </div>
            <div style={{ fontSize: '0.8rem', textAlign: 'left', maxHeight: '200px', overflow: 'auto', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '0.25rem' }}>
              <strong>Full Game Data:</strong>
              <pre>{JSON.stringify(gameData, null, 2)}</pre>
            </div>
          </WaitingDescription>
          
          <ActionButton onClick={() => {
            console.log('🧪 Force starting game for testing')
            setIsGameReady(true)
            setGameState({
              phase: 'choosing',
              currentRound: 1,
              totalRounds: 5,
              creatorScore: 0,
              challengerScore: 0,
              currentTurn: gameData?.creator,
              timeLeft: 20,
              creatorChoice: null,
              joinerChoice: null,
              creatorPower: 0,
              joinerPower: 0
            })
            startCountdown()
          }}>
            🧪 Force Start Game (Test)
          </ActionButton>
        </WaitingState>
      )
    }
    
    if (status === 'waiting_challenger' || status === 'awaiting_challenger' || status === 'waiting_for_challenger') {
      return (
        <WaitingState>
          <WaitingIcon>⏳</WaitingIcon>
          <WaitingTitle>Waiting for Challenger</WaitingTitle>
          <WaitingDescription>
            The game is waiting for someone to accept an offer and join as a challenger. 
            Once a challenger joins and deposits their crypto, the game will begin!
          </WaitingDescription>
          
          <CoinPreview>
            <GameCoin
              gameId={gameId}
              gameState={{ phase: 'waiting' }}
              gameData={gameData}
              flipAnimation={null}
              customHeadsImage={coinConfig?.headsImage}
              customTailsImage={coinConfig?.tailsImage}
              gameCoin={coinConfig}
              isMobile={window.innerWidth <= 768}
              onPowerChargeStart={() => {}}
              onPowerChargeStop={() => {}}
              isMyTurn={() => false}
              address={address}
              isCreator={() => isCreator}
            />
          </CoinPreview>
          
          <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
            Game ID: {gameId}
          </div>
        </WaitingState>
      )
    }
    
    if (status === 'waiting_challenger_deposit') {
      return (
        <WaitingState>
          <WaitingIcon>💰</WaitingIcon>
          <WaitingTitle>Waiting for Deposit</WaitingTitle>
          <WaitingDescription>
            A challenger has accepted an offer! Waiting for them to deposit their crypto stake. 
            The game will start automatically once the deposit is confirmed.
          </WaitingDescription>
          
          <CoinPreview>
            <GameCoin
              gameId={gameId}
              gameState={{ phase: 'waiting' }}
              gameData={gameData}
              flipAnimation={null}
              customHeadsImage={coinConfig?.headsImage}
              customTailsImage={coinConfig?.tailsImage}
              gameCoin={coinConfig}
              isMobile={window.innerWidth <= 768}
              onPowerChargeStart={() => {}}
              onPowerChargeStop={() => {}}
              isMyTurn={() => false}
              address={address}
              isCreator={() => isCreator}
            />
          </CoinPreview>
        </WaitingState>
      )
    }
    
    if (status === 'completed') {
      return (
        <WaitingState>
          <WaitingIcon>🏆</WaitingIcon>
          <WaitingTitle>Game Completed</WaitingTitle>
          <WaitingDescription>
            This game has finished. Check the final results and coin flip history.
          </WaitingDescription>
          
          <ActionButton onClick={() => window.location.href = '/'}>
            Return to Games
          </ActionButton>
        </WaitingState>
      )
    }
    
    return (
      <WaitingState>
        <WaitingIcon>🎮</WaitingIcon>
        <WaitingTitle>Game Room Not Ready</WaitingTitle>
        <WaitingDescription>
          The game room is not yet available. Please check the other tabs for more information.
        </WaitingDescription>
      </WaitingState>
    )
  }

  const renderActiveGame = () => {
    const isPlayer1 = address?.toLowerCase() === gameData?.creator?.toLowerCase()
    const isPlayer2 = address?.toLowerCase() === gameData?.challenger?.toLowerCase()
    const isMyTurn = (gameState?.phase === 'choosing' && 
                     ((isPlayer1 && gameState?.currentTurn === gameData?.creator) ||
                      (isPlayer2 && gameState?.currentTurn === gameData?.challenger)))

    return (
      <GameContent>
        {/* Game Status Display */}
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.8)', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ color: '#00BFFF', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Round {gameState?.currentRound || 1} of 5
          </div>
          <div style={{ color: '#FFD700', fontSize: '1rem' }}>
            Score: Creator {gameState?.creatorScore || 0} - Challenger {gameState?.challengerScore || 0}
          </div>
          <div style={{ color: '#FFA500', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Phase: {gameState?.phase || 'unknown'} | Turn: {gameState?.currentTurn === gameData?.creator ? 'Creator' : 'Challenger'}
          </div>
        </div>

        {/* Countdown Display */}
        {countdown && gameState?.phase === 'choosing' && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '2px solid #FFD700',
            borderRadius: '1rem',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ color: '#FFD700', fontSize: '2rem', fontWeight: 'bold' }}>
              {countdown}s
            </div>
            <div style={{ color: '#FFD700', fontSize: '1rem' }}>
              {isMyTurn ? 'Your turn to choose!' : 'Waiting for opponent...'}
            </div>
          </div>
        )}

        {/* Game Phase Display */}
        {gameState?.phase === 'flip_result' && (
          <div style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '2px solid #00FF41',
            borderRadius: '1rem',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ color: '#00FF41', fontSize: '1.5rem', fontWeight: 'bold' }}>
              🎲 {gameState?.flipResult?.toUpperCase()}
            </div>
            <div style={{ color: '#00FF41', fontSize: '1rem' }}>
              {gameState?.roundWinner === 'creator' ? 'Creator wins!' : 
               gameState?.roundWinner === 'joiner' ? 'Challenger wins!' : 'Tie!'}
            </div>
          </div>
        )}

        {/* Choice Buttons */}
        {gameState?.phase === 'choosing' && isMyTurn && (
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => handlePlayerChoice('heads')}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.2), rgba(0, 0, 0, 0.5))',
                border: '2px solid #00FF41',
                borderRadius: '1rem',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 10px 30px rgba(0, 255, 65, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Heads
            </button>
            <button
              onClick={() => handlePlayerChoice('tails')}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.2), rgba(0, 0, 0, 0.5))',
                border: '2px solid #FF1493',
                borderRadius: '1rem',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 10px 30px rgba(255, 20, 147, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Tails
            </button>
          </div>
        )}

        {/* Waiting Message */}
        {gameState?.phase === 'waiting_for_player2' && (
          <div style={{
            background: 'rgba(255, 165, 0, 0.1)',
            border: '2px solid #FFA500',
            borderRadius: '1rem',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ color: '#FFA500', fontSize: '1.2rem', fontWeight: 'bold' }}>
              Waiting for Player 2 to choose...
            </div>
          </div>
        )}

        {/* Game Complete */}
        {gameState?.phase === 'game_complete' && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '2px solid #FFD700',
            borderRadius: '1rem',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold' }}>
              🏆 Game Complete!
            </div>
            <div style={{ color: '#FFD700', fontSize: '1rem' }}>
              Final Score: Creator {gameState?.creatorScore} - Challenger {gameState?.challengerScore}
            </div>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid #FF0000',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: '#FF0000'
          }}>
            <div>Debug Info:</div>
            <div>Game Ready: {isGameReady ? 'Yes' : 'No'}</div>
            <div>Creator Deposited: {gameData?.creator_deposited ? 'Yes' : 'No'}</div>
            <div>Challenger Deposited: {gameData?.challenger_deposited ? 'Yes' : 'No'}</div>
            <div>Game Status: {gameData?.status || 'undefined'}</div>
            <div>Game State: {JSON.stringify(gameState, null, 2)}</div>
            <button
              onClick={() => {
                console.log('🧪 Force starting game for testing')
                setIsGameReady(true)
                setGameState({
                  phase: 'choosing',
                  currentRound: 1,
                  totalRounds: 5,
                  creatorScore: 0,
                  challengerScore: 0,
                  currentTurn: gameData?.creator,
                  timeLeft: 20,
                  creatorChoice: null,
                  joinerChoice: null,
                  creatorPower: 0,
                  joinerPower: 0
                })
                startCountdown()
              }}
              style={{
                padding: '0.5rem 1rem',
                background: '#FF0000',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              🧪 Force Start Game (Test)
            </button>
          </div>
        )}

        {/* Coin Display */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <GameCoin
            gameId={gameId}
            gameState={gameState || { phase: 'waiting' }}
            gameData={gameData}
            flipAnimation={gameState?.phase === 'flip_result' ? { result: gameState.flipResult } : null}
            customHeadsImage={coinConfig?.headsImage}
            customTailsImage={coinConfig?.tailsImage}
            gameCoin={coinConfig}
            isMobile={window.innerWidth <= 768}
            onPowerChargeStart={() => {}}
            onPowerChargeStop={() => {}}
            isMyTurn={() => isMyTurn}
            address={address}
            isCreator={() => isCreator}
            flipSeed={gameState?.flipSeed}
          />
        </div>
      </GameContent>
    )
  }

  return (
    <TabContainer>
      {/* Game Status Header */}
      <GameStatusHeader>
        <StatusBadge status={gameData?.status}>
          🎮 {getGameStatus()}
        </StatusBadge>
        
        <GameInfo>
          <InfoItem>
            <InfoLabel>Price</InfoLabel>
            <InfoValue>${getGamePrice().toFixed(2)}</InfoValue>
          </InfoItem>
          
          {gameState && (
            <>
              <InfoItem>
                <InfoLabel>Round</InfoLabel>
                <InfoValue>{gameState.currentRound}/{gameState.totalRounds}</InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Score</InfoLabel>
                <InfoValue>{gameState.creatorScore} - {gameState.challengerScore}</InfoValue>
              </InfoItem>
            </>
          )}
          
          <InfoItem>
            <InfoLabel>Connection</InfoLabel>
            <InfoValue style={{ color: connected ? '#00FF41' : '#FF1493' }}>
              {connected ? '🟢 Online' : '🔴 Offline'}
            </InfoValue>
          </InfoItem>
        </GameInfo>
      </GameStatusHeader>
      
      {/* Game Content */}
      <GameContent>
        {isGameReady ? renderActiveGame() : renderWaitingState()}
      </GameContent>
    </TabContainer>
  )
}

export default GameRoomTab
