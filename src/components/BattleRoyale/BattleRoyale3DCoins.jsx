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
  onCoinChange 
}) => {
  const [hoveredSlot, setHoveredSlot] = useState(null)
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(138, 43, 226, 0.3))',
      borderRadius: '1rem',
      border: '2px solid rgba(255, 20, 147, 0.3)',
      minHeight: '500px'
    }}>
      {Array.from({ length: 8 }, (_, index) => {
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
  onPowerRelease = () => {}
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
        {safeGamePhase === 'revealing_target' && 'Revealing Target...'}
        {safeGamePhase === 'waiting_choice' && 'Make Your Choice!'}
        {safeGamePhase === 'charging_power' && 'Charge Your Power!'}
        {safeGamePhase === 'executing_flips' && 'Flipping...'}
        {safeGamePhase === 'showing_result' && 'Round Complete!'}
        {safeGamePhase === 'completed' && 'Game Over!'}
        {safeGamePhase === 'game_complete' && 'Game Complete!'}
      </div>

      {/* Player coins grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '2rem',
        maxWidth: '800px',
        width: '100%'
      }}>
        {Array.from({ length: 8 }, (_, index) => {
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
                isPlayerTurn={isCurrentUser && safeGamePhase === 'charging_power'}
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
                    // Update flip state to show charging
                    setLocalFlipStates(prev => ({
                      ...prev,
                      [player.address]: {
                        ...prev[player.address],
                        chargingPlayer: player.address,
                        isCharging: true
                      }
                    }))
                  }
                }}
                onPowerRelease={(power) => {
                  if (isCurrentUser && safeGamePhase === 'charging_power') {
                    console.log('Releasing power for player:', player.address, 'Power:', power)
                    // Update flip state with power level
                    setLocalFlipStates(prev => ({
                      ...prev,
                      [player.address]: {
                        ...prev[player.address],
                        chargingPlayer: null,
                        isCharging: false,
                        power: power
                      }
                    }))
                    // Emit power to server
                    if (typeof onPowerRelease === 'function') {
                      onPowerRelease(player.address, power)
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BattleRoyale3DCoins