import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from '@emotion/styled'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useToast } from '../../contexts/ToastContext'
import socketService from '../../services/SocketService'
import OptimizedGoldCoin from '../OptimizedGoldCoin'
import ProfilePicture from '../ProfilePicture'
import GameResultPopup from '../GameResultPopup'

// === STYLED COMPONENTS ===
const GameContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: white;
`

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 2rem;
`

const GameTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.connected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)'};
  border: 1px solid ${props => props.connected ? '#00FF00' : '#FF0000'};
  border-radius: 0.5rem;
  font-size: 0.9rem;
`

const GameBoard = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  align-items: start;
`

const PlayerCard = styled.div`
  background: linear-gradient(135deg, 
    ${props => props.isCreator ? 
      'rgba(255, 215, 0, 0.15)' : 
      'rgba(0, 255, 65, 0.15)'
    } 0%, 
    rgba(0, 0, 0, 0.5) 100%
  );
  border: 2px solid ${props => props.isCreator ? '#FFD700' : '#00FF41'};
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 0 30px ${props => props.isCreator ? 
    'rgba(255, 215, 0, 0.3)' : 
    'rgba(0, 255, 65, 0.3)'
  };
`

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const PlayerLabel = styled.div`
  flex: 1;
  color: ${props => props.isCreator ? '#FFD700' : '#00FF41'};
  font-weight: bold;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const PlayerStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
`

const StatLabel = styled.span`
  color: #CCCCCC;
  font-size: 0.9rem;
`

const StatValue = styled.span`
  color: white;
  font-weight: bold;
  font-size: 1rem;
`

const RoundWins = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
`

const RoundDot = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => {
    if (props.isWon) return props.isCreator ? '#FFD700' : '#00FF41';
    if (props.isLost) return '#FF1493';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  border: 2px solid ${props => {
    if (props.isWon) return props.isCreator ? '#FFA500' : '#00CC33';
    if (props.isLost) return '#FF0066';
    return 'rgba(255, 255, 255, 0.2)';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
  color: ${props => props.isWon || props.isLost ? '#000' : '#666'};
  box-shadow: ${props => props.isWon ? 
    `0 0 10px ${props.isCreator ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 255, 65, 0.5)'}` : 
    'none'
  };
`

const CenterArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`

const CoinContainer = styled.div`
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const GameStatus = styled.div`
  text-align: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 1rem;
  min-width: 300px;
`

const StatusText = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 0.5rem;
`

const RoundInfo = styled.div`
  font-size: 1rem;
  color: #CCCCCC;
`

const ChoiceSection = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-top: 1rem;
`

const ChoiceButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  border: 2px solid ${props => props.choice === 'heads' ? '#00FF41' : '#FF1493'};
  background: linear-gradient(135deg, 
    ${props => props.choice === 'heads' ? 
      'rgba(0, 255, 65, 0.2)' : 
      'rgba(255, 20, 147, 0.2)'
    } 0%, 
    rgba(0, 0, 0, 0.5) 100%
  );
  color: white;
  border-radius: 1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px ${props => props.choice === 'heads' ? 
      'rgba(0, 255, 65, 0.4)' : 
      'rgba(255, 20, 147, 0.4)'
    };
  }
`

const PowerBarContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin-top: 1rem;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;
`

const PowerBarLabel = styled.div`
  color: #FFD700;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const PowerBar = styled.div`
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #FFD700;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
`

const PowerFill = styled.div`
  height: 100%;
  width: ${props => props.power}%;
  background: linear-gradient(90deg, 
    #FFD700 0%, 
    #FFA500 30%, 
    #FF6B00 60%, 
    #FF1493 100%
  );
  border-radius: 13px;
  transition: width 0.15s ease-out;
  box-shadow: ${props => props.charging ? 
    '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)' :
    '0 0 8px rgba(255, 215, 0, 0.6)'
  };
`

const ForfeitButton = styled.button`
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(255, 0, 0, 0.2) 0%, rgba(139, 0, 0, 0.5) 100%);
  border: 2px solid #FF0000;
  border-radius: 0.5rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  
  &:hover {
    background: linear-gradient(135deg, rgba(255, 0, 0, 0.4) 0%, rgba(139, 0, 0, 0.7) 100%);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 0, 0, 0.4);
  }
