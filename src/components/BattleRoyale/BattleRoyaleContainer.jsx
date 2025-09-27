import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BattleRoyaleTabbedInterface from './BattleRoyaleTabbedInterface'
import BattleRoyaleGameRoom from './BattleRoyaleGameRoom'
import socketService from '../../services/SocketService'

const BattleRoyaleContainer = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [gamePhase, setGamePhase] = useState('lobby')
  
  useEffect(() => {
    // Listen for game start events
    const handleGameStarting = (data) => {
      console.log('Container: Game starting event received')
      setGamePhase('playing')
      // Navigate to play route after a delay
      setTimeout(() => {
        navigate(`/battle-royale/${gameId}/play`)
      }, 1000)
    }
    
    socketService.on('battle_royale_starting', handleGameStarting)
    
    return () => {
      socketService.off('battle_royale_starting', handleGameStarting)
    }
  }, [gameId, navigate])
  
  // Check current route to determine what to render
  const isPlayRoute = window.location.pathname.includes('/play')
  
  if (isPlayRoute) {
    return <BattleRoyaleGameRoom gameId={gameId} />
  } else {
    return <BattleRoyaleTabbedInterface gameId={gameId} />
  }
}

export default BattleRoyaleContainer
