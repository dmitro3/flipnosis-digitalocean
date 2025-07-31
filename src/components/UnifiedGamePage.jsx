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
import GameResultPopup from './GameResultPopup'
import ProfilePicture from './ProfilePicture'
import GameChatBox from './GameChatBox'
import NFTOfferComponent from './NFTOfferComponent'

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

const PlayerSection = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`

const PlayerCard = styled.div`
  background: rgba(0, 0, 0, 0.6);
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid #FFD700;
  text-align: center;
  flex: 1;
`

const ChatSection = styled.div`
  width: 100%;
  max-width: 400px;
  margin-top: 2rem;
`

const OfferSection = styled.div`
  width: 100%;
  max-width: 500px;
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
  
  // Test state for result popup
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [testResult, setTestResult] = useState({ isWinner: true, flipResult: 'heads' })
  
  // Test state for chat
  const [messages, setMessages] = useState([
    { id: 1, sender: address, message: 'Hello! Ready to flip?', timestamp: Date.now() },
    { id: 2, sender: '0x123...', message: 'Let\'s do this!', timestamp: Date.now() + 1000 }
  ])
  
  // Test state for offers
  const [offers, setOffers] = useState([
    { id: 1, from: '0x123...', amount: '0.1 ETH', timestamp: Date.now() }
  ])
  
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <GameContainer>
          <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
            Game Page Test - Complete Components
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
                  fontWeight: 'bold',
                  marginRight: '1rem'
                }}
              >
                Test Toast
              </button>
              
              <button 
                onClick={() => setShowResultPopup(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#FFD700',
                  color: '#000',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Test Result Popup
              </button>
            </div>
          </div>
          
          {/* Player Section */}
          <PlayerSection>
            <PlayerCard>
              <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Creator</h3>
              <ProfilePicture 
                address={address}
                size={80}
                showAddress={true}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Power: {gameState.creatorPower}
              </p>
            </PlayerCard>
            
            <PlayerCard>
              <h3 style={{ color: '#FFD700', marginBottom: '1rem' }}>Joiner</h3>
              <ProfilePicture 
                address={null}
                size={80}
                showAddress={true}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Power: {gameState.joinerPower}
              </p>
            </PlayerCard>
          </PlayerSection>
          
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
          
          {/* Chat and Offer Sections */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', justifyContent: 'center' }}>
            <ChatSection>
              <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>Game Chat</h3>
              <GameChatBox 
                messages={messages}
                onSendMessage={(message) => {
                  const newMessage = {
                    id: messages.length + 1,
                    sender: address,
                    message,
                    timestamp: Date.now()
                  }
                  setMessages([...messages, newMessage])
                }}
                gameId={gameId}
                isMobile={false}
              />
            </ChatSection>
            
            <OfferSection>
              <h3 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '1rem' }}>NFT Offers</h3>
              <NFTOfferComponent 
                offers={offers}
                onCreateOffer={(amount) => {
                  const newOffer = {
                    id: offers.length + 1,
                    from: address,
                    amount,
                    timestamp: Date.now()
                  }
                  setOffers([...offers, newOffer])
                  showSuccess('Offer created!')
                }}
                onAcceptOffer={(offerId) => {
                  showSuccess('Offer accepted!')
                }}
                onRejectOffer={(offerId) => {
                  showSuccess('Offer rejected!')
                }}
                gameId={gameId}
                isMobile={false}
              />
            </OfferSection>
          </div>
        </GameContainer>
        
        {/* Result Popup */}
        {showResultPopup && (
          <GameResultPopup
            isVisible={showResultPopup}
            isWinner={testResult.isWinner}
            flipResult={testResult.flipResult}
            playerChoice="heads"
            onClose={() => setShowResultPopup(false)}
            onClaimWinnings={() => {
              showSuccess('Winnings claimed!')
              setShowResultPopup(false)
            }}
            gameData={null}
          />
        )}
      </Container>
    </ThemeProvider>
  )
}

export default UnifiedGamePage