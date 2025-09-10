import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from '@emotion/styled'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useToast } from '../../contexts/ToastContext'
import socketService from '../../services/SocketService'
import OptimizedGoldCoin from '../OptimizedGoldCoin'
import ProfilePicture from '../ProfilePicture'
import GameResultPopup from '../GameResultPopup'

// ===== CLEAN CLIENT ARCHITECTURE =====
// Purely reactive to server state - no local game logic
// Server is the single source of truth

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
  font-size: 0.9rem;
`

const StatLabel = styled.span`
  color: #aaa;
`

const StatValue = styled.span`
  font-weight: bold;
  color: ${props => props.isCreator ? '#FFD700' : '#007BFF'};
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
  color: #00ff88;
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`

const ChoiceButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  background: ${props => props.choice === 'heads' 
    ? 'linear-gradient(135deg, #ffd700, #ffed4e)' 
    : 'linear-gradient(135deg, #c0392b, #e74c3c)'};
  color: ${props => props.choice === 'heads' ? '#000' : '#fff'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const PowerBar = styled.div`
  width: 200px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin: 1rem 0;
`

const PowerFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00cc6a);
  width: ${props => props.power}%;
  transition: width 0.1s ease;
`

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00ff88;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

// === MAIN COMPONENT ===
const FlipSuiteFinal = ({ gameData, coinConfig }) => {
  const { gameId } = useParams()
  const { address } = useAccount()
  const { showSuccess, showError, showInfo } = useToast()
  const navigate = useNavigate()
  
  // ===== PURELY REACTIVE STATE =====
  // All state comes from server - no local game logic
  const [serverGameState, setServerGameState] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Local UI state only
  const [playerChoice, setPlayerChoice] = useState(null)
  const [powerLevel, setPowerLevel] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [chargingPower, setChargingPower] = useState(0)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [resultData, setResultData] = useState(null)
  
  const chargingIntervalRef = useRef(null)
  const initializedRef = useRef(false)

  // ===== HELPER FUNCTIONS =====
  const isCreator = useCallback(() => {
    return address && serverGameState?.creator && address.toLowerCase() === serverGameState.creator.toLowerCase()
  }, [address, serverGameState?.creator])

  const isChallenger = useCallback(() => {
    return address && serverGameState?.challenger && address.toLowerCase() === serverGameState.challenger.toLowerCase()
  }, [address, serverGameState?.challenger])

  const isMyTurn = useCallback(() => {
    return serverGameState && serverGameState.currentTurn && 
           address && serverGameState.currentTurn.toLowerCase() === address.toLowerCase()
  }, [serverGameState, address])

  const canMakeChoice = useCallback(() => {
    return serverGameState && 
           serverGameState.phase === 'choosing' && 
           isMyTurn() && 
           !playerChoice
  }, [serverGameState, isMyTurn, playerChoice])

  const canFlip = useCallback(() => {
    return serverGameState && 
           serverGameState.phase === 'choosing' && 
           isMyTurn() && 
           playerChoice && 
           powerLevel > 0
  }, [serverGameState, isMyTurn, playerChoice, powerLevel])

  // ===== SOCKET EVENT HANDLERS =====
  const handleGameStateUpdate = useCallback((data) => {
    console.log('📊 Game state update received:', data)
    setServerGameState(data)
    setLoading(false)
  }, [])

  const handleGameStarted = useCallback((data) => {
    console.log('🎮 Game started:', data)
    setServerGameState(data)
    setLoading(false)
    showSuccess('🎮 Game started!')
  }, [showSuccess])

  const handleRoundStart = useCallback((data) => {
    console.log('🔄 Round started:', data)
    setServerGameState(prev => ({
      ...prev,
      currentRound: data.round,
      currentTurn: data.currentTurn,
      creatorScore: data.creatorScore,
      challengerScore: data.challengerScore,
      phase: 'choosing',
      creatorChoice: null,
      challengerChoice: null,
      creatorPower: 0,
      challengerPower: 0,
      flipResult: null,
      roundWinner: null
    }))
    setPlayerChoice(null)
    setPowerLevel(0)
    showInfo(`Round ${data.round} started!`)
  }, [showInfo])

  const handleChoiceMade = useCallback((data) => {
    console.log('🎯 Choice made:', data)
    setServerGameState(prev => ({
      ...prev,
      [data.isCreator ? 'creatorChoice' : 'challengerChoice']: data.choice,
      [data.isCreator ? 'creatorPower' : 'challengerPower']: data.power
    }))
  }, [])

  const handleFlipResult = useCallback((data) => {
    console.log('🏆 Flip result:', data)
    setServerGameState(prev => ({
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
  }, [address, isCreator, showSuccess, showInfo])

  const handleGameComplete = useCallback((data) => {
    console.log('🏆 Game complete:', data)
    setServerGameState(prev => ({
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
  }, [address, showSuccess, showError])

  // ===== SOCKET CONNECTION =====
  useEffect(() => {
    if (!gameId || !address || initializedRef.current) return

    console.log('🔌 Connecting to game server...')
    initializedRef.current = true

    const connectToGame = async () => {
      try {
        await socketService.connect(gameId, address)
        setConnected(true)
        
        // Register event listeners
        socketService.on('game_state_update', handleGameStateUpdate)
        socketService.on('game_started', handleGameStarted)
        socketService.on('round_start', handleRoundStart)
        socketService.on('choice_made', handleChoiceMade)
        socketService.on('flip_result', handleFlipResult)
        socketService.on('game_complete', handleGameComplete)
        
        // Request current game state
        socketService.emit('request_game_state', { gameId })
        
      } catch (error) {
        console.error('❌ Failed to connect to game server:', error)
        showError('Failed to connect to game server')
      }
    }

    connectToGame()

    return () => {
      // Cleanup
      socketService.off('game_state_update', handleGameStateUpdate)
      socketService.off('game_started', handleGameStarted)
      socketService.off('round_start', handleRoundStart)
      socketService.off('choice_made', handleChoiceMade)
      socketService.off('flip_result', handleFlipResult)
      socketService.off('game_complete', handleGameComplete)
    }
  }, [gameId, address, handleGameStateUpdate, handleGameStarted, handleRoundStart, handleChoiceMade, handleFlipResult, handleGameComplete, showError])

  // ===== POWER CHARGING LOGIC =====
  const startCharging = useCallback(() => {
    if (!canMakeChoice()) return
    
    console.log('⚡ Starting power charge')
    setIsCharging(true)
    setChargingPower(1)
    
    const startTime = Date.now()
    chargingIntervalRef.current = setInterval(() => {
      setChargingPower(prev => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / 4500, 1) // 4.5 seconds to reach max
        const newPower = Math.min(10, Math.max(1, 1 + (progress * 9))) // 1-10 range
        setPowerLevel(newPower)
        return newPower
      })
    }, 50)
  }, [canMakeChoice])

  const stopCharging = useCallback(() => {
    if (!isCharging) return
    
    const finalPower = Math.round(chargingPower)
    console.log('⚡ Stopping power charge at:', finalPower)
    
    if (chargingIntervalRef.current) {
      clearInterval(chargingIntervalRef.current)
      chargingIntervalRef.current = null
    }
    
    setIsCharging(false)
    setPowerLevel(finalPower)
  }, [isCharging, chargingPower])

  // Cleanup charging on unmount
  useEffect(() => {
    return () => {
      if (chargingIntervalRef.current) {
        clearInterval(chargingIntervalRef.current)
      }
    }
  }, [])

  // ===== GAME ACTIONS =====
  const handleChoice = useCallback((choice) => {
    if (!canMakeChoice()) return
    
    setPlayerChoice(choice)
    showInfo(`You chose ${choice}! Now set your power level.`)
  }, [canMakeChoice, showInfo])

  const handleFlip = useCallback(() => {
    if (!canFlip()) return
    
    console.log('🎯 Making choice:', { choice: playerChoice, power: powerLevel })
    
    socketService.emit('player_choice', {
      gameId,
      address,
      choice: playerChoice,
      power: powerLevel
    })
  }, [canFlip, playerChoice, powerLevel, gameId, address])

  // ===== RENDER HELPERS =====
  const getStatusText = () => {
    if (loading) return 'Loading game...'
    if (!connected) return 'Connecting...'
    if (!serverGameState) return 'Waiting for game state...'
    
    switch (serverGameState.phase) {
      case 'choosing':
        if (canMakeChoice()) return 'Choose heads or tails!'
        if (isMyTurn()) return 'Waiting for your choice...'
        return `Waiting for ${isCreator() ? 'challenger' : 'creator'} to choose...`
      case 'flipping':
        return 'Coin is flipping...'
      case 'result':
        return `Round ${serverGameState.currentRound} complete!`
      case 'completed':
        return 'Game completed!'
      default:
        return 'Game active'
    }
  }

  const getPlayerName = (playerAddress) => {
    if (!playerAddress) return 'Waiting...'
    return `${playerAddress.slice(0, 6)}...${playerAddress.slice(-4)}`
  }

  // ===== RENDER =====
  if (loading) {
    return (
      <GameContainer>
        <LoadingSpinner />
        <StatusText>Loading game...</StatusText>
      </GameContainer>
    )
  }

  if (!connected) {
    return (
      <GameContainer>
        <StatusText>Connecting to game server...</StatusText>
      </GameContainer>
    )
  }

  return (
    <GameContainer>
      {/* Game Header */}
      <GameHeader>
        <GameTitle>🎮 NFT Flip Battle</GameTitle>
        <ConnectionStatus connected={connected}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </ConnectionStatus>
      </GameHeader>

      {/* Game Board */}
      <GameBoard>
        {/* Creator Card */}
        <PlayerCard isCreator={true} isActive={serverGameState?.currentTurn === serverGameState?.creator}>
          <PlayerHeader>
            <ProfilePicture address={serverGameState?.creator} size={40} />
            <PlayerLabel isCreator={true}>👑 Creator</PlayerLabel>
          </PlayerHeader>
          <PlayerStats>
            <StatRow>
              <StatLabel>Name:</StatLabel>
              <StatValue isCreator={true}>{getPlayerName(serverGameState?.creator)}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score:</StatLabel>
              <StatValue isCreator={true}>{serverGameState?.creatorScore || 0}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice:</StatLabel>
              <StatValue isCreator={true}>{serverGameState?.creatorChoice || 'Choosing...'}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Power:</StatLabel>
              <StatValue isCreator={true}>{serverGameState?.creatorPower || 0}</StatValue>
            </StatRow>
          </PlayerStats>
        </PlayerCard>

        {/* Coin Area */}
        <CoinArea>
          <GameStatus>
            <StatusText>{getStatusText()}</StatusText>
            {serverGameState && (
              <div style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                Round {serverGameState.currentRound}/5
              </div>
            )}
          </GameStatus>

          <OptimizedGoldCoin
            isFlipping={serverGameState?.phase === 'flipping'}
            flipResult={serverGameState?.flipResult}
            flipDuration={3000}
            onFlipComplete={() => console.log('Flip animation complete')}
            onPowerCharge={startCharging}
            onPowerRelease={stopCharging}
            isPlayerTurn={isMyTurn() && serverGameState?.phase === 'choosing'}
            isCharging={isCharging}
            creatorPower={serverGameState?.creatorPower || 0}
            joinerPower={serverGameState?.challengerPower || 0}
            customHeadsImage={coinConfig?.headsImage}
            customTailsImage={coinConfig?.tailsImage}
            size={240}
            material={coinConfig?.material || 'gold'}
          />

          {/* Power Bar */}
          {serverGameState?.phase === 'choosing' && isMyTurn() && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {isCharging ? '⚡ Hold to Charge Power ⚡' : 'Ready to Flip'}
              </div>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: '#00ff88' }}>
                {powerLevel} / 10
              </div>
              <PowerBar>
                <PowerFill power={powerLevel * 10} />
              </PowerBar>
              <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
                {isCharging ? 'Release to flip!' : 'Hold coin to charge'}
              </div>
            </div>
          )}

          {/* Choice Buttons */}
          {canMakeChoice() && (
            <ChoiceButtons>
              <ChoiceButton 
                choice="heads" 
                onClick={() => handleChoice('heads')}
              >
                👑 Heads
              </ChoiceButton>
              <ChoiceButton 
                choice="tails" 
                onClick={() => handleChoice('tails')}
              >
                💎 Tails
              </ChoiceButton>
            </ChoiceButtons>
          )}

          {/* Flip Button */}
          {canFlip() && (
            <button
              onClick={handleFlip}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              🎲 FLIP COIN!
            </button>
          )}
        </CoinArea>

        {/* Challenger Card */}
        <PlayerCard isCreator={false} isActive={serverGameState?.currentTurn === serverGameState?.challenger}>
          <PlayerHeader>
            <ProfilePicture address={serverGameState?.challenger} size={40} />
            <PlayerLabel isCreator={false}>⚔️ Challenger</PlayerLabel>
          </PlayerHeader>
          <PlayerStats>
            <StatRow>
              <StatLabel>Name:</StatLabel>
              <StatValue isCreator={false}>{getPlayerName(serverGameState?.challenger)}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Score:</StatLabel>
              <StatValue isCreator={false}>{serverGameState?.challengerScore || 0}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Choice:</StatLabel>
              <StatValue isCreator={false}>{serverGameState?.challengerChoice || 'Choosing...'}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Power:</StatLabel>
              <StatValue isCreator={false}>{serverGameState?.challengerPower || 0}</StatValue>
            </StatRow>
          </PlayerStats>
        </PlayerCard>
      </GameBoard>

      {/* Result Popup */}
      {showResultPopup && resultData && (
        <GameResultPopup
          isOpen={showResultPopup}
          onClose={() => setShowResultPopup(false)}
          resultData={resultData}
        />
      )}
    </GameContainer>
  )
}

export default FlipSuiteFinal