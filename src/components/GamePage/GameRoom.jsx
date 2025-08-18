import React from 'react'
import styled from '@emotion/styled'
import ProfilePicture from '../ProfilePicture'
import GameBackground from './GameBackground'
import ChatContainer from './ChatContainer'

const GameRoomContainer = styled.div`
  min-height: 100vh;
  position: relative;
  z-index: 1;
`

const GameContent = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const MainGameArea = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
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
  height: fit-content;
  box-shadow: 0 0 30px ${props => props.isCreator ? 
    'rgba(255, 215, 0, 0.3)' : 
    'rgba(0, 255, 65, 0.3)'
  };
`

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
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
  gap: 0.75rem;
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
  gap: 2rem;
  align-items: center;
  justify-content: center;
`

const CoinContainer = styled.div`
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ChoiceSection = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-top: 2rem;
`

const OpponentChoosingMessage = styled.div`
  padding: 1.5rem 3rem;
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
  border: 2px solid #FFA500;
  border-radius: 1rem;
  color: #FFA500;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(255, 165, 0, 0.3);
`

const ChoiceButton = styled.button`
  padding: 1.5rem 3rem;
  background: linear-gradient(135deg, 
    ${props => props.choice === 'heads' ? 
      'rgba(0, 255, 65, 0.2)' : 
      'rgba(255, 20, 147, 0.2)'
    } 0%, 
    rgba(0, 0, 0, 0.5) 100%
  );
  border: 2px solid ${props => props.choice === 'heads' ? '#00FF41' : '#FF1493'};
  border-radius: 1rem;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      ${props => props.choice === 'heads' ? 
        'rgba(0, 255, 65, 0.3)' : 
        'rgba(255, 20, 147, 0.3)'
      }, 
      transparent
    );
    transition: left 0.5s ease;
  }
  
  &:hover:not(:disabled):before {
    left: 100%;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px ${props => props.choice === 'heads' ? 
      'rgba(0, 255, 65, 0.4)' : 
      'rgba(255, 20, 147, 0.4)'
    };
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`

const PowerBarContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin-top: 2rem;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: ${props => props.show ? 'auto' : 'none'};
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
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #FFD700;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
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
  border-radius: 18px;
  transition: width 0.15s ease-out;
  box-shadow: ${props => props.charging ? 
    '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)' :
    '0 0 8px rgba(255, 215, 0, 0.6)'
  };
  animation: ${props => props.charging ? 'powerPulse 0.6s linear infinite' : 'none'};
`

const CountdownContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 0.5rem;
  text-align: center;
`

const CountdownText = styled.div`
  color: #FFD700;
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const TurnIndicator = styled.div`
  color: ${props => props.isMyTurn ? '#00FF41' : '#FF1493'};
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-weight: bold;
`

const ChatSection = styled.div`
  margin-top: 2rem;
  height: 400px;
