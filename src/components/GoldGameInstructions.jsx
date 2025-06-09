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
  if (spectatorMode) {
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
        <div style={{
          fontSize: '1.5rem',
          marginBottom: '0.5rem'
        }}>
          👀
        </div>
        <p style={{ 
          color: '#FFD700', 
          marginBottom: '1rem', 
          fontWeight: 'bold',
          fontSize: '1.2rem',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
        }}>
          SPECTATING
        </p>
        <p style={{ 
          color: 'rgba(255, 215, 0, 0.8)', 
          fontSize: '0.9rem',
          lineHeight: '1.4'
        }}>
          Watch players choose their side, charge power, and flip the golden coin!
        </p>
      </div>
    )
  }

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

  return renderRoundIndicators(playerNumber === 1)
}

export default GoldGameInstructions 