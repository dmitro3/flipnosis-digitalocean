import React from 'react'
import GlassTubeGame from '../components/BattleRoyale/3dtest/GlassTubeGame'

const TestGameStandalone = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      background: '#000814'
    }}>
      <GlassTubeGame />
    </div>
  )
}

export default TestGameStandalone

