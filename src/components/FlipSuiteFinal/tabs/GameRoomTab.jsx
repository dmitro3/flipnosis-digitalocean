import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import OptimizedGoldCoin from '../../OptimizedGoldCoin'
import ProfilePicture from '../../ProfilePicture'
import WinLoseAnimation from '../../WinLoseAnimation'
import RoundResultAnimation from '../RoundResultAnimation'

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
      case 'playing':
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
      case 'playing':
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
      case 'playing':
        return '#00FF41'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return '#FF9500'
      case 'waiting_challenger_deposit':
        return '#FFD700'
      case 'completed':
        return '#808080'
      default:
        return '#FFFFFF'
    }
  }};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const GameInfo = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const InfoLabel = styled.span`
  color: #888;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const InfoValue = styled.span`
  color: white;
  font-weight: bold;
  font-size: 1rem;
`

const GameContent = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
`

const WaitingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 2rem;
  padding: 2rem;
`

const WaitingIcon = styled.div`
  font-size: 4rem;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }
`

const WaitingTitle = styled.h2`
  color: #FFD700;
  font-size: 2rem;
  margin: 0;
  text-align: center;
`

const WaitingDescription = styled.p`
  color: #CCC;
  font-size: 1.1rem;
  text-align: center;
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
`

// Game End UI Styles
const GameEndContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: linear-gradient(135deg, 
    ${props => props.isWinner ? 
      'rgba(0, 255, 65, 0.15)' :   // Green for winner
      'rgba(255, 20, 147, 0.15)'   // Pink for loser
    } 0%, 
    rgba(0, 0, 0, 0.5) 100%
  );
  border: 3px solid ${props => props.isWinner ? '#00FF41' : '#FF1493'};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 0 40px ${props => props.isWinner ? 
    'rgba(0, 255, 65, 0.4)' :      // Green glow for winner
    'rgba(255, 20, 147, 0.4)'      // Pink glow for loser
  };
  animation: ${props => props.isWinner ? 'winnerPulse' : 'loserPulse'} 2s ease-in-out infinite;
  
  @keyframes winnerPulse {
    0%, 100% { 
      box-shadow: 0 0 40px rgba(0, 255, 65, 0.4);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 60px rgba(0, 255, 65, 0.6);
      transform: scale(1.02);
    }
  }
  
  @keyframes loserPulse {
    0%, 100% { 
      box-shadow: 0 0 40px rgba(255, 20, 147, 0.4);
    }
    50% { 
      box-shadow: 0 0 60px rgba(255, 20, 147, 0.6);
    }
  }
`

const GameEndTitle = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  color: ${props => props.isWinner ? '#00FF41' : '#FF1493'};
  text-shadow: ${props => props.isWinner ? 
    '0 0 20px #00FF41, 0 0 40px #00FF41, 0 0 60px #00FF41' :
    '0 0 20px #FF1493, 0 0 40px #FF1493, 0 0 60px #FF1493'
  };
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 1rem;
  text-align: center;
`

const GameEndSubtitle = styled.p`
  font-size: 1.2rem;
  color: #CCC;
  text-align: center;
  margin-bottom: 2rem;
  max-width: 400px;
  line-height: 1.5;
`

const FinalScore = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 20px #FFD700;
  margin-bottom: 2rem;
  text-align: center;
`

const WithdrawButton = styled.button`
  padding: 1.5rem 3rem;
  font-size: 1.3rem;
  font-weight: bold;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  border: 3px solid #FFD700;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  
  &:hover {
    background: linear-gradient(135deg, #FFA500, #FF8C00);
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const HomeButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  background: linear-gradient(135deg, #666, #444);
  color: white;
  border: 2px solid #666;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:hover {
    background: linear-gradient(135deg, #777, #555);
    transform: translateY(-2px);
  }
`

