import React from 'react'
import { theme } from '../styles/theme'

const GoldGameInstructions = ({ 
  isPlayerTurn, 
  gamePhase, 
  isPlayer, 
  playerNumber, 
  spectatorMode,
  currentPower = 0,
  playerChoice = null,
  currentRound = 1,
  maxRounds = 5,
  creatorWins = 0,
  joinerWins = 0
}) => {
  // Round indicator circles for each player box
  const renderRoundIndicators = (isCreator) => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '1rem',
        padding: '0.5rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '0.5rem'
      }}>
        {Array.from({ length: maxRounds }).map((_, index) => {
          const roundNumber = index + 1
          const isCurrentRound = roundNumber === currentRound
          const isPastRound = roundNumber < currentRound
          const roundWinner = roundNumber < currentRound ? 
            (creatorWins >= roundNumber ? 'creator' : 'joiner') : null
          const isWin = isCreator ? 
            (roundWinner === 'creator') : 
            (roundWinner === 'joiner')

          return (
            <div
              key={roundNumber}
              style={{
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '50%',
                background: isCurrentRound ? 
                  'rgba(255, 215, 0, 0.3)' : 
                  isPastRound ? 
                    (isWin ? theme.colors.neonGreen : theme.colors.statusError) :
                    'rgba(255, 255, 255, 0.1)',
                border: `2px solid ${
                  isCurrentRound ? '#FFD700' :
                  isPastRound ? 
                    (isWin ? theme.colors.neonGreen : theme.colors.statusError) :
                    'rgba(255, 255, 255, 0.2)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: isCurrentRound ? '#FFD700' : 'white',
                boxShadow: isCurrentRound ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
              }}
            >
              {roundNumber}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{
      marginTop: '2rem',
      textAlign: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '1rem',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Game Info */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '0.8rem',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        <h3 style={{
          color: '#FFD700',
          fontSize: '1rem',
          marginBottom: '1rem',
          textAlign: 'left'
        }}>
          Game Info
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          textAlign: 'left'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Current Round</div>
            <div style={{ color: '#FFD700', fontWeight: 'bold' }}>{currentRound} / {maxRounds}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Creator Wins</div>
            <div style={{ color: theme.colors.neonGreen, fontWeight: 'bold' }}>{creatorWins}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Joiner Wins</div>
            <div style={{ color: theme.colors.neonGreen, fontWeight: 'bold' }}>{joinerWins}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>SIDE</div>
            <div style={{ color: '#FFD700', fontWeight: 'bold', textTransform: 'capitalize' }}>
              {gamePhase?.split('\n')[1] || 'Waiting'}
            </div>
          </div>
        </div>
      </div>

      {renderRoundIndicators(playerNumber === 1)}
    </div>
  )
}

export default GoldGameInstructions 