`

// === MAIN COMPONENT ===
const FlipSuiteFinal = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useToast()
  
  // Game state
  const [gameState, setGameState] = useState({
    phase: 'connecting', // connecting, waiting, choosing, charging, flipping, result, completed
    currentRound: 1,
    creatorScore: 0,
    challengerScore: 0,
    currentTurn: null,
    creator: null,
    challenger: null,
    creatorChoice: null,
    challengerChoice: null,
    creatorPower: 0,
    challengerPower: 0,
    flipResult: null,
    roundWinner: null,
    gameWinner: null
  })
  
  // UI state
  const [connected, setConnected] = useState(false)
  const [playerChoice, setPlayerChoice] = useState(null)
  const [powerLevel, setPowerLevel] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [countdown, setCountdown] = useState(null)
  
  // Refs
  const powerIntervalRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  
  // Helper functions
  const isCreator = useCallback(() => {
    return address?.toLowerCase() === gameState.creator?.toLowerCase()
  }, [address, gameState.creator])
  
  const isChallenger = useCallback(() => {
    return address?.toLowerCase() === gameState.challenger?.toLowerCase()
  }, [address, gameState.challenger])
  
  const isMyTurn = useCallback(() => {
    return address?.toLowerCase() === gameState.currentTurn?.toLowerCase()
  }, [address, gameState.currentTurn])
  
  const canMakeChoice = useCallback(() => {
    return isMyTurn() && gameState.phase === 'choosing' && !playerChoice
  }, [isMyTurn, gameState.phase, playerChoice])
  
  // Socket.io connection
  useEffect(() => {
    if (!gameId || !address) return
    
    const connectToGame = async () => {
      try {
        await socketService.connect(gameId, address)
        setConnected(true)
        setGameState(prev => ({ ...prev, phase: 'waiting' }))
        showSuccess('Connected to game!')
      } catch (error) {
        console.error('Failed to connect to game:', error)
        showError('Failed to connect to game server')
      }
    }
    
    connectToGame()
    
    return () => {
      socketService.disconnect()
    }
  }, [gameId, address])
  
  // Socket.io event handlers
  useEffect(() => {
    if (!connected) return
    
    // Game state updates
    const handleGameStateUpdate = (data) => {
      console.log('📊 Game state update:', data)
      setGameState(prev => ({ ...prev, ...data }))
    }
    
    // Round start
    const handleRoundStart = (data) => {
      console.log('🎲 Round start:', data)
      setGameState(prev => ({
        ...prev,
        currentRound: data.round,
        phase: 'choosing',
        currentTurn: data.currentTurn,
        creatorChoice: null,
        challengerChoice: null,
        creatorPower: 0,
        challengerPower: 0,
        flipResult: null,
        roundWinner: null
      }))
      setPlayerChoice(null)
      setPowerLevel(0)
      setIsCharging(false)
      
      // Start countdown for choice
      if (data.round <= 4) {
        startChoiceCountdown()
      }
    }
    
    // Round 5 auto-flip
    const handleAutoFlip = (data) => {
      console.log('🎲 Auto-flip round 5:', data)
      setGameState(prev => ({
        ...prev,
        phase: 'flipping',
        creatorChoice: data.autoChoice,
        challengerChoice: data.autoChoice,
        creatorPower: 10,
        challengerPower: 10
      }))
    }
    
    // Flip result
    const handleFlipResult = (data) => {
      console.log('🏆 Flip result:', data)
      setGameState(prev => ({
        ...prev,
        phase: 'result',
        flipResult: data.result,
        roundWinner: data.roundWinner,
        creatorScore: data.creatorScore,
        challengerScore: data.challengerScore
      }))
      
      // Show result popup
      setResultData({
        isWinner: data.roundWinner === address,
        flipResult: data.result,
        playerChoice: isCreator() ? data.creatorChoice : data.challengerChoice,
        roundWinner: data.roundWinner,
        round: data.round
      })
      setShowResultPopup(true)
      
      if (data.roundWinner === address) {
        showSuccess(`🎉 You won round ${data.round}!`)
      } else {
        showInfo(`😔 You lost round ${data.round}`)
      }
    }
    
    // Game complete
    const handleGameComplete = (data) => {
      console.log('🏆 Game complete:', data)
      setGameState(prev => ({
        ...prev,
        phase: 'completed',
        gameWinner: data.winner
      }))
      
      setResultData({
        isWinner: data.winner === address,
        isGameComplete: true,
        finalScore: `${data.creatorScore}-${data.challengerScore}`
      })
      setShowResultPopup(true)
      
      if (data.winner === address) {
        showSuccess('🎉 Congratulations! You won the game!')
      } else {
        showError('😔 You lost this game. Better luck next time!')
      }
    }
    
    // Register event listeners
    socketService.on('game_state_update', handleGameStateUpdate)
    socketService.on('round_start', handleRoundStart)
    socketService.on('auto_flip_round_5', handleAutoFlip)
    socketService.on('flip_result', handleFlipResult)
    socketService.on('game_complete', handleGameComplete)
    
    return () => {
      socketService.off('game_state_update', handleGameStateUpdate)
      socketService.off('round_start', handleRoundStart)
      socketService.off('auto_flip_round_5', handleAutoFlip)
      socketService.off('flip_result', handleFlipResult)
      socketService.off('game_complete', handleGameComplete)
    }
  }, [connected, address, isCreator])
  
  // Choice countdown
  const startChoiceCountdown = () => {
    setCountdown(20)
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setCountdown(null)
          
          // Auto-choose if it's player's turn
          if (isMyTurn() && !playerChoice) {
            const autoChoice = Math.random() < 0.5 ? 'heads' : 'tails'
            handlePlayerChoice(autoChoice)
            showInfo('⏰ Time\'s up! Auto-selected choice.')
          }
          
          return null
        }
        return prev - 1
      })
    }, 1000)
    
    countdownIntervalRef.current = interval
  }
  
  // Player choice handler
  const handlePlayerChoice = (choice) => {
    if (!canMakeChoice()) return
    
    setPlayerChoice(choice)
    
    // Send choice to server
    socketService.emit('player_choice', {
      gameId,
      choice,
      player: address
    })
    
    showSuccess(`You chose ${choice.toUpperCase()}!`)
    
    // Stop countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      setCountdown(null)
    }
  }
  
  // Power charging
  const startPowerCharging = () => {
    if (!isMyTurn() || gameState.phase !== 'choosing' || playerChoice) return
    
    setIsCharging(true)
    setPowerLevel(1)
    
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const newPower = Math.min(10, Math.max(1, 1 + (elapsed * 2))) // 1-10 over 4.5 seconds
      setPowerLevel(newPower)
      
      if (newPower >= 10) {
        stopPowerCharging()
      }
    }, 50)
    
    powerIntervalRef.current = interval
  }
  
  const stopPowerCharging = () => {
    if (!isCharging) return
    
    const finalPower = Math.round(powerLevel)
    
    setIsCharging(false)
    if (powerIntervalRef.current) {
      clearInterval(powerIntervalRef.current)
      powerIntervalRef.current = null
    }
    
    // Send power to server
    socketService.emit('power_charged', {
      gameId,
      power: finalPower,
      player: address
    })
    
    showSuccess(`Power charged to ${finalPower}/10!`)
  }
  
  // Forfeit handler
  const handleForfeit = () => {
    const confirmed = window.confirm(
      'Are you sure you want to forfeit? Your opponent will win both the NFT and crypto.'
    )
    if (confirmed) {
      socketService.emit('forfeit_game', {
        gameId,
        player: address
      })
      navigate('/marketplace')
    }
  }
  
  // Result popup handlers
  const handleResultClose = () => {
    setShowResultPopup(false)
    setResultData(null)
  }
  
  const handleClaimWinnings = () => {
    if (resultData?.isWinner) {
      // Navigate to claim page or handle winnings
      navigate(`/claim/${gameId}`)
    } else {
      navigate('/marketplace')
    }
  }
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (powerIntervalRef.current) {
        clearInterval(powerIntervalRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])
  
  // Render helpers
  const getStatusText = () => {
    switch (gameState.phase) {
      case 'connecting':
        return 'Connecting to game...'
      case 'waiting':
        return 'Waiting for game to start...'
      case 'choosing':
        if (gameState.currentRound === 5) {
          return 'Round 5 - Auto-flip starting...'
        }
        if (isMyTurn()) {
          return `Round ${gameState.currentRound} - Choose heads or tails!`
        }
        return `Round ${gameState.currentRound} - Waiting for opponent...`
      case 'charging':
        if (isMyTurn()) {
          return 'Charge your power!'
        }
        return 'Opponent is charging power...'
      case 'flipping':
        return 'Coin is flipping...'
      case 'result':
        return `Round ${gameState.currentRound} complete!`
      case 'completed':
        return 'Game completed!'
      default:
        return 'Game active'
    }
  }
  
  const getCurrentChooser = () => {
    if (gameState.currentRound <= 4) {
      return gameState.currentRound % 2 === 1 ? 'creator' : 'challenger'
    }
    return 'auto' // Round 5 is auto
  }
  
  if (gameState.phase === 'connecting') {
    return (
      <GameContainer>
        <GameStatus>
          <StatusText>Connecting to game...</StatusText>
        </GameStatus>
      </GameContainer>
    )
  }
  
  return (
    <GameContainer>
      {/* Forfeit Button */}
      <ForfeitButton onClick={handleForfeit}>
        🏳️ Forfeit Game
      </ForfeitButton>
      
      {/* Game Header */}
      <GameHeader>
        <GameTitle>Flip Suite Final</GameTitle>
        <ConnectionStatus connected={connected}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: connected ? '#00FF00' : '#FF0000' 
          }} />
          {connected ? 'Connected' : 'Disconnected'}
        </ConnectionStatus>
      </GameHeader>
      
      {/* Game Board */}
      <GameBoard>
        {/* Creator Card */}
        <PlayerCard isCreator={true}>
          <PlayerHeader>
            <ProfilePicture 
              address={gameState.creator}
              size={40}
            />
            <PlayerLabel isCreator={true}>
              {isCreator() ? 'You' : 'Creator'}
            </PlayerLabel>
          </PlayerHeader>
          
          <PlayerStats>
            <StatRow>
              <StatLabel>Power</StatLabel>
              <StatValue>{gameState.creatorPower || 0}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice</StatLabel>
              <StatValue>
                {gameState.creatorChoice ? gameState.creatorChoice.toUpperCase() : '-'}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score</StatLabel>
              <StatValue>{gameState.creatorScore}</StatValue>
            </StatRow>
          </PlayerStats>
          
          <RoundWins>
            {[1, 2, 3, 4, 5].map(round => (
              <RoundDot 
                key={round}
                isCreator={true}
                isWon={round <= gameState.creatorScore}
                isLost={round <= gameState.challengerScore}
              >
                {round}
              </RoundDot>
            ))}
          </RoundWins>
        </PlayerCard>
        
        {/* Center Area */}
        <CenterArea>
          <GameStatus>
            <StatusText>{getStatusText()}</StatusText>
            <RoundInfo>
              Round {gameState.currentRound}/5 • First to 3 wins
              {countdown && (
                <div style={{ marginTop: '0.5rem', color: '#FF6B6B' }}>
                  {countdown}s remaining
                </div>
              )}
            </RoundInfo>
          </GameStatus>
          
          <CoinContainer>
            <OptimizedGoldCoin
              isFlipping={gameState.phase === 'flipping'}
              flipResult={gameState.flipResult}
              flipDuration={3000}
              isPlayerTurn={isMyTurn() && gameState.phase === 'choosing'}
              onPowerCharge={startPowerCharging}
              onPowerRelease={stopPowerCharging}
              chargingPlayer={isMyTurn() ? address : null}
              creatorPower={gameState.creatorPower}
              joinerPower={gameState.challengerPower}
              creatorChoice={gameState.creatorChoice}
              joinerChoice={gameState.challengerChoice}
              isCreator={isCreator()}
              size={280}
              gamePhase={gameState.phase}
            />
          </CoinContainer>
          
          {/* Choice Buttons */}
          {gameState.phase === 'choosing' && canMakeChoice() && gameState.currentRound <= 4 && (
            <ChoiceSection>
              <ChoiceButton
                choice="heads"
                onClick={() => handlePlayerChoice('heads')}
                disabled={!canMakeChoice()}
              >
                👑 Heads
              </ChoiceButton>
              <ChoiceButton
                choice="tails"
                onClick={() => handlePlayerChoice('tails')}
                disabled={!canMakeChoice()}
              >
                💎 Tails
              </ChoiceButton>
            </ChoiceSection>
          )}
          
          {/* Power Bar */}
          <PowerBarContainer show={gameState.phase === 'choosing' && isMyTurn()}>
            <PowerBarLabel>
              {isCharging ? '⚡ Charging Power ⚡' : 'Power Level'}
            </PowerBarLabel>
            <PowerBar>
              <PowerFill 
                power={powerLevel * 10}
                charging={isCharging}
              />
            </PowerBar>
            <div style={{ 
              textAlign: 'center', 
              marginTop: '0.5rem', 
              fontSize: '0.9rem', 
              color: '#FFD700' 
            }}>
              {powerLevel}/10
            </div>
          </PowerBarContainer>
        </CenterArea>
        
        {/* Challenger Card */}
        <PlayerCard isCreator={false}>
          <PlayerHeader>
            <ProfilePicture 
              address={gameState.challenger}
              size={40}
            />
            <PlayerLabel isCreator={false}>
              {isChallenger() ? 'You' : 'Challenger'}
            </PlayerLabel>
          </PlayerHeader>
          
          <PlayerStats>
            <StatRow>
              <StatLabel>Power</StatLabel>
              <StatValue>{gameState.challengerPower || 0}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice</StatLabel>
              <StatValue>
                {gameState.challengerChoice ? gameState.challengerChoice.toUpperCase() : '-'}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score</StatLabel>
              <StatValue>{gameState.challengerScore}</StatValue>
            </StatRow>
          </PlayerStats>
          
          <RoundWins>
            {[1, 2, 3, 4, 5].map(round => (
              <RoundDot 
                key={round}
                isCreator={false}
                isWon={round <= gameState.challengerScore}
                isLost={round <= gameState.creatorScore}
              >
                {round}
              </RoundDot>
            ))}
          </RoundWins>
        </PlayerCard>
      </GameBoard>
      
      {/* Result Popup */}
      {showResultPopup && resultData && (
        <GameResultPopup
          resultData={resultData}
          onClose={handleResultClose}
          onClaimWinnings={handleClaimWinnings}
        />
      )}
    </GameContainer>
  )
}

export default FlipSuiteFinal
