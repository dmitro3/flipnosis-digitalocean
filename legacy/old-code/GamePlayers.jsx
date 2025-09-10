import React from 'react'
import styled from '@emotion/styled'
import ProfilePicture from '../ProfilePicture'

const PlayerSection = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const PlayerBox = styled.div`
  flex: 1;
  background: linear-gradient(135deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 255, 65, 0.05) 100%);
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid #00FF41;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.3), inset 0 0 20px rgba(0, 255, 65, 0.1);
`

const PowerDisplay = styled.div`
  flex: 1;
  background: linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 40, 80, 0.9) 100%);
  padding: 1.5rem;
  border-radius: 1rem;
  border: 2px solid #FFD700;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 100, 120, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const RoundIndicators = styled.div`
  display: flex;
  gap: 0.5rem;
`

const RoundDot = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => {
    if (props.isCurrent) return '#FFFF00';
    if (props.isWon) return '#00FF41';
    if (props.isLost) return '#FF1493';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: ${props => props.isCurrent || props.isWon || props.isLost ? '#000' : '#666'};
`

const GamePlayers = ({
  gameData,
  gameState,
  playerChoices,
  roundCountdown,
  isCreator,
  isJoiner,
  getGameCreator,
  getGameJoiner,
  isMyTurn
}) => {
  return (
    <PlayerSection>
      {/* Combined Player Box - Left Side */}
      <PlayerBox>
        {/* Creator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: isCreator() ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem',
          border: isCreator() ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <ProfilePicture 
              address={getGameCreator()}
              size={50}
              showAddress={true}
            />
          </div>
          <div style={{ flex: '1' }}>
            <h4 style={{ color: '#FFD700', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Creator</h4>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'white' }}>
              Power: {Number(gameState.creatorPower) || 0}
            </p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#ccc' }}>
              Wins: {gameState.creatorWins || 0}
            </p>
            {playerChoices.creator && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.25rem 0.5rem', 
                background: playerChoices.creator === 'heads' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 20, 147, 0.2)',
                border: `1px solid ${playerChoices.creator === 'heads' ? '#00FF41' : '#FF1493'}`,
                borderRadius: '0.25rem',
                fontSize: '0.8rem',
                color: 'white',
                textAlign: 'center',
                display: 'inline-block'
              }}>
                Chose: {playerChoices.creator.toUpperCase()}
              </div>
            )}
          </div>
          <RoundIndicators>
            <RoundDot isCurrent={gameState.currentRound === 1} isWon={gameState.creatorWins > 0} isLost={gameState.joinerWins > 0}>
              1
            </RoundDot>
            <RoundDot isCurrent={gameState.currentRound === 2} isWon={gameState.creatorWins > 1} isLost={gameState.joinerWins > 1}>
              2
            </RoundDot>
            <RoundDot isCurrent={gameState.currentRound === 3} isWon={gameState.creatorWins > 2} isLost={gameState.joinerWins > 2}>
              3
            </RoundDot>
          </RoundIndicators>
        </div>
        
        {/* Joiner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem',
          background: isJoiner() ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem',
          border: isJoiner() ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <ProfilePicture 
              address={getGameJoiner()}
              size={50}
              showAddress={true}
            />
          </div>
          <div style={{ flex: '1' }}>
            <h4 style={{ color: '#FFD700', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>Joiner</h4>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'white' }}>
              Power: {Number(gameState.joinerPower) || 0}
            </p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#ccc' }}>
              Wins: {gameState.joinerWins || 0}
            </p>
            {playerChoices.joiner && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.25rem 0.5rem', 
                background: playerChoices.joiner === 'heads' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 20, 147, 0.2)',
                border: `1px solid ${playerChoices.joiner === 'heads' ? '#00FF41' : '#FF1493'}`,
                borderRadius: '0.25rem',
                fontSize: '0.8rem',
                color: 'white',
                textAlign: 'center',
                display: 'inline-block'
              }}>
                Chose: {playerChoices.joiner.toUpperCase()}
              </div>
            )}
          </div>
          <RoundIndicators>
            <RoundDot isCurrent={gameState.currentRound === 1} isWon={gameState.joinerWins > 0} isLost={gameState.creatorWins > 0}>
              1
            </RoundDot>
            <RoundDot isCurrent={gameState.currentRound === 2} isWon={gameState.joinerWins > 1} isLost={gameState.creatorWins > 1}>
              2
            </RoundDot>
            <RoundDot isCurrent={gameState.currentRound === 3} isWon={gameState.joinerWins > 2} isLost={gameState.creatorWins > 2}>
              3
            </RoundDot>
          </RoundIndicators>
        </div>
      </PlayerBox>
      
      {/* Power Display - Right Side */}
      <PowerDisplay>
        <h3 style={{ 
          color: '#FFD700', 
          marginBottom: '1rem', 
          textAlign: 'center', 
          fontSize: '1.2rem',
          animation: 'powerLevelFlash 2s ease-in-out infinite',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
        }}>
          ⚡ POWER LEVEL ⚡
        </h3>
        
        {/* Power Bar */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              color: '#FFD700',
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Total Power</span>
              <span style={{ 
                color: '#FFD700',
                textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' 
              }}>
                {((Number(gameState.creatorPower) || 0) + (Number(gameState.joinerPower) || 0)).toFixed(1)}/10
              </span>
            </div>
            
            <div style={{
              height: '30px',
              background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(40, 30, 0, 0.6) 100%)',
              borderRadius: '15px',
              overflow: 'hidden',
              border: '3px solid #FFD700',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                height: '100%',
                width: `${(((Number(gameState.creatorPower) || 0) + (Number(gameState.joinerPower) || 0)) / 10) * 100}%`,
                background: gameState.chargingPlayer ? 
                  `linear-gradient(90deg, #FFD700 0%, #FFA500 30%, #FF6B00 60%, #FF1493 100%)` :
                  `linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)`,
                borderRadius: '12px',
                transition: 'width 0.15s ease-out',
                backgroundSize: '200% 100%',
                animation: gameState.chargingPlayer ? 'powerCharge 0.6s linear infinite' : 'none',
                boxShadow: gameState.chargingPlayer ? 
                  '0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)' :
                  '0 0 8px rgba(255, 215, 0, 0.6)'
              }} />
              
              {/* Power level markers */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 0.5rem'
              }}>
                {[2, 4, 6, 8].map(level => (
                  <div key={level} style={{
                    width: '2px',
                    height: '70%',
                    background: 'rgba(255, 255, 255, 0.4)',
                    opacity: ((Number(gameState.creatorPower) || 0) + (Number(gameState.joinerPower) || 0)) >= level ? 1 : 0.3
                  }} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Charging Indicator */}
          {gameState.chargingPlayer && (
            <div style={{
              padding: '0.75rem',
              background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.1) 100%)',
              border: '1px solid rgba(255, 215, 0, 0.5)',
              borderRadius: '0.75rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                color: '#FFD700',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                animation: 'powerPulse 0.4s ease-in-out infinite',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
              }}>
                ⚡ {gameState.chargingPlayer === getGameCreator() ? 'PLAYER 1' : 'PLAYER 2'} CHARGING ⚡
              </div>
            </div>
          )}
          
          {/* Round Countdown */}
          {roundCountdown !== null && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.2rem',
                color: roundCountdown <= 5 ? '#FF4444' : '#00FF41',
                fontWeight: 'bold',
                textShadow: roundCountdown <= 5 ? '0 0 10px rgba(255, 68, 68, 0.8)' : '0 0 10px rgba(0, 255, 65, 0.5)',
                animation: roundCountdown <= 5 ? 'pulse 1s ease-in-out infinite' : 'none'
              }}>
                ⏰ {roundCountdown}s
              </div>
            </div>
          )}
          
          {/* Waiting for Opponent Message */}
          {gameData?.status === 'active' && gameState.phase === 'choosing' && 
           !isMyTurn() && !(isCreator() ? gameState.creatorChoice : gameState.joinerChoice) && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '0.75rem',
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              <div style={{
                color: '#FFD700',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                animation: 'pulse 2s ease-in-out infinite',
                textShadow: '0 0 5px rgba(255, 215, 0, 0.8)'
              }}>
                ⏳ Waiting for opponent's choice...
              </div>
              <div style={{
                color: '#CCCCCC',
                fontSize: '0.8rem',
                marginTop: '0.25rem'
              }}>
                {gameState.phase === 'choosing' ? 'Player 1 goes first' : 'Please wait...'}
              </div>
            </div>
          )}
        </div>
      </PowerDisplay>
    </PlayerSection>
  )
}

export default GamePlayers 