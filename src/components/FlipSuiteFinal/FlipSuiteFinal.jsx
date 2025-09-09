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
    ${props => props.isCreator ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 123, 255, 0.1)'} 0%, 
    ${props => props.isCreator ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 86, 179, 0.2)'} 100%);
  border: 2px solid ${props => props.isCreator ? '#FFD700' : '#007BFF'};
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  position: relative;
  
  ${props => props.isActive && `
    box-shadow: 0 0 20px ${props.isCreator ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 123, 255, 0.5)'};
    transform: scale(1.05);
  `}
  
  transition: all 0.3s ease;
`

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`

const PlayerLabel = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.isCreator ? '#FFD700' : '#007BFF'};
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
`

const StatLabel = styled.span`
  font-size: 0.9rem;
  opacity: 0.8;
`

const StatValue = styled.span`
  font-weight: bold;
  color: ${props => props.isWinner ? '#00FF00' : props.isLoser ? '#FF0000' : 'inherit'};
`

const RoundWins = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
`

const WinIndicator = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.won ? '#00FF00' : 'rgba(255, 255, 255, 0.2)'};
  border: 2px solid ${props => props.won ? '#00FF00' : 'rgba(255, 255, 255, 0.3)'};
`

const CoinContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`

const GameStatus = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  font-weight: bold;
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`

const ChoiceButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.selected ? '#FFD700' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.selected ? '#000' : '#fff'};
  border: 2px solid ${props => props.selected ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'};
  
  &:hover {
    background: ${props => props.selected ? '#FFD700' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const PowerSlider = styled.div`
  width: 100%;
  max-width: 300px;
  margin-bottom: 2rem;
`

const PowerLabel = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
`

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFD700;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFD700;
    cursor: pointer;
    border: none;
  }
