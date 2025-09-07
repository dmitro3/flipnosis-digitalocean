import React, { useState } from 'react'
import styled from '@emotion/styled'
import FinalCoin from '../FinalCoin'

const CoinSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
  min-height: 200px;
  gap: 1rem;
  width: 100%;
  height: 100%;
  position: relative;
`

const TestButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const GameCoin = ({
  gameId,
  gameState,
  gameData,
  flipAnimation,
  customHeadsImage,
  customTailsImage,
  gameCoin,
  isMobile,
  onPowerChargeStart,
  onPowerChargeStop,
  isMyTurn,
  address,
  isCreator,
  flipSeed // Pass this from the server for deterministic animations
}) => {
  // Add debug logging
  console.log('GameCoin props:', {
    customHeadsImage,
    customTailsImage,
    gameCoin,
    gameData: gameData?.coinData || gameData?.coin_data
  })
  const [testFlip, setTestFlip] = useState(null)
  const [isTestFlipping, setIsTestFlipping] = useState(false)
  
  // Parse coin data from game data to get custom faces
  const getCoinFaces = () => {
    // GameCoin debug info
    
    if (gameData?.coin_data) {
      try {
        const coinData = typeof gameData.coin_data === 'string' 
          ? JSON.parse(gameData.coin_data) 
          : gameData.coin_data
        
        // Parsed coinData
        
        return {
          headsImage: coinData.headsImage || customHeadsImage,
          tailsImage: coinData.tailsImage || customTailsImage,
          material: coinData.material || gameCoin?.material
        }
      } catch (e) {
        console.error('Failed to parse coin data:', e)
      }
    }
    
    const result = {
      headsImage: customHeadsImage,
      tailsImage: customTailsImage,
      material: gameCoin?.material
    }
    
    // Final coin faces
    return result
  }
  
  const handleTestFlip = () => {
    if (isTestFlipping) {
      console.log('🔄 Test flip already in progress, ignoring...')
      return
    }
    
    console.log('🎲 Starting test flip...')
    setIsTestFlipping(true)
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    
    // Set the flip state
    setTestFlip({
      isActive: true,
      result,
      duration: 3000
    })
    
    // Reset after animation completes
    setTimeout(() => {
      console.log('🎲 Test flip completed, resetting...')
      setTestFlip(null)
      setIsTestFlipping(false)
    }, 4000) // Give more time for animation to complete
  }
  
  const coinFaces = getCoinFaces()
  
  return (
    <CoinSection>
      <FinalCoin
        isFlipping={testFlip?.isActive || flipAnimation?.isActive}
        flipResult={testFlip?.result || flipAnimation?.result}
        flipDuration={3000}
        onFlipComplete={() => {
          console.log('Flip animation complete')
        }}
        onPowerCharge={onPowerChargeStart} // Start charging
        onPowerRelease={onPowerChargeStop} // Stop charging and flip
        isPlayerTurn={
          gameState?.phase === 'charging' && 
          ((gameState?.roundPhase === 'player1_flip' && isCreator()) ||
           (gameState?.roundPhase === 'player2_flip' && !isCreator()))
        }
        isCharging={gameState?.isCharging}
        creatorPower={gameState?.roundPhase === 'player1_flip' ? gameState?.player1Power : 0}
        joinerPower={gameState?.roundPhase === 'player2_flip' ? gameState?.player2Power : 0}
        customHeadsImage={customHeadsImage || coinFaces.headsImage}
        customTailsImage={customTailsImage || coinFaces.tailsImage}
        size={isMobile ? 180 : 240}
        material={coinFaces.material}
        seed={flipSeed}
        isMobile={isMobile}
      />
      
      {/* Test Button - only show in development or when not in active game */}
      {(!gameState.phase || gameState.phase === 'waiting') && (
        <TestButton 
          onClick={handleTestFlip} 
          disabled={isTestFlipping}
        >
          {isTestFlipping ? 'Flipping...' : 'Test Flip'}
        </TestButton>
      )}
    </CoinSection>
  )
}

export default GameCoin 