import React, { useState, useCallback } from 'react'
import styled from '@emotion/styled'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import BattleRoyaleUnified3DScene from './BattleRoyaleUnified3DScene'
import FloatingChatWidget from './FloatingChatWidget'
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
    padding: 1rem 2rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    
    &.heads {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      color: #333;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
      }
    }
    
    &.tails {
      background: linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%);
      color: #333;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(192, 192, 192, 0.3);
      }
    }
    
    &.selected {
      border: 3px solid #00ff88;
      box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }
`

const FlipButton = styled.button`
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #000;
  border: 3px solid #00ff88;
  padding: 1.5rem 3rem;
  border-radius: 2rem;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 255, 136, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
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

  const handleFlipClick = useCallback(() => {
    if (!isInGame || isEliminated || phase !== 'round_active') return
    
    const success = flipCoin(5)
    if (success) {
      // Choice locked
    }
  }, [isInGame, isEliminated, phase, flipCoin])

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
                <FlipButton
                  onClick={handleFlipClick}
                  disabled={!player.choice || player.hasFlipped}
                >
                  {player.hasFlipped ? '✅ FLIPPED' : '🪙 FLIP COIN'}
                </FlipButton>
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
