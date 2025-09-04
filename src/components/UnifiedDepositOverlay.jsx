import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import webSocketService from '../services/WebSocketService'
import { useToast } from '../contexts/ToastContext'
import { useContractService } from '../utils/useContractService'

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const Modal = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 500px;
  width: 90%;
  border: 2px solid #00FF41;
  box-shadow: 
    0 0 50px rgba(0, 255, 65, 0.3),
    0 0 100px rgba(0, 191, 255, 0.1);
  animation: slideUp 0.4s ease;
  
  @keyframes slideUp {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`

const Title = styled.h2`
  color: #00FF41;
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  text-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
`

const TimerDisplay = styled.div`
  text-align: center;
  margin: 2rem 0;
`

const TimeRemaining = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: ${props => props.critical ? '#FF4444' : '#00BFFF'};
  text-shadow: 0 0 30px ${props => props.critical ? 'rgba(255, 68, 68, 0.5)' : 'rgba(0, 191, 255, 0.5)'};
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
  animation: ${props => props.critical ? 'pulse 1s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`

const TimerLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin-top: 0.5rem;
`

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 2rem 0;
`

const PlayerStatus = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => props.deposited ? '#00FF41' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  
  ${props => props.deposited && `
    background: rgba(0, 255, 65, 0.1);
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
  `}
`

const PlayerLabel = styled.div`
  color: ${props => props.isYou ? '#00FF41' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: ${props => props.isYou ? 'bold' : 'normal'};
`

const PlayerAddress = styled.div`
  color: #00BFFF;
  font-family: monospace;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
`

const DepositStatus = styled.div`
  color: ${props => props.deposited ? '#00FF41' : '#FFA500'};
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`

const StatusIcon = styled.span`
  font-size: 1.2rem;
`

const ActionSection = styled.div`
  margin-top: 2rem;
  text-align: center;
`

const DepositButton = styled.button`
  background: linear-gradient(135deg, #00FF41, #00BFFF);
  color: #000;
  border: none;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  
  &:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 0 30px rgba(0, 255, 65, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: linear-gradient(135deg, #666, #444);
  }
`

const WaitingMessage = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const SpectatorMessage = styled.div`
  background: rgba(0, 191, 255, 0.1);
  border: 1px solid #00BFFF;
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  color: #00BFFF;
`

const InfoMessage = styled.div`
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid #FFA500;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #FFA500;
  text-align: center;
`

const CreatorInfo = styled.div`
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid #00FF41;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #00FF41;
  text-align: center;
`

// Main Component
export default function UnifiedDepositOverlay({ 
  gameId, 
  address, 
  gameData,
  depositState: propDepositState, // Accept depositState as prop
  onDepositComplete,
  onTimeout
}) {
  const { showSuccess, showError, showInfo } = useToast()
  const { contractService } = useContractService()
  const [depositState, setDepositState] = useState(propDepositState) // Initialize with prop
  const [isDepositing, setIsDepositing] = useState(false)
  const [userRole, setUserRole] = useState('spectator') // 'creator', 'challenger', 'spectator'

  // Update internal state when prop changes
  useEffect(() => {
    console.log('🎯 UnifiedDepositOverlay: depositState prop changed:', propDepositState)
    setDepositState(propDepositState)
  }, [propDepositState])

  // Determine user role
  useEffect(() => {
    if (!depositState || !address) return
    
    if (address.toLowerCase() === depositState.creator?.toLowerCase()) {
      setUserRole('creator')
    } else if (address.toLowerCase() === depositState.challenger?.toLowerCase()) {
      setUserRole('challenger')
    } else {
      setUserRole('spectator')
    }
  }, [depositState, address])

  // WebSocket event handlers
  useEffect(() => {
    if (!gameId) return

    const handleDepositStageStarted = (data) => {
      console.log('💰 Deposit stage started:', data)
      if (data.gameId === gameId) {
        setDepositState({
          phase: 'deposit_stage',
          creator: data.creator,
          challenger: data.challenger,
          timeRemaining: data.timeRemaining,
          creatorDeposited: true, // Always true - NFT already deposited
          challengerDeposited: data.challengerDeposited
        })
      }
    }

    const handleDepositCountdown = (data) => {
      if (data.gameId === gameId) {
        setDepositState(prev => ({
          ...prev,
          timeRemaining: data.timeRemaining,
          challengerDeposited: data.challengerDeposited
        }))
      }
    }

    const handleDepositConfirmed = (data) => {
      console.log('✅ Deposit confirmed:', data)
      if (data.gameId === gameId) {
        setDepositState(prev => ({
          ...prev,
          creatorDeposited: data.creatorDeposited,
          challengerDeposited: data.challengerDeposited
        }))
        
        if (data.bothDeposited) {
          showSuccess('Both players deposited! Game starting...')
          setTimeout(() => {
            setDepositState(null)
            if (onDepositComplete) onDepositComplete()
          }, 2000)
        }
      }
    }

    const handleNftDepositConfirmed = (data) => {
      console.log('✅ NFT deposit confirmed:', data)
      if (data.gameId === gameId) {
        setDepositState(prev => ({
          ...prev,
          creatorDeposited: data.creatorDeposited
        }))
        
        showSuccess('NFT deposited successfully!')
      }
    }

    const handleDepositTimeout = (data) => {
      console.log('⏰ Deposit timeout:', data)
      if (data.gameId === gameId) {
        showError(data.message || 'Challenger failed to deposit in time')
        setTimeout(() => {
          setDepositState(null)
          if (onTimeout) onTimeout(data)
        }, 3000)
      }
    }

    const handleGameStarted = (data) => {
      console.log('🎮 Game started:', data)
      if (data.gameId === gameId) {
        console.log('🚀 Both players deposited - transitioning to flip suite!')
        setDepositState(null)
        
        // Transport both players to the flip suite
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchToFlipSuite', {
            detail: { gameId: data.gameId, immediate: true }
          }))
        }, 1000)
        
        if (onDepositComplete) onDepositComplete()
      }
    }

    // Register handlers
    webSocketService.on('deposit_stage_started', handleDepositStageStarted)
    webSocketService.on('deposit_countdown', handleDepositCountdown)
    webSocketService.on('deposit_confirmed', handleDepositConfirmed)
    webSocketService.on('nft_deposit_confirmed', handleNftDepositConfirmed)
    webSocketService.on('deposit_timeout', handleDepositTimeout)
    webSocketService.on('game_started', handleGameStarted)

    // Cleanup
    return () => {
      webSocketService.off('deposit_stage_started', handleDepositStageStarted)
      webSocketService.off('deposit_countdown', handleDepositCountdown)
      webSocketService.off('deposit_confirmed', handleDepositConfirmed)
      webSocketService.off('nft_deposit_confirmed', handleNftDepositConfirmed)
      webSocketService.off('deposit_timeout', handleDepositTimeout)
      webSocketService.off('game_started', handleGameStarted)
    }
  }, [gameId, onDepositComplete, onTimeout, showSuccess, showError])

  // Handle deposit action
  const handleDeposit = async () => {
    if (isDepositing) return
    setIsDepositing(true)

    try {
      if (userRole === 'creator') {
        // Creator deposits NFT
        showInfo('Depositing NFT...')
        
        if (!gameData?.nft_contract || !gameData?.nft_token_id) {
          throw new Error('NFT contract or token ID not found')
        }
        
        // Call real NFT deposit contract method
        const result = await contractService.depositNFT(
          gameId,
          gameData.nft_contract,
          gameData.nft_token_id
        )
        
        if (result.success) {
          // Send confirmation to server via Socket.io
          try {
            webSocketService.emit('deposit_confirmed', {
              gameId: gameId,
              player: address,
              assetType: 'nft',
              transactionHash: result.transactionHash
            })
          } catch (socketError) {
            console.warn('⚠️ Failed to send Socket.io message:', socketError)
            // Don't fail the deposit if Socket.io fails
          }
          
          showSuccess('NFT deposited successfully!')
        } else {
          throw new Error(result.error || 'NFT deposit failed')
        }
      } else if (userRole === 'challenger') {
        // Challenger deposits crypto
        showInfo('Depositing crypto...')
        
        if (!depositState?.cryptoAmount) {
          throw new Error('Crypto amount not found')
        }
        
        // Call real crypto deposit contract method
        const result = await contractService.depositETH(gameId, depositState.cryptoAmount)
        
        if (result.success) {
          // Send confirmation to server via Socket.io
          try {
            console.log('🎯 Sending deposit_confirmed event:', {
              gameId: gameId,
              player: address,
              assetType: 'crypto',
              transactionHash: result.transactionHash
            })
            
            webSocketService.emit('deposit_confirmed', {
              gameId: gameId,
              player: address,
              assetType: 'crypto',
              transactionHash: result.transactionHash
            })
            
            console.log('✅ deposit_confirmed event sent successfully')
          } catch (socketError) {
            console.error('❌ Failed to send Socket.io message:', socketError)
            // Don't fail the deposit if Socket.io fails
          }
          
          showSuccess('Crypto deposited successfully!')
        } else {
          throw new Error(result.error || 'Crypto deposit failed')
        }
      }
    } catch (error) {
      console.error('❌ Deposit failed:', error)
      showError('Deposit failed: ' + error.message)
    } finally {
      setIsDepositing(false)
    }
  }

  // Don't render if no deposit state
  console.log('🎯 UnifiedDepositOverlay: render check:', { 
    hasDepositState: !!depositState, 
    depositState,
    userRole,
    gameId,
    address 
  })
  
  if (!depositState) {
    console.log('❌ UnifiedDepositOverlay: No depositState, not rendering')
    return null
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isCriticalTime = depositState.timeRemaining <= 30

  return (
    <Overlay>
      <Modal>
        <Title>
          {userRole === 'spectator' ? '👁️ Deposit in Progress' : '💰 Deposit Required'}
        </Title>

        <TimerDisplay>
          <TimeRemaining critical={isCriticalTime}>
            {formatTime(depositState.timeRemaining)}
          </TimeRemaining>
          <TimerLabel>Time Remaining for Challenger</TimerLabel>
        </TimerDisplay>

        <StatusGrid>
          <PlayerStatus deposited={true}>
            <PlayerLabel isYou={userRole === 'creator'}>
              {userRole === 'creator' ? '👤 You (Creator)' : '👤 Creator'}
            </PlayerLabel>
            <PlayerAddress>
              {depositState.creator?.slice(0, 6)}...{depositState.creator?.slice(-4)}
            </PlayerAddress>
            <DepositStatus deposited={true}>
              <StatusIcon>✅</StatusIcon>
              NFT Already Deposited
            </DepositStatus>
          </PlayerStatus>

          <PlayerStatus deposited={depositState.challengerDeposited}>
            <PlayerLabel isYou={userRole === 'challenger'}>
              {userRole === 'challenger' ? '👤 You (Challenger)' : '👤 Challenger'}
            </PlayerLabel>
            <PlayerAddress>
              {depositState.challenger?.slice(0, 6)}...{depositState.challenger?.slice(-4)}
            </PlayerAddress>
            <DepositStatus deposited={depositState.challengerDeposited}>
              <StatusIcon>{depositState.challengerDeposited ? '✅' : '⏳'}</StatusIcon>
              {depositState.challengerDeposited ? 'Crypto Deposited' : 'Awaiting Crypto'}
            </DepositStatus>
          </PlayerStatus>
        </StatusGrid>

        <ActionSection>
          {userRole === 'creator' && !depositState.creatorDeposited && (
            <>
              <DepositButton 
                onClick={handleDeposit}
                disabled={isDepositing}
              >
                {isDepositing ? 'Depositing NFT...' : 'Deposit NFT'}
              </DepositButton>
              <InfoMessage>
                ⚠️ You must deposit your NFT to start the game
              </InfoMessage>
            </>
          )}

          {userRole === 'creator' && depositState.creatorDeposited && !depositState.challengerDeposited && (
            <CreatorInfo>
              ✅ Your NFT has been deposited<br/>
              ⏳ Waiting for challenger to deposit crypto...
            </CreatorInfo>
          )}

          {userRole === 'challenger' && !depositState.challengerDeposited && (
            <>
              <DepositButton 
                onClick={handleDeposit}
                disabled={isDepositing}
              >
                {isDepositing ? 'Depositing Crypto...' : `Deposit ${gameData?.price_usd || gameData?.asking_price || '0'} Crypto`}
              </DepositButton>
              <InfoMessage>
                ⚠️ You must deposit crypto to start the game
              </InfoMessage>
            </>
          )}

          {userRole === 'challenger' && depositState.challengerDeposited && (
            <WaitingMessage>
              ✅ Your crypto has been deposited<br/>
              🎮 Game is starting...
            </WaitingMessage>
          )}

          {userRole === 'spectator' && (
            <SpectatorMessage>
              👁️ You are spectating this game<br/>
              Creator's NFT is already deposited<br/>
              Challenger must deposit crypto within the time limit
            </SpectatorMessage>
          )}

          {depositState.challengerDeposited && (
            <WaitingMessage style={{ color: '#00FF41', borderColor: '#00FF41' }}>
              🎮 Both deposits confirmed! Starting game...
            </WaitingMessage>
          )}
        </ActionSection>
      </Modal>
    </Overlay>
  )
}
