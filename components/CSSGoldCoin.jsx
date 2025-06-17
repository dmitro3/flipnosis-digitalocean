import React, { useState, useEffect } from 'react'
import { isMobileDevice } from '../utils/deviceDetection'

const CSSGoldCoin = ({
  isFlipping = false,
  flipResult = null,
  flipDuration = 3000,
  creatorPower = 0,
  joinerPower = 0,
  isPlayerTurn = false,
  chargingPlayer = null,
  isCreator = false,
  creatorChoice = null,
  joinerChoice = null,
  onMouseDown,
  onMouseUp,
  size = 200
}) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentSide, setCurrentSide] = useState('heads')
  const [rotations, setRotations] = useState(0)
  const isMobile = isMobileDevice()

  // Calculate flip parameters based on power
  const totalPower = creatorPower + joinerPower
  const powerRatio = Math.min(totalPower / 10, 1)
  
  // Scale rotations based on power (same as desktop version)
  const minFlips = 4
  const maxFlips = 15
  const calculatedFlips = minFlips + (powerRatio * (maxFlips - minFlips))

  // Start flip animation
  useEffect(() => {
    if (!isFlipping || !flipResult) return

    setIsAnimating(true)
    setRotations(calculatedFlips)

    // Set final result after animation
    const timer = setTimeout(() => {
      setCurrentSide(flipResult)
      setIsAnimating(false)
    }, flipDuration)

    return () => clearTimeout(timer)
  }, [isFlipping, flipResult, flipDuration, calculatedFlips])

  // Determine text colors based on player choices
  const getTextColors = () => {
    let headsColor = '#8B4513'
    let tailsColor = '#8B4513'
    
    if (creatorChoice && joinerChoice) {
      if (isCreator) {
        headsColor = creatorChoice === 'heads' ? '#00FF00' : '#FF0000'
        tailsColor = creatorChoice === 'tails' ? '#00FF00' : '#FF0000'
      } else {
        headsColor = joinerChoice === 'heads' ? '#00FF00' : '#FF0000'
        tailsColor = joinerChoice === 'tails' ? '#00FF00' : '#FF0000'
      }
    }
    
    return { headsColor, tailsColor }
  }

  const { headsColor, tailsColor } = getTextColors()

  return (
    <div
      className="css-coin-container"
      onMouseDown={isPlayerTurn ? onMouseDown : undefined}
      onMouseUp={isPlayerTurn ? onMouseUp : undefined}
      onTouchStart={isPlayerTurn ? onMouseDown : undefined}
      onTouchEnd={isPlayerTurn ? onMouseUp : undefined}
      style={{
        width: size,
        height: size,
        cursor: isPlayerTurn ? 'pointer' : 'default',
        perspective: '1000px',
        margin: '0 auto'
      }}
    >
      <div
        className={`coin ${isAnimating ? 'flipping' : ''} ${chargingPlayer ? 'charging' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: isAnimating ? 'none' : 'transform 0.3s ease',
          transform: `rotateX(${currentSide === 'tails' ? 180 : 0}deg)`,
          animation: isAnimating ? `coinFlip ${flipDuration}ms ease-out forwards` : 
                    chargingPlayer ? 'coinCharge 0.5s ease-in-out infinite' : 'none',
          '--flip-rotations': rotations
        }}
      >
        {/* Heads Side */}
        <div
          className="coin-side heads"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #FFE55C, #DAA520, #B8860B)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.15}px`,
            fontWeight: 'bold',
            color: headsColor,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            border: '3px solid #8B7D6B',
            backfaceVisibility: 'hidden',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ fontSize: `${size * 0.25}px`, marginBottom: `${size * 0.02}px` }}>♔</div>
          <div>HEADS</div>
        </div>

        {/* Tails Side */}
        <div
          className="coin-side tails"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #FFE55C, #DAA520, #B8860B)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.15}px`,
            fontWeight: 'bold',
            color: tailsColor,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            border: '3px solid #8B7D6B',
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ fontSize: `${size * 0.25}px`, marginBottom: `${size * 0.02}px` }}>♦</div>
          <div>TAILS</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes coinFlip {
          0% {
            transform: rotateX(0deg) translateY(0px);
          }
          50% {
            transform: rotateX(calc(var(--flip-rotations) * 180deg / 2)) translateY(-20px);
          }
          100% {
            transform: rotateX(calc(var(--flip-rotations) * 180deg)) translateY(0px);
          }
        }

        @keyframes coinCharge {
          0%, 100% {
            transform: scale(1) rotateY(0deg);
          }
          50% {
            transform: scale(1.05) rotateY(5deg);
          }
        }

        .coin.flipping {
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .coin.charging {
          filter: drop-shadow(0 0 10px #FFD700);
        }

        .css-coin-container:hover .coin {
          filter: drop-shadow(0 0 5px #FFD700);
        }
      `}</style>
    </div>
  )
}

export default CSSGoldCoin 