// Active Game Styles
const GameBoard = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  align-items: start;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
`

const PlayerCard = styled.div`
  background: linear-gradient(135deg, 
    ${props => props.isCreator ? 
      'rgba(255, 20, 147, 0.15)' :   // Neon Pink with transparency
      'rgba(0, 255, 65, 0.15)'       // Neon Green for challenger
    } 0%, 
    rgba(0, 0, 0, 0.5) 100%          // Transparent black gradient
  );
  border: 2px solid ${props => props.isCreator ? '#FF1493' : '#00FF41'};
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  position: relative;
  height: fit-content;
  box-shadow: 0 0 30px ${props => props.isCreator ? 
    'rgba(255, 20, 147, 0.4)' :      // Pink glow
    'rgba(0, 255, 65, 0.3)'          // Green glow
  };
  
  ${props => props.isActive && `
    box-shadow: 0 0 40px ${props.isCreator ? 'rgba(255, 20, 147, 0.6)' : 'rgba(0, 255, 65, 0.5)'};
    transform: scale(1.02);
    animation: activePulse 2s ease-in-out infinite;
    
    @keyframes activePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.9; }
    }
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
  color: ${props => props.isCreator ? '#FF1493' : '#00FF41'};
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 10px ${props => props.isCreator ? '#FF1493' : '#00FF41'};
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
  font-size: 0.9rem;
`

const StatLabel = styled.span`
  color: #aaa;
`

const StatValue = styled.span`
  font-weight: bold;
  color: ${props => props.isCreator ? '#FF1493' : '#00FF41'};
`

const CoinArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
`

const GameStatus = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`

const StatusText = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #00BFFF;
  text-shadow: 0 0 20px #00BFFF, 0 0 40px #00BFFF, 0 0 60px #00BFFF;
  animation: neonPulse 2s linear infinite;
  text-transform: uppercase;
  letter-spacing: 2px;
  
  @keyframes neonPulse {
    0%, 100% { 
      text-shadow: 0 0 20px #00BFFF, 0 0 40px #00BFFF, 0 0 60px #00BFFF;
    }
    50% { 
      text-shadow: 0 0 30px #00BFFF, 0 0 60px #00BFFF, 0 0 90px #00BFFF;
    }
  }
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`

const ChoiceButton = styled.button`
  padding: 1.5rem 3rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  background: linear-gradient(135deg, 
    ${props => props.choice === 'heads' ? 
      'rgba(0, 255, 65, 0.2)' :      // Green for heads
      'rgba(255, 20, 147, 0.2)'      // Pink for tails
    } 0%, 
    rgba(0, 0, 0, 0.5) 100%
  );
  border: 2px solid ${props => props.choice === 'heads' ? '#00FF41' : '#FF1493'};
  color: white;
  
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

const PowerBar = styled.div`
  width: 350px;
  height: 40px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 20, 0.9));
  border: 3px solid #FFD700;
  border-radius: 20px;
  overflow: hidden;
  margin: 1rem 0;
  position: relative;
  box-shadow: 
    0 0 20px rgba(255, 215, 0, 0.4),
    inset 0 0 20px rgba(0, 0, 0, 0.5);
`

const PowerFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, 
    #FFD700 0%,
    #FFA500 20%,
    #FF6B00 40%,
    #FF1493 60%,
    #8A2BE2 80%,
    #00BFFF 100%
  );
  width: ${props => Math.max(0, Math.min(100, props.power))}%;
  transition: width 0.1s ease-out;
  position: relative;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.4) 50%, 
      transparent 100%);
    animation: ${props => props.power > 0 ? 'powerShimmer 2s infinite' : 'none'};
  }
  
  @keyframes powerShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`

const PowerText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #FFD700;
  font-weight: bold;
  font-size: 1rem;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  z-index: 1;
  letter-spacing: 1px;
`

const PowerTicks = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  pointer-events: none;
`

const PowerTick = styled.div`
  width: 2px;
  height: 60%;
  background: rgba(255, 255, 255, 0.6);
  opacity: ${props => props.active ? 1 : 0.3};
  transition: opacity 0.2s ease;
`

const PulseButton = styled(ChoiceButton)`
  @keyframes pulse {
    0% { 
      transform: scale(1);
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
    }
    50% { 
      transform: scale(1.05);
      box-shadow: 0 0 40px rgba(0, 255, 136, 0.8);
    }
    100% { 
      transform: scale(1);
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
    }
  }
`

// Neon waiting message component
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
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.02); }
  }
`

// Turn indicator with neon glow
const TurnIndicator = styled.div`
  color: ${props => props.isMyTurn ? '#00BFFF' : '#FF1493'};
  font-size: 1.2rem;
  margin-top: 0.5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: ${props => props.isMyTurn ? 
    '0 0 15px #00BFFF, 0 0 30px #00BFFF' : 
    '0 0 15px #FF1493, 0 0 30px #FF1493'
  };
`

// Neon countdown timer (bottom left)
const CountdownContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #FF1493;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 20, 147, 0.4);
  z-index: 1000;
  min-width: 150px;
  
  @media (max-width: 768px) {
    bottom: 1rem;
    left: 1rem;
    padding: 1rem;
    min-width: 120px;
  }
