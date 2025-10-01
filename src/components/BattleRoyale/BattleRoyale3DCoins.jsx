import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import OptimizedGoldCoin from '../OptimizedGoldCoin'
import BattleRoyaleUnified3DScene from './BattleRoyaleUnified3DScene'

// Separate 2D Lobby Component
const Lobby2DDisplay = ({ 
  players, 
  currentUserAddress, 
  playerCoinImages, 
  coinSides, 
  onSlotClick, 
  canJoin, 
  isJoining, 
  onCoinSideToggle, 
  onCoinChange,
  serverState
}) => {
  const [hoveredSlot, setHoveredSlot] = useState(null)
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)', // 3x2 grid for 6 players
      gap: '1rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(138, 43, 226, 0.3))',
      borderRadius: '1rem',
      border: '2px solid rgba(255, 20, 147, 0.3)',
      minHeight: '500px'
    }}>
      {Array.from({ length: 6 }, (_, index) => { // Changed from 8 to 6
        const player = players[index]
        const isOccupied = player?.address
        const isCurrentUser = player?.address === currentUserAddress
        const coinSide = coinSides[player?.address] || 'heads'
        
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1rem',
              background: isOccupied 
                ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 191, 255, 0.2))'
                : 'linear-gradient(135deg, rgba(255, 20, 147, 0.2), rgba(138, 43, 226, 0.2))',
              borderRadius: '0.5rem',
              border: `2px solid ${isOccupied ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 20, 147, 0.5)'}`,
              cursor: canJoin && !isOccupied ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={() => setHoveredSlot(index)}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() => {
              if (canJoin && !isOccupied) {
                onSlotClick(index)
              }
            }}
          >
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {index + 1}
            </div>
            
            {isOccupied ? (
              <>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                  border: '3px solid #FFD700',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                }}>
                  <img
                    src={playerCoinImages[player.address]?.[`${coinSide}Image`] || '/coins/plainh.png'}
                    alt={`${coinSide} side`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCoinSideToggle(player.address)
                    }}
                  />
                </div>
                
                <div style={{
                  color: '#00ff88',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-all'
                }}>
                  {player.address?.slice(0, 6)}...{player.address?.slice(-4)}
                </div>
                
                {/* Show player's choice in lobby */}
                {serverState?.players?.[player?.address]?.choice && (
                  <div style={{
                    background: serverState.players[player.address].choice === 'heads' 
                      ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                      : 'linear-gradient(135deg, #C0C0C0, #808080)',
                    color: '#000',
                    padding: '0.3rem',
                    borderRadius: '0.3rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '0.5rem',
                    fontSize: '0.6rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    🎯 {serverState.players[player.address].choice.toUpperCase()}
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isCurrentUser ? '#00ff88' : '#00bfff'
                  }} />
                  <span style={{
                    color: isCurrentUser ? '#00ff88' : '#00bfff',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    {isCurrentUser ? 'You' : 'Player'}
                  </span>
                </div>
                
                <button
                  style={{
                    background: 'linear-gradient(135deg, #ff1493, #8a2be2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCoinChange(player.address)
                  }}
                >
                  Change Coin
                </button>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#FF1493',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {canJoin ? (
                  <div>
                    {isJoining ? 'Joining...' : 'Click to Join'}
                  </div>
                ) : (
                  'Empty Slot'
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Main component
const BattleRoyale3DCoins = ({
  players = [],
  gamePhase = 'filling',
  serverState = null,
  flipStates = {},
  onFlipComplete = () => {},
  playerCoinImages = {},
  isCreator = false,
  currentUserAddress = null,
  size = 240,
  onSlotClick = () => {},
  canJoin = false,
  isJoining = false,
  coinSides = {},
  onCoinSideToggle = () => {},
  onCoinChange = () => {},
  onPowerRelease = () => {},
  onPowerChargeStart = null,
  onPowerChargeStop = null
}) => {
  // Refs
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const coinsRef = useRef([])
  const animationIdRef = useRef(null)
  const texturesRef = useRef({})
  
  // State
  const [hoveredSlot, setHoveredSlot] = useState(null)
  const [quality] = useState('high')
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [localFlipStates, setLocalFlipStates] = useState(flipStates)
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [powerLevel, setPowerLevel] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  
  // Sync localFlipStates with flipStates prop
  useEffect(() => {
    setLocalFlipStates(flipStates)
  }, [flipStates])
  
  // Safe game phase check
  const safeGamePhase = gamePhase || 'filling'
  
  // Determine if we should use 3D or 2D display
  const shouldUse3D = useMemo(() => {
    const use3D = safeGamePhase !== 'filling' && safeGamePhase !== 'waiting_players'
    console.log('Should use 3D:', use3D, 'Game phase:', safeGamePhase)
    return use3D
  }, [safeGamePhase])
  
  // Memoized callback
  const safeOnFlipComplete = useCallback((playerAddress, result) => {
    if (typeof onFlipComplete === 'function') {
      onFlipComplete(playerAddress, result)
    }
  }, [onFlipComplete])
  
  // Set scene ready since we're using individual OptimizedGoldCoin components
  useEffect(() => {
    setIsSceneReady(true)
  }, [])

  // Power charging logic
  useEffect(() => {
    let powerInterval = null
    
    if (isCharging) {
      powerInterval = setInterval(() => {
        setPowerLevel(prev => {
          const newLevel = Math.min(prev + 2, 100)
          return newLevel
        })
      }, 50)
    } else {
      if (powerInterval) {
        clearInterval(powerInterval)
      }
    }
    
    return () => {
      if (powerInterval) {
        clearInterval(powerInterval)
      }
    }
  }, [isCharging])

  // Reset power level when game phase changes
  useEffect(() => {
    if (safeGamePhase !== 'charging_power') {
      setPowerLevel(0)
      setIsCharging(false)
      setSelectedChoice(null)
    }
  }, [safeGamePhase])
  
  // 2D Lobby Display
  if (!shouldUse3D) {
    return (
      <Lobby2DDisplay
        players={players}
        currentUserAddress={currentUserAddress}
        playerCoinImages={playerCoinImages}
        coinSides={coinSides}
        onSlotClick={onSlotClick}
        canJoin={canJoin}
        isJoining={isJoining}
        onCoinSideToggle={onCoinSideToggle}
        onCoinChange={onCoinChange}
        serverState={serverState}
      />
    )
  }
  
  // 3D Game Display - Two column layout with unified scene on left, interactive panel on right
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      minHeight: '600px',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'row',
      gap: '2rem',
      padding: '2rem',
      '@media (max-width: 1200px)': {
        flexDirection: 'column'
      }
    }}>
      {/* Left side: Unified 3D Scene */}
      <div style={{
        flex: '3',
        minWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Game phase indicator */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(138, 43, 226, 0.8))',
          color: '#00ff88',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: '2px solid rgba(255, 20, 147, 0.5)',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(255, 20, 147, 0.5)'
        }}>
          {safeGamePhase === 'starting' && 'Game Starting...'}
          {safeGamePhase === 'revealing_target' && 'Target Revealed!'}
          {safeGamePhase === 'charging_power' && `Charge Your Power! ${serverState?.roundCountdown ? `(${serverState.roundCountdown}s)` : ''}`}
          {safeGamePhase === 'executing_flips' && 'Flipping...'}
          {safeGamePhase === 'showing_result' && 'Round Complete!'}
          {safeGamePhase === 'completed' && 'Game Over!'}
          {safeGamePhase === 'game_complete' && 'Game Complete!'}
        </div>
        
        {/* Prominent countdown timer */}
        {safeGamePhase === 'charging_power' && serverState?.roundCountdown > 0 && (
          <div style={{
            background: serverState.roundCountdown <= 5 ? 'rgba(255, 20, 147, 0.2)' : 'rgba(0, 191, 255, 0.2)',
            color: serverState.roundCountdown <= 5 ? '#ff1493' : '#00bfff',
            padding: '1rem 2rem',
            borderRadius: '1rem',
            border: `3px solid ${serverState.roundCountdown <= 5 ? '#ff1493' : '#00bfff'}`,
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: `0 0 20px ${serverState.roundCountdown <= 5 ? 'rgba(255, 20, 147, 0.8)' : 'rgba(0, 191, 255, 0.8)'}`,
            animation: serverState.roundCountdown <= 5 ? 'pulse 0.5s ease-in-out infinite' : 'none',
            boxShadow: `0 0 30px ${serverState.roundCountdown <= 5 ? 'rgba(255, 20, 147, 0.5)' : 'rgba(0, 191, 255, 0.5)'}`
          }}>
            ⏰ {serverState.roundCountdown}s
          </div>
        )}

        {/* Unified 3D Scene */}
        <BattleRoyaleUnified3DScene
          players={players}
          gamePhase={safeGamePhase}
          serverState={serverState}
          flipStates={localFlipStates}
          playerCoinImages={playerCoinImages}
          currentUserAddress={currentUserAddress}
          onFlipComplete={safeOnFlipComplete}
        />
      </div>

      {/* Right side: Interactive Player Panel */}
      <div style={{
        flex: '2',
        minWidth: '400px',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(0, 191, 255, 0.3)',
        borderRadius: '1rem',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        {/* Panel Header */}
        <div style={{
          color: '#00bfff',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(0, 191, 255, 0.8)',
          borderBottom: '2px solid rgba(0, 191, 255, 0.3)',
          paddingBottom: '0.5rem',
          width: '100%'
        }}>
          🎮 YOUR CONTROLS
        </div>

        {/* Large Interactive 3D Coin */}
        {currentUserAddress && (
          <div style={{
            width: '300px',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <OptimizedGoldCoin
              size={300}
              headsImage={playerCoinImages[currentUserAddress]?.headsImage || null}
              tailsImage={playerCoinImages[currentUserAddress]?.tailsImage || null}
              isFlipping={localFlipStates[currentUserAddress]?.isFlipping || false}
              flipResult={localFlipStates[currentUserAddress]?.flipResult}
              creatorPower={serverState?.players?.[currentUserAddress]?.power || 1}
              onFlipComplete={(result) => {
                console.log('✅ Your coin flip complete:', result)
                if (onFlipComplete) {
                  onFlipComplete(currentUserAddress, result)
                }
              }}
            />
          </div>
        )}

        {/* Player Address */}
        <div style={{
          color: '#00ff88',
          fontSize: '1rem',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          {currentUserAddress ? `${currentUserAddress.slice(0, 6)}...${currentUserAddress.slice(-4)}` : 'Not Connected'}
        </div>

        {/* Choice Buttons */}
        {safeGamePhase === 'charging_power' && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            width: '100%'
          }}>
            <button
              style={{
                background: selectedChoice === 'heads' 
                  ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                  : 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                color: selectedChoice === 'heads' ? '#000' : '#333',
                border: selectedChoice === 'heads' ? '3px solid #00ff88' : 'none',
                borderRadius: '0.5rem',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: selectedChoice === 'heads' 
                  ? '0 0 20px rgba(0, 255, 136, 0.5)'
                  : '0 4px 15px rgba(255, 215, 0, 0.3)'
              }}
              onClick={() => setSelectedChoice('heads')}
              onMouseEnter={(e) => {
                if (selectedChoice !== 'heads') {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedChoice !== 'heads') {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)'
                }
              }}
            >
              HEADS
            </button>
            <button
              style={{
                background: selectedChoice === 'tails' 
                  ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                  : 'linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%)',
                color: selectedChoice === 'tails' ? '#000' : '#333',
                border: selectedChoice === 'tails' ? '3px solid #00ff88' : 'none',
                borderRadius: '0.5rem',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: selectedChoice === 'tails' 
                  ? '0 0 20px rgba(0, 255, 136, 0.5)'
                  : '0 4px 15px rgba(192, 192, 192, 0.3)'
              }}
              onClick={() => setSelectedChoice('tails')}
              onMouseEnter={(e) => {
                if (selectedChoice !== 'tails') {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 20px rgba(192, 192, 192, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedChoice !== 'tails') {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 15px rgba(192, 192, 192, 0.3)'
                }
              }}
            >
              TAILS
            </button>
          </div>
        )}

        {/* Power Bar */}
        {safeGamePhase === 'charging_power' && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '200px',
              height: '30px',
              border: '2px solid #fff',
              background: '#222',
              borderRadius: '15px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #00ff00, #ffff00, #ff0000)',
                width: `${powerLevel}%`,
                transition: 'width 0.1s linear',
                borderRadius: '13px'
              }} />
            </div>
            <div style={{
              color: '#00bfff',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              POWER: <span>{powerLevel}%</span>
            </div>
          </div>
        )}

        {/* Flip Button */}
        {safeGamePhase === 'charging_power' && (
          <button
            disabled={!selectedChoice}
            style={{
              background: selectedChoice 
                ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                : 'linear-gradient(135deg, #666 0%, #444 100%)',
              color: selectedChoice ? '#000' : '#999',
              border: 'none',
              padding: '1.5rem 3rem',
              borderRadius: '2rem',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              cursor: selectedChoice ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              userSelect: 'none',
              border: selectedChoice ? '3px solid #00ff88' : '3px solid #666',
              boxShadow: selectedChoice 
                ? '0 4px 15px rgba(0, 255, 136, 0.3)'
                : '0 4px 15px rgba(102, 102, 102, 0.3)',
              opacity: selectedChoice ? 1 : 0.6
            }}
            onMouseDown={() => {
              if (!selectedChoice) return
              console.log('🔋 Flip button pressed - starting power charge')
              setIsCharging(true)
              if (onPowerChargeStart) {
                onPowerChargeStart()
              }
            }}
            onMouseUp={() => {
              if (!selectedChoice) return
              console.log('🔋 Flip button released - executing flip')
              setIsCharging(false)
              if (onPowerChargeStop) {
                onPowerChargeStop(powerLevel)
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              if (!selectedChoice) return
              console.log('🔋 Flip button touch start - starting power charge')
              setIsCharging(true)
              if (onPowerChargeStart) {
                onPowerChargeStart()
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              if (!selectedChoice) return
              console.log('🔋 Flip button touch end - executing flip')
              setIsCharging(false)
              if (onPowerChargeStop) {
                onPowerChargeStop(powerLevel)
              }
            }}
            onMouseEnter={(e) => {
              if (selectedChoice) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 136, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedChoice) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.3)'
              }
            }}
          >
            {!selectedChoice ? '🎯 CHOOSE FIRST' : '🪙 HOLD TO FLIP'}
          </button>
        )}

        {/* Game Status */}
        <div style={{
          color: '#aaa',
          fontSize: '0.9rem',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          {safeGamePhase === 'filling' && 'Waiting for players to join...'}
          {safeGamePhase === 'starting' && 'Game is starting...'}
          {safeGamePhase === 'revealing_target' && 'Target is being revealed...'}
          {safeGamePhase === 'charging_power' && 'Choose your side and charge your power!'}
          {safeGamePhase === 'executing_flips' && 'Coins are flipping...'}
          {safeGamePhase === 'showing_result' && 'Results are being shown...'}
          {safeGamePhase === 'completed' && 'Game completed!'}
        </div>
      </div>
    </div>
  )
}

export default BattleRoyale3DCoins