`

const FlipButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #000;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
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
    phase: 'connecting', // connecting, waiting, choosing, flipping, result, completed
    currentRound: 1,
    totalRounds: 5,
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
  const [powerLevel, setPowerLevel] = useState(50)
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
  
  const canFlip = useCallback(() => {
    return isMyTurn() && gameState.phase === 'choosing' && playerChoice && powerLevel > 0
  }, [isMyTurn, gameState.phase, playerChoice, powerLevel])
  
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
      console.log('🔄 Game state update:', data)
      setGameState(prev => ({ ...prev, ...data }))
    }
    
    // Game started
    const handleGameStarted = (data) => {
      console.log('🚀 Game started:', data)
      setGameState(prev => ({
        ...prev,
        phase: data.phase || 'choosing',
        status: data.status || 'active',
        creator: data.creator || prev.creator,
        challenger: data.challenger || prev.challenger,
        currentTurn: data.currentTurn || data.creator,
        currentRound: data.currentRound || 1,
        totalRounds: data.totalRounds || 5,
        creatorScore: data.creatorScore || 0,
        challengerScore: data.challengerScore || 0
      }))
      showInfo('🎮 Game started! Choose heads or tails!')
    }
    
    // Round start
    const handleRoundStart = (data) => {
      console.log('🔄 Round start:', data)
      setGameState(prev => ({
        ...prev,
        phase: 'choosing',
        currentRound: data.round,
        currentTurn: data.currentTurn,
        creatorChoice: null,
        challengerChoice: null,
        creatorPower: 0,
        challengerPower: 0,
        flipResult: null,
        roundWinner: null
      }))
      setPlayerChoice(null)
      setPowerLevel(50)
      showInfo(`🎯 Round ${data.round} starting! It's ${data.currentTurn === address ? 'your' : 'opponent\'s'} turn!`)
    }
    
    // Choice made
    const handleChoiceMade = (data) => {
      console.log('🎯 Choice made:', data)
      setGameState(prev => ({
        ...prev,
        [data.isCreator ? 'creatorChoice' : 'challengerChoice']: data.choice,
        [data.isCreator ? 'creatorPower' : 'challengerPower']: data.power
      }))
    }
    
    // Flip result
    const handleFlipResult = (data) => {
      console.log('🏆 Flip result:', data)
      setGameState(prev => ({
        ...prev,
        phase: 'result',
        flipResult: data.flipResult,
        roundWinner: data.roundWinner,
        creatorScore: data.creatorScore,
        challengerScore: data.challengerScore,
        creatorChoice: data.creatorChoice,
        challengerChoice: data.challengerChoice
      }))
      
      // Show result popup
      setResultData({
        isWinner: data.roundWinner === address,
        flipResult: data.flipResult,
        playerChoice: isCreator() ? data.creatorChoice : data.challengerChoice,
        roundWinner: data.roundWinner,
        round: data.round
      })
      setShowResultPopup(true)
      
      if (data.roundWinner === address) {
        showSuccess(`🎉 You won round ${data.round}!`)
      } else if (data.roundWinner) {
        showInfo(`😔 You lost round ${data.round}`)
      } else {
        showInfo(`🤝 Round ${data.round} was a tie!`)
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
    socketService.on('game_started', handleGameStarted)
    socketService.on('round_start', handleRoundStart)
    socketService.on('choice_made', handleChoiceMade)
    socketService.on('flip_result', handleFlipResult)
    socketService.on('game_complete', handleGameComplete)
    
    return () => {
      socketService.off('game_state_update', handleGameStateUpdate)
      socketService.off('game_started', handleGameStarted)
      socketService.off('round_start', handleRoundStart)
      socketService.off('choice_made', handleChoiceMade)
      socketService.off('flip_result', handleFlipResult)
      socketService.off('game_complete', handleGameComplete)
    }
  }, [connected, address, isCreator, showSuccess, showError, showInfo])
  
  // Game actions
  const handleChoice = (choice) => {
    if (!canMakeChoice()) return
    
    setPlayerChoice(choice)
    showInfo(`You chose ${choice}! Now set your power level.`)
  }
  
  const handlePowerChange = (event) => {
    setPowerLevel(parseInt(event.target.value))
  }
  
  const handleFlip = () => {
    if (!canFlip()) return
    
    console.log('🎯 Making choice:', { choice: playerChoice, power: powerLevel })
    
    socketService.emit('player_choice', {
      gameId,
      address,
      choice: playerChoice,
      power: powerLevel
    })
    
    setGameState(prev => ({ ...prev, phase: 'flipping' }))
    showInfo('🎲 Flipping coin...')
  }
  
  const handleForfeit = () => {
    if (window.confirm('Are you sure you want to forfeit this game?')) {
      navigate('/')
      showInfo('Game forfeited')
    }
  }
  
  const handleResultClose = () => {
    setShowResultPopup(false)
    setResultData(null)
  }
  
  // Render game status
  const renderGameStatus = () => {
    if (gameState.phase === 'connecting') {
      return 'Connecting to game...'
    } else if (gameState.phase === 'waiting') {
      return 'Waiting for game to start...'
    } else if (gameState.phase === 'choosing') {
      if (isMyTurn()) {
        return `Round ${gameState.currentRound} - Your turn! Choose heads or tails`
      } else {
        return `Round ${gameState.currentRound} - Waiting for ${gameState.currentTurn === gameState.creator ? 'Creator' : 'Challenger'} to choose`
      }
    } else if (gameState.phase === 'flipping') {
      return 'Flipping coin...'
    } else if (gameState.phase === 'result') {
      return `Round ${gameState.currentRound} - ${gameState.roundWinner ? `${gameState.roundWinner === address ? 'You' : 'Opponent'} won!` : 'Tie!'}`
    } else if (gameState.phase === 'completed') {
      return `Game Complete - ${gameState.gameWinner === address ? 'You won!' : 'You lost!'}`
    }
    return 'Unknown game state'
  }
  
  // Render choice buttons
  const renderChoiceButtons = () => {
    if (gameState.phase !== 'choosing' || !isMyTurn()) return null
    
    return (
      <ChoiceButtons>
        <ChoiceButton
          selected={playerChoice === 'heads'}
          onClick={() => handleChoice('heads')}
          disabled={!canMakeChoice()}
        >
          HEADS
        </ChoiceButton>
        <ChoiceButton
          selected={playerChoice === 'tails'}
          onClick={() => handleChoice('tails')}
          disabled={!canMakeChoice()}
        >
          TAILS
        </ChoiceButton>
      </ChoiceButtons>
    )
  }
  
  // Render power slider
  const renderPowerSlider = () => {
    if (gameState.phase !== 'choosing' || !isMyTurn() || !playerChoice) return null
    
    return (
      <PowerSlider>
        <PowerLabel>Power Level: {powerLevel}%</PowerLabel>
        <Slider
          type="range"
          min="1"
          max="100"
          value={powerLevel}
          onChange={handlePowerChange}
        />
      </PowerSlider>
    )
  }
  
  // Render flip button
  const renderFlipButton = () => {
    if (gameState.phase !== 'choosing' || !isMyTurn() || !playerChoice) return null
    
    return (
      <FlipButton
        onClick={handleFlip}
        disabled={!canFlip()}
      >
        🎲 FLIP COIN
      </FlipButton>
    )
  }
  
  // Render round wins
  const renderRoundWins = (isCreator) => {
    const wins = isCreator ? gameState.creatorScore : gameState.challengerScore
    const rounds = []
    
    for (let i = 1; i <= gameState.totalRounds; i++) {
      rounds.push(
        <WinIndicator key={i} won={i <= wins} />
      )
    }
    
    return <RoundWins>{rounds}</RoundWins>
  }
  
  if (gameState.phase === 'connecting') {
    return (
      <GameContainer>
        <GameStatus>Connecting to game...</GameStatus>
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
        <PlayerCard isCreator={true} isActive={gameState.currentTurn === gameState.creator}>
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
          
          {renderRoundWins(true)}
        </PlayerCard>
        
        {/* Coin Container */}
        <CoinContainer>
          <GameStatus>{renderGameStatus()}</GameStatus>
          
          {renderChoiceButtons()}
          {renderPowerSlider()}
          {renderFlipButton()}
          
          <OptimizedGoldCoin
            isSpinning={gameState.phase === 'flipping'}
            result={gameState.flipResult}
            power={isCreator() ? gameState.creatorPower : gameState.challengerPower}
          />
        </CoinContainer>
        
        {/* Challenger Card */}
        <PlayerCard isCreator={false} isActive={gameState.currentTurn === gameState.challenger}>
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
          
          {renderRoundWins(false)}
        </PlayerCard>
      </GameBoard>
      
      {/* Result Popup */}
      {showResultPopup && (
        <GameResultPopup
          isOpen={showResultPopup}
          onClose={handleResultClose}
          result={resultData}
        />
      )}
    </GameContainer>
  )
}

export default FlipSuiteFinal