`

const CountdownText = styled.div`
  color: ${props => props.isUrgent ? '#FF4444' : '#FF1493'};
  font-size: 2.5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: ${props => props.isUrgent ? 
    '0 0 20px #FF4444, 0 0 40px #FF4444, 0 0 60px #FF4444' :
    '0 0 20px #FF1493, 0 0 40px #FF1493, 0 0 60px #FF1493'
  };
  animation: ${props => props.isUrgent ? 'urgentPulse 0.5s linear infinite' : 'neonPulse 2s linear infinite'};
  margin-bottom: 0.5rem;
  
  @keyframes neonPulse {
    0%, 100% { 
      text-shadow: 0 0 20px #FF1493, 0 0 40px #FF1493, 0 0 60px #FF1493;
    }
    50% { 
      text-shadow: 0 0 30px #FF1493, 0 0 60px #FF1493, 0 0 90px #FF1493;
    }
  }
  
  @keyframes urgentPulse {
    0%, 100% { 
      text-shadow: 0 0 20px #FF4444, 0 0 40px #FF4444, 0 0 60px #FF4444;
      transform: scale(1);
    }
    50% { 
      text-shadow: 0 0 30px #FF4444, 0 0 60px #FF4444, 0 0 90px #FF4444;
      transform: scale(1.05);
    }
  }
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const CountdownLabel = styled.div`
  color: #FFA500;
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`

