import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import styled from 'styled-components'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import useGameData from './hooks/useGameData'
import useWebSocket from '../../hooks/useWebSocket'
import GameChat from './GameChat'
import GamePayment from './GamePayment'
import PlayerCard from './PlayerCard'
import OptimizedCoinWrapper from './OptimizedCoinWrapper'
import { useNotification } from '../../contexts/NotificationContext'
import { detectDevice } from '../../utils/deviceDetection'

// Container that transforms based on game state
const GameContainer = styled.div`
  display: flex;
  gap: 2rem;
  padding: 2rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.$gameMode && `
    .left-panel {
      width: 350px;
      transition: width 0.5s ease;
    }
    
    .center-panel {
      display: none;
    }
    
    .right-panel {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `}
`

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: ${props => props.$gameMode ? '350px' : '400px'};
  transition: all 0.5s ease;
`

const CenterPanel = styled.div`
  flex: 1;
  display: ${props => props.$gameMode ? 'none' : 'flex'};
  flex-direction: column;
  gap: 1rem;
  transition: all 0.5s ease;
  opacity: ${props => props.$gameMode ? 0 : 1};
`

const RightPanel = styled.div`
  width: ${props => props.$gameMode ? 'calc(100% - 400px)' : '400px'};
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.5s ease;
`

const GameBoard = styled.div`
  background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(30, 144, 255, 0.1));
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  display: ${props => props.$show ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  animation: ${props => props.$show ? 'slideIn 0.5s ease' : 'none'};
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`

const NFTDetailsBox = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.5s ease;
  
  ${props => props.$compact && `
    padding: 0.75rem;
    font-size: 0.9rem;
    
    h3 {
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
  `}
`

const OffersContainer = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  display: ${props => props.$hide ? 'none' : 'block'};
  transition: all 0.5s ease;
  opacity: ${props => props.$hide ? 0 : 1};
`

const CountdownOverlay = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  display: ${props => props.$show ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: ${props => props.$show ? 'pulse 1s ease-in-out' : 'none'};
`

const CountdownNumber = styled.div`
  font-size: 8rem;
  font-weight: bold;
  background: linear-gradient(45deg, #FF1493, #00BFFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 20, 147, 0.5);
`

const GameStartingText = styled.div`
  font-size: 2rem;
  color: #00BFFF;
  animation: glow 2s ease-in-out infinite;
  
  @keyframes glow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`

const ControlPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 0.75rem;
  border: 1px solid rgba(138, 43, 226, 0.3);
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`

const ChoiceButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  border: 2px solid ${props => props.$selected ? '#00BFFF' : 'rgba(138, 43, 226, 0.5)'};
  background: ${props => props.$selected 
    ? 'linear-gradient(135deg, rgba(0, 191, 255, 0.3), rgba(138, 43, 226, 0.3))'
    : 'rgba(0, 0, 0, 0.5)'};
  color: white;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PowerButton = styled.button`
  padding: 1rem;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #FF1493, #FFD700);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(255, 20, 147, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PowerBar = styled.div`
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 15px;
  overflow: hidden;
`

const PowerFill = styled.div`
  height: 100%;
  width: ${props => props.$power}%;
  background: linear-gradient(90deg, #FFD700, #FF1493);
  transition: width 0.1s ease;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
`

const RoundIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin: 1rem 0;
`

const RoundDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$won === 'creator' ? '#00FF00' : props.$won === 'joiner' ? '#FF0000' : '#333'};
  border: 2px solid ${props => props.$active ? '#FFD700' : '#666'};
`

export default function GameSession() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useNotification()
  const { isMobile } = detectDevice()
  
  // Game data and WebSocket
  const {
    gameData,
    gameState,
    offers,
    messages,
    depositTimeLeft,
    isCreator,
    isJoiner,
    loadGameData,
    handleAcceptOffer,
    sendMessage
  } = useGameData(gameId)
  
  const { sendMessage: wsSend, lastMessage } = useWebSocket()
  
  // Local state
  const [isGameMode, setIsGameMode] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [playerChoice, setPlayerChoice] = useState(null)
  const [opponentChoice, setOpponentChoice] = useState(null)
  const [powerLevel, setPowerLevel] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [roundResults, setRoundResults] = useState([])
  const [scores, setScores] = useState({ creator: 0, joiner: 0 })
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipResult, setFlipResult] = useState(null)
  
  const chargeInterval = useRef(null)
  
  // WebSocket message handler
  useEffect(() => {
    if (!lastMessage) return
    
    const data = JSON.parse(lastMessage.data)
    console.log('📨 GameSession received:', data.type, data)
    
    switch (data.type) {
      case 'game_phase_transition':
        handlePhaseTransition(data)
        break
        
      case 'countdown_start':
        startCountdown(data.count || 3)
        break
        
      case 'round_start':
        handleRoundStart(data)
        break
        
      case 'opponent_choice':
        setOpponentChoice(data.choice)
        break
        
      case 'coin_flip_start':
        handleCoinFlipStart(data)
        break
        
      case 'coin_flip_frame':
        // This is handled by OptimizedCoinWrapper
        break
        
      case 'round_result':
        handleRoundResult(data)
        break
        
      case 'game_complete':
        handleGameComplete(data)
        break
    }
  }, [lastMessage])
  
  // Phase transition handler
  const handlePhaseTransition = (data) => {
    console.log('🎮 Phase transition:', data)
    
    if (data.phase === 'game_active') {
      setIsGameMode(true)
      showSuccess('Game is starting!')
      
      // Start the countdown
      setTimeout(() => {
        startCountdown(3)
      }, 500)
    }
  }
  
  // Countdown logic
  const startCountdown = (count) => {
    setShowCountdown(true)
    setCountdownNumber(count)
    
    const interval = setInterval(() => {
      setCountdownNumber(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimeout(() => {
            setShowCountdown(false)
            // Request round start from server
            wsSend({
              type: 'request_round_start',
              gameId,
              round: currentRound
            })
          }, 1000)
          return 'GO!'
        }
        return prev - 1
      })
    }, 1000)
  }
  
  // Round start handler
  const handleRoundStart = (data) => {
    console.log('🎲 Round start:', data)
    setCurrentRound(data.round)
    setPlayerChoice(null)
    setOpponentChoice(null)
    setPowerLevel(0)
    setIsFlipping(false)
    setFlipResult(null)
    showInfo(`Round ${data.round} - Make your choice!`)
  }
  
  // Player choice handler
  const handleChoice = (choice) => {
    if (playerChoice || !isMyTurn()) return
    
    setPlayerChoice(choice)
    
    // Send choice to server
    wsSend({
      type: 'player_choice',
      gameId,
      choice,
      player: address
    })
    
    showInfo(`You chose ${choice}!`)
  }
  
  // Power charge handlers
  const startCharging = () => {
    if (!playerChoice || isCharging) return
    
    setIsCharging(true)
    chargeInterval.current = setInterval(() => {
      setPowerLevel(prev => {
        const newPower = Math.min(100, prev + 2)
        if (newPower >= 100) {
          releasePower()
        }
        return newPower
      })
    }, 50)
  }
  
  const releasePower = () => {
    if (!chargeInterval.current) return
    
    clearInterval(chargeInterval.current)
    chargeInterval.current = null
    setIsCharging(false)
    
    // Send power level to server
    wsSend({
      type: 'power_release',
      gameId,
      power: powerLevel,
      player: address
    })
    
    showSuccess(`Power released at ${powerLevel}%!`)
  }
  
  // Coin flip handler
  const handleCoinFlipStart = (data) => {
    setIsFlipping(true)
    showInfo('Flipping coin...')
  }
  
  // Round result handler
  const handleRoundResult = (data) => {
    console.log('🏆 Round result:', data)
    
    setFlipResult(data.result)
    setRoundResults(prev => [...prev, {
      round: data.round,
      winner: data.winner
    }])
    
    setScores({
      creator: data.scores.creator,
      joiner: data.scores.joiner
    })
    
    const winnerText = data.winner === address ? 'You won!' : 'You lost!'
    showInfo(`Round ${data.round}: ${winnerText}`)
    
    // Reset for next round
    setTimeout(() => {
      if (data.round < 5 && Math.max(data.scores.creator, data.scores.joiner) < 3) {
        handleRoundStart({ round: data.round + 1 })
      }
    }, 3000)
  }
  
  // Game complete handler
  const handleGameComplete = (data) => {
    console.log('🎊 Game complete:', data)
    
    const didWin = data.winner === address
    if (didWin) {
      showSuccess('🎉 Congratulations! You won the game!')
    } else {
      showError('😔 You lost this game. Better luck next time!')
    }
    
    // Show claim button or redirect
    setTimeout(() => {
      if (didWin) {
        navigate(`/claim/${gameId}`)
      } else {
        navigate('/marketplace')
      }
    }, 5000)
  }
  
  // Helper functions
  const isMyTurn = () => {
    // In this game, both players choose simultaneously
    return !playerChoice && isGameMode && !showCountdown
  }
  
  const canCharge = () => {
    return playerChoice && !opponentChoice && !isFlipping
  }
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (chargeInterval.current) {
        clearInterval(chargeInterval.current)
      }
    }
  }, [])
  
  if (!gameData) {
    return <div>Loading game...</div>
  }
  
  return (
    <>
      {/* Countdown Overlay */}
      <CountdownOverlay $show={showCountdown}>
        {countdownNumber === 'GO!' ? (
          <GameStartingText>Game Starting!</GameStartingText>
        ) : (
          <CountdownNumber>{countdownNumber}</CountdownNumber>
        )}
      </CountdownOverlay>
      
      <GameContainer $gameMode={isGameMode}>
        {/* Left Panel - Chat and NFT Details */}
        <LeftPanel className="left-panel" $gameMode={isGameMode}>
          {/* NFT Details - Compact in game mode */}
          <NFTDetailsBox $compact={isGameMode}>
            <h3>{gameData.nft_name || 'NFT'}</h3>
            <p>{gameData.nft_collection}</p>
            <p>${gameData.price_usd} USD</p>
          </NFTDetailsBox>
          
          {/* Chat - Always visible */}
          <GameChat
            messages={messages}
            onSendMessage={sendMessage}
            isCompact={isGameMode}
          />
        </LeftPanel>
        
        {/* Center Panel - Offers/Display Coin (hidden in game mode) */}
        <CenterPanel className="center-panel" $gameMode={isGameMode}>
          {!isGameMode && (
            <>
              {/* Offers Container */}
              <OffersContainer $hide={isGameMode}>
                <h3>Active Offers</h3>
                {offers.map(offer => (
                  <div key={offer.id}>
                    {/* Offer display logic */}
                  </div>
                ))}
              </OffersContainer>
              
              {/* Display Coin */}
              {gameData.status === 'waiting_for_challenger' && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <OptimizedCoinWrapper
                    size={200}
                    headsImage={gameData.coin_heads_image}
                    tailsImage={gameData.coin_tails_image}
                    isDisplay={true}
                  />
                </div>
              )}
            </>
          )}
        </CenterPanel>
        
        {/* Right Panel - Payment/Game Board */}
        <RightPanel className="right-panel" $gameMode={isGameMode}>
          {!isGameMode ? (
            // Payment Section
            <GamePayment
              gameData={gameData}
              onDepositComplete={() => {
                showSuccess('Deposit confirmed!')
              }}
            />
          ) : (
            // Game Board
            <GameBoard $show={isGameMode}>
              {/* Round Indicators */}
              <RoundIndicator>
                {[1, 2, 3, 4, 5].map(round => (
                  <RoundDot
                    key={round}
                    $active={round === currentRound}
                    $won={roundResults.find(r => r.round === round)?.winner}
                  />
                ))}
              </RoundIndicator>
              
              {/* Player Cards */}
              <div style={{ display: 'flex', gap: '2rem', width: '100%', justifyContent: 'space-around' }}>
                <PlayerCard
                  player="creator"
                  address={gameData.creator}
                  score={scores.creator}
                  choice={isCreator() ? playerChoice : opponentChoice}
                  power={isCreator() ? powerLevel : 0}
                  isActive={true}
                />
                
                <PlayerCard
                  player="joiner"
                  address={gameData.challenger || gameData.joiner}
                  score={scores.joiner}
                  choice={isJoiner() ? playerChoice : opponentChoice}
                  power={isJoiner() ? powerLevel : 0}
                  isActive={true}
                />
              </div>
              
              {/* Game Coin */}
              <OptimizedCoinWrapper
                size={isMobile ? 200 : 300}
                headsImage={gameData.coin_heads_image}
                tailsImage={gameData.coin_tails_image}
                isFlipping={isFlipping}
                result={flipResult}
                serverControlled={true}
                gameId={gameId}
              />
              
              {/* Control Panel */}
              <ControlPanel>
                <ChoiceButtons>
                  <ChoiceButton
                    onClick={() => handleChoice('heads')}
                    disabled={!isMyTurn()}
                    $selected={playerChoice === 'heads'}
                  >
                    HEADS
                  </ChoiceButton>
                  <ChoiceButton
                    onClick={() => handleChoice('tails')}
                    disabled={!isMyTurn()}
                    $selected={playerChoice === 'tails'}
                  >
                    TAILS
                  </ChoiceButton>
                </ChoiceButtons>
                
                {canCharge() && (
                  <>
                    <PowerBar>
                      <PowerFill $power={powerLevel} />
                    </PowerBar>
                    <PowerButton
                      onMouseDown={startCharging}
                      onMouseUp={releasePower}
                      onTouchStart={startCharging}
                      onTouchEnd={releasePower}
                      disabled={!playerChoice || isFlipping}
                    >
                      {isCharging ? 'CHARGING...' : 'HOLD TO CHARGE'}
                    </PowerButton>
                  </>
                )}
              </ControlPanel>
            </GameBoard>
          )}
        </RightPanel>
      </GameContainer>
    </>
  )
}
