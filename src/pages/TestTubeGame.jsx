import React from 'react'
import { TubeGamePage } from '../components/tubes'

const TestTubeGame = () => {
  // Use a mock game ID for testing
  const mockGameId = 'test-tube-game-123'
  
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <TubeGamePage gameId={mockGameId} />
    </div>
  )
}

export default TestTubeGame
