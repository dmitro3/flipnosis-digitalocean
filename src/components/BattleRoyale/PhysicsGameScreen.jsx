import React, { useState, useCallback } from 'react'
import styled from '@emotion/styled'
import SimpleCoinTubes from './SimpleCoinTubes'
import SimplePlayerCards from './SimplePlayerCards'
import { useBattleRoyaleGame } from '../../contexts/BattleRoyaleGameContext'
import socketService from '../../services/SocketService'
import CoinSelector from '../CoinSelector'
import hazeVideo from '../../../Images/Video/haze.webm'

const BackgroundVideo = styled.video`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  opacity: 0.7;
`

const FullScreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  overflow: hidden;
`

const ThreeJSCanvas = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`

const UIOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 280px;
  z-index: 10;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
`

const TopUIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  z-index: 10;
  pointer-events: none;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  > * {
    pointer-events: auto;
  }
`

const RoundIndicator = styled.div`
  background: rgba(0, 0, 0, 0.95);
  border: 4px solid #00ffff;
  padding: 1rem 2rem;
  border-radius: 1rem;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
  
  .round-text {
    background: linear-gradient(135deg, #00ffff, #00ff88);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

const TimerDisplay = styled.div`
  background: rgba(0, 0, 0, 0.95);
  border: 4px solid ${props => props.urgent ? '#ff1493' : '#00ffff'};
  border-radius: 1rem;
  padding: 1rem 2rem;
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  box-shadow: 0 0 30px ${props => props.urgent ? 'rgba(255, 20, 147, 0.8)' : 'rgba(0, 255, 255, 0.8)'};
  animation: ${props => props.urgent ? 'pulse 0.8s ease-in-out infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`

const ModalContent = styled.div`
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid #FFD700;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #FFD700;
  font-size: 2rem;
  cursor: pointer;
  
  &:hover {
    color: #ff6b6b;
  }
`

const PhysicsGameScreen = () => {
  const { gameState, address, updateCoin } = useBattleRoyaleGame()
  const [showCoinSelector, setShowCoinSelector] = useState(false)
  const [selectedPlayerAddr, setSelectedPlayerAddr] = useState(null)
  const [powerLevel, setPowerLevel] = useState(0)

  if (!gameState) return null

  const phase = gameState.phase
  const currentPlayer = gameState.players?.[address?.toLowerCase()]
  const turnTimer = gameState.roundTimer || 0
  const urgent = turnTimer <= 10

  const handleChoiceSelect = useCallback((choice) => {
    socketService.emit('physics_set_choice', {
      gameId: gameState.gameId,
      address,
      choice
    })
  }, [gameState.gameId, address])

  const handleFlipCoin = useCallback((playerAddr, power) => {
    const player = gameState.players?.[playerAddr.toLowerCase()]
    if (!player || !player.choice) return

    // Trigger the coin animation with the result
    if (window.flipCoin) {
      // For now, use random result - server will determine actual result
      const mockResult = Math.random() < 0.5 ? 'heads' : 'tails'
      window.flipCoin(playerAddr, power, mockResult)
    }

    socketService.emit('physics_fire_coin', {
      gameId: gameState.gameId,
      address: playerAddr,
      angle: 0,
      power: power
    })
  }, [gameState])

  const handleChangeCoin = useCallback((playerAddr) => {
    setSelectedPlayerAddr(playerAddr)
    setShowCoinSelector(true)
  }, [])

  const handleCoinSelect = useCallback((coinData) => {
    updateCoin(coinData)
    setShowCoinSelector(false)
    setSelectedPlayerAddr(null)
  }, [updateCoin])

  const handleCoinLanded = useCallback((playerAddr, result) => {
    console.log(`Coin landed: ${playerAddr} - ${result}`)
    // The server will handle the result
  }, [])

  const handlePowerStart = useCallback((playerAddr) => {
    if (window.startTubeHeating) {
      window.startTubeHeating(playerAddr)
    }
  }, [])

  const handlePowerEnd = useCallback((playerAddr, power) => {
    if (window.shatterTube) {
      window.shatterTube(playerAddr)
    }
    handleFlipCoin(playerAddr, power)
  }, [handleFlipCoin])

  const handlePowerChange = useCallback((power) => {
    setPowerLevel(power)
  }, [])

  return (
    <FullScreenContainer>
      <BackgroundVideo autoPlay loop muted playsInline>
        <source src={hazeVideo} type="video/webm" />
      </BackgroundVideo>
      <ThreeJSCanvas>
        <SimpleCoinTubes
          players={gameState.players || {}}
          playerOrder={gameState.playerOrder || []}
          onCoinLanded={handleCoinLanded}
          onPowerChange={handlePowerChange}
        />
      </ThreeJSCanvas>

      {phase === 'round_active' && (
        <TopUIOverlay>
          <RoundIndicator>
            <div className="round-text">
              🎯 ROUND {gameState.currentRound}
            </div>
          </RoundIndicator>

          <TimerDisplay urgent={urgent}>
            {turnTimer}s
          </TimerDisplay>
        </TopUIOverlay>
      )}

      <UIOverlay>
        <SimplePlayerCards
          players={gameState.players || {}}
          playerOrder={gameState.playerOrder || []}
          currentPlayerAddress={address}
          onChoiceSelect={handleChoiceSelect}
          onFlipCoin={handleFlipCoin}
          onChangeCoin={handleChangeCoin}
          onPowerStart={handlePowerStart}
          onPowerEnd={handlePowerEnd}
          disabled={phase !== 'round_active' || currentPlayer?.hasFired}
        />
      </UIOverlay>

      {showCoinSelector && (
        <Modal onClick={() => setShowCoinSelector(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setShowCoinSelector(false)}>×</CloseButton>
            <h2 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>
              Choose Your Coin
            </h2>
            <CoinSelector
              selectedCoin={gameState.players?.[selectedPlayerAddr?.toLowerCase()]?.coin}
              onCoinSelect={handleCoinSelect}
              showCustomOption={true}
            />
          </ModalContent>
        </Modal>
      )}
    </FullScreenContainer>
  )
}

export default PhysicsGameScreen
