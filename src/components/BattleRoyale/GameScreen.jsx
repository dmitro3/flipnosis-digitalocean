import React, { useState, useCallback, useRef, useEffect } from 'react'
import styled from '@emotion/styled'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import BattleRoyaleUnified3DScene from './BattleRoyaleUnified3DScene'
import FloatingChatWidget from './FloatingChatWidget'
import socketService from '../../services/SocketService'
import './BattleRoyaleCoins.css'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
`

const GameLayout = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 1200px) {
    flex-direction: column;
  }
`

const SceneContainer = styled.div`
  flex: 2;
  min-width: 600px;
  height: 600px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  overflow: hidden;
  
  @media (max-width: 1200px) {
    min-width: 100%;
    height: 500px;
  }
`

const ControlPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00bfff;
  border-radius: 1rem;
  padding: 2rem;
  backdrop-filter: blur(15px);
  max-width: 500px;
  
  @media (max-width: 1200px) {
    max-width: 100%;
  }
`

const StatusHeader = styled.div`
  text-align: center;
  
  .phase {
    color: #00bfff;
    font-size: 1.2rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
  }
  
  .timer {
    color: ${props => props.urgent ? '#ff6b6b' : '#00ff88'};
    font-size: 2.5rem;
    font-weight: bold;
    text-shadow: 0 0 20px currentColor;
    animation: ${props => props.urgent ? 'pulse 1s ease-in-out infinite' : 'none'};
  }
  
  .round-info {
    color: #aaa;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
`

const CoinPreview = styled.div`
  width: 150px;
  height: 150px;
  margin: 0 auto;
  border-radius: 50%;
  border: 3px solid #FFD700;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  overflow: hidden;
  background: radial-gradient(circle, #FFD700, #FFA500);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const ChoiceButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  
  button {
    padding: 1.2rem 2.5rem;
    border: none;
    border-radius: 1rem;
    font-size: 1.3rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    font-family: 'Hyperwave', 'Poppins', sans-serif;
    letter-spacing: 2px;
    position: relative;
    overflow: hidden;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s;
    }
    
    &:hover:not(:disabled)::before {
      left: 100%;
    }
    
    &.heads {
      background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
      color: #000;
      border: 3px solid #00ff88;
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
      
      &:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0, 255, 136, 0.6);
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px) scale(0.98);
      }
    }
    
    &.tails {
      background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
      color: #fff;
      border: 3px solid #ff1493;
      box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
      
      &:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 8px 25px rgba(255, 20, 147, 0.6);
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px) scale(0.98);
      }
    }
    
    &.selected {
      border: 4px solid #FFD700;
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.3);
      animation: selectedPulse 1.5s ease-in-out infinite;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }
  
  @keyframes selectedPulse {
    0%, 100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.3); }
    50% { box-shadow: 0 0 40px rgba(255, 215, 0, 1), inset 0 0 30px rgba(255, 215, 0, 0.5); }
  }
`

const FlipButton = styled.button`
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #000;
  border: 3px solid #00ff88;
  padding: 1.5rem 3rem;
  border-radius: 2rem;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  font-family: 'Hyperwave', 'Poppins', sans-serif;
  letter-spacing: 3px;
  position: relative;
  overflow: hidden;
  user-select: none;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s;
  }
  
  &:hover:not(:disabled)::before {
    left: 100%;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 10px 30px rgba(0, 255, 136, 0.5);
  }
  
  &:active:not(:disabled) {
    transform: translateY(-1px) scale(1.02);
  }
  
  &.charging {
    animation: chargeGlow 0.3s ease-in-out infinite;
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @keyframes chargeGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.6); }
    50% { box-shadow: 0 0 40px rgba(0, 255, 136, 1); }
  }
`

const PowerBarContainer = styled.div`
  margin-top: 1rem;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #00bfff;
  border-radius: 1rem;
  padding: 0.8rem;
  text-align: center;
`

const PowerLabel = styled.div`
  color: #00bfff;
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-family: 'Hyperwave', 'Poppins', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
`

const PowerBarTrack = styled.div`
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 15px;
  overflow: hidden;
  border: 2px solid #00bfff;
  position: relative;
`

const PowerBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00ff88 0%, #00ffff 50%, #ffff00 100%);
  border-radius: 15px;
  transition: width 0.1s linear;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 1s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`

const PowerValue = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
  z-index: 1;
  font-family: 'Hyperwave', 'Poppins', sans-serif;
`

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  color: ${props => props.color || 'white'};
  font-weight: bold;
`

