import React, { useState, useEffect, useMemo } from 'react'
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
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(138, 43, 226, 0.3))',
      borderRadius: '1rem',
      border: '2px solid rgba(255, 20, 147, 0.3)',
      minHeight: '500px'
    }}>
      {Array.from({ length: 6 }, (_, index) => {
        const player = players[index]
        const isOccupied = !!player?.address
        const isCurrentUser = player?.address?.toLowerCase() === currentUserAddress?.toLowerCase()
        const coinSide = coinSides[player?.address] || 'heads'
        const canJoinThisSlot = canJoin && !isOccupied && !!currentUserAddress
        
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
              cursor: canJoinThisSlot ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={() => setHoveredSlot(index)}
            onMouseLeave={() => setHoveredSlot(null)}
            onClick={() => {
              if (canJoinThisSlot) {
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
                {canJoinThisSlot ? (
                  <div>
                    {isJoining ? 'Joining...' : 'Click to Join'}
                  </div>
                ) : (
                  <div>
                    {!currentUserAddress ? 'Connect Wallet' : 'Empty Slot'}
                  </div>
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
  onCoinChange = () => {}
}) => {
  const [selectedChoice, setSelectedChoice] = useState(null)
  
  // Safe game phase check
  const safeGamePhase = gamePhase || 'filling'
  
  // Determine if we should use 3D or 2D display
  const shouldUse3D = useMemo(() => {
    return safeGamePhase !== 'filling' && safeGamePhase !== 'waiting_players'
  }, [safeGamePhase])

  // Reset choice when game phase changes
  useEffect(() => {
    if (safeGamePhase !== 'round_active') {
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
  
  // 3D Game Display
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
      alignItems: 'center',
      justifyContent: 'center'
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
          {safeGamePhase === 'round_active' && `Round Active! ${serverState?.roundCountdown ? `(${serverState.roundCountdown}s)` : ''}`}
          {safeGamePhase === 'completed' && 'Game Over!'}
        </div>
        
        {/* Countdown timer */}
        {safeGamePhase === 'round_active' && serverState?.roundCountdown > 0 && (
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
          flipStates={flipStates}
          playerCoinImages={playerCoinImages}
          currentUserAddress={currentUserAddress}
          onFlipComplete={onFlipComplete}
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
        {safeGamePhase === 'round_active' && (
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
            >
              TAILS
            </button>
          </div>
        )}

        {/* Flip Button */}
        {safeGamePhase === 'round_active' && (
          <button
            disabled={!selectedChoice || serverState?.players?.[currentUserAddress]?.hasFlipped}
            style={{
              background: selectedChoice && !serverState?.players?.[currentUserAddress]?.hasFlipped
                ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
                : 'linear-gradient(135deg, #666 0%, #444 100%)',
              color: selectedChoice ? '#000' : '#999',
              border: 'none',
              padding: '1.5rem 3rem',
              borderRadius: '2rem',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              cursor: selectedChoice && !serverState?.players?.[currentUserAddress]?.hasFlipped ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              userSelect: 'none',
              border: selectedChoice ? '3px solid #00ff88' : '3px solid #666',
              boxShadow: selectedChoice 
                ? '0 4px 15px rgba(0, 255, 136, 0.3)'
                : '0 4px 15px rgba(102, 102, 102, 0.3)',
              opacity: selectedChoice && !serverState?.players?.[currentUserAddress]?.hasFlipped ? 1 : 0.6
            }}
            onClick={() => {
              if (!selectedChoice) {
                console.log('❌ Must choose heads or tails first')
                return
              }
              
              console.log(`🎲 Flipping with choice: ${selectedChoice}`)
              
              // Send choice to server
              if (typeof window !== 'undefined' && window.socketService) {
                window.socketService.emit('battle_royale_player_choice', {
                  gameId: serverState?.gameId,
                  address: currentUserAddress,
                  choice: selectedChoice
                })
                
                // Execute flip
                window.socketService.emit('battle_royale_execute_flip', {
                  gameId: serverState?.gameId,
                  address: currentUserAddress
                })
              }
            }}
          >
            {!selectedChoice ? '🎯 CHOOSE FIRST' : 
             serverState?.players?.[currentUserAddress]?.hasFlipped ? '✅ FLIPPED' :
             '🪙 FLIP COIN'}
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
          {safeGamePhase === 'round_active' && 'Choose your side and flip your coin!'}
          {safeGamePhase === 'completed' && 'Game completed!'}
        </div>
      </div>
    </div>
  )
}

export default BattleRoyale3DCoins