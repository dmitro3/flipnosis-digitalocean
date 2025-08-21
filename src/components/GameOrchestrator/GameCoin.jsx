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
  const [testFlip, setTestFlip] = useState(null)
  const [isTestFlipping, setIsTestFlipping] = useState(false)
  
  // Parse coin data from game data to get custom faces
  const getCoinFaces = () => {
    console.log('🔍 GameCoin - gameData:', gameData)
    console.log('🔍 GameCoin - gameData.coin_data:', gameData?.coin_data)
    console.log('🔍 GameCoin - customHeadsImage:', customHeadsImage)
    console.log('🔍 GameCoin - customTailsImage:', customTailsImage)
    
    if (gameData?.coin_data) {
      try {
        const coinData = typeof gameData.coin_data === 'string' 
          ? JSON.parse(gameData.coin_data) 
          : gameData.coin_data
        
        console.log('🔍 GameCoin - parsed coinData:', coinData)
        
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
    
    console.log('🔍 GameCoin - final coin faces:', result)
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
        isFlipping={testFlip?.isActive || !!flipAnimation}
        flipResult={testFlip?.result || flipAnimation?.result}
        flipDuration={testFlip?.duration || flipAnimation?.duration || 3000}
        onFlipComplete={() => {
          // Handle flip completion
          console.log('Flip animation complete')
        }}
        onPowerCharge={onPowerChargeStart}
        onPowerRelease={onPowerChargeStop}
        isPlayerTurn={isMyTurn()}
        isCharging={gameState.chargingPlayer === address}
        creatorPower={gameState.creatorPower || 5}
        joinerPower={gameState.joinerPower || 5}
        customHeadsImage={coinFaces.headsImage}
        customTailsImage={coinFaces.tailsImage}
        size={isMobile ? 225 : 300}
        material={coinFaces.material}
        seed={flipSeed || Math.random() * 10000}
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