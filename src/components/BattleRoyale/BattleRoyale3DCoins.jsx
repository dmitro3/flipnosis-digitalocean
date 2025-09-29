import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import OptimizedGoldCoin from '../OptimizedGoldCoin'

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
  
  // 3D Game Display - Using OptimizedGoldCoin components in a grid
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      minHeight: '600px',
      background: 'transparent', // Transparent background
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem',
      padding: '2rem'
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

      {/* Player coins grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', // 3x2 grid for 6 players
        gap: '2rem',
        maxWidth: '800px',
        width: '100%'
      }}>
        {Array.from({ length: 6 }, (_, index) => { // Changed from 8 to 6
          const player = players[index]
          const isOccupied = player?.address
          const isCurrentUser = player?.address === currentUserAddress
          const flipState = localFlipStates[player?.address] || {}
          
          if (!isOccupied) {
            // Empty slot - show placeholder
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  color: '#aaa',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>Slot {index + 1}</div>
                <div>Empty</div>
              </div>
            )
          }

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: isCurrentUser 
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 204, 106, 0.1))'
                  : 'linear-gradient(135deg, rgba(0, 191, 255, 0.1), rgba(138, 43, 226, 0.1))',
                border: `2px solid ${isCurrentUser ? '#00ff88' : '#00bfff'}`,
                borderRadius: '1rem',
                position: 'relative'
              }}
            >
              {/* Slot number */}
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

              {/* Player coin */}
              <OptimizedGoldCoin
                isFlipping={flipState.isFlipping || false}
                flipResult={flipState.flipResult || null}
                flipDuration={flipState.flipDuration || 2000}
                isPlayerTurn={isCurrentUser}
                chargingPlayer={flipState.chargingPlayer || null}
                creatorPower={flipState.creatorPower || 0}
                joinerPower={flipState.joinerPower || 0}
                size={120}
                customHeadsImage={playerCoinImages[player.address]?.headsImage}
                customTailsImage={playerCoinImages[player.address]?.tailsImage}
                gamePhase={safeGamePhase}
                isCreator={false}
                creatorChoice={null}
                joinerChoice={null}
                onFlipComplete={(result) => safeOnFlipComplete(player.address, result)}
                isInteractive={isCurrentUser && safeGamePhase === 'charging_power'}
                onCoinClick={() => {
                  if (isCurrentUser && safeGamePhase === 'charging_power') {
                    // Handle coin interaction for power charging
                    console.log('Player coin clicked for power charging')
                  }
                }}
                onPowerCharge={() => {
                  if (isCurrentUser && safeGamePhase === 'charging_power') {
                    console.log('Starting power charge for player:', player.address)
                    // Call parent component's power charge handler
                    if (onPowerChargeStart) {
                      onPowerChargeStart()
                    }
                  }
                }}
                onPowerRelease={(power) => {
                  if (isCurrentUser && safeGamePhase === 'charging_power') {
                    console.log('Releasing power for player:', player.address, 'Power:', power)
                    // Call parent component's power release handler
                    if (onPowerChargeStop) {
                      onPowerChargeStop(power)
                    }
                  }
                }}
              />

              {/* Player info */}
              <div style={{
                color: isCurrentUser ? '#00ff88' : '#00bfff',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                textAlign: 'center',
                wordBreak: 'break-all'
              }}>
                {player.address?.slice(0, 6)}...{player.address?.slice(-4)}
              </div>

              {/* Show player's choice */}
              {serverState?.players?.[player?.address]?.choice && (
                <div style={{
                  background: serverState.players[player.address].choice === 'heads' 
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                    : 'linear-gradient(135deg, #C0C0C0, #808080)',
                  color: '#000',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginTop: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  fontSize: '0.8rem'
                }}>
                  🎯 {serverState.players[player.address].choice.toUpperCase()}
                </div>
              )}
              
              {/* Show flip result */}
              {flipState.flipResult && serverState?.gamePhase === 'showing_result' && (
                <div style={{
                  background: flipState.flipResult === serverState?.players?.[player?.address]?.choice
                    ? 'linear-gradient(135deg, #00ff88, #00cc6a)'
                    : 'linear-gradient(135deg, #ff4444, #cc0000)',
                  color: '#fff',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginTop: '0.5rem'
                }}>
                  {flipState.flipResult === serverState?.players?.[player?.address]?.choice ? '✅ MATCHED!' : '❌ ELIMINATED'}
                </div>
              )}

              {/* Status indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.7rem',
                color: '#aaa'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isCurrentUser ? '#00ff88' : '#00bfff'
                }} />
                <span>{isCurrentUser ? 'You' : 'Player'}</span>
              </div>

              {/* Flip Button for current user */}
              {isCurrentUser && safeGamePhase === 'charging_power' && (
                <button
                  style={{
                    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    boxShadow: '0 2px 10px rgba(0, 255, 136, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseDown={() => {
                    console.log('🔋 Flip button pressed - starting power charge')
                    if (onPowerChargeStart) {
                      onPowerChargeStart()
                    }
                  }}
                  onMouseUp={() => {
                    console.log('🔋 Flip button released - executing flip')
                    if (onPowerChargeStop) {
                      onPowerChargeStop(5) // Default power
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    console.log('🔋 Flip button touch start - starting power charge')
                    if (onPowerChargeStart) {
                      onPowerChargeStart()
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    console.log('🔋 Flip button touch end - executing flip')
                    if (onPowerChargeStop) {
                      onPowerChargeStop(5) // Default power
                    }
                  }}
                >
                  🪙 Hold to Flip
                </button>
              )}

              {/* Win/Loss indicator */}
              {flipState.flipResult && (
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  background: flipState.isWinner 
                    ? 'rgba(0, 255, 136, 0.2)' 
                    : 'rgba(255, 0, 0, 0.2)',
                  color: flipState.isWinner ? '#00ff88' : '#ff4444',
                  border: `1px solid ${flipState.isWinner ? '#00ff88' : '#ff4444'}`
                }}>
                  {flipState.isWinner ? '✅ WIN' : '❌ LOSE'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BattleRoyale3DCoins