`

const GameRoom = ({
  gameData,
  gameState,
  playerChoices,
  isCreator,
  isJoiner,
  getGameCreator,
  getGameJoiner,
  isMyTurn,
  handlePlayerChoice,
  handlePowerChargeStart,
  handlePowerChargeStop,
  roundCountdown,
  children // For coin component
}) => {
  const currentRound = gameState?.currentRound || 1
  const totalRounds = 5 // Changed to 5 rounds
  
  const creatorWins = gameState?.creatorWins || 0
  const joinerWins = gameState?.joinerWins || 0
  
  const showPowerBar = gameState?.phase === 'charging' || gameState?.chargingPlayer
  const totalPower = (Number(gameState?.creatorPower) || 0) + (Number(gameState?.joinerPower) || 0)
  
  const canChoose = gameState?.phase === 'choosing' && isMyTurn()

  // Determine whose turn it is to choose
  const getCurrentChooser = () => {
    if (currentRound === 1 || currentRound === 3 || currentRound === 5) {
      return 'creator' // Player 1 (creator) goes first, third, and fifth
    } else {
      return 'joiner' // Player 2 (joiner) goes second and fourth
    }
  }

  const currentChooser = getCurrentChooser()
  const isCreatorTurn = currentChooser === 'creator'
  const isJoinerTurn = currentChooser === 'joiner'

  return (
    <GameRoomContainer>
      <GameBackground />
      <GameContent>
        <MainGameArea>
          {/* Creator Card */}
          <PlayerCard isCreator={true}>
            <PlayerHeader>
              <ProfilePicture 
                address={getGameCreator()}
                size={40}
              />
              <PlayerLabel isCreator={true}>
                {isCreator() ? 'You' : 'Creator'}
              </PlayerLabel>
            </PlayerHeader>
            
            <PlayerStats>
              <StatRow>
                <StatLabel>Power</StatLabel>
                <StatValue>{Number(gameState?.creatorPower) || 0}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Choice</StatLabel>
                <StatValue>
                  {playerChoices?.creator ? playerChoices.creator.toUpperCase() : '-'}
                </StatValue>
              </StatRow>
            </PlayerStats>
            
            <RoundWins>
              {[1, 2, 3, 4, 5].map(round => (
                <RoundDot 
                  key={round}
                  isCreator={true}
                  isWon={round <= creatorWins}
                  isLost={round <= joinerWins}
                >
                  {round}
                </RoundDot>
              ))}
            </RoundWins>

            {/* Countdown beneath creator container */}
            {gameState?.phase === 'choosing' && isCreatorTurn && (
              <CountdownContainer>
                <CountdownText>
                  {roundCountdown ? `${roundCountdown}s` : '20s'}
                </CountdownText>
                <TurnIndicator isMyTurn={isMyTurn()}>
                  {isMyTurn() ? 'YOUR TURN' : 'OPPONENT\'S TURN'}
                </TurnIndicator>
              </CountdownContainer>
            )}
          </PlayerCard>
          
          {/* Center Game Area */}
          <CenterArea>
            <CoinContainer>
              {children}
            </CoinContainer>
            
            <ChoiceSection>
              {!isMyTurn() ? (
                <OpponentChoosingMessage>
                  🤔 Opponent is choosing...
                </OpponentChoosingMessage>
              ) : (
                <>
                  <ChoiceButton
                    choice="heads"
                    disabled={!canChoose || playerChoices?.creator || playerChoices?.joiner}
                    onClick={() => canChoose && handlePlayerChoice('heads')}
                  >
                    Heads
                  </ChoiceButton>
                  
                  <ChoiceButton
                    choice="tails"
                    disabled={!canChoose || playerChoices?.creator || playerChoices?.joiner}
                    onClick={() => canChoose && handlePlayerChoice('tails')}
                  >
                    Tails
                  </ChoiceButton>
                </>
              )}
            </ChoiceSection>
            
            <PowerBarContainer show={showPowerBar}>
              <PowerBarLabel>
                {gameState?.chargingPlayer ? '⚡ Charging Power ⚡' : 'Power Level'}
              </PowerBarLabel>
              <PowerBar>
                <PowerFill 
                  power={Math.min(totalPower * 10, 100)}
                  charging={gameState?.chargingPlayer}
                />
              </PowerBar>
            </PowerBarContainer>
          </CenterArea>
          
          {/* Challenger Card */}
          <PlayerCard isCreator={false}>
            <PlayerHeader>
              <ProfilePicture 
                address={getGameJoiner()}
                size={40}
              />
              <PlayerLabel isCreator={false}>
                {isJoiner() ? 'You' : 'Challenger'}
              </PlayerLabel>
            </PlayerHeader>
            
            <PlayerStats>
              <StatRow>
                <StatLabel>Power</StatLabel>
                <StatValue>{Number(gameState?.joinerPower) || 0}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Choice</StatLabel>
                <StatValue>
                  {playerChoices?.joiner ? playerChoices.joiner.toUpperCase() : '-'}
                </StatValue>
              </StatRow>
            </PlayerStats>
            
            <RoundWins>
              {[1, 2, 3, 4, 5].map(round => (
                <RoundDot 
                  key={round}
                  isCreator={false}
                  isWon={round <= joinerWins}
                  isLost={round <= creatorWins}
                >
                  {round}
                </RoundDot>
              ))}
            </RoundWins>

            {/* Countdown beneath challenger container */}
            {gameState?.phase === 'choosing' && isJoinerTurn && (
              <CountdownContainer>
                <CountdownText>
                  {roundCountdown ? `${roundCountdown}s` : '20s'}
                </CountdownText>
                <TurnIndicator isMyTurn={isMyTurn()}>
                  {isMyTurn() ? 'YOUR TURN' : 'OPPONENT\'S TURN'}
                </TurnIndicator>
              </CountdownContainer>
            )}
          </PlayerCard>
        </MainGameArea>

        {/* Chat beneath Player 2's container */}
        <ChatSection>
          <ChatContainer />
        </ChatSection>
      </GameContent>
    </GameRoomContainer>
  )
}

export default GameRoom
