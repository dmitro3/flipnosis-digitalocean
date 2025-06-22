import React, { useState, useEffect, useRef } from 'react'
import './SpriteBasedCoin.css'

const SpriteBasedCoin = ({
  isFlipping = false,
  flipResult = null,
  flipDuration = 3000,
  size = 300,
  creatorChoice = null,
  joinerChoice = null,
  isCreator = false,
  customHeadsImage = null,
  customTailsImage = null,
  onPowerCharge,
  onPowerRelease,
  isPlayerTurn = false,
  isCharging = false,
  creatorPower = 0,
  joinerPower = 0
}) => {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showingSide, setShowingSide] = useState('heads')
  const [currentRotation, setCurrentRotation] = useState(0)
  const animationRef = useRef(null)
  
  // Test mode states (development only)
  const [testMode, setTestMode] = useState(false)
  
  // Check if we're on mobile - show test interface in all environments
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768
  const isDevelopment = process.env.NODE_ENV === 'development'
  const showTestInterface = isMobile // Available in all environments now
  
  // Generate 120 frames for ultra-smooth animation (60fps for 2 seconds)
  const totalFrames = 120
  
  // Use test power if in test mode, otherwise use props
  const effectivePower = testMode ? 5 : (creatorPower + joinerPower) // Fixed test power of 5
  const effectiveCharging = testMode ? false : isCharging
  
  // Calculate power-based duration and rotations
  const getAnimationParams = () => {
    const totalPower = effectivePower
    const powerRatio = Math.min(totalPower / 10, 1)
    const baseDuration = 2000 // 2 seconds base
    const powerDuration = baseDuration + (powerRatio * 1500) // 2-3.5 seconds based on power
    
    // More rotations with higher power (minimum 6, maximum 20 full rotations)
    const minRotations = 6
    const maxRotations = 20
    const totalRotations = minRotations + (powerRatio * (maxRotations - minRotations))
    
    return { powerDuration, totalRotations }
  }

  const testFlip = () => {
    if (!testMode || isAnimating) return
    
    // Random result
    const results = ['heads', 'tails']
    const randomResult = results[Math.floor(Math.random() * results.length)]
    
    // Simulate the flip
    simulateFlip(randomResult)
  }

  const simulateFlip = (result) => {
    if (isAnimating) return
    
    console.log('🎬 Test flip starting:', { result, power: effectivePower })
    setIsAnimating(true)
    
    const { powerDuration, totalRotations } = getAnimationParams()
    
    // Calculate if we need to end on opposite side
    const needsFlip = showingSide !== result
    
    // Total degrees: multiple full rotations + final position
    const fullRotations = Math.floor(totalRotations)
    const extraDegrees = needsFlip ? 180 : 0
    const totalDegrees = (fullRotations * 360) + extraDegrees
    
    console.log('📊 Test animation params:', {
      currentSide: showingSide,
      targetSide: result,
      needsFlip,
      totalRotations: totalRotations.toFixed(1),
      totalDegrees,
      duration: powerDuration,
      power: effectivePower
    })
    
    const startTime = Date.now()
    const startRotation = currentRotation
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / powerDuration, 1)
      
      if (progress < 1) {
        // Enhanced three-phase easing
        let easedProgress
        if (progress < 0.15) {
          easedProgress = (progress / 0.15) * 0.3
        } else if (progress < 0.75) {
          const midProgress = (progress - 0.15) / 0.6
          easedProgress = 0.3 + (midProgress * 0.6)
        } else {
          const endProgress = (progress - 0.75) / 0.25
          const decelerated = 1 - Math.pow(1 - endProgress, 4)
          easedProgress = 0.9 + (decelerated * 0.1)
        }
        
        const newRotation = startRotation + (totalDegrees * easedProgress)
        setCurrentRotation(newRotation)
        
        const newFrame = Math.floor(easedProgress * (totalFrames - 1))
        setCurrentFrame(newFrame)
        
        animationRef.current = requestAnimationFrame(animate)
      } else {
        const finalRotation = startRotation + totalDegrees
        setCurrentRotation(finalRotation)
        setCurrentFrame(totalFrames - 1)
        setIsAnimating(false)
        setShowingSide(result)
        
        console.log('✅ Test animation complete:', {
          finalSide: result,
          finalRotation: finalRotation.toFixed(1) + '°'
        })
      }
    }
    
    animate()
  }

  // Enhanced coin flip animation
  useEffect(() => {
    if (!isFlipping || !flipResult || testMode) return
    
    console.log('🎬 Starting sprite-based flip animation:', { flipResult, showingSide })
    setIsAnimating(true)
    
    const { powerDuration, totalRotations } = getAnimationParams()
    
    // Calculate if we need to end on opposite side
    const needsFlip = showingSide !== flipResult
    
    // Total degrees: multiple full rotations + final position
    const fullRotations = Math.floor(totalRotations)
    const extraDegrees = needsFlip ? 180 : 0 // Add 180° if we need to flip to opposite side
    const totalDegrees = (fullRotations * 360) + extraDegrees
    
    console.log('📊 Animation params:', {
      currentSide: showingSide,
      targetSide: flipResult,
      needsFlip,
      totalRotations: totalRotations.toFixed(1),
      totalDegrees,
      duration: powerDuration
    })
    
    const startTime = Date.now()
    const startRotation = currentRotation
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / powerDuration, 1)
      
      if (progress < 1) {
        // Enhanced three-phase easing
        let easedProgress
        if (progress < 0.15) {
          // Quick acceleration phase (15% of time)
          easedProgress = (progress / 0.15) * 0.3
        } else if (progress < 0.75) {
          // Constant speed phase (60% of time for 60% of distance)
          const midProgress = (progress - 0.15) / 0.6
          easedProgress = 0.3 + (midProgress * 0.6)
        } else {
          // Dramatic deceleration phase (25% of time for final 10%)
          const endProgress = (progress - 0.75) / 0.25
          const decelerated = 1 - Math.pow(1 - endProgress, 4) // Quartic ease out
          easedProgress = 0.9 + (decelerated * 0.1)
        }
        
        // Calculate current rotation
        const newRotation = startRotation + (totalDegrees * easedProgress)
        setCurrentRotation(newRotation)
        
        // Update frame for debugging
        const newFrame = Math.floor(easedProgress * (totalFrames - 1))
        setCurrentFrame(newFrame)
        
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Animation complete - ensure exact final position
        const finalRotation = startRotation + totalDegrees
        setCurrentRotation(finalRotation)
        setCurrentFrame(totalFrames - 1)
        setIsAnimating(false)
        setShowingSide(flipResult)
        
        console.log('✅ Sprite animation complete:', {
          finalSide: flipResult,
          finalRotation: finalRotation.toFixed(1) + '°'
        })
      }
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isFlipping, flipResult, creatorPower, joinerPower])

  // Generate the coin face content
  const renderCoinFace = (side) => {
    const isSelected = (side === 'heads' && (creatorChoice === 'heads' || joinerChoice === 'heads')) ||
                     (side === 'tails' && (creatorChoice === 'tails' || joinerChoice === 'tails'))
    
    return (
      <div className={`coin-face coin-${side} ${isSelected ? 'selected' : ''}`}>
        <div className="coin-symbol">
          {side === 'heads' ? '♔' : '♦'}
        </div>
        <div className="coin-text">
          {side.toUpperCase()}
        </div>
        {isSelected && <div className="selection-ring" />}
      </div>
    )
  }

  // Add vertical bounce motion during flip
  const getVerticalOffset = () => {
    if (!isAnimating) return 0
    
    const progress = currentFrame / (totalFrames - 1)
    const bounceHeight = 20 // pixels
    
    // Parabolic motion - up then down
    const verticalProgress = Math.sin(progress * Math.PI)
    return -verticalProgress * bounceHeight
  }

  const scale = effectiveCharging ? 1.05 + Math.sin(Date.now() * 0.01) * 0.03 : 1
  const verticalOffset = getVerticalOffset()

  return (
    <div style={{ position: 'relative' }}>
      {/* Main Coin Component */}
      <div 
        className={`sprite-coin-container ${isAnimating ? 'flipping' : ''} ${effectiveCharging ? 'charging' : ''}`}
        style={{
          width: size,
          height: size,
          transform: `scale(${scale}) translateY(${verticalOffset}px)`,
          cursor: isPlayerTurn ? 'pointer' : 'default'
        }}
        onMouseDown={!testMode ? onPowerCharge : undefined}
        onMouseUp={!testMode ? onPowerRelease : undefined}
        onTouchStart={!testMode ? onPowerCharge : undefined}
        onTouchEnd={!testMode ? onPowerRelease : undefined}
      >
        <div 
          className="coin-wrapper"
          style={{
            transform: `rotateX(${currentRotation}deg)`,
            transition: isAnimating ? 'none' : 'transform 0.3s ease'
          }}
        >
          {/* Heads side */}
          <div 
            className="coin-side heads-side"
            style={{
              backgroundImage: customHeadsImage ? `url(${customHeadsImage})` : 'none'
            }}
          >
            {!customHeadsImage && renderCoinFace('heads')}
          </div>
          
          {/* Tails side */}
          <div 
            className="coin-side tails-side"
            style={{
              backgroundImage: customTailsImage ? `url(${customTailsImage})` : 'none'
            }}
          >
            {!customTailsImage && renderCoinFace('tails')}
          </div>
          
          {/* Edge segments - only show during flip for performance */}
          {isAnimating && [...Array(12)].map((_, i) => (
            <div
              key={i}
              className="coin-edge"
            />
          ))}
        </div>
        
        {/* Charging effects */}
        {effectiveCharging && (
          <div className="charging-effects">
            <div className="power-ring" />
            <div className="energy-particles" />
          </div>
        )}
      </div>

      {/* Mobile Test Interface (Development Only) */}
      {showTestInterface && (
        <div style={{
          position: 'absolute',
          top: size + 10,
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '12px',
          padding: '12px',
          color: '#fff',
          fontSize: '14px'
        }}>
          {/* Test Mode Toggle */}
          <div style={{ marginBottom: '10px', textAlign: 'center' }}>
            <button
              onClick={() => setTestMode(!testMode)}
              style={{
                background: testMode ? '#00FF41' : '#666',
                color: testMode ? '#000' : '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {testMode ? 'TEST MODE ON' : 'ENABLE TEST MODE'}
            </button>
          </div>

          {testMode && (
            <>
              {/* Instructions */}
              <div style={{ 
                fontSize: '12px', 
                textAlign: 'center', 
                marginBottom: '10px',
                color: '#ccc',
                lineHeight: '1.3'
              }}>
                Click FLIP to test the coin animation
              </div>

              {/* Flip Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={testFlip}
                  disabled={isAnimating}
                  style={{
                    background: !isAnimating ? '#FF1493' : '#444',
                    color: !isAnimating ? '#fff' : '#999',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: !isAnimating ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isAnimating ? 'FLIPPING...' : 'FLIP!'}
                </button>
              </div>

              {/* Current Side Display */}
              <div style={{
                textAlign: 'center',
                marginTop: '8px',
                fontSize: '12px',
                color: '#aaa'
              }}>
                Current: {showingSide.toUpperCase()} | Rotation: {currentRotation.toFixed(0)}°
              </div>
            </>
          )}
        </div>
      )}

      {/* Debug info - remove in production */}
      {isDevelopment && isAnimating && (
        <div style={{
          position: 'absolute',
          bottom: testMode ? '-80px' : '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          color: '#fff',
          background: 'rgba(0,0,0,0.7)',
          padding: '2px 6px',
          borderRadius: '4px',
          whiteSpace: 'nowrap'
        }}>
          Frame: {currentFrame}/{totalFrames} | Rotation: {currentRotation.toFixed(0)}° | Side: {showingSide}→{flipResult || 'test'}
        </div>
      )}
    </div>
  )
}

export default SpriteBasedCoin 