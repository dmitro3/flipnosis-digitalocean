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
  const animationRef = useRef(null)
  
  // Generate 60 frames for smooth animation (30fps would be 30 frames)
  const totalFrames = 60
  
  // Calculate power-based duration
  const getAnimationDuration = () => {
    const totalPower = creatorPower + joinerPower
    const powerRatio = Math.min(totalPower / 10, 1)
    const baseDuration = 2000 // 2 seconds base
    const powerDuration = 1000 + (powerRatio * 2000) // 1-3 seconds based on power
    return powerDuration
  }

  // Enhanced coin flip animation with natural physics
  useEffect(() => {
    if (!isFlipping || !flipResult) return
    
    console.log('🎬 Starting sprite-based flip animation:', { flipResult })
    setIsAnimating(true)
    
    const animationDuration = getAnimationDuration()
    const frameInterval = animationDuration / totalFrames
    
    let frame = 0
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)
      
      if (progress < 1) {
        // Natural easing - fast start, slow end
        let easedProgress
        if (progress < 0.7) {
          // Fast phase - 70% of time for 85% of animation
          easedProgress = (progress / 0.7) * 0.85
        } else {
          // Slow phase - last 30% of time for final 15%
          const slowPhase = (progress - 0.7) / 0.3
          const eased = 1 - Math.pow(1 - slowPhase, 3) // Cubic ease out
          easedProgress = 0.85 + (eased * 0.15)
        }
        
        // Calculate current frame based on eased progress
        const newFrame = Math.floor(easedProgress * (totalFrames - 1))
        setCurrentFrame(newFrame)
        
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Animation complete
        setCurrentFrame(totalFrames - 1)
        setIsAnimating(false)
        setShowingSide(flipResult)
        console.log('✅ Sprite animation complete. Final side:', flipResult)
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

  // Calculate the rotation angle for current frame
  const getRotationForFrame = (frame) => {
    if (!isAnimating) {
      return showingSide === 'heads' ? 0 : 180
    }
    
    // Total rotations based on power
    const totalPower = creatorPower + joinerPower
    const powerRatio = Math.min(totalPower / 10, 1)
    const baseRotations = 8 + (powerRatio * 12) // 8-20 full rotations
    
    // Determine if we need to end on heads or tails
    const needsOddHalves = showingSide !== flipResult
    const totalDegrees = (baseRotations * 360) + (needsOddHalves ? 180 : 0)
    
    const progress = frame / (totalFrames - 1)
    return progress * totalDegrees
  }

  const rotation = getRotationForFrame(currentFrame)
  const scale = isCharging ? 1.05 + Math.sin(Date.now() * 0.01) * 0.03 : 1

  return (
    <div 
      className={`sprite-coin-container ${isAnimating ? 'flipping' : ''} ${isCharging ? 'charging' : ''}`}
      style={{
        width: size,
        height: size,
        transform: `scale(${scale})`,
        cursor: isPlayerTurn ? 'pointer' : 'default'
      }}
      onMouseDown={onPowerCharge}
      onMouseUp={onPowerRelease}
      onTouchStart={onPowerCharge}
      onTouchEnd={onPowerRelease}
    >
      <div 
        className="coin-wrapper"
        style={{
          transform: `rotateX(${rotation}deg)`,
          transition: isAnimating ? 'none' : 'transform 0.3s ease'
        }}
      >
        {/* Heads side */}
        <div 
          className="coin-side heads-side"
          style={{
            transform: 'rotateX(0deg) translateZ(10px)',
            backgroundImage: customHeadsImage ? `url(${customHeadsImage})` : 'none'
          }}
        >
          {!customHeadsImage && renderCoinFace('heads')}
        </div>
        
        {/* Tails side */}
        <div 
          className="coin-side tails-side"
          style={{
            transform: 'rotateX(180deg) translateZ(10px)',
            backgroundImage: customTailsImage ? `url(${customTailsImage})` : 'none'
          }}
        >
          {!customTailsImage && renderCoinFace('tails')}
        </div>
        
        {/* Edge (multiple segments for smooth circular appearance) */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="coin-edge"
            style={{
              transform: `rotateY(${i * 30}deg) translateZ(100px)`
            }}
          />
        ))}
      </div>
      
      {/* Charging effects */}
      {isCharging && (
        <div className="charging-effects">
          <div className="power-ring" />
          <div className="energy-particles" />
        </div>
      )}
    </div>
  )
}

export default SpriteBasedCoin 