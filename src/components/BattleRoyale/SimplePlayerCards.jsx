import React from 'react'
import styled from '@emotion/styled'
import ProfilePicture from '../ProfilePicture'

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 320px); /* Match tube spacing exactly */
  gap: 0;
  width: 1920px;
  margin: 0 auto;
  justify-content: center;
  align-items: start;
`

const PlayerCard = styled.div`
  width: 280px; /* Slightly smaller than 320px for visual padding */
  margin: 0 20px; /* 20px margin on each side = 280 + 40 = 320px total */
  background: linear-gradient(135deg, ${props => {
    if (props.isEliminated) return 'rgba(255, 0, 0, 0.2)'
    if (props.isCurrentPlayer) return 'rgba(0, 255, 136, 0.2)'
    return 'rgba(0, 191, 255, 0.2)'
  }}, rgba(0, 0, 0, 0.8));
  
  border: 3px solid ${props => { 
    if (props.isEliminated) return '#ff0000'
    if (props.isCurrentPlayer) return '#00ff88'
    return '#00bfff'
  }};
  
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  
  opacity: ${props => props.isEliminated ? 0.5 : 1};
  filter: ${props => props.isEliminated ? 'grayscale(100%)' : 'none'};
`

const EmptyCard = styled.div`
  background: rgba(255, 20, 147, 0.1);
  border: 3px dashed rgba(255, 20, 147, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #ff1493;
  font-size: 1.5rem;
  font-weight: bold;
`

const PlayerAddress = styled.div`
  color: white;
  font-size: 0.85rem;
  font-family: monospace;
  font-weight: bold;
  text-align: center;
`

const LivesDisplay = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 1.5rem;
`

const ChoiceDisplay = styled.div`
  padding: 0.5rem 1rem;
  background: ${props => props.choice === 'heads' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(192, 192, 192, 0.2)'};
  border: 2px solid ${props => props.choice === 'heads' ? '#FFD700' : '#C0C0C0'};
  border-radius: 0.5rem;
  color: ${props => props.choice === 'heads' ? '#FFD700' : '#C0C0C0'};
  font-weight: bold;
  font-size: 0.9rem;
  text-transform: uppercase;
  width: 100%;
  text-align: center;
`

const FlipButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #ff1493, #ff69b4);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 20, 147, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ChangeCoinButton = styled.button`
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #FFD700;
  border-radius: 0.5rem;
  color: #FFD700;
  font-weight: bold;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.3);
    transform: translateY(-2px);
  }
`

const SimplePlayerCards = ({
  players = {},
  playerOrder = [],
  currentPlayerAddress = null,
  onChoiceSelect,
  onFlipCoin,
  onChangeCoin,
  disabled = false
}) => {
  const slots = Array.from({ length: 6 }, (_, i) => {
    const playerAddr = playerOrder[i]
    const player = playerAddr ? players[playerAddr.toLowerCase()] : null
    const isCurrentPlayer = playerAddr?.toLowerCase() === currentPlayerAddress?.toLowerCase()
    const isEmpty = !player
    const isEliminated = player && !player.isActive

    return {
      slotNumber: i + 1,
      playerAddr,
      player,
      isCurrentPlayer,
      isEmpty,
      isEliminated
    }
  })

  return (
    <CardsContainer>
      {slots.map((slot) => {
        if (slot.isEmpty) {
          return (
            <EmptyCard key={slot.slotNumber}>
              ✖ EMPTY
            </EmptyCard>
          )
        }

        return (
          <PlayerCard
            key={slot.slotNumber}
            isCurrentPlayer={slot.isCurrentPlayer}
            isEliminated={slot.isEliminated}
          >
            <ProfilePicture
              address={slot.playerAddr}
              size={60}
              style={{
                borderRadius: '50%',
                border: '3px solid rgba(255, 255, 255, 0.3)'
              }}
            />

            <PlayerAddress>
              {slot.isCurrentPlayer ? 'YOU' : `${slot.playerAddr.slice(0, 6)}...${slot.playerAddr.slice(-4)}`}
            </PlayerAddress>

            <LivesDisplay>
              {[1, 2, 3].map(i => (
                <span key={i} style={{ opacity: i <= slot.player.lives ? 1 : 0.3 }}>
                  {i <= slot.player.lives ? '🏆' : '⬛'}
                </span>
              ))}
            </LivesDisplay>

            {slot.player.choice && (
              <ChoiceDisplay choice={slot.player.choice}>
                {slot.player.choice}
              </ChoiceDisplay>
            )}

            {slot.isCurrentPlayer && !slot.isEliminated && (
              <>
                {!slot.player.choice ? (
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <FlipButton
                      onClick={() => onChoiceSelect('heads')}
                      style={{ flex: 1, background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
                      disabled={disabled}
                    >
                      Heads
                    </FlipButton>
                    <FlipButton
                      onClick={() => onChoiceSelect('tails')}
                      style={{ flex: 1, background: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' }}
                      disabled={disabled}
                    >
                      Tails
                    </FlipButton>
                  </div>
                ) : !slot.player.hasFired ? (
                  <FlipButton
                    onClick={() => onFlipCoin(slot.playerAddr)}
                    disabled={disabled}
                  >
                    🚀 Flip Coin
                  </FlipButton>
                ) : (
                  <FlipButton disabled>
                    ✅ Flipped!
                  </FlipButton>
                )}

                <ChangeCoinButton onClick={() => onChangeCoin(slot.playerAddr)}>
                  🪙 Change Coin
                </ChangeCoinButton>
              </>
            )}
          </PlayerCard>
        )
      })}
    </CardsContainer>
  )
}

export default SimplePlayerCards

