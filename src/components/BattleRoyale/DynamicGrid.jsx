import React from 'react'
import styled from '@emotion/styled'
import PlayerCard from './PlayerCard'

const GRID_CONFIGS = {
  6: { columns: 'repeat(3, 1fr)', rows: 'repeat(2, 1fr)', gap: '1rem' },
  5: { columns: 'repeat(3, 1fr)', rows: 'repeat(2, 1fr)', gap: '1.2rem' },
  4: { columns: 'repeat(2, 1fr)', rows: 'repeat(2, 1fr)', gap: '1.5rem' },
  3: { columns: 'repeat(3, 1fr)', rows: '1fr', gap: '2rem' },
  2: { columns: 'repeat(2, 1fr)', rows: '1fr', gap: '3rem' },
  1: { columns: '1fr', rows: '1fr', gap: '0' }
}

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: ${props => GRID_CONFIGS[props.playerCount]?.columns || 'repeat(3, 1fr)'};
  grid-template-rows: ${props => GRID_CONFIGS[props.playerCount]?.rows || 'repeat(2, 1fr)'};
  gap: ${props => GRID_CONFIGS[props.playerCount]?.gap || '1rem'};
  width: 100%;
  height: 100%;
  padding: 2rem;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
    padding: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }
`

const DynamicGrid = ({ players, currentUserAddress, gamePhase, serverState, playerCoinImages }) => {
  const activePlayers = players.filter(p => p && p.address && serverState?.players?.[p.address.toLowerCase()]?.status !== 'eliminated')
  return (
    <GridContainer playerCount={activePlayers.length}>
      {activePlayers.map((player, index) => {
        const isCurrentUser = player.address?.toLowerCase() === currentUserAddress?.toLowerCase()
        const coinImage = playerCoinImages[player.address?.toLowerCase()]
        return (
          <PlayerCard
            key={player.address}
            player={player}
            slotNumber={player.slotNumber || index}
            isCurrentUser={isCurrentUser}
            gamePhase={gamePhase}
            serverState={serverState}
            playerCoinImage={coinImage}
            large={activePlayers.length <= 2}
            showXP={true}
          />
        )
      })}
    </GridContainer>
  )
}

export default DynamicGrid

