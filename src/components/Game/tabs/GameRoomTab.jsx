import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import PlayerCard from '../PlayerCard'
import OptimizedCoinWrapper from '../OptimizedCoinWrapper'

const TabContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 1rem;
`

const GameBoard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 1000px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(138, 43, 226, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(138, 43, 226, 0.05) 50%, transparent 70%);
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  
  @keyframes shimmer {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
`

const GameHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
`

const GameTitle = styled.h1`
  color: #8A2BE2;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const GameSubtitle = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`

const RoundIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
`

const RoundDot = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => 
    props.$won === 'creator' ? '#00FF41' :
    props.$won === 'joiner' ? '#FF1493' :
    props.$active ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'
  };
  border: 2px solid ${props => 
    props.$active ? '#FFD700' : 'rgba(255, 255, 255, 0.5)'
  };
  transition: all 0.3s ease;
  
  ${props => props.$active && `
    animation: pulse 1s ease-in-out infinite;
    box-shadow: 0 0 10px #FFD700;
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
  `}
`

const PlayersSection = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 2rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const CoinSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
  min-height: 300px;
`

const ControlPanel = styled.div`
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 600px;
  position: relative;
  z-index: 2;
`

const ControlTitle = styled.h3`
  color: #8A2BE2;
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
  text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
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
  flex: 1;
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PowerSection = styled.div`
  margin-bottom: 1.5rem;
`

const PowerBar = styled.div`
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(138, 43, 226, 0.3);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 1rem;
`

const PowerFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #FF1493, #FFD700);
  width: ${props => props.$power}%;
  transition: width 0.3s ease;
`

const PowerButton = styled.button`
  width: 100%;
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

const StatusMessage = styled.div`
  text-align: center;
  font-size: 1.1rem;
  color: #FFD700;
  margin-bottom: 1rem;
  font-weight: bold;
`

const LockedMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
`

const LockIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #FF6B6B;
`

const LockTitle = styled.h2`
  color: #FF6B6B;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
`

const LockDescription = styled.p`
  font-size: 1.1rem;
  line-height: 1.5;
  max-width: 400px;
`

const GameRoomTab = ({ 
  gameData, 
  gameId, 
  isCreator, 
  isJoiner, 
  address, 
  isGameActive, 
  gamePhase 
}) => {
  const [playerChoice, setPlayerChoice] = useState(null)
  const [opponentChoice, setOpponentChoice] = useState(null)
  const [powerLevel, setPowerLevel] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [roundResults, setRoundResults] = useState([])
  const [scores, setScores] = useState({ creator: 0, joiner: 0 })
  const [gameState, setGameState] = useState('waiting_choice') // waiting_choice, flipping, round_complete

  useEffect(() => {
    // Update game state based on gameData
    if (gameData) {
      // This would be updated with real game state management
      setCurrentRound(gameData.currentRound || 1)
      setScores({
        creator: gameData.creatorScore || 0,
        joiner: gameData.joinerScore || 0
      })
    }
  }, [gameData])

  const handleChoiceSelect = (choice) => {
    if (gameState === 'waiting_choice') {
      setPlayerChoice(choice)
      // Send choice to server via WebSocket
      // This would be implemented with the actual game logic
    }
  }

  const handlePowerActivation = () => {
    if (powerLevel >= 100) {
      setPowerLevel(0)
      // Activate power-up logic
    }
  }

  const handleFlipCoin = () => {
    if (playerChoice && gameState === 'waiting_choice') {
      setGameState('flipping')
      // Trigger coin flip animation
      // This would connect to the actual game engine
    }
  }

  // If game is not active, show locked state
  if (!isGameActive) {
    return (
      <TabContainer>
        <LockedMessage>
          <LockIcon>🔒</LockIcon>
          <LockTitle>Game Room Locked</LockTitle>
          <LockDescription>
            This area will unlock when Player 2 deposits into the game and the coin flip battle begins!
          </LockDescription>
        </LockedMessage>
      </TabContainer>
    )
  }

  return (
    <TabContainer>
      <GameBoard>
        <GameHeader>
          <GameTitle>⚔️ COIN FLIP BATTLE</GameTitle>
          <GameSubtitle>Best of 5 Rounds</GameSubtitle>
        </GameHeader>

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

        {/* Players Section */}
        <PlayersSection>
          <PlayerCard
            player="creator"
            address={gameData?.creator}
            score={scores.creator}
            choice={isCreator ? playerChoice : opponentChoice}
            power={isCreator ? powerLevel : 0}
            isActive={true}
          />
          
          <PlayerCard
            player="joiner"
            address={gameData?.challenger || gameData?.joiner}
            score={scores.joiner}
            choice={isJoiner ? playerChoice : opponentChoice}
            power={isJoiner ? powerLevel : 0}
            isActive={true}
          />
        </PlayersSection>

        {/* Game Coin */}
        <CoinSection>
          <OptimizedCoinWrapper
            size={300}
            headsImage={gameData?.nft_image || '/placeholder-nft.svg'}
            tailsImage={gameData?.nft_image || '/placeholder-nft.svg'}
            isFlipping={gameState === 'flipping'}
            result={null}
            serverControlled={true}
            gameId={gameId}
            isDisplay={false}
          />
        </CoinSection>

        {/* Control Panel */}
        <ControlPanel>
          <ControlTitle>🎮 Game Controls</ControlTitle>
          
          <StatusMessage>
            {gameState === 'waiting_choice' ? 'Choose Heads or Tails' :
             gameState === 'flipping' ? 'Coin is flipping...' :
             'Round Complete!'}
          </StatusMessage>

          {/* Choice Buttons */}
          <ChoiceButtons>
            <ChoiceButton
              $selected={playerChoice === 'heads'}
              onClick={() => handleChoiceSelect('heads')}
              disabled={gameState !== 'waiting_choice'}
            >
              👑 HEADS
            </ChoiceButton>
            <ChoiceButton
              $selected={playerChoice === 'tails'}
              onClick={() => handleChoiceSelect('tails')}
              disabled={gameState !== 'waiting_choice'}
            >
              ⚡ TAILS
            </ChoiceButton>
          </ChoiceButtons>

          {/* Power Section */}
          <PowerSection>
            <PowerBar>
              <PowerFill $power={powerLevel} />
            </PowerBar>
            <PowerButton
              onClick={handlePowerActivation}
              disabled={powerLevel < 100}
            >
              ⚡ ACTIVATE POWER-UP {powerLevel < 100 ? `(${powerLevel}%)` : '(READY!)'}
            </PowerButton>
          </PowerSection>

          {/* Flip Button */}
          {playerChoice && gameState === 'waiting_choice' && (
            <ChoiceButton
              style={{
                background: 'linear-gradient(135deg, #00FF41, #39FF14)',
                color: '#000',
                marginTop: '1rem',
                width: '100%'
              }}
              onClick={handleFlipCoin}
            >
              🚀 FLIP THE COIN!
            </ChoiceButton>
          )}
        </ControlPanel>
      </GameBoard>
    </TabContainer>
  )
}

export default GameRoomTab
