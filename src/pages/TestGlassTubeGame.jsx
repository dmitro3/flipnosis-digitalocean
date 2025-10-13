import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { BattleRoyaleGameProvider } from '../contexts/BattleRoyaleGameContext'
import GlassTubeGame from '../components/BattleRoyale/GlassTubeGame'
import styled from '@emotion/styled'

const TestContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  gap: 2rem;
`

const TestCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
  color: white;
  text-align: center;
  max-width: 600px;
  width: 100%;
`

const TestButton = styled.button`
  background: linear-gradient(135deg, #ff1493, #ff69b4);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 20, 147, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  background: ${props => {
    if (props.status === 'connected') return 'rgba(0, 255, 136, 0.2)'
    if (props.status === 'error') return 'rgba(255, 0, 0, 0.2)'
    return 'rgba(255, 255, 255, 0.1)'
  }};
  border: 2px solid ${props => {
    if (props.status === 'connected') return '#00ff88'
    if (props.status === 'error') return '#ff0000'
    return 'rgba(255, 255, 255, 0.3)'
  }};
`

const TestGlassTubeGame = () => {
  const navigate = useNavigate()
  const { address, isConnected } = useWallet()
  const { showToast } = useToast()
  
  const [testGameId] = useState('test_glass_tube_game_123')
  const [gameState, setGameState] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // Mock game state for testing
  const createMockGameState = () => ({
    gameId: testGameId,
    phase: 'playing',
    creator: address || '0x1234567890123456789012345678901234567890',
    nftImage: '/placeholder-nft.svg',
    nftName: 'Test NFT',
    nftCollection: 'Test Collection',
    nftContract: '0x1234567890123456789012345678901234567890',
    nftTokenId: '1',
    nftChain: 'base',
    entryFee: '100.00',
    serviceFee: '5.00',
    currentPlayers: 4,
    maxPlayers: 4,
    playerOrder: [
      address || '0x1234567890123456789012345678901234567890',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      '0x9876543210987654321098765432109876543210',
      '0xfedcba0987654321fedcba0987654321fedcba09'
    ],
    players: {
      [address?.toLowerCase() || '0x1234567890123456789012345678901234567890']: {
        address: address || '0x1234567890123456789012345678901234567890',
        lives: 3,
        isActive: true,
        isCreator: true,
        coin: {
          type: 'gold',
          headsImage: '/coins/goldh.png',
          tailsImage: '/coins/goldt.png'
        }
      },
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': {
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        lives: 3,
        isActive: true,
        isCreator: false,
        coin: {
          type: 'silver',
          headsImage: '/coins/silverh.png',
          tailsImage: '/coins/silvert.png'
        }
      },
      '0x9876543210987654321098765432109876543210': {
        address: '0x9876543210987654321098765432109876543210',
        lives: 3,
        isActive: true,
        isCreator: false,
        coin: {
          type: 'bronze',
          headsImage: '/coins/bronzeh.png',
          tailsImage: '/coins/bronzet.png'
        }
      },
      '0xfedcba0987654321fedcba0987654321fedcba09': {
        address: '0xfedcba0987654321fedcba0987654321fedcba09',
        lives: 3,
        isActive: true,
        isCreator: false,
        coin: {
          type: 'custom',
          headsImage: '/coins/customh.png',
          tailsImage: '/coins/customt.png'
        }
      }
    },
    playerSlots: [
      address || '0x1234567890123456789012345678901234567890',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      '0x9876543210987654321098765432109876543210',
      '0xfedcba0987654321fedcba0987654321fedcba09'
    ]
  })

  const startTest = () => {
    if (!isConnected) {
      showToast('Please connect your wallet first', 'error')
      return
    }

    const mockState = createMockGameState()
    setGameState(mockState)
    setConnectionStatus('connected')
    showToast('Test game started!', 'success')
  }

  const resetTest = () => {
    setGameState(null)
    setConnectionStatus('disconnected')
    showToast('Test reset', 'info')
  }

  const goBack = () => {
    navigate('/')
  }

  return (
    <TestContainer>
      <TestCard>
        <h1>🧪 Glass Tube Game Test</h1>
        <p>Test the new 4-player Glass Tube Game integration</p>
        
        <StatusIndicator status={connectionStatus}>
          <span>{connectionStatus === 'connected' ? '🟢' : '🔴'}</span>
          <span>
            {connectionStatus === 'connected' ? 'Test Game Active' : 'Not Connected'}
          </span>
        </StatusIndicator>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <TestButton 
            onClick={startTest} 
            disabled={!isConnected || connectionStatus === 'connected'}
          >
            {isConnected ? 'Start Test Game' : 'Connect Wallet First'}
          </TestButton>
          
          <TestButton 
            onClick={resetTest} 
            disabled={connectionStatus === 'disconnected'}
          >
            Reset Test
          </TestButton>
          
          <TestButton onClick={goBack}>
            Back to Home
          </TestButton>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
          <p><strong>Test Features:</strong></p>
          <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
            <li>✅ 4-player glass tube visualization</li>
            <li>✅ Real-time 3D coin flipping</li>
            <li>✅ Server-authoritative flip mechanics</li>
            <li>✅ Player elimination system</li>
            <li>✅ Beautiful visual effects</li>
          </ul>
        </div>
      </TestCard>

      {gameState && (
        <BattleRoyaleGameProvider gameId={testGameId}>
          <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000 }}>
            <GlassTubeGame />
          </div>
        </BattleRoyaleGameProvider>
      )}
    </TestContainer>
  )
}

export default TestGlassTubeGame
