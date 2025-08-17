import { useEffect, useCallback } from 'react'
import { useToast } from '../../../contexts/ToastContext'

export const useGameStart = (gameId, gameData, address, onGameStart) => {
  const { showInfo } = useToast()
  
  // Listen for game start events
  useEffect(() => {
    if (!gameId || !address) return
    
    const handleGameStartMessage = (event) => {
      const data = event.detail
      
      if (!data || !data.type) return
      
      // Handle various game start messages
      switch (data.type) {
        case 'game_started':
        case 'GAME_STARTED':
          console.log('🎮 Game started event received:', data)
          if (data.gameId === gameId || data.contract_game_id === gameId) {
            onGameStart()
          }
          break
          
        case 'deposit_received':
        case 'DEPOSIT_CONFIRMED':
          console.log('💰 Deposit confirmed:', data)
          // Check if both deposits are complete
          if (data.bothDeposited || 
              (data.creatorDeposited && data.challengerDeposited)) {
            showInfo('Both players deposited! Game starting...')
            setTimeout(() => onGameStart(), 1000)
          }
          break
          
        case 'TRANSPORT_TO_GAME':
          console.log('🚀 Transport to game received:', data)
          if (data.gameId === gameId && data.forceTransport) {
            onGameStart()
          }
          break
      }
    }
    
    // Add WebSocket listener
    window.addEventListener('websocket-message', handleGameStartMessage)
    
    // Check if WebSocket service exists and add direct listener
    const ws = window.FlipnosisWS
    if (ws) {
      ws.on('game_started', (data) => {
        if (data.gameId === gameId) {
          console.log('🎮 Direct game_started event:', data)
          onGameStart()
        }
      })
      
      ws.on('both_deposits_complete', (data) => {
        if (data.gameId === gameId) {
          console.log('💰 Both deposits complete:', data)
          onGameStart()
        }
      })
    }
    
    return () => {
      window.removeEventListener('websocket-message', handleGameStartMessage)
      if (ws) {
        ws.off('game_started')
        ws.off('both_deposits_complete')
      }
    }
  }, [gameId, address, onGameStart, showInfo])
  
  // Manual check for game readiness
  const checkGameReady = useCallback(() => {
    if (gameData?.status === 'active' && 
        gameData?.creator_deposited && 
        gameData?.challenger_deposited) {
      return true
    }
    return false
  }, [gameData])
  
  return {
    checkGameReady
  }
}