const ReplayNotification = styled.div`
  background: linear-gradient(135deg, #ff8c00 0%, #ffa500 100%);
  border: 3px solid #ffd700;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  color: #000;
  font-weight: bold;
  font-size: 1.3rem;
  box-shadow: 0 0 30px rgba(255, 140, 0, 0.6);
  animation: replayPulse 1s ease-in-out infinite;
  margin-bottom: 1rem;
  font-family: 'Hyperwave', 'Poppins', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  
  @keyframes replayPulse {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(255, 140, 0, 0.6);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 40px rgba(255, 140, 0, 1);
      transform: scale(1.02);
    }
  }
`

const WinnerDisplay = styled.div`
  text-align: center;
  padding: 2rem;
  
  .trophy {
    font-size: 5rem;
    animation: bounce 1s ease-in-out infinite;
  }
  
  .message {
    color: #FFD700;
    font-size: 2rem;
    font-weight: bold;
    margin: 1rem 0;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  }
  
  .winner {
    color: white;
    font-size: 1.2rem;
    font-family: monospace;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
`

const GameScreen = () => {
  const { gameState, playerCoinImages, address, makeChoice, flipCoin } = useBattleRoyaleGame()
  const [localChoice, setLocalChoice] = useState(null)
  const [power, setPower] = useState(1)
  const [isCharging, setIsCharging] = useState(false)
  const [replayMessage, setReplayMessage] = useState(null)
  const chargeIntervalRef = useRef(null)

  if (!gameState) return null

  const player = gameState.players?.[address?.toLowerCase()]
  const isInGame = !!player
  const isEliminated = player?.status === 'eliminated'
  const phase = gameState.phase
  const countdown = gameState.roundCountdown || 0
  const currentRound = gameState.currentRound || 1

  // Build players array for 3D scene (in slot order)
  const scenePlayersArray = (gameState.playerSlots || []).map((addr, idx) => {
    if (!addr) return null
    return {
      address: addr,
      slotNumber: idx,
      ...gameState.players?.[addr.toLowerCase()]
    }
  }).filter(Boolean)

  const handleChoiceClick = useCallback((choice) => {
    if (!isInGame || isEliminated || phase !== 'round_active') return
    
    const success = makeChoice(choice)
    if (success) {
      setLocalChoice(choice)
    }
  }, [isInGame, isEliminated, phase, makeChoice])

  // Start charging power
  const handleFlipMouseDown = useCallback(() => {
    if (!isInGame || isEliminated || phase !== 'round_active') return
    if (!player.choice || player.hasFlipped) return
    
    setIsCharging(true)
    setPower(1)
    
    // Increase power over time
    chargeIntervalRef.current = setInterval(() => {
      setPower(prev => {
        const newPower = prev + 0.5
        return newPower > 10 ? 10 : newPower // Max power = 10
      })
    }, 100)
  }, [isInGame, isEliminated, phase, player])

  // Release and flip
  const handleFlipMouseUp = useCallback(() => {
    if (!isInGame || isEliminated || phase !== 'round_active') return
    if (!player.choice || player.hasFlipped) return
    if (!isCharging) return
    
    // Clear interval
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current)
      chargeIntervalRef.current = null
    }
    
    setIsCharging(false)
    
    // Send flip with power
    const success = flipCoin(Math.floor(power))
    if (success) {
      console.log(`🪙 Flipped with power: ${Math.floor(power)}`)
    }
    
    // Reset power after a delay
    setTimeout(() => setPower(1), 500)
  }, [isInGame, isEliminated, phase, player, flipCoin, power, isCharging])

  // Handle mouse leave (cancel charge)
  const handleFlipMouseLeave = useCallback(() => {
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current)
      chargeIntervalRef.current = null
    }
    setIsCharging(false)
    setPower(1)
  }, [])

  // Listen for round end messages
  useEffect(() => {
    const handleRoundEnd = (data) => {
      if (data.message) {
        setReplayMessage(data.message)
        // Clear message after 5 seconds
        setTimeout(() => setReplayMessage(null), 5000)
      }
    }

    socketService.on('battle_royale_round_end', handleRoundEnd)

    return () => {
      socketService.off('battle_royale_round_end', handleRoundEnd)
    }
  }, [])

  // PHASE: STARTING
  if (phase === 'starting') {
    return (
      <Container>
        <div style={{
          textAlign: 'center',
          padding: '4rem',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '1rem',
          border: '2px solid #FFD700'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
          <h2 style={{ color: '#FFD700', fontSize: '2rem', margin: '1rem 0' }}>
            Game Starting...
          </h2>
          <p style={{ color: 'white', fontSize: '1.2rem' }}>
            {gameState.currentPlayers} / 6 Players Ready
          </p>
          <p style={{ color: '#aaa', marginTop: '1rem' }}>
            Get ready for Battle Royale!
          </p>
        </div>
      </Container>
    )
  }

  // PHASE: COMPLETED
  if (phase === 'completed') {
    const isWinner = gameState.winner?.toLowerCase() === address?.toLowerCase()
    return (
      <Container>
        <WinnerDisplay>
          <div className="trophy">🏆</div>
          <div className="message">
            {isWinner ? 'YOU WON!' : 'GAME OVER'}
          </div>
          <div className="winner">
            Winner: {gameState.winner ? `${gameState.winner.slice(0, 10)}...${gameState.winner.slice(-8)}` : 'None'}
          </div>
          <div style={{ color: '#aaa', marginTop: '1rem' }}>
            Total Rounds: {gameState.currentRound}
          </div>
        </WinnerDisplay>
      </Container>
    )
  }

  // PHASE: ROUND_ACTIVE or ROUND_RESULT
  return (
    <Container>
      <GameLayout>
        {/* 3D SCENE */}
        <SceneContainer>
          <BattleRoyaleUnified3DScene
            players={scenePlayersArray}
            gamePhase={phase}
            serverState={gameState}
            playerCoinImages={playerCoinImages}
            currentUserAddress={address}
          />
        </SceneContainer>

        {/* CONTROL PANEL */}
        <ControlPanel>
          {/* REPLAY NOTIFICATION */}
          {replayMessage && (
            <ReplayNotification>
              ⚠️ {replayMessage}
            </ReplayNotification>
          )}
          
          <StatusHeader urgent={countdown <= 5}>
            <div className="phase">
              {phase === 'round_active' ? '⚔️ BATTLE ACTIVE' : '📊 ROUND ENDING'}
            </div>
            <div className="timer">
              {countdown}s
            </div>
            <div className="round-info">
              Round {currentRound} • {gameState.activePlayers?.length || 0} Players Alive
            </div>
          </StatusHeader>

          {isInGame && !isEliminated ? (
            <>
              {/* COIN PREVIEW */}
              <CoinPreview>
                {playerCoinImages[address?.toLowerCase()]?.headsImage ? (
                  <img 
                    src={playerCoinImages[address.toLowerCase()].headsImage} 
                    alt="Your coin" 
                  />
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '4rem'
                  }}>🪙</div>
                )}
              </CoinPreview>

              {/* CHOICE BUTTONS */}
              {phase === 'round_active' && (
                <ChoiceButtons>
                  <button
                    className={`heads ${(localChoice === 'heads' || player.choice === 'heads') ? 'selected' : ''}`}
                    onClick={() => handleChoiceClick('heads')}
                    disabled={player.hasFlipped}
                  >
                    HEADS
                  </button>
                  <button
                    className={`tails ${(localChoice === 'tails' || player.choice === 'tails') ? 'selected' : ''}`}
                    onClick={() => handleChoiceClick('tails')}
                    disabled={player.hasFlipped}
                  >
                    TAILS
                  </button>
                </ChoiceButtons>
              )}

              {/* FLIP BUTTON */}
              {phase === 'round_active' && (
                <>
                  <FlipButton
                    className={isCharging ? 'charging' : ''}
                    onMouseDown={handleFlipMouseDown}
                    onMouseUp={handleFlipMouseUp}
                    onMouseLeave={handleFlipMouseLeave}
                    onTouchStart={handleFlipMouseDown}
                    onTouchEnd={handleFlipMouseUp}
                    disabled={!player.choice || player.hasFlipped}
                  >
                    {player.hasFlipped ? '✅ FLIPPED' : isCharging ? '⚡ CHARGING...' : '🪙 HOLD TO FLIP'}
                  </FlipButton>
                  
                  {/* POWER BAR */}
                  {!player.hasFlipped && (
                    <PowerBarContainer>
                      <PowerLabel>Flip Power</PowerLabel>
                      <PowerBarTrack>
                        <PowerBarFill style={{ width: `${(power / 10) * 100}%` }} />
                        <PowerValue>{Math.floor(power)}/10</PowerValue>
                      </PowerBarTrack>
                    </PowerBarContainer>
                  )}
                </>
              )}

              {/* STATUS INFO */}
              {player.choice && (
                <InfoBox color="#FFD700">
                  Your Choice: {player.choice.toUpperCase()}
                </InfoBox>
              )}

              {player.hasFlipped && (
                <InfoBox color="#00ff88">
                  ✅ Coin Flipped - Waiting for others...
                </InfoBox>
              )}
            </>
          ) : isEliminated ? (
            <InfoBox color="#ff6b6b">
              💀 You were eliminated in Round {player.eliminatedInRound}
            </InfoBox>
          ) : (
            <InfoBox color="#aaa">
              👁️ Spectating
            </InfoBox>
          )}
        </ControlPanel>
      </GameLayout>
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </Container>
  )
}

export default GameScreen
