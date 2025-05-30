import React from 'react'
import { ThemeProvider } from '@emotion/react'
import { theme } from '../styles/theme'
import { GlassCard, NeonText } from '../styles/components'
import styled from '@emotion/styled'

// Power Bar Component
export const PowerBar = ({ power, isCharging, isVisible }) => {
  if (!isVisible) return null
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '-40px',
      left: '0',
      right: '0',
      height: '10px',
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '5px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.3)'
    }}>
      <div style={{
        height: '100%',
        width: `${(power / 10) * 100}%`,
        background: isCharging 
          ? `linear-gradient(90deg, ${theme.colors.neonGreen}, ${theme.colors.neonYellow}, ${theme.colors.neonOrange})`
          : `linear-gradient(90deg, ${theme.colors.neonBlue}, ${theme.colors.neonPurple})`,
        borderRadius: '5px',
        transition: 'width 0.1s ease',
        backgroundSize: '200% 100%',
        animation: isCharging ? 'powerCharge 1s linear infinite' : 'none'
      }} />
      {/* Power level indicators */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: theme.colors.textTertiary
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
          <span key={level} style={{
            opacity: power >= level ? 1 : 0.3,
            color: power >= level ? theme.colors.neonYellow : theme.colors.textTertiary
          }}>
            |
          </span>
        ))}
      </div>
    </div>
  )
}

// Coin Component with enhanced animations
export const GameCoin = ({ 
  isFlipping, 
  flipResult, 
  onPowerCharge, 
  onPowerRelease,
  isPlayerTurn,
  gamePhase
}) => {
  const coinRef = React.useRef(null)
  
  const getCoinEmoji = () => {
    if (isFlipping) return '🌀'
    if (flipResult === 'heads') return '👑'
    if (flipResult === 'tails') return '💎'
    return '🪙'
  }
  
  const getCoinBackground = () => {
    if (flipResult === 'heads') {
      return `linear-gradient(45deg, ${theme.colors.neonPink}, ${theme.colors.neonPurple})`
    }
    if (flipResult === 'tails') {
      return `linear-gradient(45deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})`
    }
    return `linear-gradient(45deg, ${theme.colors.neonYellow}, ${theme.colors.neonOrange})`
  }
  
  return (
    <div
      ref={coinRef}
      style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: getCoinBackground(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        fontWeight: 'bold',
        color: 'white',
        cursor: isPlayerTurn && gamePhase === 'playing' ? 'pointer' : 'default',
        border: `3px solid ${theme.colors.neonYellow}`,
        boxShadow: `0 0 20px ${theme.colors.neonYellow}`,
        transition: 'all 0.3s ease',
        transform: isPlayerTurn && gamePhase === 'playing' ? 'scale(1.05)' : 'scale(1)',
        animation: isPlayerTurn && gamePhase === 'playing' ? 'coinGlow 2s ease-in-out infinite' : 'none'
      }}
      onMouseDown={gamePhase === 'playing' && isPlayerTurn ? onPowerCharge : undefined}
      onMouseUp={gamePhase === 'playing' && isPlayerTurn ? onPowerRelease : undefined}
      onMouseLeave={gamePhase === 'playing' && isPlayerTurn ? onPowerRelease : undefined}
      onTouchStart={gamePhase === 'playing' && isPlayerTurn ? onPowerCharge : undefined}
      onTouchEnd={gamePhase === 'playing' && isPlayerTurn ? onPowerRelease : undefined}
    >
      {getCoinEmoji()}
    </div>
  )
}

// Score Display Component
export const ScoreDisplay = ({ scores, currentRound, gamePhase }) => {
  if (gamePhase !== 'playing') return null
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      padding: '1rem',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '1rem',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{ 
        color: theme.colors.neonPink, 
        fontWeight: 'bold', 
        fontSize: '2rem',
        textShadow: `0 0 10px ${theme.colors.neonPink}`
      }}>
        {scores.creator}
      </div>
      <div style={{ 
        color: theme.colors.textSecondary,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Round</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{currentRound}</div>
      </div>
      <div style={{ 
        color: theme.colors.neonBlue, 
        fontWeight: 'bold', 
        fontSize: '2rem',
        textShadow: `0 0 10px ${theme.colors.neonBlue}`
      }}>
        {scores.joiner}
      </div>
    </div>
  )
}

