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
// import OptimizedGoldCoin from './OptimizedGoldCoin'
// import PowerDisplay from '../components/PowerDisplay'
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

const UnifiedGamePage = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { address, isConnected } = useWallet()
  const { showSuccess, showError } = useToast()
  const { isInitialized: contractInitialized } = useContractService()
  
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <GameContainer>
          <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
            Game Page Test - Enhanced
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
        </GameContainer>
      </Container>
    </ThemeProvider>
  )
}

export default UnifiedGamePage