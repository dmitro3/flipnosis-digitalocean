import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { XP_RARITIES } from '../../constants/xpRarities'

const XPContainer = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  animation: floatUp 2s ease-out forwards;
  pointer-events: none;
  z-index: 1000;
  
  @keyframes floatUp {
    0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(0.8); }
    50% { transform: translateX(-50%) translateY(-40px) scale(1.2); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-80px) scale(1); }
  }
`

const XPText = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color};
  text-shadow: 0 0 10px ${props => props.glow}, 0 0 20px ${props => props.glow}, 0 0 30px ${props => props.glow};
  font-family: 'Hyperwave', 'Poppins', sans-serif;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const XPRewardDrop = ({ amount, rarity, onComplete }) => {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onComplete) onComplete()
    }, 2000)
    return () => clearTimeout(timer)
  }, [onComplete])
  if (!visible) return null
  const rarityData = XP_RARITIES[rarity] || XP_RARITIES.common
  return (
    <XPContainer>
      <XPText color={rarityData.color} glow={rarityData.glow}>
        {rarityData.emoji} +{amount} XP
      </XPText>
    </XPContainer>
  )
}

export default XPRewardDrop