const GameRoomTab = ({ 
  gameData, 
  gameId, 
  socket, 
  connected, 
  coinConfig, 
  address, 
  isCreator,
  isGameReady
}) => {
  const [gameState, setGameState] = useState(null)
  const [playerNames, setPlayerNames] = useState({
    creator: null,
    challenger: null
  })
  const [roundCountdown, setRoundCountdown] = useState(null)
  const [showWinLoseAnimation, setShowWinLoseAnimation] = useState(false)
  const [roundResult, setRoundResult] = useState(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  // Check if game is ready to play - STRICT ACCESS CONTROL
  useEffect(() => {
    if (!gameData) {
      return
    }
    
    // STRICT: Game is only ready when BOTH players have deposited AND game is ACTIVE phase
    const hasCreator = gameData.creator
    const hasChallenger = gameData.challenger
    const bothDeposited = gameData.creatorDeposited && gameData.challengerDeposited
    const gameActive = gameData.status === 'active' && gameData.phase === 'game_active' // MUST be game_active phase
    
    // Must have both players AND both deposits AND active game phase
    const gameReady = hasCreator && hasChallenger && bothDeposited && gameActive
    
    // CRITICAL: Only allow actual players to see the game as ready
    const isActualCreator = address?.toLowerCase() === hasCreator?.toLowerCase()
    const isActualChallenger = address?.toLowerCase() === hasChallenger?.toLowerCase()
    const isActualPlayer = isActualCreator || isActualChallenger
    
    const finalGameReady = gameReady && isActualPlayer
    
    console.log('🎮 GameRoomTab: STRICT Game readiness check:', {
      hasCreator: !!hasCreator,
      hasChallenger: !!hasChallenger,
      bothDeposited,
      gameActive,
      gameReady,
      isActualPlayer,
      finalGameReady,
      currentUser: address,
      isCreator: isActualCreator,
      isChallenger: isActualChallenger
    })
  }, [gameData, address])
  
  // When tab becomes active and game is ready, request fresh state
  useEffect(() => {
    if (isGameReady && socket) {
      console.log('🎮 Game room tab active, requesting game state...')
      socket.emit('request_game_state', { gameId })
    }
  }, [isGameReady, gameId, socket])
  
  // Polling mechanism to check for challenger presence
  useEffect(() => {
    if (!gameId || !socket) return
    
    let pollInterval = null
    let pollCount = 0
    const maxPolls = 30 // 1 minute at 2-second intervals
    
    const checkChallengerPresence = async () => {
      try {
        // Request fresh game state from server
        socket.emit('request_game_state', { gameId })
        pollCount++
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls && pollInterval) {
          clearInterval(pollInterval)
          pollInterval = null
          console.log('🔄 Challenger polling stopped - max attempts reached')
        }
      } catch (error) {
        console.error('Challenger polling error:', error)
      }
    }
    
    // Start polling if game is active but challenger might not be visible yet
    // Only poll if we don't have both players present and deposited
    const hasBothPlayers = gameData?.challenger && gameData?.creator
    const bothDeposited = gameData?.creatorDeposited && gameData?.challengerDeposited
    
    if (gameData?.status === 'active' && gameData?.phase === 'game_active' && (!hasBothPlayers || !bothDeposited)) {
      console.log('🔄 Starting challenger presence polling...', { hasBothPlayers, bothDeposited })
      pollInterval = setInterval(checkChallengerPresence, 2000)
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
        console.log('🔄 Challenger polling stopped - cleanup')
      }
    }
  }, [gameId, socket, gameData?.status, gameData?.phase, gameData?.challenger, gameData?.creator, gameData?.creatorDeposited, gameData?.challengerDeposited])

  // Listen for socket events to update game state
  useEffect(() => {
    if (!socket) return
    
    const handleGameStateUpdate = (data) => {
      console.log('📊 Game state update received:', data)
      setGameState(data)
      
      // Update countdown from server if provided
      if (data.roundCountdown !== undefined) {
        setRoundCountdown(data.roundCountdown)
      }
      
      // Stop challenger polling if both players are present
      if (data.challenger && data.creator) {
        console.log('✅ Both players present - challenger polling can stop')
      }
    }
    
    const handleGameReady = (data) => {
      console.log('🎮 Game ready event in GameRoomTab')
    }
    
    const handleGameStarted = (data) => {
      console.log('🎮 Game started event in GameRoomTab:', data)
      
      // Initialize game state from the event data
      setGameState({
        currentRound: data.currentRound || 1,
        totalRounds: data.totalRounds || 5,
        creatorScore: data.creatorScore || 0,
        challengerScore: data.challengerScore || 0,
        currentTurn: data.currentTurn || data.creator,
        flipSeed: null,
        phase: data.phase || 'choosing',
        roundPhase: 'player1_choice'
      })
    }
    
    const handleFlipExecuting = (data) => {
      console.log('🎲 Flip executing received from server:', data)
      // Update game state with synchronized coin flip data
      setGameState(prev => ({
        ...prev,
        coinState: data.coinState,
        creatorChoice: data.creatorChoice,
        challengerChoice: data.challengerChoice,
        creatorFinalPower: data.creatorPower,
        challengerFinalPower: data.challengerPower,
        gamePhase: 'executing_flip'
      }))
      
      // Clear countdown when flip starts
      setRoundCountdown(null)
    }
    
    const handleRoundResult = (data) => {
      console.log('🎲 Round result received:', data)
      console.log('🎲 Current address:', address)
      console.log('🎲 Game data:', { creator: gameData?.creator, challenger: gameData?.challenger })
      
      // Update game state with round result
      setGameState(prev => ({
        ...prev,
        currentRound: data.currentRound,
        creatorScore: data.creatorScore,
        challengerScore: data.challengerScore,
        lastResult: data.flipResult,
        roundWinner: data.roundWinner,
        flipResult: data.flipResult,
        gamePhase: 'showing_result'
      }))
      
      // Show win/lose animation for actual players
      const isActualCreator = address?.toLowerCase() === gameData?.creator?.toLowerCase()
      const isActualChallenger = address?.toLowerCase() === gameData?.challenger?.toLowerCase()
      
      console.log('🎬 Round animation check:', {
        isActualCreator,
        isActualChallenger,
        roundWinner: data.roundWinner,
        creator: gameData?.creator,
        challenger: gameData?.challenger,
        address,
        flipResult: data.flipResult
      })
      
      if (isActualCreator || isActualChallenger) {
        const playerWon = (isActualCreator && data.roundWinner?.toLowerCase() === gameData?.creator?.toLowerCase()) ||
                          (isActualChallenger && data.roundWinner?.toLowerCase() === gameData?.challenger?.toLowerCase())
        
        console.log('🎬 Triggering round animation:', {
          playerWon,
          playerScore: isActualCreator ? data.creatorScore : data.challengerScore,
          opponentScore: isActualCreator ? data.challengerScore : data.creatorScore,
          flipResult: data.flipResult
        })
        
        setRoundResult({
          isWin: playerWon,
          playerScore: isActualCreator ? data.creatorScore : data.challengerScore,
          opponentScore: isActualCreator ? data.challengerScore : data.creatorScore,
          currentRound: data.currentRound,
          totalRounds: 5,
          flipResult: data.flipResult,
          playerChoice: isActualCreator ? data.creatorChoice : data.challengerChoice
        })
        setShowWinLoseAnimation(true)
        console.log('🎬 Round animation triggered!')
      }
    }
    
    const handleGameComplete = (data) => {
      console.log('🏆 Game complete received:', data)
      setGameState(prev => ({
        ...prev,
        gamePhase: 'game_complete',
        gameWinner: data.gameWinner,
        creatorScore: data.creatorScore,
        challengerScore: data.challengerScore,
        finalScore: data.finalScore
      }))
      
      // Hide any existing animations
      setShowWinLoseAnimation(false)
      setRoundResult(null)
    }
    
    const handleNewRound = (data) => {
      console.log('🔄 New round event received:', data)
      console.log(`🎯 Round ${data.currentRound} - ${data.currentTurn === gameData?.creator ? 'Creator' : 'Challenger'}'s turn`)
      
      // Clear any existing animations
      setShowWinLoseAnimation(false)
      setRoundResult(null)
      
      // Update game state with new round info
      setGameState(prev => ({
        ...prev,
        currentRound: data.currentRound,
        currentTurn: data.currentTurn,
        gamePhase: 'waiting_choice',
        // Reset choices for new round
        creatorChoice: null,
        challengerChoice: null,
        creatorCharging: false,
        challengerCharging: false
      }))
    }
    
    socket.on('game_state_update', handleGameStateUpdate)
    socket.on('game_ready', handleGameReady)
    socket.on('game_started', handleGameStarted)
    socket.on('flip_executing', handleFlipExecuting)
    socket.on('round_result', handleRoundResult)
    socket.on('game_complete', handleGameComplete)
    socket.on('new_round', handleNewRound)
    
    // Request current game state when mounting
    socket.emit('request_game_state', { gameId })
    
    return () => {
      socket.off('game_state_update', handleGameStateUpdate)
      socket.off('game_ready', handleGameReady)
      socket.off('game_started', handleGameStarted)
      socket.off('flip_executing', handleFlipExecuting)
      socket.off('round_result', handleRoundResult)
      socket.off('game_complete', handleGameComplete)
      socket.off('new_round', handleNewRound)
    }
  }, [socket, gameId])
  
  // Fetch player names
  useEffect(() => {
    const fetchPlayerNames = async () => {
      if (!gameData) return
      
      const names = { creator: null, challenger: null }
      
      // Fetch creator name
      if (gameData.creator) {
        try {
          const response = await fetch(`/api/profile/${gameData.creator}`)
          if (response.ok) {
            const profile = await response.json()
            names.creator = profile.name || profile.username || null
          }
        } catch (error) {
          console.error('Error fetching creator profile:', error)
        }
      }
      
      // Fetch challenger name
      if (gameData.challenger) {
        try {
          const response = await fetch(`/api/profile/${gameData.challenger}`)
          if (response.ok) {
            const profile = await response.json()
            names.challenger = profile.name || profile.username || null
          }
        } catch (error) {
          console.error('Error fetching challenger profile:', error)
        }
      }
      
      setPlayerNames(names)
    }
    
    fetchPlayerNames()
  }, [gameData?.creator, gameData?.challenger])
  
  // Withdrawal functionality
  const handleWithdraw = async () => {
    if (!gameData || !address) return
    
    setIsWithdrawing(true)
    try {
      console.log('🏦 Starting withdrawal process for game:', gameData.id)
      
      // Import contract service
      const contractService = (await import('../../../services/ContractService')).default
      
      // Call the withdrawal function
      const result = await contractService.withdrawWinnings(gameData.id)
      console.log('🏦 Withdrawal result:', result)
      
      if (result.success) {
        console.log('✅ Withdrawal successful:', result)
        
        // Show success message via toast context (assuming it's available)
        const event = new CustomEvent('showToast', {
          detail: {
            type: 'success',
            message: `Withdrawal successful! NFT: ${result.nftTx?.slice(0, 10)}... ETH: ${result.ethTx?.slice(0, 10)}...`
          }
        })
        window.dispatchEvent(event)
        
        // Redirect to home after successful withdrawal
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } else {
        throw new Error(result.error || 'Withdrawal failed')
      }
      
    } catch (error) {
      console.error('❌ Withdrawal failed:', error)
      
      // Show error message
      const event = new CustomEvent('showToast', {
        detail: {
          type: 'error',
          message: `Withdrawal failed: ${error.message}`
        }
      })
      window.dispatchEvent(event)
    } finally {
      setIsWithdrawing(false)
    }
  }
  
  // Server-controlled countdown - no client-side timer needed
  // The countdown is now managed by the server and received via game_state_update
  
  const getGameStatus = () => {
    if (!gameData) return 'Loading...'
    
    switch (gameData.status) {
      case 'active':
      case 'in_progress':
      case 'playing':
        return 'Game Active'
      case 'waiting_challenger':
      case 'waiting_for_challenger':
        return 'Waiting for Player 2'
      case 'waiting_challenger_deposit':
        return 'Waiting for Deposit'
      case 'completed':
        return 'Game Complete'
      default:
        return gameData.status || 'Unknown'
    }
  }
  
  const getGamePrice = () => {
    if (!gameData) return 0
    return parseFloat(gameData.ethAmount || gameData.amount || 0)
  }
  
  const renderWaitingState = () => {
    const status = gameData?.status
    
    if (status === 'waiting_challenger' || status === 'waiting_for_challenger') {
      return (
        <WaitingState>
          <WaitingIcon>⏳</WaitingIcon>
          <WaitingTitle>Waiting for Player 2</WaitingTitle>
          <WaitingDescription>
            The game room will activate once another player joins and deposits.
            Check the Flip Lounge tab to see incoming offers!
          </WaitingDescription>
          <ActionButton onClick={() => window.dispatchEvent(new CustomEvent('switchToLoungeTab'))}>
            Go to Flip Lounge
          </ActionButton>
        </WaitingState>
      )
    }
    
    if (status === 'waiting_challenger_deposit') {
      return (
        <WaitingState>
          <WaitingIcon>💰</WaitingIcon>
          <WaitingTitle>Waiting for Deposit</WaitingTitle>
          <WaitingDescription>
            Player 2 has joined! Waiting for their deposit to be confirmed.
            The game will start automatically once the deposit is received.
          </WaitingDescription>
        </WaitingState>
      )
    }
    
    if (status === 'completed') {
      return (
        <WaitingState>
          <WaitingIcon>🏆</WaitingIcon>
          <WaitingTitle>Game Complete</WaitingTitle>
          <WaitingDescription>
            This game has ended. Check the results in the game history.
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
        <WaitingTitle>Preparing Game Room...</WaitingTitle>
        <WaitingDescription>
          The game room is loading. This should only take a moment.
        </WaitingDescription>
      </WaitingState>
    )
  }
  
  const renderActiveGame = () => {
    if (!gameState) {
      return (
        <WaitingState>
          <WaitingIcon>🎮</WaitingIcon>
          <WaitingTitle>Loading Game...</WaitingTitle>
          <WaitingDescription>
            Preparing the game room...
          </WaitingDescription>
        </WaitingState>
      )
    }
    
    // ACCESS CONTROL: Only allow actual players to interact
    const isActualCreator = address?.toLowerCase() === gameData.creator?.toLowerCase()
    const isActualChallenger = address?.toLowerCase() === gameData.challenger?.toLowerCase()
    const isPlayer = isActualCreator || isActualChallenger
    
    if (!isPlayer) {
      return (
        <WaitingState>
          <WaitingIcon>👁️</WaitingIcon>
          <WaitingTitle>Spectator Mode</WaitingTitle>
          <WaitingDescription>
            You are watching this game. Only the two players can participate.
          </WaitingDescription>
        </WaitingState>
      )
    }

    return (
      <GameBoard>
        {/* Creator Card */}
        <PlayerCard 
          isCreator={true} 
          isActive={gameState.currentTurn === gameData.creator}
        >
          <PlayerHeader>
            <ProfilePicture address={gameData.creator} size={40} />
            <PlayerLabel isCreator={true}>
              {playerNames.creator || `${gameData.creator?.slice(0, 6)}...${gameData.creator?.slice(-4)}`}
            </PlayerLabel>
          </PlayerHeader>
          <PlayerStats>
            <StatRow>
              <StatLabel>Wallet:</StatLabel>
              <StatValue isCreator={true}>
                {gameData.creator?.slice(0, 6)}...{gameData.creator?.slice(-4)}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score:</StatLabel>
              <StatValue isCreator={true}>{gameState.creatorScore}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice:</StatLabel>
              <StatValue isCreator={true}>
                {gameState.creatorChoice || 'Waiting...'}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Power:</StatLabel>
              <StatValue isCreator={true}>
                {gameState.creatorFinalPower?.toFixed(1) || '1.0'}/10.0
              </StatValue>
            </StatRow>
          </PlayerStats>
        </PlayerCard>

        {/* Coin Area or Game End */}
        <CoinArea>
          {(gameState.gamePhase === 'game_complete' || gameState.phase === 'game_complete') ? (
            // Game End UI
            <GameEndContainer isWinner={gameState.gameWinner?.toLowerCase() === address?.toLowerCase()}>
              <GameEndTitle isWinner={gameState.gameWinner?.toLowerCase() === address?.toLowerCase()}>
                {gameState.gameWinner?.toLowerCase() === address?.toLowerCase() ? '🏆 You Won!' : '💔 You Lost'}
              </GameEndTitle>
              
              <FinalScore>
                Final Score: {gameState.finalScore || `${gameState.creatorScore}-${gameState.challengerScore}`}
              </FinalScore>
              
              <GameEndSubtitle>
                {gameState.gameWinner?.toLowerCase() === address?.toLowerCase() 
                  ? 'Congratulations! You can now withdraw both the NFT and crypto from this game.'
                  : 'Better luck next time! The winner takes all in this flip battle.'
                }
              </GameEndSubtitle>
              
              {gameState.gameWinner?.toLowerCase() === address?.toLowerCase() ? (
                <WithdrawButton 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? '⏳ Withdrawing...' : '💰 Withdraw Winnings'}
                </WithdrawButton>
              ) : (
                <HomeButton onClick={() => window.location.href = '/'}>
                  🏠 Return Home
                </HomeButton>
              )}
            </GameEndContainer>
          ) : (
            // Regular Game UI
            <>
              <GameStatus>
                <StatusText>Round {gameState.currentRound}/{gameState.totalRounds}</StatusText>
              </GameStatus>

              <OptimizedGoldCoin
                isFlipping={gameState.coinState?.isFlipping}
                flipResult={gameState.flipResult || gameState.coinState?.flipResult}
                flipDuration={gameState.coinState?.flipDuration || 1000}
                onFlipComplete={() => console.log('Flip animation complete')}
                customHeadsImage={coinConfig?.headsImage}
                customTailsImage={coinConfig?.tailsImage}
                size={240}
                material={coinConfig?.material}
                isPlayerTurn={false} // Server controls everything
                gamePhase={gameState.gamePhase}
                isInteractive={false}
                serverControlled={true} // Pure server-driven mode
                totalRotations={gameState.coinState?.totalRotations}
                finalRotation={gameState.coinState?.finalRotation}
                // Pass server power values to ensure consistent animation
                creatorPower={gameState.creatorFinalPower || 1}
                joinerPower={gameState.challengerFinalPower || 1}
              />
            </>
          )}

          {/* Choice Buttons */}
          {(gameState.phase === 'choosing' || gameState.gamePhase === 'waiting_choice') && gameState.currentTurn === address && (
            <ChoiceButtons>
              <ChoiceButton 
                choice="heads" 
                onClick={() => socket.emit('player_choice', { gameId, address, choice: 'heads' })}
              >
                👑 Heads
              </ChoiceButton>
              <ChoiceButton 
                choice="tails" 
                onClick={() => socket.emit('player_choice', { gameId, address, choice: 'tails' })}
              >
                💎 Tails
              </ChoiceButton>
            </ChoiceButtons>
          )}

          {/* Waiting for other player */}
          {(gameState.phase === 'choosing' || gameState.gamePhase === 'waiting_choice') && gameState.currentTurn !== address && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <OpponentChoosingMessage>
                🤔 {gameState.currentTurn === gameState.creator ? 'Creator' : 'Challenger'} is choosing...
              </OpponentChoosingMessage>
              <TurnIndicator isMyTurn={false}>
                {gameState.currentTurn?.slice(0, 6)}...{gameState.currentTurn?.slice(-4)} is making their choice
              </TurnIndicator>
            </div>
          )}

          {/* Waiting during power charging */}
          {gameState.gamePhase === 'charging_power' && gameState.currentTurn !== address && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <OpponentChoosingMessage style={{ background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 255, 100, 0.1) 100%)', borderColor: '#00FF88', color: '#00FF88' }}>
                ⚡ {gameState.currentTurn === gameState.creator ? 'Creator' : 'Challenger'} is charging power
              </OpponentChoosingMessage>
              <TurnIndicator isMyTurn={false} style={{ color: '#00FF88', textShadow: '0 0 15px #00FF88, 0 0 30px #00FF88' }}>
                Your choice: {address === gameState.creator ? gameState.creatorChoice : gameState.challengerChoice}
              </TurnIndicator>
              <PowerBar>
                <PowerFill 
                  power={
                    (((gameState.currentTurn === gameState.creator ? gameState.creatorFinalPower : gameState.challengerFinalPower) || 1.0) - 1.0) * (100/9)
                  }
                />
                <PowerTicks>
                  {[2, 4, 6, 8].map(level => (
                    <PowerTick 
                      key={level} 
                      active={((gameState.currentTurn === gameState.creator ? gameState.creatorFinalPower : gameState.challengerFinalPower) || 1.0) >= level}
                    />
                  ))}
                </PowerTicks>
                <PowerText>
                  {(gameState.currentTurn === gameState.creator ? gameState.creatorFinalPower : gameState.challengerFinalPower)?.toFixed(1) || '1.0'}/10.0
                </PowerText>
              </PowerBar>
            </div>
          )}

          {/* Power Charging */}
          {gameState.gamePhase === 'charging_power' && gameState.currentTurn === address && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{ color: '#00ff88', fontSize: '1.4rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                🎯 Your choice: {address === gameState.creator ? gameState.creatorChoice : gameState.challengerChoice}
              </div>
              <div style={{ color: '#ffaa00', fontSize: '1.2rem', marginBottom: '1rem' }}>
                Hold to charge your flip power!
              </div>
              
              <PowerBar>
                <PowerFill 
                  power={
                    (((address === gameState.creator ? gameState.creatorFinalPower : gameState.challengerFinalPower) || 1.0) - 1.0) * (100/9)
                  }
                />
                <PowerTicks>
                  {[2, 4, 6, 8].map(level => (
                    <PowerTick 
                      key={level} 
                      active={((address === gameState.creator ? gameState.creatorFinalPower : gameState.challengerFinalPower) || 1.0) >= level}
                    />
                  ))}
                </PowerTicks>
                <PowerText>
                  {(address === gameState.creator ? gameState.creatorFinalPower : gameState.challengerFinalPower)?.toFixed(1) || '1.0'}/10.0
                </PowerText>
              </PowerBar>
              
              <div style={{ fontSize: '1rem', color: '#ccc', marginBottom: '1.5rem' }}>
                {address === gameState.creator ? 
                  `Opponent gets: ${gameState.challengerChoice}` : 
                  `Opponent gets: ${gameState.creatorChoice}`
                }
              </div>
              
              <PulseButton
                onMouseDown={() => {
                  socket.emit('start_power_charge', { gameId, address })
                }}
                onMouseUp={() => {
                  socket.emit('stop_power_charge', { gameId, address })
                }}
                onMouseLeave={() => {
                  // Also stop if mouse leaves button while holding
                  socket.emit('stop_power_charge', { gameId, address })
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  socket.emit('start_power_charge', { gameId, address })
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  socket.emit('stop_power_charge', { gameId, address })
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                  color: '#000',
                  padding: '1.5rem 3rem',
                  fontSize: '1.3rem',
                  userSelect: 'none',
                  cursor: 'pointer',
                  border: '3px solid #00ff88',
                  animation: 'pulse 2s infinite'
                }}
              >
                ⚡ HOLD TO CHARGE ⚡
              </PulseButton>
              
              <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '1rem' }}>
                Release when you're satisfied with your power level!
              </div>
            </div>
          )}
        </CoinArea>

        {/* Challenger Card */}
        <PlayerCard 
          isCreator={false} 
          isActive={gameState.currentTurn === gameData.challenger}
        >
          <PlayerHeader>
            <ProfilePicture address={gameData.challenger} size={40} />
            <PlayerLabel isCreator={false}>
              {playerNames.challenger || `${gameData.challenger?.slice(0, 6)}...${gameData.challenger?.slice(-4)}`}
            </PlayerLabel>
          </PlayerHeader>
          <PlayerStats>
            <StatRow>
              <StatLabel>Wallet:</StatLabel>
              <StatValue isCreator={false}>
                {gameData.challenger?.slice(0, 6)}...{gameData.challenger?.slice(-4)}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score:</StatLabel>
              <StatValue isCreator={false}>{gameState.challengerScore}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice:</StatLabel>
              <StatValue isCreator={false}>
                {gameState.challengerChoice || 'Waiting...'}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Power:</StatLabel>
              <StatValue isCreator={false}>
                {gameState.challengerFinalPower?.toFixed(1) || '1.0'}/10.0
              </StatValue>
            </StatRow>
          </PlayerStats>
        </PlayerCard>
      </GameBoard>
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
      
      {/* Neon Countdown Timer - Bottom Left */}
      {roundCountdown && (
        <CountdownContainer>
          <CountdownText isUrgent={roundCountdown <= 5}>
            {roundCountdown}s
          </CountdownText>
          <CountdownLabel>Time Left</CountdownLabel>
        </CountdownContainer>
      )}
      
      {/* Round Result Animation with WebM videos */}
      <RoundResultAnimation
        isVisible={showWinLoseAnimation}
        isWin={roundResult?.isWin}
        playerScore={roundResult?.playerScore}
        opponentScore={roundResult?.opponentScore}
        currentRound={roundResult?.currentRound}
        totalRounds={roundResult?.totalRounds}
        onAnimationComplete={() => {
          setShowWinLoseAnimation(false)
          setRoundResult(null)
          // Server now handles round progression automatically - no manual request needed
          console.log('🎬 Round result animation complete - server will handle next round')
        }}
      />
    </TabContainer>
  )
}

export default GameRoomTab
