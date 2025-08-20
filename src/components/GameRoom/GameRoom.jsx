import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { ThemeProvider } from '@emotion/react'
import ProfilePicture from '../ProfilePicture'
import GameBackground from '../GameOrchestrator/GameBackground'
import GameResultPopup from '../GameResultPopup'
import { useGameRoomState } from './hooks/useGameRoomState'
import webSocketService from '../../services/WebSocketService'
import { useProfile } from '../../contexts/ProfileContext'
import { theme } from '../../styles/theme'

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
      'rgba(255, 20, 147, 0.15)' : 
      'rgba(0, 255, 65, 0.15)'
    } 0%, 
    rgba(0, 0, 0, 0.5) 100%
  );
  border: 2px solid ${props => props.isCreator ? '#FF1493' : '#00FF41'};
  border-radius: 1rem;
  padding: 1.5rem;
  height: fit-content;
  box-shadow: 0 0 30px ${props => props.isCreator ? 
    'rgba(255, 20, 147, 0.4)' : 
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
  color: ${props => props.isCreator ? '#FF1493' : '#00FF41'};
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
  color: #00BFFF;
  font-size: 2.5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 20px #00BFFF, 0 0 40px #00BFFF, 0 0 60px #00BFFF;
  animation: neonPulse 2s linear infinite;
  
  @keyframes neonPulse {
    0%, 100% { 
      text-shadow: 0 0 20px #00BFFF, 0 0 40px #00BFFF, 0 0 60px #00BFFF;
    }
    50% { 
      text-shadow: 0 0 30px #00BFFF, 0 0 60px #00BFFF, 0 0 90px #00BFFF;
    }
  }
`

const TurnIndicator = styled.div`
  color: ${props => props.isMyTurn ? '#00BFFF' : '#FF1493'};
  font-size: 1.5rem;
  margin-top: 0.5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: ${props => props.isMyTurn ? 
    '0 0 15px #00BFFF, 0 0 30px #00BFFF' : 
    '0 0 15px #FF1493, 0 0 30px #FF1493'
  };
`

const ChatSection = styled.div`
  margin-top: 2rem;
  height: 400px;
`

const GameRoom = ({
  gameId,
  gameData,
  children, // For coin component
  onExitRoom, // Callback to exit back to lobby or home
  customHeadsImage,
  customTailsImage,
  gameCoin
}) => {
  const { address, getPlayerName } = useProfile()
  const [wsConnected, setWsConnected] = useState(false)
  
  // State for player names
  const [creatorName, setCreatorName] = useState('')
  const [joinerName, setJoinerName] = useState('')
  
  // Use game room specific hooks
  const {
    gameState,
    playerChoices,
    flipAnimation,
    resultData,
    showResultPopup,
    roundCountdown,
    streamedCoinState,
    setGameState,
    setPlayerChoices,
    setStreamedCoinState,
    handleFlipResult,
    handleGameCompleted,
    resetForNextRound,
    startRoundCountdown,
    stopRoundCountdown,
    handleAutoFlip,
    isCreator,
    isJoiner,
    isMyTurn,
    getGameCreator,
    getGameJoiner,
    getChoosingPlayer // FIXED: Use the improved turn determination
  } = useGameRoomState(gameId, gameData?.creator, gameData)

  // Connect to game room when component mounts
  useEffect(() => {
    const initGameRoom = async () => {
      if (!gameId || !address) return
      
      const gameRoomId = `game_room_${gameId}`
      await webSocketService.connect(gameRoomId, address)
      setWsConnected(true)
      
      // Set up message handling
      const handleMessage = (data) => {
        console.log('🎮 Game room message:', data)
        
        switch (data.type) {
          case 'CHOICES_MADE':
            // Update UI with both player choices
            setPlayerChoices({
              creator: data.player1Choice,
              joiner: data.player2Choice  
            })
            setGameState(prev => ({
              ...prev,
              phase: 'charging',
              currentTurn: data.currentTurn
            }))
            break
            
          case 'POWER_PHASE_STARTED':
            setGameState(prev => ({
              ...prev,
              phase: 'charging',
              currentTurn: data.currentTurn
            }))
            break
            
          // ... other message handlers
        }
      }
      
      webSocketService.on('CHOICES_MADE', handleMessage)
      webSocketService.on('POWER_PHASE_STARTED', handleMessage)
      // ... register other handlers
    }
    
    initGameRoom()
  }, [gameId, address])
  
  // Choice handler
  const handlePlayerChoice = (choice) => {
    const oppositeChoice = choice === 'heads' ? 'tails' : 'heads'
    
    webSocketService.send({
      type: 'GAME_ACTION',
      gameId,
      action: 'MAKE_CHOICE',
      player: address,
      choice,
      oppositeChoice
    })
  }

  // Power charge handlers
  const handlePowerChargeStart = () => {
    webSocketService.send({
      type: 'GAME_ACTION',
      gameId,
      action: 'POWER_CHARGE_START',
      player: address
    })
  }

  const handlePowerChargeStop = (powerLevel) => {
    webSocketService.send({
      type: 'GAME_ACTION',
      gameId,
      action: 'POWER_CHARGED',
      player: address,
      powerLevel
    })
  }

  const handleForfeit = () => {
    webSocketService.send({
      type: 'GAME_ACTION',
      gameId,
      action: 'FORFEIT_GAME',
      player: address
    })
  }

  const currentRound = gameState?.currentRound || 1
  const totalRounds = 5
  
  const creatorWins = gameState?.creatorWins || 0
  const joinerWins = gameState?.joinerWins || 0
  
  const showPowerBar = gameState?.phase === 'charging' || gameState?.chargingPlayer
  const totalPower = (Number(gameState?.creatorPower) || 0) + (Number(gameState?.joinerPower) || 0)
  
  // FIXED: Better turn determination using the improved logic
  const canChoose = gameState?.phase === 'choosing' && isMyTurn()
  const currentChooser = getChoosingPlayer(currentRound)
  const isCreatorTurn = currentChooser === getGameCreator()
  const isJoinerTurn = currentChooser === getGameJoiner()

  // Fetch player names
  useEffect(() => {
    const fetchPlayerNames = async () => {
      const creatorAddress = getGameCreator()
      const joinerAddress = getGameJoiner()
      
      if (creatorAddress) {
        try {
          const name = await getPlayerName(creatorAddress)
          setCreatorName(name || `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`)
        } catch (error) {
          console.error('Error fetching creator name:', error)
          setCreatorName(`${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`)
        }
      }
      
      if (joinerAddress) {
        try {
          const name = await getPlayerName(joinerAddress)
          setJoinerName(name || `${joinerAddress.slice(0, 6)}...${joinerAddress.slice(-4)}`)
        } catch (error) {
          console.error('Error fetching joiner name:', error)
          setJoinerName(`${joinerAddress.slice(0, 6)}...${joinerAddress.slice(-4)}`)
        }
      }
    }

    fetchPlayerNames()
  }, [getGameCreator, getGameJoiner, getPlayerName])

  // Add forfeit button styles
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
    
    &:active {
      transform: translateY(0);
    }
  `

  const TestButton = styled.button`
    position: fixed;
    top: 2rem;
    left: 2rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 150, 255, 0.5) 100%);
    border: 2px solid #00FFFF;
    border-radius: 0.5rem;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1000;
    
    &:hover {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.4) 0%, rgba(0, 150, 255, 0.7) 100%);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 255, 255, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
  `

  const handleForfeitClick = () => {
    const confirmed = window.confirm(
      'Are you sure you want to forfeit? Your opponent will win both the NFT and crypto.'
    )
    if (confirmed) {
      handleForfeit()
      if (onExitRoom) onExitRoom()
    }
  }

  // Test flip function
  const handleTestFlip = () => {
    console.log('🧪 Test flip triggered!')
    
    // Generate random test data
    const testCreatorPower = Math.floor(Math.random() * 10) + 1 // 1-10
    const testJoinerPower = Math.floor(Math.random() * 10) + 1 // 1-10
    const testCreatorChoice = Math.random() < 0.5 ? 'heads' : 'tails'
    const testJoinerChoice = Math.random() < 0.5 ? 'heads' : 'tails'
    const testFlipResult = Math.random() < 0.5 ? 'heads' : 'tails'
    const testRoundWinner = testFlipResult === testCreatorChoice ? getGameCreator() : getGameJoiner()
    
    // Set up test choices
    setPlayerChoices({
      creator: testCreatorChoice,
      joiner: testJoinerChoice
    })
    
    // Set game state to charging phase
    setGameState(prev => ({
      ...prev,
      phase: 'charging',
      creatorChoice: testCreatorChoice,
      joinerChoice: testJoinerChoice,
      creatorPower: testCreatorPower,
      joinerPower: testJoinerPower
    }))
    
    // Trigger the flip after a short delay
    setTimeout(() => {
      handleFlipResult({
        result: testFlipResult,
        roundWinner: testRoundWinner,
        creatorChoice: testCreatorChoice,
        challengerChoice: testJoinerChoice,
        creatorPower: testCreatorPower,
        joinerPower: testJoinerPower
      })
    }, 1000)
  }

  return (
    <ThemeProvider theme={theme}>
      <GameRoomContainer>
        <GameBackground />
        
        {/* Test Button */}
        <TestButton onClick={handleTestFlip}>
          🧪 Test Flip
        </TestButton>
        
        {/* Forfeit Button */}
        <ForfeitButton onClick={handleForfeitClick}>
          🏳️ Forfeit Game
        </ForfeitButton>
        
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
                {creatorName || 'Creator'}
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
              {!canChoose ? (
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
                {joinerName || 'Challenger'}
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

        {/* Game Result Popup */}
        {showResultPopup && resultData && (
          <GameResultPopup
            resultData={resultData}
            onClose={resetForNextRound}
            onClaimWinnings={resetForNextRound}
          />
        )}
      </GameContent>
    </GameRoomContainer>
    </ThemeProvider>
  )
}

export default GameRoom
