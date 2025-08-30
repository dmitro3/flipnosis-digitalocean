import React, { useState } from 'react'
import styled from '@emotion/styled'

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

const UnlockButton = styled.button`
  background: linear-gradient(135deg, #00FF41, #39FF14);
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 2rem;
  color: #000;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
  }
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

const PlayerCard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00FF41;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
  
  .player-name {
    color: #FFFFFF;
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .player-address {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    margin-bottom: 1rem;
    word-break: break-all;
  }
  
  .score {
    font-size: 2rem;
    font-weight: bold;
    color: #FFD700;
    margin: 1rem 0;
  }
`

const CoinSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
  min-height: 200px;
`

const CoinDisplay = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  cursor: pointer;
  transition: transform 0.3s ease;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  
  &:hover {
    transform: scale(1.1) rotate(180deg);
  }
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

const GameRoomTabSimple = ({ gameData, gameId, isCreator, isJoiner, address, isGameActive }) => {
  const [playerChoice, setPlayerChoice] = useState(null)
  const [gameUnlocked, setGameUnlocked] = useState(isGameActive)
  
  const handleChoiceSelect = (choice) => {
    setPlayerChoice(choice)
    console.log('Selected choice:', choice)
  }
  
  const handleUnlockDemo = () => {
    setGameUnlocked(true)
  }
  
  // If game is not active, show locked state
  if (!gameUnlocked) {
    return (
      <TabContainer>
        <LockedMessage>
          <LockIcon>🔒</LockIcon>
          <LockTitle>Game Room Locked</LockTitle>
          <LockDescription>
            This area will unlock when Player 2 deposits into the game and the coin flip battle begins!
          </LockDescription>
          <UnlockButton onClick={handleUnlockDemo}>
            🎮 Demo Game Room
          </UnlockButton>
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

        {/* Players Section */}
        <PlayersSection>
          <PlayerCard>
            <div className="player-name">Creator</div>
            <div className="player-address">
              {gameData?.creator ? 
                `${gameData.creator.slice(0, 6)}...${gameData.creator.slice(-4)}` : 
                'Player 1'
              }
            </div>
            <div className="score">0</div>
          </PlayerCard>
          
          <PlayerCard>
            <div className="player-name">Challenger</div>
            <div className="player-address">
              {gameData?.joiner ? 
                `${gameData.joiner.slice(0, 6)}...${gameData.joiner.slice(-4)}` : 
                'Waiting...'
              }
            </div>
            <div className="score">0</div>
          </PlayerCard>
        </PlayersSection>

        {/* Game Coin */}
        <CoinSection>
          <CoinDisplay title="Click to flip!">
            🪙
          </CoinDisplay>
        </CoinSection>

        {/* Control Panel */}
        <ControlPanel>
          <ControlTitle>🎮 Game Controls</ControlTitle>
          
          <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#FFD700', fontSize: '1.1rem' }}>
            Choose Heads or Tails
          </div>

          {/* Choice Buttons */}
          <ChoiceButtons>
            <ChoiceButton
              $selected={playerChoice === 'heads'}
              onClick={() => handleChoiceSelect('heads')}
            >
              👑 HEADS
            </ChoiceButton>
            <ChoiceButton
              $selected={playerChoice === 'tails'}
              onClick={() => handleChoiceSelect('tails')}
            >
              ⚡ TAILS
            </ChoiceButton>
          </ChoiceButtons>

          {/* Flip Button */}
          {playerChoice && (
            <ChoiceButton
              style={{
                background: 'linear-gradient(135deg, #00FF41, #39FF14)',
                color: '#000',
                marginTop: '1rem',
                width: '100%'
              }}
              onClick={() => console.log('Flipping coin with choice:', playerChoice)}
            >
              🚀 FLIP THE COIN!
            </ChoiceButton>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '1rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            This is a demo version. Full game logic will be connected to the server.
          </div>
        </ControlPanel>
      </GameBoard>
    </TabContainer>
  )
}

export default GameRoomTabSimple
