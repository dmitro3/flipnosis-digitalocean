import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import BattleRoyaleUnified3DScene from './BattleRoyaleUnified3DScene'
import PlayerStatsBar from './PlayerStatsBar'
import XPRewardDrop from './XPRewardDrop'

const CardContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.95) 0%, rgba(40, 20, 60, 0.95) 100%);
  border: 2px solid;
  border-image: linear-gradient(45deg, ${props => props.isCurrentUser ? '#00ff88' : '#00ffff'}, ${props => props.isCurrentUser ? '#00cc6a' : '#9d00ff'}) 1;
  border-radius: 1rem;
  box-shadow: 0 0 20px ${props => props.isCurrentUser ? 'rgba(0, 255, 136, 0.3)' : 'rgba(0, 255, 255, 0.3)'}, inset 0 0 60px rgba(255, 0, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  opacity: ${props => props.eliminated ? 0.3 : 1};
  filter: ${props => props.eliminated ? 'grayscale(100%)' : 'none'};
`

const SlotBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: #FFD700;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: bold;
  z-index: 5;
`

const CoinViewport = styled.div`
  width: 100%;
  height: ${props => props.large ? '300px' : '200px'};
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.95));
`

const PlayerAddress = styled.div`
  color: white;
  font-size: 0.8rem;
  font-family: monospace;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
`

const ChoiceIndicator = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.9);
  color: ${props => props.choice === 'heads' ? '#FFD700' : '#C0C0C0'};
  border: 2px solid ${props => props.choice === 'heads' ? '#FFD700' : '#C0C0C0'};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  z-index: 5;
  box-shadow: 0 0 20px ${props => props.choice === 'heads' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(192, 192, 192, 0.5)'};
`

const PlayerCard = ({ 
  player, 
  slotNumber, 
  isCurrentUser, 
  gamePhase,
  serverState,
  playerCoinImage,
  large = false,
  showXP = true
}) => {
  const [showXPDrop, setShowXPDrop] = useState(false)
  const [lastXP, setLastXP] = useState(0)
  const playerData = serverState?.players?.[player.address?.toLowerCase()]
  const eliminated = playerData?.status === 'eliminated'
  const choice = playerData?.choice
  const lastXPDrop = playerData?.lastXPDrop || 0
  useEffect(() => {
    if (lastXPDrop > 0 && lastXPDrop !== lastXP) {
      setShowXPDrop(true)
      setLastXP(lastXPDrop)
    }
  }, [lastXPDrop, lastXP])
  return (
    <CardContainer isCurrentUser={isCurrentUser} eliminated={eliminated}>
      <SlotBadge>Slot {slotNumber + 1}</SlotBadge>
      {choice && (
        <ChoiceIndicator choice={choice}>{choice}</ChoiceIndicator>
      )}
      <CoinViewport large={large}>
        <BattleRoyaleUnified3DScene
          players={[player]}
          gamePhase={gamePhase}
          serverState={serverState}
          playerCoinImages={{ [player.address?.toLowerCase()]: playerCoinImage }}
          currentUserAddress={null}
          singleCoinMode={true}
        />
        {showXP && showXPDrop && lastXPDrop > 0 && (
          <XPRewardDrop
            amount={lastXPDrop}
            rarity={
              lastXPDrop >= 1000 ? 'ultimate' :
              lastXPDrop >= 900 ? 'exotic' :
              lastXPDrop >= 700 ? 'mythic' :
              lastXPDrop >= 500 ? 'legendary' :
              lastXPDrop >= 400 ? 'epic' :
              lastXPDrop >= 300 ? 'rare' :
              lastXPDrop >= 200 ? 'uncommon' : 'common'
            }
            onComplete={() => setShowXPDrop(false)}
          />
        )}
      </CoinViewport>
      <PlayerAddress>
        {isCurrentUser ? 'YOU' : `${player.address?.slice(0, 6)}...${player.address?.slice(-4)}`}
      </PlayerAddress>
      {playerData && (
        <PlayerStatsBar
          lives={playerData.lives || 3}
          power={playerData.power || 10}
          hasShield={playerData.hasShield || false}
          hasLightningRound={playerData.hasLightningRound || false}
          totalXPEarned={playerData.totalXPEarned || 0}
          isCompact={!large}
        />
      )}
    </CardContainer>
  )
}

export default PlayerCard