// Player Card Component
export const PlayerCard = ({ 
  player, 
  isCurrentUser, 
  playerNumber,
  nft = null,
  cryptoAmount = null,
  score = 0,
  gamePhase,
  isPlayerTurn = false
}) => {
  const isPlayer1 = playerNumber === 1
  const cardColor = isPlayer1 ? theme.colors.neonPink : theme.colors.neonBlue
  
  return (
    <GlassCard style={{
      border: isCurrentUser ? `2px solid ${cardColor}` : '1px solid rgba(255,255,255,0.1)',
      animation: isPlayerTurn ? 'playerTurnGlow 2s ease-in-out infinite' : 'none'
    }}>
      <div style={{ textAlign: 'center' }}>
        {/* Player Header */}
        <div style={{
          padding: '1rem',
          background: isCurrentUser ? 
            `linear-gradient(45deg, ${cardColor}, ${isPlayer1 ? theme.colors.neonPurple : theme.colors.neonGreen})` : 
            'rgba(255,255,255,0.1)',
          borderRadius: '1rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            PLAYER {playerNumber} {isCurrentUser && '(YOU)'}
          </h3>
          <div style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            {player ? `${player.slice(0, 6)}...${player.slice(-4)}` : 'Waiting...'}
          </div>
          {isPlayerTurn && gamePhase === 'playing' && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.75rem',
              background: theme.colors.statusSuccess,
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              animation: 'powerPulse 1s ease-in-out infinite'
            }}>
              YOUR TURN
            </div>
          )}
        </div>
        
        {/* NFT or Crypto Display */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          {nft ? (
            <img
              src={nft.image}
              alt={nft.name}
              style={{
                width: '100%',
                aspectRatio: '1',
                objectFit: 'cover',
                borderRadius: '1rem',
                border: isCurrentUser ? `3px solid ${cardColor}` : '1px solid rgba(255,255,255,0.2)'
              }}
            />
          ) : (
            <div style={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(45deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})`,
              borderRadius: '1rem',
              border: isCurrentUser ? `3px solid ${cardColor}` : '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{
                fontSize: '6rem',
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))'
              }}>
                💎
              </div>
            </div>
          )}
          
          {/* Score Badge */}
          {gamePhase === 'playing' && score > 0 && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: theme.colors.statusSuccess,
              color: 'white',
              borderRadius: '50%',
              width: '3rem',
              height: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              animation: 'scoreUpdate 0.5s ease-in-out'
            }}>
              {score}
            </div>
          )}
        </div>
        
        {/* Item Info */}
        <div>
          <h4 style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>
            {nft ? nft.name : `${cryptoAmount} ETH`}
          </h4>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            {nft ? nft.collection : 'Cryptocurrency'}
          </p>
        </div>
      </div>
    </GlassCard>
  )
}

// Round Result Component
export const RoundResult = ({ flipResult, roundWinner, isCurrentUser, onClose }) => {
  if (!flipResult || !roundWinner) return null
  
  const isWinner = (roundWinner === 'creator' && isCurrentUser) || 
                   (roundWinner === 'joiner' && isCurrentUser)
  
  return (
    <GlassCard style={{ 
      textAlign: 'center', 
      background: `linear-gradient(45deg, ${theme.colors.neonPink}20, ${theme.colors.neonBlue}20)`,
      border: `2px solid ${roundWinner === 'creator' ? theme.colors.neonPink : theme.colors.neonBlue}`,
      animation: 'resultSlideIn 0.5s ease-out'
    }}>
      <NeonText style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        {flipResult.toUpperCase()}!
      </NeonText>
      <p style={{ 
        color: roundWinner === 'creator' ? theme.colors.neonPink : theme.colors.neonBlue,
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '1rem'
      }}>
        Round won by Player {roundWinner === 'creator' ? '1' : '2'}
        {isWinner && ' (YOU)'}!
      </p>
      {isWinner && (
        <div style={{
          fontSize: '2rem',
          animation: 'winCelebration 1s ease-in-out infinite'
        }}>
          🎉
        </div>
      )}
    </GlassCard>
  )
}

// Game Status Banner
export const GameStatusBanner = ({ gamePhase, gameId, rounds, price, currency }) => {
  const getStatusInfo = () => {
    switch (gamePhase) {
      case 'waiting':
        return { text: '⏳ Waiting for Player', color: theme.colors.statusWarning }
      case 'ready':
        return { text: '🔄 Ready to Start', color: theme.colors.neonBlue }
      case 'playing':
        return { text: '🎮 Playing', color: theme.colors.statusSuccess }
      case 'finished':
        return { text: '🏆 Finished', color: theme.colors.neonPurple }
      default:
        return { text: 'Unknown', color: theme.colors.textSecondary }
    }
  }
  
  const statusInfo = getStatusInfo()
  
  return (
    <GlassCard style={{ 
      textAlign: 'center', 
      marginBottom: '2rem',
      animation: 'phaseTransition 0.5s ease-out'
    }}>
      <NeonText style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        FLIP GAME #{gameId.slice(-6).toUpperCase()}
      </NeonText>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          padding: '0.5rem 1rem',
          background: statusInfo.color,
          borderRadius: '1rem',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {statusInfo.text}
        </div>
        <div style={{ color: theme.colors.textSecondary }}>
          Best of {rounds} • {price} {currency}
        </div>
      </div>
    </GlassCard>
  )
}

// Mobile-responsive wrapper
export const MobileGameLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 2fr 1fr;
  }
`

// Game Instructions Component
export const GameInstructions = ({ isPlayerTurn, gamePhase }) => {
  if (gamePhase !== 'playing') return null
  
  return (
    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
      {isPlayerTurn ? (
        <div>
          <p style={{ 
            color: theme.colors.statusSuccess, 
            marginBottom: '1rem', 
            fontWeight: 'bold',
            fontSize: '1.125rem'
          }}>
            YOUR TURN!
          </p>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            Hold down the coin to charge power, then release to flip!
          </p>
          <p style={{ color: theme.colors.textTertiary, fontSize: '0.75rem', marginTop: '0.5rem' }}>
            More power = longer flip time
          </p>
        </div>
      ) : (
        <div>
          <p style={{ 
            color: theme.colors.textSecondary,
            animation: 'waitingPulse 2s ease-in-out infinite'
          }}>
            Waiting for opponent to flip...
          </p>
        </div>
      )}
    </div>
  )
}

// Enhanced Power Bar Component for dual-player system
export const DualPowerBar = styled.div`
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 0.3s ease;

  .power-bar {
    height: 20px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    border: 1px solid ${props => props.theme.colors.neonPink};
  }

  .power-fill {
    height: 100%;
    transition: width 0.1s linear;
    background: ${props => props.isSinglePlayer ? 
      props.activePlayer === 'creator' ? 
        props.creatorCharging ? props.theme.colors.neonPink : props.theme.colors.neonGreen :
        props.joinerCharging ? props.theme.colors.neonPink : props.theme.colors.neonGreen
      : 'linear-gradient(90deg, #4CAF50, #FFC107)'
    };
    width: ${props => props.isSinglePlayer ? 
      props.activePlayer === 'creator' ? 
        `${(props.creatorPower / 10) * 100}%` :
        `${(props.joinerPower / 10) * 100}%`
      : '50%'
    };
  }

  .power-label {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.8rem;
    text-align: center;
  }

  .power-value {
    color: ${props => props.theme.colors.textPrimary};
    font-size: 0.9rem;
    text-align: center;
    font-weight: bold;
  }

  .timer {
    color: ${props => props.theme.colors.neonYellow};
    font-size: 1rem;
    text-align: center;
    margin-top: 4px;
  }
`

// Enhanced 3D Coin with dual-axis rotation
export const DualGameCoin = styled.div`
  width: 200px;
  height: 200px;
  position: relative;
  cursor: ${props => props.isPlayerTurn && props.gamePhase === 'round_active' ? 'pointer' : 'default'};
  transform-style: preserve-3d;
  transition: transform 0.3s ease;

  &:hover {
    transform: ${props => props.isPlayerTurn && props.gamePhase === 'round_active' ? 'scale(1.05)' : 'none'};
  }

  .coin {
    width: 100%;
    height: 100%;
    position: absolute;
    border-radius: 50%;
    background: ${props => {
      if (props.isFlipping) return 'linear-gradient(45deg, #FFD700, #FFA500)';
      if (props.flipResult === 'heads') return 'linear-gradient(45deg, #FFD700, #FFA500)';
      if (props.flipResult === 'tails') return 'linear-gradient(45deg, #C0C0C0, #808080)';
      return 'linear-gradient(45deg, #FFD700, #FFA500)';
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    box-shadow: 0 0 20px ${props => props.theme.colors.neonYellow};
    border: 2px solid ${props => {
      if (props.isPlayerTurn && props.gamePhase === 'round_active') return props.theme.colors.neonPink;
      if (props.gamePhase === 'flipping') return props.theme.colors.neonYellow;
      return props.theme.colors.neonGreen;
    }};
    transition: all 0.3s ease;
  }

  .coin-front, .coin-back {
    backface-visibility: hidden;
  }

  .coin-back {
    transform: rotateY(180deg);
  }

  &.flipping {
    animation: flip 2s ease-in-out;
  }

  @keyframes flip {
    0% { transform: rotateY(0); }
    100% { transform: rotateY(1800deg); }
  }
`

// Real-time Score Display with round information
export const LiveScoreDisplay = ({ scores, currentRound, gamePhase, maxRounds, flipState }) => {
  if (gamePhase === 'waiting') return null
  
  const winsNeeded = Math.ceil(maxRounds / 2)
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      padding: '1rem',
      background: 'rgba(0,0,0,0.4)',
      borderRadius: '1rem',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Creator Score */}
      <div style={{ 
        textAlign: 'center',
        border: flipState.creatorReady ? `2px solid ${theme.colors.statusSuccess}` : '2px solid transparent',
        borderRadius: '1rem',
        padding: '0.5rem',
        animation: flipState.creatorCharging ? 'playerReady 1s infinite' : 'none'
      }}>
        <div style={{ 
          color: theme.colors.neonPink, 
          fontWeight: 'bold', 
          fontSize: '2.5rem',
          textShadow: `0 0 10px ${theme.colors.neonPink}`
        }}>
          {scores.creator}
        </div>
        <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
          Player 1
        </div>
        {flipState.creatorReady && (
          <div style={{ 
            color: theme.colors.statusSuccess, 
            fontSize: '0.75rem',
            fontWeight: 'bold',
            marginTop: '0.25rem'
          }}>
            READY
          </div>
        )}
      </div>
      
      {/* Round Info */}
      <div style={{ 
        color: theme.colors.textSecondary,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Round</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.colors.textPrimary }}>
          {currentRound}
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          First to {winsNeeded}
        </div>
        
        {/* Game Phase Indicator */}
        <div style={{
          marginTop: '0.5rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '1rem',
          background: 
            gamePhase === 'round_active' ? 'rgba(255, 222, 3, 0.2)' :
            gamePhase === 'flipping' ? 'rgba(255, 107, 0, 0.2)' :
            gamePhase === 'round_complete' ? 'rgba(0, 255, 65, 0.2)' :
            'rgba(255,255,255,0.1)',
          color:
            gamePhase === 'round_active' ? theme.colors.statusWarning :
            gamePhase === 'flipping' ? theme.colors.neonOrange :
            gamePhase === 'round_complete' ? theme.colors.statusSuccess :
            theme.colors.textSecondary,
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          {gamePhase === 'round_active' ? 'CHARGING' :
           gamePhase === 'flipping' ? 'FLIPPING' :
           gamePhase === 'round_complete' ? 'SCORED' :
           'PLAYING'}
        </div>
      </div>
      
      {/* Joiner Score */}
      <div style={{ 
        textAlign: 'center',
        border: flipState.joinerReady ? `2px solid ${theme.colors.statusSuccess}` : '2px solid transparent',
        borderRadius: '1rem',
        padding: '0.5rem',
        animation: flipState.joinerCharging ? 'playerReady 1s infinite' : 'none'
      }}>
        <div style={{ 
          color: theme.colors.neonBlue, 
          fontWeight: 'bold', 
          fontSize: '2.5rem',
          textShadow: `0 0 10px ${theme.colors.neonBlue}`
        }}>
          {scores.joiner}
        </div>
        <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
          Player 2
        </div>
        {flipState.joinerReady && (
          <div style={{ 
            color: theme.colors.statusSuccess, 
            fontSize: '0.75rem',
            fontWeight: 'bold',
            marginTop: '0.25rem'
          }}>
            READY
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Player Card with real-time power display
export const LivePlayerCard = ({ 
  player, 
  isCurrentUser, 
  playerNumber,
  nft = null,
  cryptoAmount = null,
  score = 0,
  gamePhase,
  flipState,
  spectatorMode = false
}) => {
  const isPlayer1 = playerNumber === 1
  const cardColor = isPlayer1 ? theme.colors.neonPink : theme.colors.neonBlue
  const isCharging = isPlayer1 ? flipState.creatorCharging : flipState.joinerCharging
  const power = isPlayer1 ? flipState.creatorPower : flipState.joinerPower
  const isReady = isPlayer1 ? flipState.creatorReady : flipState.joinerReady
  
  return (
    <GlassCard style={{
      border: isCurrentUser ? `2px solid ${cardColor}` : '1px solid rgba(255,255,255,0.1)',
      animation: isCharging ? 'playerReady 1s infinite' : 'none',
      background: isCharging ? `linear-gradient(45deg, ${cardColor}20, transparent)` : undefined
    }}>
      <div style={{ textAlign: 'center' }}>
        {/* Player Header */}
        <div style={{
          padding: '1rem',
          background: isCurrentUser ? 
            `linear-gradient(45deg, ${cardColor}, ${isPlayer1 ? theme.colors.neonPurple : theme.colors.neonGreen})` : 
            'rgba(255,255,255,0.1)',
          borderRadius: '1rem',
          marginBottom: '1rem',
          position: 'relative'
        }}>
          <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            PLAYER {playerNumber} {isCurrentUser && '(YOU)'}
          </h3>
          <div style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            {player ? `${player.slice(0, 6)}...${player.slice(-4)}` : 'Waiting...'}
          </div>
          
          {/* Real-time status indicators */}
          {gamePhase === 'round_active' && player && (
            <div style={{
              marginTop: '0.5rem',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {isCharging && (
                <div style={{
                  padding: '0.25rem 0.75rem',
                  background: theme.colors.statusWarning,
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  animation: 'powerPulse 0.5s ease-in-out infinite'
                }}>
                  ⚡ CHARGING
                </div>
              )}
              {isReady && (
                <div style={{
                  padding: '0.25rem 0.75rem',
                  background: theme.colors.statusSuccess,
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  ✓ READY
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* NFT or Crypto Display */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          {nft ? (
            <img
              src={nft.image}
              alt={nft.name}
              style={{
                width: '100%',
                aspectRatio: '1',
                objectFit: 'cover',
                borderRadius: '1rem',
                border: isCurrentUser ? `3px solid ${cardColor}` : '1px solid rgba(255,255,255,0.2)',
                filter: isCharging ? 'brightness(1.2) saturate(1.3)' : 'brightness(1)'
              }}
            />
          ) : (
            <div style={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: player ? `linear-gradient(45deg, ${theme.colors.neonBlue}, ${theme.colors.neonGreen})` : 'rgba(255,255,255,0.1)',
              borderRadius: '1rem',
              border: isCurrentUser ? `3px solid ${cardColor}` : player ? '1px solid rgba(255,255,255,0.2)' : '2px dashed rgba(255,255,255,0.3)',
              filter: isCharging ? 'brightness(1.2) saturate(1.3)' : 'brightness(1)'
            }}>
              <div style={{
                fontSize: '6rem',
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))',
                opacity: player ? 1 : 0.5
              }}>
                {player ? '💎' : '⏳'}
              </div>
            </div>
          )}
          
          {/* Score Badge */}
          {gamePhase !== 'waiting' && score > 0 && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: theme.colors.statusSuccess,
              color: 'white',
              borderRadius: '50%',
              width: '3rem',
              height: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              animation: 'scoreUpdate 0.5s ease-in-out'
            }}>
              {score}
            </div>
          )}
        </div>
        
        {/* Item Info */}
        <div>
          <h4 style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>
            {nft ? nft.name : player ? cryptoAmount : 'Waiting for player...'}
          </h4>
          <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            {nft ? nft.collection : player ? 'Cryptocurrency' : ''}
          </p>
        </div>
        
        {/* Power Display for Active Round */}
        {gamePhase === 'round_active' && player && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ 
              color: theme.colors.textSecondary, 
              fontSize: '0.875rem',
              marginBottom: '0.5rem'
            }}>
              {isPlayer1 ? 'Vertical Power' : 'Horizontal Power'}
            </p>
            <div style={{ 
              height: '20px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <div style={{
                height: '100%',
                width: `${(power / 10) * 100}%`,
                background: isCharging 
                  ? `linear-gradient(90deg, ${cardColor}, ${isPlayer1 ? theme.colors.neonPurple : theme.colors.neonGreen})`
                  : cardColor,
                borderRadius: '10px',
                transition: 'width 0.1s ease',
                animation: isCharging ? 'powerChargeGlow 0.5s infinite' : 'none'
              }} />
            </div>
            <p style={{ 
              color: cardColor, 
              fontWeight: 'bold', 
              marginTop: '0.5rem',
              fontSize: '1.25rem'
            }}>
              {power.toFixed(1)} / 10
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

// Round Result with enhanced animation
export const LiveRoundResult = ({ flipResult, roundWinner, isCurrentUser, flipState }) => {
  if (!flipResult || !roundWinner) return null
  
  const isWinner = (roundWinner === 'creator' && isCurrentUser) || 
                   (roundWinner === 'joiner' && isCurrentUser)
  
  return (
    <GlassCard style={{ 
      textAlign: 'center', 
      background: `linear-gradient(45deg, ${theme.colors.neonPink}20, ${theme.colors.neonBlue}20)`,
      border: `2px solid ${roundWinner === 'creator' ? theme.colors.neonPink : theme.colors.neonBlue}`,
      animation: 'resultSlideIn 0.5s ease-out',
      marginTop: '2rem'
    }}>
      <div style={{
        fontSize: '4rem',
        marginBottom: '1rem',
        animation: 'resultReveal 1s ease-out'
      }}>
        {flipResult === 'heads' ? '👑' : '💎'}
      </div>
      
      <NeonText style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        {flipResult.toUpperCase()}!
      </NeonText>
      
      <div style={{
        marginBottom: '1rem',
        padding: '1rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '1rem'
      }}>
        <p style={{ 
          color: theme.colors.textSecondary,
          fontSize: '0.875rem',
          marginBottom: '0.5rem'
        }}>
          Power Combination
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: theme.colors.neonPink, fontWeight: 'bold' }}>
              {flipState.creatorPower?.toFixed(1) || '0.0'}
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
              Vertical
            </div>
          </div>
          <div style={{ color: theme.colors.textSecondary, fontSize: '1.5rem' }}>+</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: theme.colors.neonBlue, fontWeight: 'bold' }}>
              {flipState.joinerPower?.toFixed(1) || '0.0'}
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
              Horizontal
            </div>
          </div>
          <div style={{ color: theme.colors.textSecondary, fontSize: '1.5rem' }}>=</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: theme.colors.neonYellow, fontWeight: 'bold' }}>
              {((flipState.creatorPower || 0) + (flipState.joinerPower || 0)).toFixed(1)}
            </div>
            <div style={{ color: theme.colors.textSecondary, fontSize: '0.75rem' }}>
              Total
            </div>
          </div>
        </div>
      </div>
      
      <p style={{ 
        color: roundWinner === 'creator' ? theme.colors.neonPink : theme.colors.neonBlue,
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '1rem'
      }}>
        Round won by Player {roundWinner === 'creator' ? '1' : '2'}
        {isWinner && ' (YOU)'}!
      </p>
      
      {isWinner && (
        <div style={{
          fontSize: '2rem',
          animation: 'winCelebration 1s ease-in-out infinite'
        }}>
          🎉
        </div>
      )}
    </GlassCard>
  )
}

// Game Instructions for dual-player system
export const DualGameInstructions = ({ isPlayerTurn, gamePhase, isPlayer, playerNumber, spectatorMode }) => {
  if (spectatorMode) {
    return (
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ 
          color: theme.colors.neonBlue, 
          marginBottom: '1rem', 
          fontWeight: 'bold',
          fontSize: '1.125rem'
        }}>
          👀 SPECTATING
        </p>
        <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
          Watch both players charge power and flip the coin!
        </p>
      </div>
    )
  }

  if (gamePhase !== 'round_active') return null
  
  if (!isPlayer) {
    return (
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: theme.colors.textSecondary }}>
          Watch the players battle it out!
        </p>
      </div>
    )
  }
  
  return (
    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
      <div>
        <p style={{ 
          color: theme.colors.statusSuccess, 
          marginBottom: '1rem', 
          fontWeight: 'bold',
          fontSize: '1.125rem'
        }}>
          CHARGE YOUR POWER!
        </p>
        <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Hold down the coin to charge power, then release to set your force!
        </p>
        <p style={{ 
          color: playerNumber === 1 ? theme.colors.neonPink : theme.colors.neonBlue, 
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>
          You control {playerNumber === 1 ? 'VERTICAL' : 'HORIZONTAL'} rotation
        </p>
        <p style={{ color: theme.colors.textTertiary, fontSize: '0.75rem', marginTop: '0.5rem' }}>
          More power = more spin influence • Both players flip together!
        </p>
      </div>
    </div>
  )
}

// Spectator count display
export const SpectatorCounter = ({ count, isLive = false }) => {
  if (count === 0) return null
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'rgba(0, 191, 255, 0.1)',
      padding: '0.5rem 1rem',
      borderRadius: '1rem',
      border: '1px solid rgba(0, 191, 255, 0.3)'
    }}>
      <span style={{ 
        fontSize: '1rem',
        animation: isLive ? 'livePulse 2s infinite' : 'none'
      }}>
        👥
      </span>
      <span style={{ 
        color: theme.colors.neonBlue,
        fontWeight: 'bold',
        fontSize: '0.875rem'
      }}>
        {count} watching
      </span>
      {isLive && (
        <div style={{
          width: '8px',
          height: '8px',
          background: '#ff0000',
          borderRadius: '50%',
          animation: 'livePulse 1s infinite'
        }} />
      )}
    </div>
  )
} 