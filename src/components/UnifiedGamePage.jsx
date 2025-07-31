// 1. React imports first
import React, { useState, useEffect, useRef } from 'react'

// 2. Third-party imports
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@emotion/react'
import styled from '@emotion/styled'

// 3. Context imports
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'

// 4. Service imports
import contractService from '../services/ContractService'
import { useContractService } from '../utils/useContractService'

// 5. Component imports
import OptimizedGoldCoin from './OptimizedGoldCoin'
import PowerDisplay from '../components/PowerDisplay'
// import GameResultPopup from './GameResultPopup'
// import ProfilePicture from './ProfilePicture'
// import GameChatBox from './GameChatBox'
// import NFTOfferComponent from './NFTOfferComponent'

// 6. Style imports
import { theme } from '../styles/theme'
import { API_CONFIG, getApiUrl, getWsUrl } from '../config/api'
import { LoadingSpinner } from '../styles/components'

// 7. Asset imports last
// import hazeVideo from '../../Images/Video/haze.webm'
// import mobileVideo from '../../Images/Video/Mobile/mobile.webm'

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  position: relative;
  z-index: 1;
`

const GameContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const GameSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
`

const UnifiedGamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isConnected } = useWallet()
  const { showSuccess, showError } = useToast()
  const { isInitialized: contractInitialized } = useContractService()
  
  // Game state
  const [gameState, setGameState] = useState({
    phase: 'waiting',
    currentRound: 1,
    creatorChoice: null,
    joinerChoice: null,
    creatorPower: 0,
    joinerPower: 0,
    creatorWins: 0,
    joinerWins: 0,
    chargingPlayer: null
  })
  
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <GameContainer>
          <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
            Game Page Test - With Components
          </h1>
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.8)', 
            padding: '2rem', 
            borderRadius: '1rem',
            border: '2px solid #00FF41',
            color: 'white',
            textAlign: 'center'
          }}>
            <p><strong>Game ID:</strong> {gameId}</p>
            <p><strong>Wallet Address:</strong> {address || 'Not connected'}</p>
            <p><strong>Connection Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}</p>
            <p><strong>Contract Initialized:</strong> {contractInitialized ? 'Yes' : 'No'}</p>
            
            <div style={{ marginTop: '2rem' }}>
              <button 
                onClick={() => navigate('/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#00FF41',
                  color: '#000',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginRight: '1rem'
                }}
              >
                Back to Home
              </button>
              
              <button 
                onClick={() => showSuccess('Test toast message!')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#FF1493',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Test Toast
              </button>
            </div>
          </div>
          
          {/* Game Components Section */}
          <GameSection>
            <h2 style={{ color: '#FFD700', textAlign: 'center' }}>Game Components Test</h2>
            
            {/* Coin Component */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.6)', 
              padding: '1rem', 
              borderRadius: '1rem',
              border: '2px solid #FFD700'
            }}>
              <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Gold Coin</h3>
              <OptimizedGoldCoin 
                isFlipping={false}
                flipResult={null}
                size={200}
                isPlayerTurn={false}
                creatorPower={gameState.creatorPower}
                joinerPower={gameState.joinerPower}
              />
            </div>
            
            {/* Power Display Component */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.6)', 
              padding: '1rem', 
              borderRadius: '1rem',
              border: '2px solid #FFD700',
              width: '100%',
              maxWidth: '500px'
            }}>
              <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Power Display</h3>
              <PowerDisplay 
                creatorPower={gameState.creatorPower}
                joinerPower={gameState.joinerPower}
                currentPlayer={null}
                creator={address}
                joiner={null}
                chargingPlayer={gameState.chargingPlayer}
                gamePhase={gameState.phase}
                isMyTurn={false}
                playerChoice={null}
                isMobile={false}
              />
            </div>
          </GameSection>
        </GameContainer>
      </Container>
    </ThemeProvider>
  )
}

export default UnifiedGamePage